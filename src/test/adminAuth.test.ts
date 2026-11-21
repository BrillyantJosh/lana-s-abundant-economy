// @vitest-environment node
/* eslint-disable @typescript-eslint/no-explicit-any -- the tests forge and tamper with arbitrary events */
/**
 * The lanapays.us admin gate (21 Nov 2026): an admin request is believed only
 * when it is SIGNED (NIP-98) by a key on the roster. The `x-admin-hex` header
 * that used to be the whole of authentication is ignored.
 */
import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { createHash, randomBytes } from "crypto";
import { readFileSync } from "fs";
import path from "path";
import type { AddressInfo } from "net";
import type { Server } from "http";
import express from "express";
import { schnorr } from "@noble/curves/secp256k1";
import nip98 from "../../nip98Auth.cjs";
import adminAuth from "../../adminAuth.cjs";
import { nip98Headers, signedFetch } from "../lib/nip98Fetch";

const { verifyNip98, forgetSpentTokens, keepRawBody, MAX_SKEW_SEC } = nip98;
const { makeRequireAdmin } = adminAuth;

// ── test signer: what a browser running src/lib/nip98Fetch.ts would send ──
type Signer = { sk: string; hex: string };
const newSigner = (): Signer => {
  const sk = randomBytes(32).toString("hex");
  return { sk, hex: Buffer.from(schnorr.getPublicKey(Buffer.from(sk, "hex"))).toString("hex") };
};
const eventId = (e: any) =>
  createHash("sha256").update(JSON.stringify([0, e.pubkey, e.created_at, e.kind, e.tags, e.content])).digest("hex");
function header(
  s: Signer,
  o: { method: string; url: string; body?: string; nowSec?: number; kind?: number; payload?: string | null; extraTags?: any[][] },
): string {
  const created_at = o.nowSec ?? Math.floor(Date.now() / 1000);
  const tags: any[][] = [["u", o.url], ["method", o.method.toUpperCase()], ["nonce", randomBytes(16).toString("hex")]];
  const payload = o.payload !== undefined ? o.payload : o.body ? createHash("sha256").update(o.body).digest("hex") : null;
  if (payload) tags.push(["payload", payload]);
  if (o.extraTags) tags.push(...o.extraTags);
  const ev: any = { pubkey: s.hex, created_at, kind: o.kind ?? 27235, tags, content: "" };
  ev.id = eventId(ev);
  ev.sig = Buffer.from(schnorr.sign(Buffer.from(ev.id, "hex"), Buffer.from(s.sk, "hex"))).toString("hex");
  return encode(ev);
}
const decode = (h: string) => JSON.parse(Buffer.from(h.slice("Nostr ".length), "base64").toString("utf8"));
const encode = (ev: any) => "Nostr " + Buffer.from(JSON.stringify(ev)).toString("base64");

const NOW = 1_800_000_000;
const HOST = "lanapays.us";
const T = "/api/admin/posts/7?x=1";
const alice = newSigner();
const mallory = newSigner();
const req = (over: Record<string, unknown>) => ({ method: "POST", target: T, host: HOST, ...over });

