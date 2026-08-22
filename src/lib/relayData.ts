/** Minimal NIP-01 event shape as returned by /api/relay-query. */
export interface RelayEvent {
  id: string;
  pubkey: string;
  created_at: number;
  kind?: number;
  content: string;
  tags: string[][];
}

/* Relay-side data helpers for the landing page (KIND 30901/30903 merchants, KIND 36677 events, admin posts).
   Moved verbatim from the previous Index.tsx so the parsing rules stay identical. */

export interface MerchantUnit {
  name: string;
  category: string;
  categoryDetail: string;
  receiverCity: string;
  receiverCountry: string;
  image: string;
  content: string;
  pubkey: string;
  unitId: string;
  createdAt: number;
}

/** Resolve relative image paths stored in Nostr events to absolute URLs */
export function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/uploads/')) return `https://shop.lanapays.us${url}`;
  if (url.startsWith('/api/storage/')) return `https://app.mejmosefajn.org${url}`;
  return url;
}

export async function queryRelays(kind: number): Promise<RelayEvent[]> {
  try {
    const res = await fetch(`/api/relay-query?kind=${kind}&timeout=15000`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    console.log(`[Nostr] KIND ${kind}: got ${data.events?.length || 0} events via server proxy`);
    return data.events || [];
  } catch (err) {
    console.error(`[Nostr] KIND ${kind} fetch error:`, err);
    return [];
  }
}

/**
 * Fetch KIND 30903 suspension events and return a Set of currently-suspended unit IDs.
 * A unit is suspended if the latest 30903 for its d-tag has status='suspended' and
 * either no active_until or active_until > now.
 */
/**
 * Fetch KIND 30903 merchant-status events and return the Set of unit IDs that are
 * FEATURED. A unit is featured only when its latest 30903 carries featured:true AND
 * its status is operational (active / quota_warning_80) — per spec, clients ignore
 * featured:true unless the unit's status is active.
 */
export function fetchFeaturedUnitIds(): Promise<Set<string>> {
  return queryRelays(30903).then(allEvents => {
    // Replaceable: keep latest per d-tag
    const latestByDTag = new Map<string, RelayEvent>();
    for (const ev of allEvents) {
      const dTag = ev.tags?.find((t: string[]) => t[0] === 'd')?.[1] || '';
      if (!dTag) continue;
      const existing = latestByDTag.get(dTag);
      if (!existing || ev.created_at > existing.created_at) latestByDTag.set(dTag, ev);
    }

    const featured = new Set<string>();
    for (const [dTag, ev] of latestByDTag) {
      const get = (n: string) => ev.tags?.find((t: string[]) => t[0] === n)?.[1] || '';
      if (get('featured') !== 'true') continue;
      const status = get('status');
      if (status === 'active' || status === 'quota_warning_80') featured.add(dTag);
    }
    return featured;
  });
}

export function fetchMerchantsFromRelays(): Promise<MerchantUnit[]> {
  return Promise.all([
    queryRelays(30901),
    fetchFeaturedUnitIds(),
  ]).then(([allEvents, featuredIds]) => {
    const byKey = new Map<string, RelayEvent>();
    for (const ev of allEvents) {
      const dTag = ev.tags?.find((t: string[]) => t[0] === 'd')?.[1] || '';
      const key = `${ev.pubkey}:${dTag}`;
      const existing = byKey.get(key);
      if (!existing || ev.created_at > existing.created_at) byKey.set(key, ev);
    }

    const units: MerchantUnit[] = [];
    for (const ev of byKey.values()) {
      const get = (n: string) => ev.tags?.find((t: string[]) => t[0] === n)?.[1] || '';
      const images = ev.tags?.filter((t: string[]) => t[0] === 'image').map((t: string[]) => t[1]) || [];
      const status = get('status') || 'active';
      const name = get('name');
      if (status !== 'active' || !name || images.length === 0) continue;
      const unitId = get('unit_id') || get('d') || '';
      // Single source of truth: only merchants the admin flagged featured:true (and active) via KIND 30903
      if (!unitId || !featuredIds.has(unitId)) continue;
      units.push({
        name,
        category: get('category'),
        categoryDetail: get('category_detail'),
        receiverCity: get('receiver_city'),
        receiverCountry: get('receiver_country'),
        image: resolveImageUrl(images[0]),
        content: ev.content || '',
        pubkey: ev.pubkey,
        unitId,
        createdAt: ev.created_at,
      });
    }
    return units;
  });
}

// ── Post types ──

export interface Post {
  id: number;
  title: string;
  body: string;
  youtube_url: string;
  types: string[];
  language: string;
  created_at: number;
}

export const POST_TYPE_COLORS: Record<string, string> = {
  FAQ: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  INSTRUCTIONS: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  NEWS: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  PHILOSOPHY: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  'PAST EVENTS': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
};

export const POST_TYPE_LABELS: Record<string, Record<string, string>> = {
  FAQ: { en: 'FAQ', sl: 'FAQ' },
  INSTRUCTIONS: { en: 'Instructions', sl: 'Navodila' },
  NEWS: { en: 'News', sl: 'Novice' },
  PHILOSOPHY: { en: 'Philosophy', sl: 'Filozofija' },
  'PAST EVENTS': { en: 'Past Events', sl: 'Pretekli dogodki' },
};

export function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

// ── LanaEvent types ──

export interface ScheduleEntry {
  start: Date;
  end?: Date;
}

export interface LanaEvent {
  id: string;
  pubkey: string;
  created_at: number;
  title: string;
  content: string;
  status: string;
  start: Date;
  end?: Date;
  language: string;
  eventType: string;
  organizerPubkey: string;
  isOnline: boolean;
  onlineUrl?: string;
  youtubeUrl?: string;
  youtubeRecordingUrl?: string;
  location?: string;
  lat?: number;
  lon?: number;
  capacity?: number;
  cover?: string;
  fiatValue?: number;
  guests: string[];
  attachments: string[];
  category?: string;
  dTag: string;
  timezone?: string;
  schedule: ScheduleEntry[];
}

export function parseLanaEvent(event: RelayEvent): LanaEvent | null {
  try {
    const tags = event.tags || [];
    const get = (n: string): string | undefined => tags.find((t: string[]) => t[0] === n)?.[1];
    const getAll = (n: string): string[] => tags.filter((t: string[]) => t[0] === n).map((t: string[]) => t[1]);

    const title = get('title');
    const status = get('status');
    const startStr = get('start');
    const dTag = get('d');
    const language = get('language');
    const eventType = get('event_type');
    const organizerPubkey = get('p');

    if (!title || !status || !startStr || !dTag || !language || !eventType || !organizerPubkey) return null;

    const start = new Date(startStr);
    if (isNaN(start.getTime())) return null;

    const endStr = get('end');
    const end = endStr ? new Date(endStr) : undefined;
    const onlineUrl = get('online');

    const latStr = get('lat');
    const lonStr = get('lon');
    const capacityStr = get('capacity');
    const fiatValueStr = get('fiat_value');

    const scheduleTags = tags.filter((t: string[]) => t[0] === 'schedule');
    const schedule: ScheduleEntry[] = scheduleTags
      .map((t: string[]) => {
        const s = new Date(t[1]);
        if (isNaN(s.getTime())) return null;
        const e = t[2] ? new Date(t[2]) : undefined;
        return { start: s, end: e && !isNaN(e.getTime()) ? e : undefined };
      })
      .filter((entry: ScheduleEntry | null): entry is ScheduleEntry => entry !== null)
      .sort((a: ScheduleEntry, b: ScheduleEntry) => a.start.getTime() - b.start.getTime());

    return {
      id: event.id,
      pubkey: event.pubkey,
      created_at: event.created_at,
      title,
      content: event.content || '',
      status,
      start,
      end: end && !isNaN(end.getTime()) ? end : undefined,
      language,
      eventType,
      organizerPubkey,
      isOnline: !!onlineUrl,
      onlineUrl,
      youtubeUrl: get('youtube'),
      youtubeRecordingUrl: get('youtube_recording'),
      location: get('location'),
      lat: latStr ? parseFloat(latStr) : undefined,
      lon: lonStr ? parseFloat(lonStr) : undefined,
      capacity: capacityStr ? parseInt(capacityStr, 10) : undefined,
      cover: resolveImageUrl(get('cover') || ''),
      fiatValue: fiatValueStr ? parseFloat(fiatValueStr) : undefined,
      guests: getAll('guest'),
      attachments: getAll('attachment'),
      category: get('category'),
      dTag,
      timezone: get('timezone'),
      schedule,
    };
  } catch {
    return null;
  }
}

export function fetchEventsFromRelays(): Promise<LanaEvent[]> {
  return queryRelays(36677).then(allEvents => {
    const byKey = new Map<string, RelayEvent>();
    for (const ev of allEvents) {
      const dTag = ev.tags?.find((t: string[]) => t[0] === 'd')?.[1] || '';
      const key = `${ev.pubkey}:${dTag}`;
      const existing = byKey.get(key);
      if (!existing || ev.created_at > existing.created_at) byKey.set(key, ev);
    }

    const now = new Date();
    const events: LanaEvent[] = [];
    for (const ev of byKey.values()) {
      const parsed = parseLanaEvent(ev);
      if (!parsed || parsed.status !== 'active') continue;

      let isUpcoming: boolean;
      if (parsed.schedule.length > 0) {
        const lastEntry = parsed.schedule[parsed.schedule.length - 1];
        const lastEnd = lastEntry.end || new Date(lastEntry.start.getTime() + 2 * 60 * 60 * 1000);
        isUpcoming = lastEnd > now;
        if (isUpcoming) {
          // For recurring events, advance start/end to the next upcoming occurrence
          const nextEntry = parsed.schedule.find(entry => {
            const entryEnd = entry.end || new Date(entry.start.getTime() + 2 * 60 * 60 * 1000);
            return entryEnd > now;
          });
          if (nextEntry) {
            parsed.start = nextEntry.start;
            parsed.end = nextEntry.end;
          }
        }
      } else {
        const eventEnd = parsed.end || new Date(parsed.start.getTime() + 2 * 60 * 60 * 1000);
        isUpcoming = parsed.start > now || eventEnd > now;
      }
      if (isUpcoming) events.push(parsed);
    }

    events.sort((a, b) => a.start.getTime() - b.start.getTime());
    return events;
  });
}

export function getEventStatus(event: LanaEvent): 'happening-now' | 'today' | 'upcoming' {
  const now = new Date();
  const fifteenMin = new Date(now.getTime() + 15 * 60 * 1000);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

  if (event.schedule.length > 0) {
    for (const entry of event.schedule) {
      const entryEnd = entry.end || new Date(entry.start.getTime() + 2 * 60 * 60 * 1000);
      if ((entry.start <= now && entryEnd > now) || (entry.start > now && entry.start <= fifteenMin)) return 'happening-now';
    }
    for (const entry of event.schedule) {
      if (entry.start >= today && entry.start < tomorrow) return 'today';
    }
    return 'upcoming';
  }

  const eventEnd = event.end || new Date(event.start.getTime() + 2 * 60 * 60 * 1000);
  if ((event.start <= now && eventEnd > now) || (event.start > now && event.start <= fifteenMin)) return 'happening-now';
  if (event.start >= today && event.start < tomorrow) return 'today';
  return 'upcoming';
}

export const LANGUAGE_LABELS: Record<string, string> = {
  sl: 'Slovenščina', en: 'English', de: 'Deutsch', hr: 'Hrvatski', sr: 'Srpski',
  it: 'Italiano', fr: 'Français', es: 'Español', pt: 'Português', nl: 'Nederlands',
};

export const EVENT_TYPE_LABELS: Record<string, string> = {
  governance: 'Governance', awareness: 'Awareness', workshop: 'Workshop',
  celebration: 'Celebration', meetup: 'Meetup', conference: 'Conference', other: 'Other',
};

/** Translations for merchant category / category_detail fields (keys are lowercase-trimmed English). */
export const MERCHANT_CATEGORY_TRANSLATIONS: Record<string, { en: string; sl: string }> = {
  // Main categories
  'accommodation':         { en: 'Accommodation',      sl: 'Nastanitev' },
  'beauty & wellness':     { en: 'Beauty & Wellness',  sl: 'Lepota in dobro počutje' },
  'café & restaurant':     { en: 'Café & Restaurant',  sl: 'Kavarna in restavracija' },
  'cafe & restaurant':     { en: 'Café & Restaurant',  sl: 'Kavarna in restavracija' },
  'café / restaurant':     { en: 'Café & Restaurant',  sl: 'Kavarna in restavracija' },
  'cafe / restaurant':     { en: 'Café & Restaurant',  sl: 'Kavarna in restavracija' },
  'restaurant - café':     { en: 'Café & Restaurant',  sl: 'Kavarna in restavracija' },
  'restaurant - cafe':     { en: 'Café & Restaurant',  sl: 'Kavarna in restavracija' },
  'construction':          { en: 'Construction',       sl: 'Gradbeništvo' },
  'eco farm':              { en: 'Eco Farm',           sl: 'Eko kmetija' },
  'eco farming':           { en: 'Eco Farming',        sl: 'Eko kmetovanje' },
  'fashion':               { en: 'Fashion',            sl: 'Moda' },
  'furniture':             { en: 'Furniture',          sl: 'Pohištvo' },
  'kids':                  { en: 'Kids',               sl: 'Otroci' },
  'other':                 { en: 'Other',              sl: 'Drugo' },
  'pet':                   { en: 'Pet',                sl: 'Ljubljenčki' },
  'producer':              { en: 'Producer',           sl: 'Proizvajalec' },
  'service':               { en: 'Service',            sl: 'Storitev' },
  'shop':                  { en: 'Shop',               sl: 'Trgovina' },

  // Common category_detail values
  'legal':                         { en: 'Legal',                     sl: 'Pravno' },
  'crypto education':              { en: 'Crypto Education',          sl: 'Kripto izobraževanje' },
  'lifestyle':                     { en: 'Lifestyle',                 sl: 'Življenjski slog' },
  'holistic healing':              { en: 'Holistic Healing',          sl: 'Holistično zdravljenje' },
  'holistic home planning & mentorship':
                                    { en: 'Holistic Home Planning & Mentorship',
                                      sl: 'Holistično načrtovanje doma in mentorstvo' },
  'one to one mentoring':          { en: 'One-to-One Mentoring',      sl: 'Individualno mentorstvo' },
  'community welcome & wallet cards':
                                    { en: 'Community Welcome & Wallet Cards',
                                      sl: 'Kartice dobrodošlice in denarnice' },
  'micro dairy':                   { en: 'Micro Dairy',               sl: 'Mikro mlekarna' },
  'organic wine and extra vergin olive oil':
                                    { en: 'Organic Wine & Extra Virgin Olive Oil',
                                      sl: 'Eko vino in ekstra deviško oljčno olje' },
  'pasture-raised regenerative eggs':
                                    { en: 'Pasture-Raised Regenerative Eggs',
                                      sl: 'Regenerativna jajca iz proste reje' },
  'sea view & water bed':          { en: 'Sea View & Water Bed',      sl: 'Morski razgled in vodna postelja' },
  'top quality':                   { en: 'Top Quality',               sl: 'Vrhunska kakovost' },
  'wood & metal':                  { en: 'Wood & Metal',              sl: 'Les in kovina' },
  'ai,programming':                { en: 'AI & Programming',          sl: 'UI in programiranje' },
  'chikens':                       { en: 'Chickens',                  sl: 'Piščanci' },
  'chickens':                      { en: 'Chickens',                  sl: 'Piščanci' },
  'organiz':                       { en: 'Organic',                   sl: 'Ekološko' },
};

/** Translate a merchant category field. Returns the translated label if known, otherwise the original. */
export function translateCategory(value: string | undefined, lang: string): string {
  if (!value) return '';
  const key = value.trim().toLowerCase();
  const entry = MERCHANT_CATEGORY_TRANSLATIONS[key];
  if (!entry) return value;
  return (entry as Record<string, string>)[lang] || entry.en;
}

export function formatEventDate(date: Date, tz?: string, locale = 'en'): string {
  const loc = locale === 'sl' ? 'sl-SI' : 'en-GB';
  try {
    return date.toLocaleDateString(loc, {
      weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
      ...(tz ? { timeZone: tz } : {}),
    });
  } catch {
    return date.toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
  }
}

export function formatEventTime(date: Date, tz?: string, locale = 'en'): string {
  const loc = locale === 'sl' ? 'sl-SI' : 'en-GB';
  try {
    return date.toLocaleTimeString(loc, {
      hour: '2-digit', minute: '2-digit',
      ...(tz ? { timeZone: tz } : {}),
    });
  } catch {
    return date.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' });
  }
}

export function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

/** Map site language to Nostr event language code for filtering */
export const LANG_TO_EVENT_LANG: Record<string, string> = { en: 'en', sl: 'sl' };

/**
 * Append a `lang` query parameter to a URL so destination portals open in the
 * same language the user picked on lanapays.us. Uses 'en' / 'sl' codes.
 */
export function withLang(url: string, lang: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set('lang', lang);
    return u.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}lang=${encodeURIComponent(lang)}`;
  }
}

/** Map site language to accepted receiver_country values for merchants (case-insensitive match). */
export const LANG_TO_COUNTRIES: Record<string, string[]> = {
  en: ['gb', 'uk', 'united kingdom', 'britain', 'england'],
  sl: ['si', 'sl', 'slovenia', 'slovenija'],
};

export function matchesCountry(country: string | undefined, lang: string): boolean {
  const normalized = (country || '').trim().toLowerCase();
  if (!normalized) return false;
  const accepted = LANG_TO_COUNTRIES[lang] || [];
  return accepted.includes(normalized);
}
