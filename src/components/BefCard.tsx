import { motion } from "framer-motion";
import { Scale, ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import SectionHeading from "./SectionHeading";
import Mandala from "./Mandala";
import { LotusGlyph } from "./LotusDivider";
import { useConnectsOverview } from "./LiveSystem";

const BEF_URL = "https://balancedexchangeframe.work";

export default function BefCard() {
  const { lang, t } = useLanguage();
  const { data } = useConnectsOverview();
  const bef = data?.bef;

  const triad = [
    { name: t("bef.triad.exchange.name"), text: t("bef.triad.exchange") },
    { name: t("bef.triad.alignment.name"), text: t("bef.triad.alignment") },
    { name: t("bef.triad.own.name"), text: t("bef.triad.own") },
  ];
  const principles = [t("bef.p1"), t("bef.p2"), t("bef.p3"), t("bef.p4")];

  const befDate = bef?.date ? new Date(bef.date) : null;
  const versionLabel = bef
    ? befDate && !Number.isNaN(befDate.getTime())
      ? t("bef.version", { v: bef.version, date: befDate.toLocaleDateString(lang === "sl" ? "sl-SI" : "en-GB") })
      : `BEF ${bef.version}`
    : null;

  return (
    <div id="bef" className="section-anchor">
      <SectionHeading compact icon={<Scale className="h-5 w-5" />} kicker={t("bef.kicker")} title={t("bef.title")} />

      <motion.article
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[1.8rem] glass card-frame"
      >
        <Mandala className="pointer-events-none absolute -right-40 -top-40 w-[520px] text-gold opacity-[0.08]" spin={false} />
        <Mandala className="pointer-events-none absolute -bottom-48 -left-44 w-[460px] text-jade opacity-[0.06]" spin={false} />

        <div className="relative grid gap-8 p-7 sm:p-10 lg:grid-cols-2 lg:gap-12">
          <div>
            <a href={BEF_URL} target="_blank" rel="noopener noreferrer" className="font-body text-[11px] font-bold uppercase tracking-[0.24em] text-gold-deep hover:underline">
              BalancedExchangeFrame.work
            </a>
            <p className="mt-3 font-display text-[1.15rem] italic leading-relaxed text-jade-deep/90 sm:text-2xl sm:leading-snug">{t("bef.intro")}</p>

            <h4 className="mt-8 font-display text-xl font-semibold text-jade-deep">{t("bef.triad.title")}</h4>
            <ol className="mt-3 space-y-3">
              {triad.map((item, i) => (
                <li key={item.name} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-white/60 font-display text-base font-semibold text-gold-deep">
                    {["I", "II", "III"][i]}
                  </span>
                  <div>
                    <p className="font-body text-[12px] font-bold uppercase tracking-[0.18em] text-jade-deep">{item.name}</p>
                    <p className="text-sm leading-relaxed text-foreground/80">{item.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col">
            <h4 className="font-display text-xl font-semibold text-jade-deep">{t("bef.flow.title")}</h4>
            <p className="mt-2 text-[15px] leading-relaxed text-foreground/80">{t("bef.flow.text")}</p>

            <h4 className="mt-7 font-display text-xl font-semibold text-jade-deep">{t("bef.principles.title")}</h4>
            <ul className="mt-3 space-y-2.5">
              {principles.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/85">
                  <LotusGlyph className="mt-1 h-3.5 w-5 shrink-0 text-gold" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-8">
              <a href={BEF_URL} target="_blank" rel="noopener noreferrer" className="btn btn-jade">
                {t("bef.cta")} <ArrowUpRight className="h-4 w-4" />
              </a>
              {versionLabel && <span className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{versionLabel}</span>}
            </div>
          </div>
        </div>
      </motion.article>
    </div>
  );
}
