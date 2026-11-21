/**
 * WHO IS ASKING — proved per request, not claimed.
 *
 * Until 21 Nov 2026 the admin API of lanapays.us believed a bare header
 * (`x-admin-hex`) holding a Nostr PUBLIC key, and only checked that the key was
 * in the admin_users table. A public key is public: it is on every event on the
 * relays and in this very repository. So anybody who had seen an admin's hex
 * could send it and be that admin. Naming yourself was authentication.
 *
 * The caller now SIGNS each request: a NIP-98 event (kind 27235) signed with
 * the key whose hex it claims, that binds
 *   - the HTTP method                    (`method` tag)
 *   - the path AND query string          (`u` tag — absolute URL or bare path;
 *                                         an absolute one must name THIS host)
 *   - the exact body bytes, when there is a body  (`payload` = sha256 hex)
 * is at most MAX_SKEW_SEC old or early, and is SINGLE USE: a header captured in
 * flight cannot be replayed, not even inside its minute.
 *
 * The signature only establishes the hex. Whether that hex may do the thing —
 * the admin roster — is decided by the caller of this module (adminAuth.cjs).
 *
 * ⚠ Two identical requests in the same second would be the SAME event (the id is
 * sha256 over [0, pubkey, created_at, kind, tags, content]; the signature is not
 * in it) and single use would refuse the second. That is why the browser helper
 * (src/lib/nip98Fetch.ts) puts a random `nonce` tag in every token. NIP-98
 * allows extra tags and they are inside the signature, so nobody can strip one.
 *
 * This is a line-for-line CommonJS port of the canonical TypeScript module
 * lana-brain/server/lib/nip98Auth.ts (byte-identical in lana-brain,
 * lana-direct-fund and lana-coin-discount). Same checks, same order, same
 * reason codes. Fix it there first, then port the change here.
 */
'use strict';

const { createHash } = require('crypto');
const { schnorr } = require('@noble/curves/secp256k1');

const AUTH_KIND = 27235;
/** How long a token is good for, either way of "now". A captured header dies with it. */
const MAX_SKEW_SEC = 60;
const EMPTY_SHA256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

/** Spent token ids → when they stop mattering. In memory: a token lives two minutes at most. */
const spent = new Map();

function consumeOnce(id, expiresAt, nowSec) {
  for (const [k, exp] of spent) if (exp < nowSec) spent.delete(k);
  if (spent.has(id)) return false;
  spent.set(id, expiresAt);
  return true;
}

/** Test seam only. */
function forgetSpentTokens() {
  spent.clear();
}

function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

/** Path + query, normalised the same way for what was signed and what arrived. */
function normalizeTarget(target) {
  try {
    const u = new URL(target, 'http://placeholder.invalid');
    return u.pathname + u.search;
  } catch {
    return null;
  }
}

function tagValue(tags, name) {
  const t = tags.find((x) => x[0] === name);
  return t ? t[1] : undefined;
}

/**
 * Does this request carry a valid, fresh, unspent NIP-98 token for exactly this
 * method, target, host and body? Returns the signer's hex. Pure apart from the
 * single-use store, which runs LAST so a bad token never spends a good id.
 *
 * r = { authorization, method, target (path + query as received), host?, rawBody? }
 * opts = { nowSec?, consume?(id, expiresAt, nowSec) → false when already spent }
 */
