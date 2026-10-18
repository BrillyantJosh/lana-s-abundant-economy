import { describe, it, expect } from "vitest";
import origin from "../../unitOrigin.cjs";
import { isSimpleUnitEvent as clientIsSimple } from "@/lib/relayData";

// Shapes follow the live data of 18. 10. 2026: thelana.life/api/providers rows and the
// owners' KIND 30901 on the relays (bank / address tags left out on purpose).
const OWNER_SIMPLE = "a".repeat(64);
const OWNER_OBILJE = "b".repeat(64);
const OWNER_FUND = "c".repeat(64);
const STRANGER = "d".repeat(64);

const unit30901 = (pubkey: string, d: string, extra: string[][] = []) => ({
  kind: 30901,
  pubkey,
  tags: [["d", d], ["unit_id", d], ["name", d], ["status", "active"], ...extra],
});

const provider = (owner_hex: string, unit_id: string, category = "Services") => ({
  unit_id,
  owner_hex,
  name: unit_id,
  category,
  registeredAt: 1792128384,
});

describe("Simple unit mark (KIND 30901 tags)", () => {
  const cases: [string, string[][], boolean][] = [
    ["both tags, as simple.lanapays.us signs them", [["unit_type", "simple.lanapays.us"], ["lana_only", "true"]], true],
    ["unit_type alone", [["unit_type", "simple.lanapays.us"]], true],
    ["lana_only alone (shop edit dropped unit_type)", [["lana_only", "true"]], true],
    ["regular unit", [["category", "Producer"]], false],
    ["regular unit paid out in LANA is NOT Simple", [["lanapays_payout_method", "lana"]], false],
    ["LanaFund.Me unit_type is not Simple", [["unit_type", "lanafund.me"]], false],
    ["lana_only=false", [["lana_only", "false"]], false],
  ];
  for (const [label, tags, expected] of cases) {
    it(`${label} -> ${expected ? "Simple" : "not Simple"} (server and client agree)`, () => {
      const ev = unit30901(OWNER_SIMPLE, "u1", tags);
      expect(origin.isSimpleUnitEvent(ev)).toBe(expected);
      expect(clientIsSimple(ev)).toBe(expected);
    });
  }
});

describe("selectStorefronts: Ekonomija Obilja providers only", () => {
  const providers = [
    provider(OWNER_SIMPLE, "yasuragi", "Health & Wellbeing"),
    provider(OWNER_OBILJE, "biochar", "Producer"),
    provider(OWNER_FUND, "gosenca", "LanaFund.Me"),
    provider(OWNER_OBILJE, "no-event-on-relays", "Shop"),
  ];
  const events = [
    unit30901(OWNER_SIMPLE, "yasuragi", [["unit_type", "simple.lanapays.us"], ["lana_only", "true"]]),
    unit30901(OWNER_OBILJE, "biochar", [["lanapays_payout_method", "fiat"]]),
    unit30901(OWNER_FUND, "gosenca", [["unit_type", "lanafund.me"]]),
  ];

  it("drops Simple and LanaFund.Me units from the list and the count", () => {
    const { storefronts, hidden } = origin.selectStorefronts(providers, origin.simpleUnitKeys(events));
    expect(storefronts.map(p => p.unit_id)).toEqual(["biochar", "no-event-on-relays"]);
    expect(hidden).toEqual({ simple: 1, payoutOnly: 1 });
  });

  it("keeps a unit whose 30901 was not found (relay hiccup must not empty the list)", () => {
    const { storefronts } = origin.selectStorefronts(providers, new Set());
    expect(storefronts.map(p => p.unit_id)).toEqual(["yasuragi", "biochar", "no-event-on-relays"]);
  });

  it("ignores a Simple mark signed by someone other than the unit owner", () => {
    const forged = [unit30901(STRANGER, "biochar", [["lana_only", "true"]])];
    const { storefronts, hidden } = origin.selectStorefronts(providers, origin.simpleUnitKeys(forged));
    expect(storefronts.map(p => p.unit_id)).toContain("biochar");
    expect(hidden.simple).toBe(0);
  });

  it("stays Simple when any version of the unit carried the mark (sticky)", () => {
    const republishedWithoutTags = unit30901(OWNER_SIMPLE, "yasuragi", []);
    const keys = origin.simpleUnitKeys([events[0], republishedWithoutTags]);
    expect(origin.isSimpleProvider(providers[0], keys)).toBe(true);
  });
});
