/**
 * The REAL number of providers, counted from the relays.
 *
 * thelana.life/api/providers asks each relay for `limit: 60` KIND 30901 with no paging, so it is
 * "the 60 most recently edited units", not the register (memory ops_provider_list_cap). This
 * module counts the register itself from ALL KIND 30901 + KIND 30903 events:
 *
 *   valid signature -> d == unit_id -> author pinned per unit (first author seen, never moved)
 *   -> newest 30901 per unit -> status from the newest processor-signed 30903 per unit,
 *   open = active | quota_warning_80
 *   -> minus archived by the owner (30901 status other than active)
 *   -> minus LanaFund.Me payout units (KIND 30901 v1.1.0: portals must not list them)
 *   -> minus test / copy units (the word TEST / Kopija / Copy in the unit name)
 *   = network total (lanaconnects.us: the whole network, Simple included)
 *   -> minus LanaPays.Us Simple units (unitOrigin.cjs)
 *   = Ekonomija Obilja total (lanapays.us)
 */
const crypto = require('crypto');
const { schnorr } = require('@noble/curves/secp256k1');
const { isSimpleUnitEvent, unitKey } = require('./unitOrigin.cjs');

// KIND 30902 / 30903 are signed only by the LanaPays processor key (lana-brain a3c133c,
// shop e464320, mobile 7a7d7d0 pin the same key).
const PROCESSOR_HEX = '79730aba75d71584e8a4f9d0cc1173085e75590ce489760078d2bf6f5210d692';
const OPEN_STATUSES = new Set(['active', 'quota_warning_80']);
const TEST_NAME = /(^|[^\p{L}\p{N}])(test|kopija|copy)([^\p{L}\p{N}]|$)/iu;
const HEX64 = /^[0-9a-f]{64}$/;

function tagValue(ev, name) {
  const tags = ev && Array.isArray(ev.tags) ? ev.tags : [];
  const tag = tags.find(t => Array.isArray(t) && t[0] === name);
  return tag && typeof tag[1] === 'string' ? tag[1] : '';
}

/** NIP-01: id = sha256 of the serialized event, sig = BIP-340 schnorr over the id. */
function isValidEvent(ev) {
  try {
    if (!ev || typeof ev.id !== 'string' || typeof ev.sig !== 'string' || !HEX64.test(ev.pubkey || '')) return false;
    const serialized = JSON.stringify([0, ev.pubkey, ev.created_at, ev.kind, ev.tags, ev.content]);
    const id = crypto.createHash('sha256').update(serialized, 'utf8').digest('hex');
    return id === ev.id && schnorr.verify(ev.sig, id, ev.pubkey);
  } catch {
    return false;
  }
}

const isPayoutOnlyEvent = ev => tagValue(ev, 'unit_type').trim().toLowerCase() === 'lanafund.me'
  || tagValue(ev, 'category').trim().toLowerCase() === 'lanafund.me';
const isTestUnitEvent = ev => TEST_NAME.test(tagValue(ev, 'name'));

/**
 * @param units30901  all KIND 30901 events (any relay, duplicates allowed)
 * @param status30903 all KIND 30903 events
 * @param opts.simpleKeys   remembered owner:unit_id keys of Simple units (sticky)
 * @param opts.verified     Map id -> boolean, reused between runs so each event is checked once
 * @param opts.processorHex the only key whose 30903 counts (tests pass their own)
 */
