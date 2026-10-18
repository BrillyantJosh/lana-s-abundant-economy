/**
 * Which providers the landing page counts and lists: Ekonomija Obilja units only.
 *
 * thelana.life/api/providers returns every active KIND 30901 business unit, but it does
 * not expose unit_type or lana_only, so two kinds of units arrive looking like storefronts:
 *
 * 1. LanaFund.Me payout units (KIND 30901 v1.1.0 unit_type='lanafund.me'). LanaFund.Me also
 *    stamps category='LanaFund.Me', and that category is what we match on (commit 81d5292).
 *
 * 2. LanaPays.Us Simple units. simple.lanapays.us signs every unit it registers with BOTH
 *      ['unit_type', 'simple.lanapays.us']
 *      ['lana_only', 'true']
 *    (lana-pays-simple server/lib/unitOrigin.ts). Either tag alone is enough, because shop's
 *    edit form emits neither: a Simple unit edited there loses the tags on its next NIP-33
 *    republish. For the same reason the mark is sticky — once a unit was seen as Simple it
 *    stays Simple (moving to Ekonomija Obilja means registering a new unit). Those tags are
 *    only on the signed 30901 itself, so server.cjs reads it from the relays.
 *
 * Only events signed by the unit's own owner count: a stranger publishing a 30901 with the
 * same d-tag must not be able to hide somebody else's unit.
 */
const SIMPLE_UNIT_TYPE = 'simple.lanapays.us';

function tagValue(ev, name) {
  const tags = ev && Array.isArray(ev.tags) ? ev.tags : [];
  const tag = tags.find(t => Array.isArray(t) && t[0] === name);
  return tag && typeof tag[1] === 'string' ? tag[1] : '';
}

const unitKey = (ownerHex, unitId) => `${String(ownerHex || '').trim().toLowerCase()}:${String(unitId || '').trim()}`;

function isSimpleUnitEvent(ev) {
  return tagValue(ev, 'unit_type').trim().toLowerCase() === SIMPLE_UNIT_TYPE
    || tagValue(ev, 'lana_only').trim().toLowerCase() === 'true';
}

/** owner:unit_id keys of every unit whose signer published a 30901 marked Simple (any version). */
function simpleUnitKeys(events) {
  const keys = new Set();
  for (const ev of events || []) {
    if (!ev || ev.kind !== 30901 || !ev.pubkey || !isSimpleUnitEvent(ev)) continue;
    for (const id of new Set([tagValue(ev, 'd'), tagValue(ev, 'unit_id')])) {
      if (id) keys.add(unitKey(ev.pubkey, id));
    }
  }
  return keys;
}

const isPayoutOnlyUnit = p => String((p && p.category) || '').trim().toLowerCase() === 'lanafund.me';
const isSimpleProvider = (p, simpleKeys) => Boolean(p) && simpleKeys.has(unitKey(p.owner_hex, p.unit_id));

/**
 * Split thelana.life providers into the Ekonomija Obilja storefronts the page shows and
 * counts. A unit whose 30901 was not found on the relays is KEPT: the Simple mark is a
 * positive tag, so "no tag seen" means a regular unit (KIND 30901: unit_type is absent on
 * regular merchant units) — and a relay hiccup must not silently empty the list.
 */
function selectStorefronts(providers, simpleKeys) {
  const keys = simpleKeys || new Set();
  const storefronts = [];
  const hidden = { simple: 0, payoutOnly: 0 };
  for (const p of providers || []) {
    if (isPayoutOnlyUnit(p)) hidden.payoutOnly++;
    else if (isSimpleProvider(p, keys)) hidden.simple++;
    else storefronts.push(p);
  }
  return { storefronts, hidden };
}

module.exports = {
  SIMPLE_UNIT_TYPE,
  unitKey,
  isSimpleUnitEvent,
  simpleUnitKeys,
  isPayoutOnlyUnit,
  isSimpleProvider,
  selectStorefronts,
};