describe("verifyNip98 (port of lana-brain server/lib/nip98Auth.ts)", () => {
  beforeEach(() => forgetSpentTokens());

  it("accepts a fresh token for this method, absolute URL and body, and returns the signer", () => {
    const body = JSON.stringify({ title: "a" });
    const h = header(alice, { method: "POST", url: `https://${HOST}${T}`, body, nowSec: NOW });
    const r = verifyNip98(req({ authorization: h, rawBody: Buffer.from(body) }), { nowSec: NOW });
    expect(r).toMatchObject({ ok: true, hex: alice.hex });
  });

  it("accepts a bare path + query as the u tag", () => {
    const h = header(alice, { method: "GET", url: T, nowSec: NOW });
    expect(verifyNip98(req({ method: "GET", authorization: h }), { nowSec: NOW }).ok).toBe(true);
  });

  it("refuses no header, a bare hex, and a Bearer key", () => {
    expect(verifyNip98(req({ authorization: undefined }), { nowSec: NOW })).toEqual({ ok: false, reason: "MISSING" });
    expect(verifyNip98(req({ authorization: alice.hex }), { nowSec: NOW })).toEqual({ ok: false, reason: "MALFORMED" });
    expect(verifyNip98(req({ authorization: "Bearer abc" }), { nowSec: NOW })).toEqual({ ok: false, reason: "MALFORMED" });
    expect(verifyNip98(req({ authorization: "Nostr !!!" }), { nowSec: NOW })).toEqual({ ok: false, reason: "MALFORMED" });
  });

  it("refuses another kind", () => {
    const h = header(alice, { method: "POST", url: T, nowSec: NOW, kind: 1 });
    expect(verifyNip98(req({ authorization: h }), { nowSec: NOW })).toEqual({ ok: false, reason: "BAD_KIND" });
  });

  it("refuses a token older or newer than the window", () => {
    for (const skew of [MAX_SKEW_SEC + 1, -(MAX_SKEW_SEC + 1)]) {
      const h = header(alice, { method: "POST", url: T, nowSec: NOW - skew });
      expect(verifyNip98(req({ authorization: h }), { nowSec: NOW })).toEqual({ ok: false, reason: "STALE" });
    }
  });

  it("is bound to the method", () => {
    const h = header(alice, { method: "PUT", url: T, nowSec: NOW });
    expect(verifyNip98(req({ method: "DELETE", authorization: h }), { nowSec: NOW })).toEqual({ ok: false, reason: "METHOD_MISMATCH" });
  });

  it("is bound to the path AND the query string", () => {
    for (const url of ["/api/admin/posts/8?x=1", "/api/admin/posts/7?x=2", "/api/admin/posts/7", `https://${HOST}/api/admin/posts`]) {
      const h = header(alice, { method: "POST", url, nowSec: NOW });
      expect(verifyNip98(req({ authorization: h }), { nowSec: NOW }), url).toEqual({ ok: false, reason: "PATH_MISMATCH" });
    }
  });

  it("is bound to the host when the u tag is absolute", () => {
    const h = header(alice, { method: "POST", url: `https://brain.lanapays.us${T}`, nowSec: NOW });
    expect(verifyNip98(req({ authorization: h }), { nowSec: NOW })).toEqual({ ok: false, reason: "HOST_MISMATCH" });
  });

  it("is bound to the exact body bytes", () => {
    const signed = JSON.stringify({ title: "Real" });
    const sent = JSON.stringify({ title: "Fake" });
    const h = header(alice, { method: "POST", url: T, body: signed, nowSec: NOW });
    expect(verifyNip98(req({ authorization: h, rawBody: Buffer.from(sent) }), { nowSec: NOW })).toEqual({ ok: false, reason: "PAYLOAD_MISMATCH" });
  });

  it("refuses a body that the token does not cover at all", () => {
    const h = header(alice, { method: "POST", url: T, nowSec: NOW });
    expect(verifyNip98(req({ authorization: h, rawBody: Buffer.from('{"a":1}') }), { nowSec: NOW })).toEqual({ ok: false, reason: "PAYLOAD_MISSING" });
  });

  it("refuses a payload tag when no body arrived (body stripped in flight)", () => {
    const h = header(alice, { method: "POST", url: T, body: '{"a":1}', nowSec: NOW });
    expect(verifyNip98(req({ authorization: h }), { nowSec: NOW })).toEqual({ ok: false, reason: "PAYLOAD_MISMATCH" });
  });

  it("refuses an edited tag (id no longer matches) and a signature by another key", () => {
    const ev = decode(header(alice, { method: "POST", url: T, nowSec: NOW }));
    const edited = { ...ev, tags: ev.tags.map((t: string[]) => (t[0] === "u" ? ["u", T + "&y=2"] : t)) };
    expect(verifyNip98(req({ authorization: encode(edited), target: T + "&y=2" }), { nowSec: NOW })).toEqual({ ok: false, reason: "BAD_ID" });

    // Mallory signs the request herself but claims Alice's pubkey.
    const own = decode(header(mallory, { method: "POST", url: T, nowSec: NOW }));
    const forged = { ...own, pubkey: alice.hex };
    forged.id = eventId(forged);
    expect(verifyNip98(req({ authorization: encode(forged) }), { nowSec: NOW })).toEqual({ ok: false, reason: "BAD_SIG" });
  });

  it("refuses non-string tags", () => {
    const h = header(alice, { method: "POST", url: T, nowSec: NOW, extraTags: [["x", 1]] });
    expect(verifyNip98(req({ authorization: h }), { nowSec: NOW })).toEqual({ ok: false, reason: "BAD_TAGS" });
  });

  it("is single use: the same header twice is a replay", () => {
    const h = header(alice, { method: "POST", url: T, nowSec: NOW });
    expect(verifyNip98(req({ authorization: h }), { nowSec: NOW }).ok).toBe(true);
    expect(verifyNip98(req({ authorization: h }), { nowSec: NOW + 1 })).toEqual({ ok: false, reason: "REPLAYED" });
  });

  it("two identical requests in the same second are two tokens (the nonce)", () => {
    const a = header(alice, { method: "GET", url: T, nowSec: NOW });
    const b = header(alice, { method: "GET", url: T, nowSec: NOW });
    expect(decode(a).id).not.toBe(decode(b).id);
    expect(verifyNip98(req({ method: "GET", authorization: a }), { nowSec: NOW }).ok).toBe(true);
    expect(verifyNip98(req({ method: "GET", authorization: b }), { nowSec: NOW }).ok).toBe(true);
  });

  it("a refused token does not spend its id", () => {
    const h = header(alice, { method: "POST", url: T, nowSec: NOW });
    expect(verifyNip98(req({ authorization: h, target: "/elsewhere" }), { nowSec: NOW }).ok).toBe(false);
    expect(verifyNip98(req({ authorization: h }), { nowSec: NOW }).ok).toBe(true);
  });
});

