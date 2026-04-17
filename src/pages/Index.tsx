import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import HeroCarousel from "@/components/HeroCarousel";
import { useLanguage } from "@/i18n/LanguageContext";
import lanaLogo from "@/assets/lana-logo.png";
import { Store, Wallet, BookOpen, ShoppingBag, Calendar, MapPin, Tag, Loader2, RefreshCw, Globe, Radio, Clock, Languages, ExternalLink, ChevronDown, ChevronUp, Video, Users, Newspaper, Sprout, Utensils } from "lucide-react";

interface MerchantUnit {
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
function resolveImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/api/uploads/')) return `https://shop.lanapays.us${url}`;
  if (url.startsWith('/api/storage/')) return `https://app.mejmosefajn.org${url}`;
  return url;
}

async function queryRelays(kind: number): Promise<any[]> {
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

function fetchMerchantsFromRelays(): Promise<MerchantUnit[]> {
  return queryRelays(30901).then(allEvents => {
    const byKey = new Map<string, any>();
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
      units.push({
        name,
        category: get('category'),
        categoryDetail: get('category_detail'),
        receiverCity: get('receiver_city'),
        receiverCountry: get('receiver_country'),
        image: resolveImageUrl(images[0]),
        content: ev.content || '',
        pubkey: ev.pubkey,
        unitId: get('unit_id') || get('d') || '',
        createdAt: ev.created_at,
      });
    }
    return units;
  });
}

// ── Post types ──

interface Post {
  id: number;
  title: string;
  body: string;
  youtube_url: string;
  types: string[];
  language: string;
  created_at: number;
}

const POST_TYPE_COLORS: Record<string, string> = {
  FAQ: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
  INSTRUCTIONS: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  NEWS: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  PHILOSOPHY: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
  'PAST EVENTS': 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
};

const POST_TYPE_LABELS: Record<string, Record<string, string>> = {
  FAQ: { en: 'FAQ', sl: 'FAQ' },
  INSTRUCTIONS: { en: 'Instructions', sl: 'Navodila' },
  NEWS: { en: 'News', sl: 'Novice' },
  PHILOSOPHY: { en: 'Philosophy', sl: 'Filozofija' },
  'PAST EVENTS': { en: 'Past Events', sl: 'Pretekli dogodki' },
};

function getYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

// ── LanaEvent types ──

interface ScheduleEntry {
  start: Date;
  end?: Date;
}

