/**
 * Reference data from LanaConnects.us — the same upstreams (thelana.life +
 * direct.lana.fund) aggregated by our server at /api/connects/overview so the
 * browser makes one request and the numbers match what LanaConnects.us shows.
 */
import type { Lang } from "@/i18n/translations";

export type TradeStatus = "pending" | "paid" | "partial" | "failed";

export interface ConnectsProvider {
  name: string;
  image: string;
  registeredAt: number;
  category: string;
  country: string;
}

export interface ConnectsTrade {
  id: string;
  merchant: string;
  amount: number;
  currency: string;
  createdAt: number;
  paymentType: string;
  status: TradeStatus;
}

/** Numbers are null when their upstream was unavailable and no snapshot exists yet — render a dash, not a zero. */
export interface ConnectsFunding {
  waitingEur: number | null;
  byCurrency: Record<string, number>;
  investors: number | null;
  lanaInCirculation: number | null;
  distributionEur: number | null;
  rateEur: number;
}

export interface ConnectsOverview {
  split: string | number | null;
  splitStartedAt: number | null;
  splitDays: number | null;
  providersCount: number | null;
  latestProviders: ConnectsProvider[] | null;
  trades: ConnectsTrade[] | null;
  funding: ConnectsFunding;
  bef: { version: string; date: string; label: string } | null;
  updatedAt: number;
  /** last good snapshot served while an upstream is down */
  stale?: boolean;
  /** names of upstreams that failed when no snapshot existed yet */
  partial?: string[];
}

export async function fetchConnectsOverview(): Promise<ConnectsOverview> {
  const res = await fetch("/api/connects/overview", { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`overview HTTP ${res.status}`);
  return res.json();
}

const LOCALE: Record<Lang, string> = { en: "en-GB", sl: "sl-SI" };

export function formatMoney(value: number, currency = "EUR", lang: Lang = "sl"): string {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat(LOCALE[lang], {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: n % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${n.toFixed(2)} ${currency}`;
  }
}

/** Whole euros, thousands separated the way LanaConnects.us prints them ("38.301 €"). */
export function formatEUR(value: number, lang: Lang = "sl"): string {
  const n = Math.round(Number(value) || 0);
  return `${new Intl.NumberFormat(lang === "sl" ? "de-DE" : "en-GB", { maximumFractionDigits: 0 }).format(n)} €`;
}

export function formatNumber(value: number, lang: Lang = "sl", digits = 2): string {
  return new Intl.NumberFormat(LOCALE[lang], { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number(value) || 0);
}

/** Relative time with proper Slovene dual forms. Accepts unix seconds or milliseconds. */
export function timeAgo(unix: number, lang: Lang, nowMs = Date.now()): string {
  const ts = unix > 1e12 ? unix : unix * 1000;
  if (!ts || Number.isNaN(ts)) return "";
  const diff = Math.max(0, nowMs - ts);
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (lang === "sl") {
    if (mins < 1) return "pravkar";
    if (mins < 60) return `pred ${mins} min`;
    if (hours < 24) return `pred ${hours} ${hours === 1 ? "uro" : hours === 2 ? "urama" : "urami"}`;
    return `pred ${days} ${days === 1 ? "dnevom" : days === 2 ? "dnevoma" : "dnevi"}`;
  }
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

export function sumByCurrency(trades: ConnectsTrade[]): Record<string, number> {
  return trades.reduce<Record<string, number>>((acc, t) => {
    const c = t.currency || "EUR";
    acc[c] = (acc[c] || 0) + (Number(t.amount) || 0);
    return acc;
  }, {});
}
