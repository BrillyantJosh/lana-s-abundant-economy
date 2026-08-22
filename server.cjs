const express = require('express');
const compression = require('compression');
const path = require('path');
const WebSocket = require('ws');
const Database = require('better-sqlite3');
const fs = require('fs');

const app = express();

// Gzip every response. Measured 2026-08-05 on direct.lana.fund: a 5.1 MB
// admin JSON feed was going out UNCOMPRESSED — nothing in the chain (app or
// nginx-proxy) set Content-Encoding — and the page took ~10 s. The same
// payload gzips ~10x. Registered first so it wraps every route.
app.use(compression());
const PORT = process.env.PORT || 3000;

app.use(express.json());

const RELAYS = [
  'wss://relay.lanavault.space',
  'wss://relay.lanacoin-eternity.com',
  'wss://relay.lanaheartvoice.com',
];

// ── SQLite setup ──
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'lanapays.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    hex_id TEXT PRIMARY KEY,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    youtube_url TEXT DEFAULT '',
    types TEXT NOT NULL DEFAULT '[]',
    language TEXT NOT NULL DEFAULT 'en',
    author_hex TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch()),
    updated_at INTEGER DEFAULT (unixepoch())
  );
`);

// Seed admin users
const SEED_ADMINS = [
  '56e8670aa65491f8595dc3a71c94aa7445dcdca755ca5f77c07218498a362061',
  '16a970069d63ca1f739c4e3b9a5f34bca6a93ead182dbf1e438a801aa03f4ef3',
  'e01368761feeb32a8fbc5b85502847ecdbbbcb1256ae35da268416c755982ca0',
];
const insertAdmin = db.prepare('INSERT OR IGNORE INTO admin_users (hex_id) VALUES (?)');
for (const hex of SEED_ADMINS) insertAdmin.run(hex);

// ── Auth middleware ──
function requireAdmin(req, res, next) {
  const hexId = req.headers['x-admin-hex'];
  if (!hexId) return res.status(401).json({ error: 'Not authenticated' });
  const row = db.prepare('SELECT hex_id FROM admin_users WHERE hex_id = ?').get(hexId);
  if (!row) return res.status(403).json({ error: 'Access denied' });
  req.adminHex = hexId;
  next();
}

// ── Static files ──
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  immutable: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// ── Auth endpoint ──
app.get('/api/auth/verify/:hexId', (req, res) => {
  const row = db.prepare('SELECT hex_id FROM admin_users WHERE hex_id = ?').get(req.params.hexId);
  res.json({ authorized: !!row });
});

// ── Posts API (public) ──
app.get('/api/posts', (req, res) => {
  const lang = req.query.lang;
  let rows;
  if (lang) {
    rows = db.prepare('SELECT * FROM posts WHERE language = ? ORDER BY created_at DESC').all(lang);
  } else {
    rows = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  }
  const posts = rows.map(r => ({ ...r, types: JSON.parse(r.types) }));
  res.json({ posts });
});

// ── Admin Posts CRUD ──
app.post('/api/admin/posts', requireAdmin, (req, res) => {
  const { title, body, youtube_url, types, language } = req.body;
  if (!title || !body || !language) {
    return res.status(400).json({ error: 'title, body, and language are required' });
  }
  const result = db.prepare(
    'INSERT INTO posts (title, body, youtube_url, types, language, author_hex) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(title, body, youtube_url || '', JSON.stringify(types || []), language, req.adminHex);
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
  res.json({ post: { ...post, types: JSON.parse(post.types) } });
});

app.put('/api/admin/posts/:id', requireAdmin, (req, res) => {
  const { title, body, youtube_url, types, language } = req.body;
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });
  db.prepare(
    'UPDATE posts SET title = ?, body = ?, youtube_url = ?, types = ?, language = ?, updated_at = unixepoch() WHERE id = ?'
  ).run(
    title || existing.title,
    body || existing.body,
    youtube_url !== undefined ? youtube_url : existing.youtube_url,
    types ? JSON.stringify(types) : existing.types,
    language || existing.language,
    req.params.id
  );
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  res.json({ post: { ...post, types: JSON.parse(post.types) } });
});

app.delete('/api/admin/posts/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Post not found' });
  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── Relay proxy endpoint ──
app.get('/api/relay-query', async (req, res) => {
  const kind = parseInt(req.query.kind, 10);
  if (!kind || isNaN(kind)) {
    return res.status(400).json({ error: 'Missing or invalid kind parameter' });
  }
  const timeout = Math.min(parseInt(req.query.timeout, 10) || 15000, 30000);
  const limit = Math.min(parseInt(req.query.limit, 10) || 5000, 10000);
  try {
    const events = await queryRelays(kind, timeout, limit);
    res.json({ events });
  } catch (err) {
    console.error('Relay query error:', err);
    res.status(500).json({ error: 'Failed to query relays' });
  }
});

// ── LanaConnects.us reference data ──
// The landing page shows the same live figures as lanaconnects.us. That site
// proxies thelana.life + direct.lana.fund from nginx; we aggregate the same
// five upstream calls here, cache them for a minute and serve one JSON so
// the browser makes a single request and the numbers match across sites.
const THELANA_API = process.env.THELANA_API || 'https://thelana.life/api';
const DIRECT_FUND_API = process.env.DIRECT_FUND_API || 'https://direct.lana.fund/api/public';
const BEF_API = process.env.BEF_API || 'https://balancedexchangeframe.work/api';
const SHOP_BASE = 'https://shop.lanapays.us';
const CONNECTS_TTL_MS = 60 * 1000;
const connectsCache = { at: 0, data: null, inflight: null, stale: false };

async function fetchJson(url, timeoutMs = 8000) {
  const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return res.json();
}

const normalizeText = v => String(v || '').replace(/\s+/g, ' ').trim();
function absoluteUrl(v) {
  const url = normalizeText(v);
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/api/uploads/')) return `${SHOP_BASE}${url}`;
  if (url.startsWith('/api/storage/')) return `https://app.mejmosefajn.org${url}`;
  if (url.startsWith('/')) return `https://lanapays.us${url}`;
  return url;
}

