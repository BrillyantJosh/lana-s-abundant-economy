import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Store, RefreshCw, Loader2, Tag, MapPin, Sprout, Utensils, Sparkles, Shirt, Sofa, HardHat, Baby, PawPrint, Palmtree, Tent, CalendarDays } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import SectionHeading from "./SectionHeading";
import {
  fetchMerchantsFromRelays,
  matchesCountry,
  pickRandom,
  translateCategory,
  withLang,
  fadeUp,
  type MerchantUnit,
} from "@/lib/relayData";

export default function WhereToBuy() {
  const { lang, t } = useLanguage();
  const [merchants, setMerchants] = useState<MerchantUnit[]>([]);
  const [displayed, setDisplayed] = useState<MerchantUnit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMerchantsFromRelays().then((units) => {
      setMerchants(units);
      setIsLoading(false);
    });
  }, []);

  // Same rule as before: the language picks the country (SI for Slovene, UK for English).
  const languageMerchants = useMemo(() => merchants.filter((m) => matchesCountry(m.receiverCountry, lang)), [merchants, lang]);

  useEffect(() => {
    setDisplayed(pickRandom(languageMerchants, 3));
  }, [languageMerchants]);

  // `comingSoon: true` = the portal is shown dimmed and is NOT a link (too few providers yet).
  // Flip it back to `false` / remove it in this one place when the portal is ready.
  const portals = [
    { icon: Sprout, label: t("portals.farms"), url: "https://www.lanaeco.farm" },
    { icon: ShoppingBag, label: t("portals.shops"), url: "https://www.lanaeco.shop/" },
    { icon: Utensils, label: t("portals.restaurants"), url: "https://lana.restaurant/" },
    { icon: Sparkles, label: t("portals.beauty"), url: "https://lanabeauty.care" },
    { icon: Shirt, label: t("portals.fashion"), url: "https://lana.fashion" },
    { icon: Sofa, label: t("portals.furniture"), url: "https://lana.furniture" },
    { icon: HardHat, label: t("portals.construction"), url: "https://lana.construction", comingSoon: true },
    { icon: Baby, label: t("portals.kids"), url: "https://lana.kids", comingSoon: true },
    { icon: PawPrint, label: t("portals.pets"), url: "https://lana.pet" },
    { icon: Palmtree, label: t("portals.vacations"), url: "https://lana.vacations", comingSoon: true },
    { icon: Tent, label: t("portals.marketplace"), url: "https://lanamarket.place" },
    { icon: CalendarDays, label: t("portals.events"), url: "https://lana.events" },
  ];

  return (
    <div id="trgovine" className="section-anchor">
      <SectionHeading
        compact
        icon={<ShoppingBag className="h-5 w-5" />}
        kicker={t("shops.kicker")}
        title={t("shops.title")}
        subtitle={t("shops.subtitle")}
        aside={
          languageMerchants.length > 3 ? (
            <button type="button" onClick={() => setDisplayed(pickRandom(languageMerchants, 3))} className="btn btn-ghost !py-2 text-xs">
              <RefreshCw className="h-3.5 w-3.5" /> {t("shops.shuffle")}
            </button>
          ) : undefined
        }
      />

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="mb-2 h-6 w-6 animate-spin" />
          <p className="text-sm">{t("shops.loading")}</p>
        </div>
      )}

      {!isLoading && displayed.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <Store className="mx-auto mb-2 h-10 w-10 opacity-40" />
          <p className="text-sm">{t("shops.empty")}</p>
        </div>
      )}

      {!isLoading && displayed.length > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {displayed.map((unit, i) => (
            <motion.a
              key={unit.unitId}
              href={`https://shop.lanapays.us/shop/${unit.pubkey}/${unit.unitId}`}
              target="_blank"
              rel="noopener noreferrer"
              variants={fadeUp}
              custom={i + 1}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="group overflow-hidden rounded-[1.4rem] glass shadow-[0_30px_60px_-40px_hsl(160_30%_15%/.45)] transition-transform duration-500 hover:-translate-y-1.5"
            >
              <div className="relative h-44 overflow-hidden">
                <img src={unit.image} alt={unit.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-jade-deep/70 via-jade-deep/10 to-transparent" />
                <h4 className="absolute bottom-3 left-4 right-4 font-display text-xl font-semibold leading-tight text-white drop-shadow-md">{unit.name}</h4>
              </div>
              <div className="space-y-1.5 p-4">
                {unit.category && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Tag className="h-3.5 w-3.5 shrink-0 text-gold-deep" />
                    <span className="truncate">
                      {translateCategory(unit.category, lang)}
                      {unit.categoryDetail ? ` / ${translateCategory(unit.categoryDetail, lang)}` : ""}
                    </span>
                  </p>
                )}
                {(unit.receiverCity || unit.receiverCountry) && (
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-gold-deep" />
                    <span className="truncate">{[unit.receiverCity, unit.receiverCountry].filter(Boolean).join(", ")}</span>
                  </p>
                )}
                {unit.content && <p className="line-clamp-2 text-sm text-muted-foreground">{unit.content}</p>}
              </div>
            </motion.a>
          ))}
        </div>
      )}

      <motion.div
        className="mt-8"
        variants={fadeUp}
        custom={1}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">{t("shops.portals")}</p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-2.5">
          {portals.map(({ icon: Icon, label, url, comingSoon }) =>
            comingSoon ? (
              // Not a link on purpose: same pill shape so the grid stays aligned, but dimmed and inert.
              <span
                key={url}
                role="link"
                aria-disabled="true"
                data-portal-soon={url}
                title={t("portals.soonHint")}
                className="relative inline-flex cursor-default select-none items-center gap-2 rounded-full border border-dashed border-jade/20 bg-white/30 px-3 py-2 text-[13px] font-bold text-jade-deep/45 sm:px-4"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
                {/* tiny tag on the top-right edge, so the name keeps the same room as in the other pills */}
                <span className="absolute -top-1.5 right-2.5 rounded-full border border-cream bg-gold-light px-1.5 text-[9px] font-bold uppercase leading-[13px] tracking-[0.14em] text-gold-deep">
                  {t("portals.soon")}
                </span>
              </span>
            ) : (
              <a
                key={url}
                href={withLang(url, lang)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-jade/30 bg-white/55 px-3 py-2 text-[13px] font-bold text-jade-deep transition-all duration-300 hover:-translate-y-0.5 hover:border-jade hover:bg-jade hover:text-cream sm:px-4"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </a>
            ),
          )}
        </div>
      </motion.div>
    </div>
  );
}