// ── the gate as server.cjs mounts it: express.json({ verify: keepRawBody }) + requireAdmin ──
describe("requireAdmin over HTTP", () => {
  const admin = newSigner();
  const outsider = newSigner();
  const roster = new Set([admin.hex]);
  const seen: Array<{ method: string; adminHex: string; body: unknown }> = [];
  let server: Server;
  let base: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json({ verify: keepRawBody }));
    const requireAdmin = makeRequireAdmin((hex: string) => roster.has(hex));
    const record = (req: any, res: any) => {
      seen.push({ method: req.method, adminHex: req.adminHex, body: req.body });
      res.json({ ok: true, adminHex: req.adminHex });
    };
    app.get("/api/admin/whoami", requireAdmin, (req: any, res) => res.json({ hex: req.adminHex }));
    app.post("/api/admin/posts", requireAdmin, record);
    app.put("/api/admin/posts/:id", requireAdmin, record);
    app.delete("/api/admin/posts/:id", requireAdmin, record);
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
    });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
  beforeEach(() => {
    seen.length = 0;
    forgetSpentTokens();
  });

  const post = (headers: Record<string, string>, body = JSON.stringify({ title: "t", body: "b", language: "en" })) =>
    fetch(`${base}/api/admin/posts`, { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body });

  it("refuses the old unsigned x-admin-hex header, even naming a real admin", async () => {
    const res = await post({ "x-admin-hex": admin.hex });
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "SIGNATURE_REQUIRED", reason: "MISSING" });
    for (const method of ["PUT", "DELETE"]) {
      const r = await fetch(`${base}/api/admin/posts/3`, { method, headers: { "x-admin-hex": admin.hex } });
      expect(r.status, method).toBe(403);
    }
    expect(seen).toEqual([]);
  });

  it("refuses a valid signature by a key not on the roster, whatever x-admin-hex says", async () => {
    const body = JSON.stringify({ title: "t" });
    const h = header(outsider, { method: "POST", url: "/api/admin/posts", body });
    const res = await post({ Authorization: h, "x-admin-hex": admin.hex }, body);
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "NOT_ADMIN" });
    expect(seen).toEqual([]);
  });

  it("lets a roster key through, and the signer — not a header — is the admin", async () => {
    const body = JSON.stringify({ title: "t", body: "b", language: "sl" });
    const h = header(admin, { method: "POST", url: "/api/admin/posts", body });
    const res = await post({ Authorization: h, "x-admin-hex": outsider.hex }, body);
    expect(res.status).toBe(200);
    expect(seen).toEqual([{ method: "POST", adminHex: admin.hex, body: { title: "t", body: "b", language: "sl" } }]);
  });

  it("refuses a signed request whose body was changed in flight", async () => {
    const h = header(admin, { method: "POST", url: "/api/admin/posts", body: JSON.stringify({ title: "Real" }) });
    const res = await post({ Authorization: h }, JSON.stringify({ title: "Fake" }));
    expect(res.status).toBe(403);
    expect(await res.json()).toMatchObject({ code: "SIGNATURE_REQUIRED", reason: "PAYLOAD_MISMATCH" });
  });

  it("refuses a signed edit of post 7 used to delete post 8, and a replay", async () => {
    const h = header(admin, { method: "DELETE", url: "/api/admin/posts/7" });
    const other = await fetch(`${base}/api/admin/posts/8`, { method: "DELETE", headers: { Authorization: h } });
    expect(await other.json()).toMatchObject({ reason: "PATH_MISMATCH" });
    const first = await fetch(`${base}/api/admin/posts/7`, { method: "DELETE", headers: { Authorization: h } });
    expect(first.status).toBe(200);
    const again = await fetch(`${base}/api/admin/posts/7`, { method: "DELETE", headers: { Authorization: h } });
    expect(again.status).toBe(403);
    expect(await again.json()).toMatchObject({ reason: "REPLAYED" });
    expect(seen.length).toBe(1);
  });

  it("accepts what the admin page's own signer (src/lib/nip98Fetch.ts) sends", async () => {
    const g = globalThis as any;
    const prev = g.window;
    g.window = { location: new URL(`${base}/admin`) };
    try {
      const who = await signedFetch(`${base}/api/admin/whoami`, { method: "GET" }, admin.sk);
      expect(await who.json()).toEqual({ hex: admin.hex });

      const body = JSON.stringify({ title: "Naslov", body: "Besedilo ščž", language: "sl" });
      const put = await signedFetch(`${base}/api/admin/posts/4`, { method: "PUT", headers: { "Content-Type": "application/json" }, body }, admin.sk);
      expect(put.status).toBe(200);
      const del = await signedFetch(`${base}/api/admin/posts/4`, { method: "DELETE" }, admin.sk);
      expect(del.status).toBe(200);
      expect(seen.map((s) => s.method)).toEqual(["PUT", "DELETE"]);

      const outsiderRes = await signedFetch(`${base}/api/admin/whoami`, { method: "GET" }, outsider.sk);
      expect(await outsiderRes.json()).toMatchObject({ code: "NOT_ADMIN" });
    } finally {
      g.window = prev;
    }
  });
});

