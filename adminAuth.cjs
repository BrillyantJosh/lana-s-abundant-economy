/**
 * The lanapays.us admin gate.
 *
 * An admin request is let through only when it carries a valid NIP-98 signature
 * (nip98Auth.cjs) AND the key that signed it is on the admin roster. The signer
 * is the ONLY identity: a header, query parameter or body field that names a
 * hex is ignored. Until 21 Nov 2026 the gate believed the `x-admin-hex` header,
 * which anybody could fill in with an admin's public key.
 *
 * Every refusal is 403:
 *   { code: 'SIGNATURE_REQUIRED', reason }  — no / bad / stale / replayed signature
 *   { code: 'NOT_ADMIN' }                   — a good signature by a key not on the roster
 */
'use strict';

const { verifyRequestNip98, nip98Refusal } = require('./nip98Auth.cjs');

/**
 * isAdmin(hex) → boolean decides the roster. opts are passed to the verifier
 * (tests pin the clock with { nowSec }).
 */
function makeRequireAdmin(isAdmin, opts = {}) {
  return function requireAdmin(req, res, next) {
    const v = verifyRequestNip98(req, opts);
    if (!v.ok) return res.status(403).json(nip98Refusal(v.reason));
    let allowed = false;
    try {
      allowed = isAdmin(v.hex) === true;
    } catch {
      allowed = false;
    }
    if (!allowed) {
      return res.status(403).json({ error: 'Access denied. This key is not a lanapays.us admin.', code: 'NOT_ADMIN' });
    }
    req.adminHex = v.hex;
    next();
  };
}

module.exports = { makeRequireAdmin };
