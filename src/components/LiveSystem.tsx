import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Landmark, Clock, Users, ExternalLink, Play, RefreshCw, Sprout } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  fetchConnectsOverview,
  formatEUR,
  formatMoney,
  formatNumber,
  timeAgo,
  sumByCurrency,
  type ConnectsOverview,
  type TradeStatus,
} from "@/lib/connects";
import Mandala from "./Mandala";

const YOUTUBE_ID = "IvMjsdfQ4Kc";
/** Rows shown in the trades card; the filter still runs over the full feed from the server. */
const VISIBLE_TRADES = 12;

const card = "relative overflow-hidden rounded-[1.6rem] glass card-frame p-6 sm:p-7";
const cardTitle = "font-display text-[1.55rem] font-semibold leading-tight text-jade-deep";

const rise = (i: number) => ({
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, delay: i * 0.1, ease: "easeOut" as const },
});

export function useConnectsOverview() {
  return useQuery<ConnectsOverview>({
    queryKey: ["connects-overview"],
    queryFn: fetchConnectsOverview,
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

function MetricRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-gold/15 py-3.5 last:border-b-0">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/35 bg-white/60 text-jade-deep">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-semibold leading-none text-jade-deep">{value}</p>
      </div>
    </div>
  );
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export default function LiveSystem() {
  const { lang, t } = useLanguage();
  const { data, isLoading, isError, refetch, isFetching } = useConnectsOverview();
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [playing, setPlaying] = useState(false);

  const statusLabel: Record<TradeStatus, string> = {
    pending: t("live.status.pending"),
    paid: t("live.status.paid"),
    partial: t("live.status.partial"),
    failed: t("live.status.failed"),
  };

  const trades = useMemo(() => {
    const rows = data?.trades ?? [];
    const filtered = unpaidOnly ? rows.filter((r) => r.status === "pending" || r.status === "partial") : rows;
    return filtered.slice(0, VISIBLE_TRADES);
  }, [data, unpaidOnly]);

  const unpaidTotals = useMemo(() => {
    if (!unpaidOnly) return "";
    return Object.entries(sumByCurrency(trades))
      .filter(([, v]) => v > 0)
      .map(([c, v]) => formatMoney(v, c, lang))
      .join(" + ");
  }, [trades, unpaidOnly, lang]);

  const funding = data?.funding;
  const byCurrency = Object.entries(funding?.byCurrency || {}).filter(([, v]) => v > 0);
  const providers = data?.latestProviders ?? null;
  const degraded = !!(data?.stale || data?.partial?.length);
  const num = (v: number | null | undefined, f: (n: number) => string) => (v == null ? "—" : f(v));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
        <a href="https://lanaconnects.us" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-jade-deep/80 hover:text-gold-deep">
          {t("live.source")} <ExternalLink className="h-3.5 w-3.5" />
        </a>
        {data && (
          <span className="inline-flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${degraded ? "bg-lotus-deep" : "bg-jade"} ${isFetching ? "animate-pulse" : ""}`} />
            {t("live.updated", { ago: timeAgo(data.updatedAt, lang) })}
            {data.stale && <span className="normal-case tracking-normal">· {t("live.stale")}</span>}
            {!data.stale && data.partial?.length ? <span className="normal-case tracking-normal">· {t("live.partial")}</span> : null}
          </span>
        )}
      </div>

      {isError && !data && (
        <div className="mx-auto max-w-md rounded-2xl glass p-6 text-center">
          <p className="text-sm text-muted-foreground">{t("live.error")}</p>
          <button type="button" onClick={() => refetch()} className="btn btn-ghost mt-4 !py-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" /> {t("live.retry")}
          </button>
        </div>
      )}

      {(isLoading || data) && (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.35fr_1fr]">
          {/* ── System info + latest providers ── */}
          <motion.article {...rise(0)} className={card}>
            <Mandala className="pointer-events-none absolute -left-20 -bottom-24 w-64 text-gold opacity-[0.07]" spin={false} />
            <h3 className={cardTitle}>{t("live.info.title")}</h3>
            <div className="relative mt-3">
              {isLoading ? (
                <div className="space-y-4 py-2">
                  <Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" />
                </div>
              ) : (
                <>
                  <MetricRow icon={<Landmark className="h-5 w-5" />} label={t("live.split")} value={data?.split != null ? `SPLIT ${data.split}` : "—"} />
                  <MetricRow icon={<Clock className="h-5 w-5" />} label={t("live.days")} value={data?.splitDays ?? "—"} />
                  <MetricRow icon={<Users className="h-5 w-5" />} label={t("live.providers")} value={data?.providersCount ?? "—"} />
                </>
              )}
            </div>

            <h4 className="relative mt-6 font-display text-xl font-semibold text-jade-deep">{t("live.latestProviders")}</h4>
            <ol className="relative mt-3 space-y-3">
              {isLoading && Array.from({ length: 8 }, (_, i) => <li key={i}><Skeleton className="h-10" /></li>)}
              {!isLoading && providers === null && <li className="text-sm text-muted-foreground">—</li>}
              {!isLoading && providers !== null && providers.length === 0 && (
                <li className="text-sm text-muted-foreground">{t("live.noProviders")}</li>
              )}
              {(providers || []).map((p, i) => (
                <li key={`${p.name}-${i}`} className="flex items-center gap-3">
                  <span className="w-4 font-display text-lg font-semibold text-gold-deep">{i + 1}.</span>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gold/30 bg-white/70 font-display text-lg font-semibold text-jade-deep">
                    {p.image ? <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" /> : p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] font-bold text-foreground">{p.name}</span>
                    <span className="block text-xs text-muted-foreground">{t("live.registered", { ago: timeAgo(p.registeredAt, lang) })}</span>
                  </span>
                </li>
              ))}
            </ol>
          </motion.article>

          {/* ── Latest trades ── */}
          <motion.article {...rise(1)} className={`${card} flex flex-col`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className={cardTitle}>{t("live.trades.title")}</h3>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setUnpaidOnly((v) => !v)}
                  aria-pressed={unpaidOnly}
                  className={`rounded-full border px-3 py-1.5 font-bold transition-colors ${
                    unpaidOnly ? "border-gold bg-gold/20 text-gold-deep" : "border-gold/40 bg-white/50 text-jade-deep hover:bg-white/80"
                  }`}
                >
                  {unpaidOnly ? t("live.trades.showAll") : t("live.trades.showUnpaid")}
                </button>
                <a href="https://direct.lana.fund" target="_blank" rel="noopener noreferrer" className="link-arrow text-xs">
                  {t("live.trades.viewAll")} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            <div className="relative mt-4 flex-1">
              {isLoading && <div className="space-y-2">{Array.from({ length: VISIBLE_TRADES }, (_, i) => <Skeleton key={i} className="h-9" />)}</div>}
              {!isLoading && trades.length === 0 && (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {data?.trades === null ? t("live.error") : unpaidOnly ? t("live.trades.emptyUnpaid") : t("live.trades.empty")}
                </p>
              )}
              {trades.length > 0 && (
                <ol className="divide-y divide-gold/10">
                  {trades.map((tr, i) => (
                    <li key={tr.id} className="grid grid-cols-[1.6rem_auto_1fr_auto] items-center gap-x-2 py-2 text-sm sm:grid-cols-[1.8rem_auto_1fr_auto_auto_auto] sm:gap-x-3 lg:grid-cols-[1.6rem_auto_1fr_auto] lg:gap-x-2">
                      <span className="text-xs font-bold text-muted-foreground">{i + 1}.</span>
                      <span className={`h-2.5 w-2.5 rounded-full ${
                        tr.status === "paid" ? "bg-jade" : tr.status === "partial" ? "bg-lotus-deep" : tr.status === "failed" ? "bg-red-500" : "bg-gold"
                      }`} aria-hidden="true" />
                      <span className="truncate font-bold text-foreground">{tr.merchant}</span>
                      <span className="whitespace-nowrap font-display text-base font-semibold text-jade-deep sm:text-right">{formatMoney(tr.amount, tr.currency, lang)}</span>
                      <span className={`status-pill status-${tr.status} col-start-3 justify-self-start sm:col-start-auto lg:col-start-3`}>{statusLabel[tr.status]}</span>
                      <time className="col-start-4 whitespace-nowrap text-right text-xs text-muted-foreground sm:col-start-auto lg:col-start-4">{timeAgo(tr.createdAt, lang)}</time>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {unpaidOnly && trades.length > 0 && (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-gold/30 bg-gold/10 px-4 py-2.5 text-sm">
                <span className="font-bold uppercase tracking-[0.12em] text-gold-deep">{t("live.trades.unpaidTotal")}</span>
                <strong className="font-display text-lg text-jade-deep">{unpaidTotals || "0 €"}</strong>
              </div>
            )}
          </motion.article>

          {/* ── Funding + video ── */}
          <div className="flex flex-col gap-5">
            <motion.article {...rise(2)} className={card}>
              <Mandala className="pointer-events-none absolute -right-20 -top-20 w-64 text-gold opacity-[0.08]" spin={false} />
              <h3 className={`${cardTitle} relative`}>{t("live.funding.title")}</h3>
              {isLoading ? (
                <div className="mt-4 space-y-3"><Skeleton className="h-12 w-2/3" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-24" /></div>
              ) : (
                <div className="relative">
                  <p className="mt-2 font-display text-5xl font-semibold leading-none text-gold-gradient">{num(funding?.waitingEur, (n) => formatEUR(n, lang))}</p>
                  <p className="mt-2 text-sm font-bold text-jade-deep/80">{t("live.funding.investors", { n: funding?.investors == null ? "—" : funding.investors })}</p>
                  {byCurrency.length > 1 && (
                    <p className="mt-1 text-xs text-muted-foreground">{byCurrency.map(([c, v]) => formatMoney(v, c, lang)).join(" + ")}</p>
                  )}
                  <div className="mt-5 rounded-2xl border border-gold/25 bg-white/50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t("live.funding.circulation")}</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-jade-deep">{num(funding?.lanaInCirculation, (n) => formatNumber(n, lang))} LANA</p>
                    <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{t("live.funding.distribution")}</p>
                    <p className="mt-1 font-display text-3xl font-semibold text-jade">≈ {num(funding?.distributionEur, (n) => formatEUR(n, lang))}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("live.funding.split")}</p>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("live.funding.note")}</p>
                  <a href="https://direct.lana.fund" target="_blank" rel="noopener noreferrer" className="link-arrow mt-3 text-sm">
                    <Sprout className="h-4 w-4" /> {t("live.funding.invest")}
                  </a>
                </div>
              )}
            </motion.article>

            <motion.article {...rise(3)} className={card}>
              <h3 className={cardTitle}>{t("live.video.title")}</h3>
              <div className="mt-4 overflow-hidden rounded-2xl border border-gold/25 bg-black/5">
                {playing ? (
                  <iframe
                    className="aspect-video w-full"
                    src={`https://www.youtube.com/embed/${YOUTUBE_ID}?autoplay=1&rel=0`}
                    title={t("live.video.title")}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <button type="button" onClick={() => setPlaying(true)} className="group relative block aspect-video w-full" aria-label={t("live.video.play")}>
                    <img src={`https://img.youtube.com/vi/${YOUTUBE_ID}/hqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-jade-deep/50 to-transparent" />
                    <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/85 text-jade-deep shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <Play className="ml-1 h-7 w-7" fill="currentColor" />
                    </span>
                    <span className="absolute bottom-2 right-2 rounded-md bg-black/60 px-1.5 py-0.5 text-[11px] font-bold text-white">06:45</span>
                  </button>
                )}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("live.video.text")}</p>
            </motion.article>
          </div>
        </div>
      )}
    </div>
  );
}
