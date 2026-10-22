import { describe, it, expect } from "vitest";
import country from "../../providerCountry.cjs";

// The country is free text typed by the merchant. Values seen in the live data of 22. 10. 2026:
// SI, Slovenia, Sl, SL, SLOVENIA, GB, UK, ES.
describe("providerCountry: free text -> ISO code", () => {
  const cases: [string, string][] = [
    ["SI", "SI"], ["Slovenia", "SI"], ["Sl", "SI"], ["SL", "SI"], ["sl", "SI"], ["SLOVENIA", "SI"],
    ["Slovenija", "SI"], ["  Slovenija ", "SI"], ["Slo", "SI"],
    ["GB", "GB"], ["UK", "GB"], ["uk", "GB"], ["U.K.", "GB"], ["United Kingdom", "GB"],
    ["Great Britain", "GB"], ["England", "GB"], ["Velika Britanija", "GB"],
    ["ES", "ES"], ["Spain", "ES"], ["Španija", "ES"],
    ["HR", "HR"], ["Hrvaška", "HR"],
    // an unknown but well-formed ISO code is kept as it stands
    ["NZ", "NZ"],
    // not told: empty, junk, or something that only looks like a code once upper-cased
    ["", ""], ["   ", ""], ["-", ""], ["Atlantis", ""], ["nz", ""], ["Xx", ""],
  ];
  for (const [text, code] of cases) {
    it(`${JSON.stringify(text)} -> ${JSON.stringify(code)}`, () => {
      expect(country.countryCode(text)).toBe(code);
    });
  }

  it("null / undefined / numbers are not a country", () => {
    expect(country.countryCode(null)).toBe("");
    expect(country.countryCode(undefined)).toBe("");
    expect(country.countryCode(42)).toBe("");
  });

  it("'Sl' is Slovenia, never Sierra Leone (the trap of upper-casing)", () => {
    expect(country.countryCode("Sl")).toBe("SI");
    expect(country.countryCode("Sl")).not.toBe("SL");
  });
});

describe("providerCountry: groupByCountry", () => {
  const row = (name: string, countryCode: string) => ({ name, countryCode });
  const rows = [row("a", "SI"), row("b", "GB"), row("c", "SI"), row("d", ""), row("e", "SI"), row("f", "GB"), row("g", "SI")];

  it("keeps the given (newest-first) order inside each country and caps each country", () => {
    const g = country.groupByCountry(rows, 3);
    expect(g.SI.map((r: { name: string }) => r.name)).toEqual(["a", "c", "e"]);
    expect(g.GB.map((r: { name: string }) => r.name)).toEqual(["b", "f"]);
  });

  it("leaves out rows without a country code", () => {
    const g = country.groupByCountry(rows, 10);
    expect(Object.keys(g).sort()).toEqual(["GB", "SI"]);
    expect(Object.values(g).flat().map((r: { name: string }) => r.name)).not.toContain("d");
  });

  it("empty or missing input gives no groups", () => {
    expect(country.groupByCountry([], 5)).toEqual({});
    expect(country.groupByCountry(null, 5)).toEqual({});
  });
});