// Same status rule as lanaconnects.us: direct-fund deal state wins, then the brain trade status.
function tradeStatus(trade, deal) {
  if (deal && (deal.fully_paid || deal.status === 'paid')) return 'paid';
  if (deal && deal.status === 'partial') return 'partial';
  if (String((trade && trade.status) || '').toLowerCase().includes('fail')) return 'failed';
  return 'pending';
}

function buildOverview({ dashboard, providers, trades, deals, stats, bef }) {
  const split = dashboard?.split ?? dashboard?.current_split ?? stats?.split ?? null;
  const started = Number(dashboard?.split_started_at || 0);
  const splitDays = started ? Math.max(0, Math.floor((Date.now() / 1000 - started) / 86400)) : null;

  // Providers: lanaconnects.us counts every provider but lists only those with a registration date.
  const named = (providers || []).filter(p => normalizeText(p.name));
  const latestProviders = providers === null ? null : named
    .filter(p => Number(p.registeredAt || 0) > 0)
    .sort((a, b) => (Number(b.registeredAt || 0) - Number(a.registeredAt || 0)) || (Number(b.created_at || 0) - Number(a.created_at || 0)))
    .slice(0, 3)
    .map(p => ({
      name: normalizeText(p.name),
      image: absoluteUrl(p.logo || p.image || ''),
      registeredAt: Number(p.registeredAt),
      category: normalizeText(p.category),
      country: normalizeText(p.country),
    }));

  // Trades: direct-fund deals (with status) joined to brain trades by id, then brain-only trades.
  const dealRows = deals || [];
  const tradeList = trades || [];
  const dealsById = new Map(dealRows.map(d => [d.id, d]));
  const tradesById = new Map(tradeList.map(t => [t.tx_id, t]));
  const directRows = dealRows.map(deal => {
    const trade = tradesById.get(deal.id) || {};
    return {
      id: deal.id,
      merchant: normalizeText(deal.shop_name || trade.merchant_name),
      amount: Number(deal.amount || trade.amount || 0),
      currency: deal.currency || trade.currency || 'EUR',
      createdAt: Math.floor(new Date(deal.created_at || 0).getTime() / 1000) || Number(trade.created_at || 0),
      paymentType: deal.payment_type || trade.payment_type || '',
      status: tradeStatus(trade, deal),
    };
  });
  const nostrOnly = tradeList.filter(t => !dealsById.has(t.tx_id)).map(t => ({
    id: t.tx_id,
    merchant: normalizeText(t.merchant_name),
    amount: Number(t.amount || 0),
    currency: t.currency || 'EUR',
    createdAt: Number(t.created_at || 0),
    paymentType: t.payment_type || '',
    status: tradeStatus(t, null),
  }));
  const tradeRows = (trades === null && deals === null) ? null : (directRows.length ? [...directRows, ...nostrOnly] : nostrOnly)
    .filter(r => r.merchant)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 100);

  // Funding: available budget per currency; GBP folded into EUR exactly like lanaconnects.us does
  // (renderFunding(directStats || dashboard.direct_fund, dashboard)).
  const fundStats = stats || dashboard?.direct_fund || null;
  const currencies = fundStats?.totals_by_currency || {};
  const rates = fundStats?.exchange_rates || {};
  const byCurrency = {};
  for (const [code, row] of Object.entries(currencies)) {
    const available = Number(row?.available || 0);
    if (available > 0) byCurrency[code] = available;
  }
  const eur = Number(currencies.EUR?.available || 0);
  const gbp = Number(currencies.GBP?.available || 0);
  const gbpToEur = rates.GBP && rates.EUR ? Number(rates.EUR) / Number(rates.GBP) : 1.17;
  const waitingEur = fundStats ? eur + gbp * gbpToEur : null;
  const investors = fundStats ? Number(fundStats.active_count || fundStats.investor_count || 0) : null;
  const lanaInCirculation = dashboard ? Number(dashboard.pending_distribution_lana || 0) : null;
  const rateEur = Number(dashboard?.exchange_rates?.EUR || dashboard?.price_eur || 0);
  const distributionEur = dashboard ? lanaInCirculation * rateEur * 0.8 : null;

  let befInfo = null;
  const versions = Array.isArray(bef?.versions) ? bef.versions : [];
  const current = versions.find(v => v.isCurrent) || versions[0];
  if (current && current.version) {
    befInfo = { version: String(current.version), date: String(current.date || ''), label: String(current.label || '') };
  }

  return {
    split,
    splitStartedAt: started || null,
    splitDays,
    providersCount: providers === null ? null : providers.length,
    latestProviders,
    trades: tradeRows,
    funding: { waitingEur, byCurrency, investors, lanaInCirculation, distributionEur, rateEur },
    bef: befInfo,
    updatedAt: Date.now(),
  };
}

