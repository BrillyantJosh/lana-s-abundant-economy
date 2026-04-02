const express = require('express');
const path = require('path');
const WebSocket = require('ws');
const Database = require('better-sqlite3');
const fs = require('fs');

const app = express();
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
  try {
    const events = await queryRelays(kind, timeout);
    res.json({ events });
  } catch (err) {
    console.error('Relay query error:', err);
    res.status(500).json({ error: 'Failed to query relays' });
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

function queryRelays(kind, timeout = 15000) {
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
          ws.send(JSON.stringify(['REQ', subId, { kinds: [kind] }]));
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
