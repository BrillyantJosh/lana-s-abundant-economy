import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import SiteHeader from "@/components/SiteHeader";
import Mandala from "@/components/Mandala";
import { LotusGlyph } from "@/components/LotusDivider";

const NotFound = () => {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="paper-bg relative flex min-h-screen items-center justify-center overflow-hidden px-4 pt-16">
      <SiteHeader />
      <Mandala className="pointer-events-none absolute left-1/2 top-1/2 w-[560px] -translate-x-1/2 -translate-y-1/2 text-gold opacity-[0.1]" />
      <div className="relative w-full max-w-md rounded-[1.6rem] glass card-frame p-10 text-center">
        <LotusGlyph className="mx-auto h-9 w-14 text-gold-deep" />
        <p className="kicker mt-3">404</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-jade-deep">{t("notfound.title")}</h1>
        <Link to="/" className="btn btn-jade mt-6">{t("notfound.back")}</Link>
      </div>
    </div>
  );
};

export default NotFound;