interface LanaEvent {
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

function parseLanaEvent(event: any): LanaEvent | null {
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

function fetchEventsFromRelays(): Promise<LanaEvent[]> {
  return queryRelays(36677).then(allEvents => {
    const byKey = new Map<string, any>();
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

function getEventStatus(event: LanaEvent): 'happening-now' | 'today' | 'upcoming' {
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

const LANGUAGE_LABELS: Record<string, string> = {
  sl: 'Slovenščina', en: 'English', de: 'Deutsch', hr: 'Hrvatski', sr: 'Srpski',
  it: 'Italiano', fr: 'Français', es: 'Español', pt: 'Português', nl: 'Nederlands',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  governance: 'Governance', awareness: 'Awareness', workshop: 'Workshop',
  celebration: 'Celebration', meetup: 'Meetup', conference: 'Conference', other: 'Other',
};

function formatEventDate(date: Date, tz?: string, locale = 'en'): string {
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

function formatEventTime(date: Date, tz?: string, locale = 'en'): string {
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

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

/** Map site language to Nostr event language code for filtering */
const LANG_TO_EVENT_LANG: Record<string, string> = { en: 'en', sl: 'sl' };

/** Map site language to accepted receiver_country values for merchants (case-insensitive match). */
const LANG_TO_COUNTRIES: Record<string, string[]> = {
  en: ['gb', 'uk', 'united kingdom', 'britain', 'england'],
  sl: ['si', 'sl', 'slovenia', 'slovenija'],
};

function matchesCountry(country: string | undefined, lang: string): boolean {
  const normalized = (country || '').trim().toLowerCase();
  if (!normalized) return false;
  const accepted = LANG_TO_COUNTRIES[lang] || [];
  return accepted.includes(normalized);
}

const Index = () => {
  const { lang, setLang, t } = useLanguage();
  const [merchants, setMerchants] = useState<MerchantUnit[]>([]);
  const [displayed, setDisplayed] = useState<MerchantUnit[]>([]);
  const [isMerchantsLoading, setIsMerchantsLoading] = useState(true);
  const [allEvents, setAllEvents] = useState<LanaEvent[]>([]);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPostsLoading, setIsPostsLoading] = useState(true);
  const [postFilter, setPostFilter] = useState<string | null>(null);
  const [expandedPost, setExpandedPost] = useState<number | null>(null);

  useEffect(() => {
    fetchMerchantsFromRelays().then(units => {
      setMerchants(units);
      setIsMerchantsLoading(false);
    });
    fetchEventsFromRelays().then(events => {
      setAllEvents(events);
      setIsEventsLoading(false);
    });
    fetch('/api/posts').then(r => r.json()).then(data => {
      setPosts(data.posts || []);
      setIsPostsLoading(false);
    }).catch(() => setIsPostsLoading(false));
  }, []);

  // Filter merchants by country based on current language
  const languageMerchants = useMemo(() => {
    return merchants.filter(m => matchesCountry(m.receiverCountry, lang));
  }, [merchants, lang]);

  // When merchant pool changes (e.g. language switch), re-pick random 3
  useEffect(() => {
    setDisplayed(pickRandom(languageMerchants, 3));
  }, [languageMerchants]);

  // Filter events: show events matching language + always include in-person (physical) events
  // so location-based events are discoverable regardless of the language toggle.
  const lanaEvents = useMemo(() => {
    const eventLang = LANG_TO_EVENT_LANG[lang] || 'en';
    return allEvents.filter(e => e.language === eventLang || !e.isOnline);
  }, [allEvents, lang]);

  // Filter posts by language and type
  const filteredPosts = useMemo(() => {
    let filtered = posts.filter(p => p.language === lang);
    if (postFilter) filtered = filtered.filter(p => p.types.includes(postFilter));
    return filtered;
  }, [posts, lang, postFilter]);

  // Unique post types for filter buttons
  const availablePostTypes = useMemo(() => {
    const langPosts = posts.filter(p => p.language === lang);
    const types = new Set<string>();
    langPosts.forEach(p => p.types.forEach(t => types.add(t)));
    return Array.from(types);
  }, [posts, lang]);

  const handleShuffle = () => setDisplayed(pickRandom(languageMerchants, 3));
  const toggleEvent = (dTag: string) => setExpandedEvent(prev => prev === dTag ? null : dTag);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-border">
        <h1 className="text-lg sm:text-2xl font-display font-bold text-primary flex items-center gap-1.5 sm:gap-2">
          <img
            src={lanaLogo}
            alt="Lana"
            className="w-6 h-6 sm:w-8 sm:h-8 rounded"
          />
          <span>LanaPays.<span className="text-gold">Us</span></span>
        </h1>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Language Switcher */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setLang('en')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('sl')}
              className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${lang === 'sl' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              SI
            </button>
          </div>
          <a
            href="https://mobile.lanapays.us"
            className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs sm:text-sm hover:opacity-90 transition-opacity"
          >
            {t('header.login')}
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8 space-y-10 sm:space-y-16">
        {/* Carousel */}
        <HeroCarousel />

        {/* About */}
        <motion.section
          className="text-center max-w-3xl mx-auto space-y-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-primary">
            {t('about.title')}
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t('about.description')}
          </motion.p>
        </motion.section>

        {/* Action Buttons */}
        <motion.section
          className="flex flex-col items-center gap-4"
          initial="hidden" whileInView="visible" viewport={{ once: true }}
          variants={fadeUp} custom={0}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <a
              href="https://shop.lanapays.us/register"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity text-center"
            >
              {t('action.register.btn')}
            </a>
            <a
              href="https://mobile.lanapays.us"
              className="px-8 py-3 rounded-lg bg-gold text-white font-semibold text-base hover:opacity-90 transition-opacity text-center"
            >
              {t('header.login')}
            </a>
          </div>
          <Link
            to="/learn-more"
            className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors mt-1"
          >
            {t('action.learn.link')}
          </Link>
        </motion.section>

        {/* Where to Buy */}
        <section>
          <motion.div
            className="flex items-center justify-between mb-6"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <h2 className="text-xl sm:text-2xl font-display font-bold text-primary flex items-center gap-2 sm:gap-3">
              <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 text-gold" /> {t('shops.title')}
            </h2>
            {languageMerchants.length > 3 && (
              <button
                onClick={handleShuffle}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition"
              >
                <RefreshCw className="w-4 h-4" />
                {t('shops.shuffle')}
              </button>
            )}
          </motion.div>

          {isMerchantsLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">{t('shops.loading')}</p>
            </div>
          )}

          {!isMerchantsLoading && displayed.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Store className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('shops.empty')}</p>
            </div>
          )}

          {!isMerchantsLoading && displayed.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayed.map((unit, i) => (
                <motion.a
                  key={unit.unitId}
                  href={`https://shop.lanapays.us/shop/${unit.pubkey}/${unit.unitId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={fadeUp} custom={i + 1}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  className="rounded-xl bg-card border border-border overflow-hidden hover:shadow-lg hover:border-gold transition-all cursor-pointer group"
                >
                  <div className="h-40 overflow-hidden relative">
                    <img
                      src={unit.image}
                      alt={unit.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-white font-display font-semibold text-lg leading-tight drop-shadow-md">
                        {unit.name}
                      </h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {unit.category && (
                      <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        <span className="truncate">{unit.category}{unit.categoryDetail ? ` / ${unit.categoryDetail}` : ''}</span>
                      </p>
                    )}
                    {(unit.receiverCity || unit.receiverCountry) && (
                      <p className="text-muted-foreground text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{[unit.receiverCity, unit.receiverCountry].filter(Boolean).join(', ')}</span>
                      </p>
                    )}
                    {unit.content && (
                      <p className="text-muted-foreground text-sm line-clamp-2">{unit.content}</p>
                    )}
                  </div>
                </motion.a>
              ))}
            </div>
          )}

          {!isMerchantsLoading && (
            <motion.div
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8"
              variants={fadeUp} custom={4}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
            >
              <a
                href="https://www.lanaeco.farm"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Sprout className="w-4 h-4" />
                {t('portals.farms')}
              </a>
              <a
                href="https://lana.restaurant/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Utensils className="w-4 h-4" />
                {t('portals.restaurants')}
              </a>
              <a
                href="https://www.lanaeco.shop/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <ShoppingBag className="w-4 h-4" />
                {t('portals.shops')}
              </a>
            </motion.div>
          )}
        </section>

        {/* Events */}
        <section>
          <motion.h2
            className="text-xl sm:text-2xl font-display font-bold text-primary mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-gold" /> {t('events.title')}
          </motion.h2>

          {isEventsLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">{t('events.loading')}</p>
            </div>
          )}

          {!isEventsLoading && lanaEvents.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('events.empty')}</p>
            </div>
          )}

          {!isEventsLoading && lanaEvents.length > 0 && (
            <div className="space-y-4">
              {lanaEvents.map((event, i) => {
                const status = getEventStatus(event);
                const isExpanded = expandedEvent === event.dTag;

                return (
                  <motion.div
                    key={event.dTag}
                    variants={fadeUp} custom={i + 1}
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    className="rounded-xl bg-card border border-border hover:border-gold transition-colors overflow-hidden"
                  >
                    {/* Card Header — clickable */}
                    <button
                      onClick={() => toggleEvent(event.dTag)}
                      className="w-full text-left p-3 sm:p-5 flex items-start gap-3 sm:gap-6"
                    >
                      {/* Cover or Icon */}
                      {event.cover ? (
                        <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden">
                          <img src={event.cover} alt={event.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-primary flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-primary-foreground" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        {/* Badges row */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {status === 'happening-now' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-xs font-semibold rounded-full animate-pulse">
                              <Radio className="w-3 h-3" /> {t('events.live')}
                            </span>
                          )}
                          {status === 'today' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-full">
                              <Clock className="w-3 h-3" /> {t('events.today')}
                            </span>
                          )}
                          {event.isOnline ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
                              <Globe className="w-3 h-3" /> {t('events.online')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                              <MapPin className="w-3 h-3" /> {t('events.inPerson')}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium rounded-full">
                            <Languages className="w-3 h-3" /> {LANGUAGE_LABELS[event.language] || event.language}
                          </span>
                          {event.eventType && (
                            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
                              {EVENT_TYPE_LABELS[event.eventType] || event.eventType}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="font-display font-semibold text-foreground text-base sm:text-lg leading-tight">
                          {event.title}
                        </h3>

                        {/* Date & Location */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatEventDate(event.start, event.timezone, lang)}
                            {' · '}
                            {formatEventTime(event.start, event.timezone, lang)}
                            {event.end && ` – ${formatEventTime(event.end, event.timezone, lang)}`}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expand indicator */}
                      <div className="flex-shrink-0 mt-1">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Expanded Detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-0 space-y-3 sm:space-y-4 border-t border-border">
                            {/* Cover image (large) */}
                            {event.cover && (
                              <div className="rounded-lg overflow-hidden mt-4 max-h-64">
                                <img src={event.cover} alt={event.title} className="w-full h-full object-cover" />
                              </div>
                            )}

                            {/* Description */}
                            {event.content && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-1">{t('events.description')}</h4>
                                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                                  {event.content}
                                </p>
                              </div>
                            )}

                            {/* Multi-day schedule */}
                            {event.schedule.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                                  <Clock className="w-4 h-4" /> {t('events.schedule', { count: event.schedule.length })}
                                </h4>
                                <div className="space-y-1.5">
                                  {event.schedule.map((entry, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                                      <span className="font-medium text-foreground w-6">{idx + 1}.</span>
                                      <span>{formatEventDate(entry.start, event.timezone, lang)}</span>
                                      <span>
                                        {formatEventTime(entry.start, event.timezone, lang)}
                                        {entry.end && ` – ${formatEventTime(entry.end, event.timezone, lang)}`}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Info grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              {event.timezone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Clock className="w-4 h-4 flex-shrink-0" />
                                  <span>{t('events.timezone', { tz: event.timezone! })}</span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="w-4 h-4 flex-shrink-0" />
                                  <span>{event.location}</span>
                                  {event.lat && event.lon && (
                                    <a
                                      href={`https://maps.google.com/?q=${event.lat},${event.lon}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 dark:text-blue-400 hover:underline"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              )}
                              {event.capacity && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Users className="w-4 h-4 flex-shrink-0" />
                                  <span>{t('events.capacity', { n: event.capacity! })}</span>
                                </div>
                              )}
                              {event.fiatValue != null && event.fiatValue > 0 && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Tag className="w-4 h-4 flex-shrink-0" />
                                  <span>{t('events.value', { n: event.fiatValue! })}</span>
                                </div>
                              )}
                            </div>

                            {/* Links */}
                            <div className="flex flex-wrap gap-3">
                              {event.onlineUrl && (
                                <a
                                  href={event.onlineUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Globe className="w-4 h-4" /> {t('events.joinOnline')}
                                </a>
                              )}
                              {event.youtubeUrl && (
                                <a
                                  href={event.youtubeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Video className="w-4 h-4" /> {t('events.watchYoutube')}
                                </a>
                              )}
                              {event.youtubeRecordingUrl && (
                                <a
                                  href={event.youtubeRecordingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <Video className="w-4 h-4" /> {t('events.recording')}
                                </a>
                              )}
                            </div>

                            {/* Guests */}
                            {event.guests.length > 0 && (
                              <div className="text-sm text-muted-foreground">
                                {t('events.guests', { count: event.guests.length })}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* Posts / News */}
        <section>
          <motion.h2
            className="text-xl sm:text-2xl font-display font-bold text-primary mb-4 flex items-center gap-2 sm:gap-3"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            <Newspaper className="w-6 h-6 sm:w-7 sm:h-7 text-gold" /> {t('posts.title')}
          </motion.h2>

          {availablePostTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => setPostFilter(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  !postFilter ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary'
                }`}
              >
                {t('posts.filterAll')}
              </button>
              {availablePostTypes.map(type => (
                <button
                  key={type}
                  onClick={() => setPostFilter(postFilter === type ? null : type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    postFilter === type ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary'
                  }`}
                >
                  {POST_TYPE_LABELS[type]?.[lang] || type}
                </button>
              ))}
            </div>
          )}

          {isPostsLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <p className="text-sm">{t('posts.loading')}</p>
            </div>
          )}

          {!isPostsLoading && filteredPosts.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Newspaper className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('posts.empty')}</p>
            </div>
          )}

          {!isPostsLoading && filteredPosts.length > 0 && (
            <div className="space-y-4">
              {filteredPosts.map((post, i) => {
                const isExpanded = expandedPost === post.id;
                const embedUrl = getYoutubeEmbedUrl(post.youtube_url);
                return (
                  <motion.div
                    key={post.id}
                    variants={fadeUp} custom={i + 1}
                    initial="hidden" whileInView="visible" viewport={{ once: true }}
                    className="rounded-xl bg-card border border-border hover:border-gold transition-colors overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                      className="w-full text-left p-3 sm:p-5"
                    >
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {post.types.map(type => (
                          <span key={type} className={`px-2 py-0.5 text-xs font-semibold rounded-full ${POST_TYPE_COLORS[type] || 'bg-muted text-muted-foreground'}`}>
                            {POST_TYPE_LABELS[type]?.[lang] || type}
                          </span>
                        ))}
                        {post.youtube_url && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
                            <Video className="w-3 h-3" /> YouTube
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(post.created_at * 1000).toLocaleDateString(lang === 'sl' ? 'sl-SI' : 'en-US')}
                        </span>
                      </div>
                      <h3 className="font-display font-semibold text-foreground text-base sm:text-lg leading-tight">
                        {post.title}
                      </h3>
                      {!isExpanded && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.body}</p>
                      )}
                      <div className="flex items-center justify-end mt-2">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 sm:px-5 pb-3 sm:pb-5 pt-0 space-y-3 sm:space-y-4 border-t border-border">
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed mt-4">{post.body}</p>
                            {embedUrl && (
                              <div className="aspect-video rounded-lg overflow-hidden">
                                <iframe
                                  src={embedUrl}
                                  title={post.title}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                            {post.youtube_url && !embedUrl && (
                              <a
                                href={post.youtube_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition"
                              >
                                <Video className="w-4 h-4" /> {t('posts.watchVideo')}
                              </a>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <footer className="text-center py-8 text-sm text-muted-foreground border-t border-border">
        {t('footer.copy')}
      </footer>
    </div>
  );
};

export default Index;
