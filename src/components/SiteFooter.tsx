import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import LotusDivider, { LotusGlyph } from "./LotusDivider";
import Mandala from "./Mandala";
import AnchorLink from "./AnchorLink";

export default function SiteFooter() {
  const { lang, t } = useLanguage();
  const ext = { target: "_blank", rel: "noopener noreferrer" } as const;
  const col = "space-y-2 text-sm";
  const link = "text-foreground/75 transition-colors hover:text-gold-deep";

  return (
    <footer className="relative mt-10 overflow-hidden border-t border-gold/20">
      <Mandala className="pointer-events-none absolute left-1/2 top-full w-[900px] -translate-x-1/2 -translate-y-1/2 text-gold opacity-[0.07]" spin={false} />
      <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6">
        <div className="text-center">
          <LotusGlyph className="mx-auto h-9 w-14 text-gold-deep" />
          <p className="mt-3 font-display text-2xl italic text-jade-deep sm:text-3xl">{t("footer.tagline")}</p>
          <LotusDivider className="mt-5" />
        </div>

        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="kicker mb-3">{t("footer.col.pillars")}</p>
            <ul className={col}>
              <li><a className={link} href="https://simple.lanapays.us" {...ext}>Simple · simple.lanapays.us</a></li>
              <li><a className={link} href="https://mobile.lanapays.us">{t("pillars.mobile.name")} · mobile.lanapays.us</a></li>
              <li><a className={link} href="https://pay.lanapays.us" {...ext}>LanaPay · pay.lanapays.us</a></li>
            </ul>
          </div>
          <div>
            <p className="kicker mb-3">{t("footer.col.more")}</p>
            <ul className={col}>
              <li><AnchorLink className={link} to="dogodki">{t("footer.events")}</AnchorLink></li>
              <li><AnchorLink className={link} to="trgovine">{t("footer.shops")}</AnchorLink></li>
              <li><AnchorLink className={link} to="bef">{t("footer.bef")}</AnchorLink></li>
              <li><Link className={link} to="/learn-more">{t("hero.cta.learn")}</Link></li>
            </ul>
          </div>
          <div>
            <p className="kicker mb-3">{t("footer.col.tech")}</p>
            <ul className={col}>
              <li><a className={link} href="https://pos.lanapays.us" {...ext}>LanaPay POS · pos.lanapays.us</a></li>
              <li><a className={link} href="https://feed.lanapays.us" {...ext}>Lana Feed · feed.lanapays.us</a></li>
              <li><a className={link} href="https://lanafund.me" {...ext}>LanaFund.Me · lanafund.me</a></li>
            </ul>
          </div>
          <div>
            <p className="kicker mb-3">{t("footer.col.eco")}</p>
            <ul className={col}>
              <li><a className={link} href="https://lanaconnects.us" {...ext}>{t("footer.eco.connects")}</a></li>
              <li><a className={link} href="https://direct.lana.fund" {...ext}>{t("footer.eco.direct")}</a></li>
              <li><a className={link} href={`https://shop.lanapays.us/welcome?lang=${lang}`} {...ext}>{t("footer.eco.shop")}</a></li>
              <li><a className={link} href="https://www.lana.discount" {...ext}>{t("footer.eco.discount")}</a></li>
              <li><a className={link} href="https://lana8wonder.com" {...ext}>{t("footer.eco.wonder")}</a></li>
              <li><a className={link} href="https://www.mejmosefajn.org" {...ext}>{t("footer.eco.wallet")}</a></li>
              <li><a className={link} href="https://balancedexchangeframe.work" {...ext}>{t("footer.eco.bef")}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-gold/15 pt-5 text-xs text-muted-foreground sm:flex-row">
          <span>{t("footer.copy")}</span>
          <Link to="/admin" className="hover:text-gold-deep">{t("footer.admin")}</Link>
        </div>
      </div>
    </footer>
  );
}