describe("the admin page's signer on the real host", () => {
  beforeEach(() => forgetSpentTokens());

  it("signs the absolute URL, so a token made on lanapays.us is good only there", async () => {
    const g = globalThis as any;
    const prev = g.window;
    g.window = { location: new URL("https://lanapays.us/admin") };
    try {
      const s = newSigner();
      const body = JSON.stringify({ title: "x" });
      const { Authorization } = await nip98Headers("POST", "/api/admin/posts", body, s.sk);
      expect(decode(Authorization).tags.find((t: string[]) => t[0] === "u")[1]).toBe("https://lanapays.us/api/admin/posts");
      const at = (host: string) =>
        verifyNip98({ authorization: Authorization, method: "POST", target: "/api/admin/posts", host, rawBody: Buffer.from(body) });
      expect(at("brain.lanapays.us")).toEqual({ ok: false, reason: "HOST_MISMATCH" });
      expect(at("lanapays.us")).toMatchObject({ ok: true, hex: s.hex });
    } finally {
      g.window = prev;
    }
  });

  it("sends nothing it could not sign (no key → unsigned → refused by the server)", async () => {
    expect(await nip98Headers("GET", "/api/admin/whoami", undefined, "")).toEqual({});
    expect(await nip98Headers("GET", "/api/admin/whoami", undefined, "zz")).toEqual({});
  });
});

// ── wiring: what the gate is worth depends on server.cjs and the image actually using it ──
describe("server.cjs and Dockerfile wiring", () => {
  const root = path.resolve(__dirname, "../..");
  const server = readFileSync(path.join(root, "server.cjs"), "utf8");
  const code = server.replace(/\/\/.*$/gm, "");

  it("keeps the raw body for the payload check", () => {
    expect(code).toMatch(/express\.json\(\{\s*verify:\s*keepRawBody\s*\}\)/);
  });

  it("never reads the old x-admin-hex header", () => {
    expect(code).not.toMatch(/x-admin-hex/i);
    expect(code).not.toMatch(/\/api\/auth\/verify/);
  });

  it("puts every /api/admin route behind requireAdmin", () => {
    const routes = [...code.matchAll(/app\.(get|post|put|patch|delete|all|use)\(\s*['"`](\/api\/admin[^'"`]*)['"`]\s*,([^)]*)/g)];
    expect(routes.length).toBeGreaterThanOrEqual(4);
    for (const r of routes) expect(r[3], `${r[1]} ${r[2]}`).toMatch(/requireAdmin/);
  });

  it("the image copies every local .cjs module the server loads", () => {
    const docker = readFileSync(path.join(root, "Dockerfile"), "utf8");
    const copy = docker.split("\n").find((l) => /^COPY\s+server\.cjs/.test(l)) || "";
    const needed = new Set<string>();
    const visit = (file: string) => {
      const src = readFileSync(path.join(root, file), "utf8");
      for (const m of src.matchAll(/require\(\s*['"]\.\/([^'"]+\.cjs)['"]\s*\)/g)) {
        if (!needed.has(m[1])) {
          needed.add(m[1]);
          visit(m[1]);
        }
      }
    };
    visit("server.cjs");
    expect(needed.has("adminAuth.cjs") && needed.has("nip98Auth.cjs")).toBe(true);
    for (const f of needed) expect(copy.split(/\s+/), f).toContain(f);
  });
});
