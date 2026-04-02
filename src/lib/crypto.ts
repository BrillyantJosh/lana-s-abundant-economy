import elliptic from 'elliptic';

const ec = new elliptic.ec('secp256k1');

function hexToBytes(hex: string) {
  return new Uint8Array(hex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256d(data: Uint8Array): Promise<Uint8Array> {
  const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
  const first = await crypto.subtle.digest('SHA-256', ab);
  const second = await crypto.subtle.digest('SHA-256', first);
  return new Uint8Array(second);
}

function base58Decode(encoded: string): Uint8Array {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let num = 0n;
  for (const char of encoded) {
    const index = alphabet.indexOf(char);
    if (index === -1) throw new Error('Invalid Base58 character');
    num = num * 58n + BigInt(index);
  }
  let hex = num.toString(16);
  if (hex.length % 2) hex = '0' + hex;
  let bytes = hexToBytes(hex);
  for (const char of encoded) {
    if (char !== '1') break;
    bytes = new Uint8Array([0, ...bytes]);
  }
  return bytes;
}

function normalizeWif(wif: string): string {
  return wif.replace(/[\s\u200B-\u200D\uFEFF\r\n\t]/g, '').trim();
}

async function wifToPrivateKey(wif: string): Promise<{ privateKeyHex: string; isCompressed: boolean }> {
  const normalizedWif = normalizeWif(wif);
  const decoded = base58Decode(normalizedWif);
  const payload = decoded.slice(0, -4);
  const checksum = decoded.slice(-4);
  const hash = await sha256d(payload);
  const expectedChecksum = hash.slice(0, 4);
  for (let i = 0; i < 4; i++) {
    if (checksum[i] !== expectedChecksum[i]) throw new Error('Invalid WIF checksum');
  }
  if (payload[0] !== 0xb0 && payload[0] !== 0x41) throw new Error('Invalid WIF prefix');
  const isCompressed = payload.length === 34 && payload[33] === 0x01;
  const privateKey = payload.slice(1, 33);
  return { privateKeyHex: bytesToHex(privateKey), isCompressed };
}

export function deriveNostrPublicKey(privateKeyHex: string): string {
  const keyPair = ec.keyFromPrivate(privateKeyHex);
  const pubKeyPoint = keyPair.getPublic();
  return pubKeyPoint.getX().toString(16).padStart(64, '0');
}

export async function wifToNostrHex(wif: string): Promise<string> {
  const { privateKeyHex } = await wifToPrivateKey(wif);
  return deriveNostrPublicKey(privateKeyHex);
}