function verifyNip98(r, opts = {}) {
  const nowSec = opts.nowSec ?? Math.floor(Date.now() / 1000);
  const consume = opts.consume ?? consumeOnce;
  const fail = (reason) => ({ ok: false, reason });

  if (!r.authorization) return fail('MISSING');
  const m = /^Nostr\s+([A-Za-z0-9+/=_-]+)\s*$/.exec(String(r.authorization).trim());
  if (!m) return fail('MALFORMED');

  let ev;
  try {
    ev = JSON.parse(Buffer.from(m[1], 'base64').toString('utf8'));
  } catch {
    return fail('BAD_BASE64');
  }
  if (!ev || typeof ev !== 'object' || Array.isArray(ev)) return fail('BAD_EVENT');

  const { id, pubkey, created_at, kind, tags, content, sig } = ev;
  if (kind !== AUTH_KIND) return fail('BAD_KIND');
  if (typeof pubkey !== 'string' || !/^[0-9a-f]{64}$/.test(pubkey)) return fail('BAD_PUBKEY');
  if (typeof sig !== 'string' || !/^[0-9a-f]{128}$/.test(sig)) return fail('BAD_SIG');
  if (typeof id !== 'string' || !/^[0-9a-f]{64}$/.test(id)) return fail('BAD_ID');
  if (typeof created_at !== 'number' || !Number.isInteger(created_at)) return fail('BAD_TIME');
  if (Math.abs(nowSec - created_at) > MAX_SKEW_SEC) return fail('STALE');
  if (typeof content !== 'string') return fail('BAD_EVENT');
  if (!Array.isArray(tags) || !tags.every((t) => Array.isArray(t) && t.every((x) => typeof x === 'string'))) {
    return fail('BAD_TAGS');
  }

  // Bound to this verb: a captured GET is not a licence to POST.
  if (String(tagValue(tags, 'method') || '').toUpperCase() !== String(r.method).toUpperCase()) {
    return fail('METHOD_MISMATCH');
  }

  // Bound to this path and query: editing post 7 is not deleting post 8.
  const u = tagValue(tags, 'u') || '';
  let signedTarget = null;
  if (u.startsWith('/') && !u.startsWith('//')) {
    signedTarget = normalizeTarget(u);
  } else {
    let url;
    try {
      url = new URL(u);
    } catch {
      return fail('PATH_MISMATCH');
    }
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return fail('PATH_MISMATCH');
    // Bound to this server: a token signed for one Lana service is not good at another.
    if (r.host && url.host.toLowerCase() !== String(r.host).toLowerCase()) return fail('HOST_MISMATCH');
    signedTarget = url.pathname + url.search;
  }
  if (!signedTarget || signedTarget !== normalizeTarget(r.target)) return fail('PATH_MISMATCH');

  // Bound to this body: the same URL with a different post text is a different request.
  const payload = tagValue(tags, 'payload');
  const body = r.rawBody && r.rawBody.length > 0 ? r.rawBody : null;
  if (body) {
    if (!payload) return fail('PAYLOAD_MISSING');
    if (payload.toLowerCase() !== sha256Hex(body)) return fail('PAYLOAD_MISMATCH');
  } else if (payload && payload.toLowerCase() !== EMPTY_SHA256) {
    return fail('PAYLOAD_MISMATCH');
  }

  // Recompute the id from the fields themselves, then check the signature over
  // it. Never trust ev.id, and never hand the object to a library verifier that
  // may cache a "verified" mark on it.
  const expectedId = sha256Hex(JSON.stringify([0, pubkey, created_at, kind, tags, content]));
  if (expectedId !== id) return fail('BAD_ID');
  try {
    if (!schnorr.verify(Buffer.from(sig, 'hex'), Buffer.from(id, 'hex'), Buffer.from(pubkey, 'hex'))) {
      return fail('BAD_SIG');
    }
  } catch {
    return fail('BAD_SIG');
  }

  if (!consume(id, created_at + 2 * MAX_SKEW_SEC, nowSec)) return fail('REPLAYED');
  return { ok: true, hex: pubkey, id };
}

/**
 * express.json({ verify: keepRawBody }) — keeps the exact bytes the client sent,
 * so the `payload` tag is checked against what arrived, not a re-serialisation.
 */
function keepRawBody(req, _res, buf) {
  req.rawBody = buf;
}

/** Reads the fields of an Express request this module needs. */
function verifyRequestNip98(req, opts = {}) {
  const auth = req.headers['authorization'];
  const host = req.headers['host'];
  return verifyNip98(
    {
      authorization: Array.isArray(auth) ? auth[0] : auth,
      method: req.method,
      target: String(req.originalUrl || req.url || ''),
      host: Array.isArray(host) ? host[0] : host,
      rawBody: req.rawBody,
    },
    opts,
  );
}

/** What the browser is told when the signature is missing or wrong. 403, like any refusal. */
function nip98Refusal(reason) {
  return {
    error: 'This request must be signed with your Nostr key. Sign out, sign in again, and retry.',
    code: 'SIGNATURE_REQUIRED',
    reason,
  };
}

module.exports = {
  AUTH_KIND,
  MAX_SKEW_SEC,
  consumeOnce,
  forgetSpentTokens,
  verifyNip98,
  keepRawBody,
  verifyRequestNip98,
  nip98Refusal,
};