async function loadConnectsOverview() {
  const failed = [];
  const safe = (name, p) => p.catch(err => { console.warn(`[connects] ${name}: ${err.message}`); failed.push(name); return null; });
  const [dashboard, providersData, tradesData, dealsData, stats, bef] = await Promise.all([
    safe('dashboard', fetchJson(`${THELANA_API}/dashboard`)),
    safe('providers', fetchJson(`${THELANA_API}/providers`)),
    safe('trades', fetchJson(`${THELANA_API}/trades`)),
    safe('deals', fetchJson(`${DIRECT_FUND_API}/transactions`)),
    safe('split-stats', fetchJson(`${DIRECT_FUND_API}/split-stats`)),
    fetchJson(`${BEF_API}/versions`, 5000).catch(() => null), // decorative, never blocks
  ]);
  if (!dashboard && !stats && !tradesData) throw new Error('all upstreams failed');
  // A partial outage must not overwrite the last good snapshot with zeros:
  // throw so getConnectsOverview serves the cached data flagged stale.
  if (failed.length && connectsCache.data) throw new Error(`partial outage: ${failed.join(', ')}`);
  const overview = buildOverview({
    dashboard,
    providers: providersData ? (providersData.providers || []) : null,
    trades: tradesData ? (tradesData.trades || []) : null,
    deals: dealsData ? (dealsData.transactions || []) : null,
    stats,
    bef,
  });
  if (failed.length) overview.partial = failed; // no snapshot yet: ship nulls, the UI shows dashes
  return overview;
}

