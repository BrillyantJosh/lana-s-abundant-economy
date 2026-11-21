/**
 * Proving, per request, that this browser holds the key it claims.
 *
 * The lanapays.us server no longer believes a header that merely NAMES a Nostr
 * public key (`x-admin-hex`) — a public key is public, so naming one proves
 * nothing. Every admin call carries a NIP-98 token instead (nip98Auth.cjs): a
 * kind-27235 event signed with the admin's key, bound to this method, this exact
 * URL (path + query) and this exact body, good for about a minute, and
 * spendable once.
 *
 * ⚠ THE NONCE IS NOT DECORATION. Two identical requests in the same second
 * would otherwise be the same event id, and the server, which spends each id
 * once, would refuse the second as a replay.
 *
 * Follows lana-coin-discount / lana-direct-fund src/lib/nip98Fetch.ts, with two
 * differences: the key is passed in by the caller (the admin page holds it in
 * the tab's memory only — nothing is stored), and the event is signed with
 * @noble/curves directly (this app has no nostr-tools). The result is the same
 * NIP-01 event nostr-tools' finalizeEvent would produce.
 */
import { schnorr } from '@noble/curves/secp256k1';

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function randomNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return bytesToHex(new Uint8Array(digest));
}

function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/**
 * The URL the token names. On a real host the absolute URL, so the token is good
 * only at this host. On localhost (dev) a Vite proxy may rewrite Host, so the
 * bare path + query is signed instead (the server accepts either form).
 */
function signedUrl(url: string): string {
  const abs = new URL(url, window.location.href);
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
  return local ? abs.pathname + abs.search : abs.href;
}

function normalizeKey(key: string): string | null {
  const sk = String(key || '').trim().toLowerCase();
  return /^[0-9a-f]{64}$/.test(sk) ? sk : null;
}

/**
 * The Authorization header proving the holder of `key` (32-byte hex) signed
 * this method + URL + body. Returns {} for a missing or malformed key, so the
 * request goes out unsigned and the server refuses it with a reason, rather than
 * this throwing inside a click handler.
 */
export async function nip98Headers(method: string, url: string, body: string | undefined, key: string): Promise<Record<string, string>> {
  const sk = normalizeKey(key);
  if (!sk) return {};
  const skBytes = hexToBytes(sk);
  const pubkey = bytesToHex(schnorr.getPublicKey(skBytes));
  const tags: string[][] = [
    ['u', signedUrl(url)],
    ['method', method.toUpperCase()],
    ['nonce', randomNonce()],
  ];
  if (body) tags.push(['payload', await sha256Hex(body)]);
  const created_at = Math.floor(Date.now() / 1000);
  const kind = 27235;
  const content = '';
  const id = await sha256Hex(JSON.stringify([0, pubkey, created_at, kind, tags, content]));
  const sig = bytesToHex(schnorr.sign(hexToBytes(id), skBytes));
  const ev = { id, pubkey, created_at, kind, tags, content, sig };
  return { Authorization: 'Nostr ' + toBase64(JSON.stringify(ev)) };
}

/**
 * fetch() with the signature attached. The body, if any, must be the string
 * that is sent (JSON.stringify once, pass it here): the signature covers those
 * exact bytes.
 */
export async function signedFetch(url: string, init: RequestInit, key: string): Promise<Response> {
  const method = String(init.method || 'GET').toUpperCase();
  if (init.body != null && typeof init.body !== 'string') {
    throw new Error('signedFetch: body must be a string (JSON.stringify it first)');
  }
  const auth = await nip98Headers(method, url, (init.body as string | undefined) ?? undefined, key);
  const headers = new Headers(init.headers);
  for (const [k, v] of Object.entries(auth)) headers.set(k, v);
  return fetch(url, { ...init, method, headers });
}

/** What to tell a person whose request came back refused by the server. */
export function explainRefusal(data: { code?: string; reason?: string } | null | undefined): string {
  if (data?.code === 'NOT_ADMIN') return 'Access denied. This key is not an authorized admin.';
  switch (data?.reason) {
    case 'MISSING':
    case 'MALFORMED':
    case 'BAD_BASE64':
    case 'BAD_EVENT':
      return 'This page has lost its signing key. Log out and log in again with your private key.';
    case 'STALE':
    case 'BAD_TIME':
      return 'Your device clock is more than a minute off, so the signature was rejected. Fix the date and time on this device, then try again.';
    case 'REPLAYED':
      return 'That request was already used. Try it once more.';
    default:
      return 'Could not verify your signature. Log out and log in again, then try once more.';
  }
}
