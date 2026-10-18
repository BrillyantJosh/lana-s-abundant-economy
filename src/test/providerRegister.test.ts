import { describe, it, expect } from "vitest";
import { schnorr } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha2";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils";
import register from "../../providerRegister.cjs";

type Ev = { id: string; pubkey: string; created_at: number; kind: number; tags: string[][]; content: string; sig: string };

const key = () => {
  const sk = schnorr.utils.randomPrivateKey();
  return { sk, pk: bytesToHex(schnorr.getPublicKey(sk)) };
};
const sign = (k: { sk: Uint8Array; pk: string }, kind: number, created_at: number, tags: string[][]): Ev => {
  const base = { pubkey: k.pk, created_at, kind, tags, content: "" };
  const id = bytesToHex(sha256(utf8ToBytes(JSON.stringify([0, base.pubkey, created_at, kind, tags, ""]))));
  return { ...base, id, sig: bytesToHex(schnorr.sign(id, k.sk)) };
};

const processor = key();
const owner = key();
const stranger = key();
let t = 1_790_000_000;
const unit = (d: string, name: string, extra: string[][] = [], who = owner, unitId = d) =>
  sign(who, 30901, t++, [
    ["d", d], ["unit_id", unitId], ["name", name],
    ...(extra.some(x => x[0] === "status") ? [] : [["status", "active"]]),
    ...extra,
  ]);
const status = (d: string, value: string, who = processor) => sign(who, 30903, t++, [["d", d], ["unit_id", d], ["status", value]]);
const build = (units: Ev[], statuses: Ev[], simpleKeys = new Set<string>()) =>
  register.buildRegister(units, statuses, { processorHex: processor.pk, simpleKeys });

describe("provider register: the real count from KIND 30901 + 30903", () => {
  it("counts open units only (active and quota_warning_80, never suspended / pending / no 30903)", () => {
    const units = ["a", "b", "c", "d", "e"].map(d => unit(d, `Shop ${d}`));
    const statuses = [status("a", "active"), status("b", "quota_warning_80"), status("c", "suspended"), status("d", "pending")];
    const r = build(units, statuses);
    expect(r.networkTotal).toBe(2);
    expect(r.breakdown.statusByLatest30903).toEqual({ active: 1, quota_warning_80: 1, suspended: 1, pending: 1, none: 1 });
  });

  it("takes the NEWEST 30903 per unit and ignores 30903 not signed by the processor", () => {
    const units = [unit("a", "Shop a"), unit("b", "Shop b")];
    const statuses = [status("a", "active"), status("a", "suspended"), status("b", "suspended"), status("b", "active", stranger)];
    const r = build(units, statuses);
    expect(r.networkTotal).toBe(0);
    expect(r.breakdown.notProcessor30903).toBe(1);
  });

  it("drops events with a bad signature, d != unit_id and other authors' copies of a unit", () => {
    const good = unit("a", "Shop a");
    const tampered = { ...unit("b", "Shop b"), tags: [["d", "b"], ["unit_id", "b"], ["name", "Changed"], ["status", "active"]] };
    const shadow = unit("x", "Shadow", [], owner, "a");
    const hijack = unit("a", "Hijacked", [["status", "archived"]], stranger); // newer, but not the pinned author
    const r = build([good, tampered, shadow, hijack], [status("a", "active"), status("b", "active"), status("x", "active")]);
    expect(r.breakdown.invalidSignature30901).toBe(1);
    expect(r.breakdown.dNotUnitId).toBe(1);
    expect(r.breakdown.foreignAuthor).toBe(1);
    expect(r.networkTotal).toBe(1); // "Shop a" by its pinned owner, still active
  });

  it("removes archived, LanaFund.Me and TEST units; Simple only from the Ekonomija Obilja total", () => {
    const units = [
      unit("ok", "Kmetija Monera"),
      unit("pasta", "Testenine Mojca"), // a word that only starts with "test" is a real business
      unit("arch", "Old shop", [["status", "archived"]]),
      unit("fund", "Martin", [["unit_type", "lanafund.me"], ["category", "LanaFund.Me"]]),
      unit("test", "KMETIJA JJJ (TEST)"),
      unit("copy", "Eco shop (Kopija)"),
      unit("simple", "Yasuragi Studio", [["unit_type", "simple.lanapays.us"], ["lana_only", "true"]]),
      unit("edited", "Simple edited in shop"), // lost its tags, remembered as Simple
    ];
    const statuses = units.map(u => status(u.tags[0][1], "active"));
    const r = build(units, statuses, new Set([`${owner.pk}:edited`]));
    expect(r.breakdown).toMatchObject({ open: 8, archived: 1, payoutOnly: 1, test: 2, networkTotal: 4, simple: 2, obiljeTotal: 2 });
    expect(r.removedNames.test).toEqual(["Eco shop (Kopija)", "KMETIJA JJJ (TEST)"]);
  });

  it("de-duplicates the same event delivered by several relays", () => {
    const u = unit("a", "Shop a");
    const s = status("a", "active");
    const r = build([u, u, u, u], [s, s]);
    expect(r.breakdown.raw30901).toBe(1);
    expect(r.networkTotal).toBe(1);
  });
});