async function getConnectsOverview() {
  const fresh = connectsCache.data && Date.now() - connectsCache.at < CONNECTS_TTL_MS;
  if (fresh) return connectsCache.stale ? { ...connectsCache.data, stale: true } : connectsCache.data;
  if (!connectsCache.inflight) {
    connectsCache.inflight = loadConnectsOverview()
      .then(data => {
        // a partial result (no snapshot yet, some fields null) is served but never cached
        if (!data.partial) { connectsCache.data = data; connectsCache.at = Date.now(); connectsCache.stale = false; }
        return data;
      })
      .finally(() => { connectsCache.inflight = null; });
  }
  try {
    return await connectsCache.inflight;
  } catch (err) {
    if (connectsCache.data) {
      // keep the last good snapshot, flag it, and retry upstreams at most once per TTL
      connectsCache.stale = true;
      connectsCache.at = Date.now();
      return { ...connectsCache.data, stale: true };
    }
    throw err;
  }
}

app.get('/api/connects/overview', async (_req, res) => {
  try {
    const data = await getConnectsOverview();
    // degraded payloads must not be pinned by the browser
    res.set('Cache-Control', data.stale || data.partial ? 'no-store' : 'public, max-age=30');
    res.json(data);
  } catch (err) {
    console.error('[connects] overview failed:', err.message);
    res.status(503).json({ error: 'Live data unavailable' });
  }
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// SPA fallback
app.get('/{*path}', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

function queryRelays(kind, timeout = 15000, limit = 5000) {
  return new Promise((resolve) => {
    const allEvents = [];
    const seenIds = new Set();
    let completed = 0;
    let resolved = false;

    const finish = () => {
      if (resolved) return;
      completed++;
      if (completed >= RELAYS.length) {
        resolved = true;
        console.log(`[Relay] KIND ${kind}: collected ${allEvents.length} events from ${RELAYS.length} relays`);
        resolve(allEvents);
      }
    };

    for (const relayUrl of RELAYS) {
      try {
        const ws = new WebSocket(relayUrl);
        const subId = `srv_${kind}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const t = setTimeout(() => {
          console.warn(`[Relay] ${relayUrl} timeout after ${timeout}ms`);
          try { ws.close(); } catch {}
          finish();
        }, timeout);

        ws.on('open', () => {
          ws.send(JSON.stringify(['REQ', subId, { kinds: [kind], limit }]));
        });

        ws.on('message', (data) => {
          try {
            const msg = JSON.parse(data);
            if (msg[0] === 'EVENT' && msg[1] === subId && !seenIds.has(msg[2].id)) {
              seenIds.add(msg[2].id);
              allEvents.push(msg[2]);
            }
            if (msg[0] === 'EOSE') {
              clearTimeout(t);
              try { ws.close(); } catch {}
              finish();
            }
          } catch {}
        });

        ws.on('error', () => {
          clearTimeout(t);
          finish();
        });

        ws.on('close', () => {
          clearTimeout(t);
          finish();
        });
      } catch {
        finish();
      }
    }
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