function buildRegister(units30901, status30903, opts = {}) {
  const simpleKeys = opts.simpleKeys || new Set();
  const verified = opts.verified || new Map();
  const processorHex = opts.processorHex || PROCESSOR_HEX;
  const valid = ev => {
    if (!verified.has(ev.id)) verified.set(ev.id, isValidEvent(ev));
    return verified.get(ev.id);
  };
  const dedupe = (events, kind) => {
    const byId = new Map();
    for (const ev of events || []) if (ev && ev.kind === kind && ev.id && !byId.has(ev.id)) byId.set(ev.id, ev);
    return [...byId.values()];
  };
  const raw1 = dedupe(units30901, 30901);
  const raw3 = dedupe(status30903, 30903);
  const ok1 = raw1.filter(valid);
  const ok3 = raw3.filter(valid);

  // d must equal unit_id (otherwise a "shadow slot" can collide with somebody else's unit).
  const shaped = ok1.filter(ev => tagValue(ev, 'd') && tagValue(ev, 'd') === tagValue(ev, 'unit_id'));
  const byUnit = new Map();
  for (const ev of shaped) {
    const d = tagValue(ev, 'd');
    if (!byUnit.has(d)) byUnit.set(d, []);
    byUnit.get(d).push(ev);
  }
  // Author pin (TOFU): the author of the oldest event we have for the unit; others are ignored.
  let foreignAuthor = 0;
  const newest = new Map();
  for (const [d, events] of byUnit) {
    const pinned = events.reduce((a, b) => (b.created_at < a.created_at ? b : a)).pubkey;
    const own = events.filter(ev => ev.pubkey === pinned);
    foreignAuthor += events.length - own.length;
    newest.set(d, own.reduce((a, b) => (b.created_at > a.created_at ? b : a)));
  }

  const statusByUnit = new Map();
  let notProcessor = 0;
  for (const ev of ok3) {
    if (ev.pubkey !== processorHex) { notProcessor++; continue; }
    const d = tagValue(ev, 'd');
    const cur = statusByUnit.get(d);
    if (d && (!cur || ev.created_at > cur.created_at)) statusByUnit.set(d, ev);
  }

  const statuses = {};
  const open = [];
  for (const [d, ev] of newest) {
    const status = statusByUnit.has(d) ? tagValue(statusByUnit.get(d), 'status').trim().toLowerCase() || 'unknown' : 'none';
    statuses[status] = (statuses[status] || 0) + 1;
    if (OPEN_STATUSES.has(status)) open.push(ev);
  }

  const removed = { archived: [], payoutOnly: [], test: [], simple: [] };
  const network = [];
  for (const ev of open) {
    const status1 = tagValue(ev, 'status').trim().toLowerCase();
    if (status1 && status1 !== 'active') removed.archived.push(ev);
    else if (isPayoutOnlyEvent(ev)) removed.payoutOnly.push(ev);
    else if (isTestUnitEvent(ev)) removed.test.push(ev);
    else network.push(ev);
  }
  const obilje = [];
  for (const ev of network) {
    if (isSimpleUnitEvent(ev) || simpleKeys.has(unitKey(ev.pubkey, tagValue(ev, 'd')))) removed.simple.push(ev);
    else obilje.push(ev);
  }
  const names = list => list.map(ev => tagValue(ev, 'name').trim()).sort((a, b) => a.localeCompare(b));

  return {
    networkTotal: network.length,
    obiljeTotal: obilje.length,
    breakdown: {
      raw30901: raw1.length,
      invalidSignature30901: raw1.length - ok1.length,
      dNotUnitId: ok1.length - shaped.length,
      foreignAuthor,
      units: newest.size,
      raw30903: raw3.length,
      invalidSignature30903: raw3.length - ok3.length,
      notProcessor30903: notProcessor,
      statusByLatest30903: statuses,
      open: open.length,
      archived: removed.archived.length,
      payoutOnly: removed.payoutOnly.length,
      test: removed.test.length,
      networkTotal: network.length,
      simple: removed.simple.length,
      obiljeTotal: obilje.length,
    },
    removedNames: { archived: names(removed.archived), payoutOnly: names(removed.payoutOnly), test: names(removed.test), simple: names(removed.simple) },
  };
}

module.exports = { PROCESSOR_HEX, isValidEvent, isTestUnitEvent, isPayoutOnlyEvent, buildRegister };
