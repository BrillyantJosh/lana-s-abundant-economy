/**
 * Which country a provider is in, for the "latest providers" lists of the LanaConnects pages
 * (the Slovenian page lists Slovenian providers, the English page the UK ones).
 *
 * The country on a unit is free text typed by the merchant, so the live data holds
 *   SI, Slovenia, Sl, SL, SLOVENIA   (all Slovenia)
 *   GB, UK                           (both the United Kingdom)
 *   ES
 * It must NEVER be turned into a code by upper-casing alone: "Sl" would become SL, which is
 * Sierra Leone. So the text goes through an explicit alias map first (lower-cased, accents and
 * dots removed) and "sl" is, on purpose, Slovenia: no provider of this network is in Sierra
 * Leone, and "Sl" / "SL" is what Slovenian merchants type. Only text that is not in the map and is
 * written as exactly two capital ASCII letters is taken as an ISO code as it stands (ES, HR, ...).
 * Anything else has no code ('') and is simply not listed under any country.
 *
 * Same idea as COUNTRY_ALIASES in lana-pays-shop (src/components/CountrySelect.tsx), but this one
 * answers "which country is this text?", where the shop's one answers "which countries match what
 * is being typed?".
 */

// normalised text -> ISO 3166-1 alpha-2
const COUNTRY_NAMES = {
  SI: ['si', 'slo', 'sl', 'svn', 'slovenia', 'slovenija', 'slovenie', 'republic of slovenia', 'republika slovenija'],
  GB: ['gb', 'uk', 'gbr', 'en', 'united kingdom', 'the united kingdom', 'the uk', 'great britain', 'britain', 'england', 'scotland', 'wales', 'northern ireland', 'velika britanija', 'zdruzeno kraljestvo', 'anglija'],
  HR: ['hr', 'cro', 'hrv', 'croatia', 'hrvaska', 'hrvatska'],
  AT: ['at', 'aut', 'austria', 'avstrija', 'osterreich'],
  IT: ['it', 'ita', 'italy', 'italija', 'italia'],
  DE: ['de', 'ger', 'deu', 'germany', 'nemcija', 'deutschland'],
  FR: ['fr', 'fra', 'france', 'francija'],
  ES: ['es', 'spa', 'esp', 'spain', 'spanija', 'espana'],
  PT: ['pt', 'por', 'portugal', 'portugalska'],
  IE: ['ie', 'irl', 'ireland', 'irska'],
  NL: ['nl', 'ned', 'netherlands', 'holland', 'nizozemska'],
  BE: ['be', 'bel', 'belgium', 'belgija'],
  CH: ['ch', 'sui', 'switzerland', 'svica', 'schweiz'],
  HU: ['hu', 'hun', 'hungary', 'madzarska'],
  RS: ['rs', 'srb', 'serbia', 'srbija'],
  BA: ['ba', 'bih', 'bosnia', 'bosnia and herzegovina', 'bosna', 'bosna in hercegovina'],
  ME: ['me', 'montenegro', 'crna gora'],
  MK: ['mk', 'north macedonia', 'macedonia', 'severna makedonija', 'makedonija'],
  US: ['us', 'usa', 'united states', 'united states of america', 'america', 'zda', 'amerika'],
  CA: ['ca', 'can', 'canada', 'kanada'],
  AU: ['au', 'aus', 'australia', 'avstralija'],
};

const BY_TEXT = new Map();
for (const [code, names] of Object.entries(COUNTRY_NAMES)) {
  for (const name of names) BY_TEXT.set(name, code);
}

// "Slovenija" / "Španija" / "U.K." -> "slovenija" / "spanija" / "uk"
const normalizeCountryText = value => String(value == null ? '' : value)
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/\./g, '')
  .replace(/[^a-z ]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

/** ISO 3166-1 alpha-2 code of free-text country input, or '' when it cannot be told. */
function countryCode(value) {
  const raw = String(value == null ? '' : value).trim();
  if (!raw) return '';
  const known = BY_TEXT.get(normalizeCountryText(raw));
  if (known) return known;
  return /^[A-Z]{2}$/.test(raw) ? raw : '';
}

/**
 * Rows grouped by country code, newest first as given, at most `perCountry` each.
 * Rows without a country code are left out.
 */
function groupByCountry(rows, perCountry) {
  const groups = {};
  for (const row of rows || []) {
    const code = row && row.countryCode;
    if (!code) continue;
    const list = groups[code] || (groups[code] = []);
    if (list.length < perCountry) list.push(row);
  }
  return groups;
}

module.exports = { countryCode, normalizeCountryText, groupByCountry };
