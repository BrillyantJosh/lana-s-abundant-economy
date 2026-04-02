const express = require('express');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

const RELAYS = [
  'wss://relay.lanavault.space',
  'wss://relay.lanacoin-eternity.com',
  'wss://relay.lanaheartvoice.com',
];

// Serve static files from the Vite build
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  immutable: true,
  setHeaders(res, filePath) {
    // Don't cache index.html
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// Relay proxy endpoint
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

// SPA fallback — serve index.html for all other routes
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
