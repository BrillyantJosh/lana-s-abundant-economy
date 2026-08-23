import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { LotusGlyph } from "./LotusDivider";
import AnchorLink from "./AnchorLink";
import { usePathDialogs } from "./PathDialogs";

interface Props {
  /** true on the landing page: transparent over the hero, frosted after scrolling */
  overHero?: boolean;
}

export default function SiteHeader({ overHero = false }: Props) {
  const { lang, setLang, t } = useLanguage();
  const { openRegister, openLogin } = usePathDialogs();
  const [scrolled, setScrolled] = useState(!overHero);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!overHero) return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  const nav = [
    { id: "sistem", label: t("nav.live") },
    { id: "sklopi", label: t("nav.pillars") },
    { id: "vec", label: t("nav.more") },
    { id: "tehnicne", label: t("nav.tech") },
  ];

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        solid ? "glass glass-solid shadow-[0_12px_40px_-24px_rgba(31,58,46,.45)]" : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:px-6">
        <AnchorLink to="top" className="group flex items-center gap-2.5" aria-label="LanaPays.Us">
          <LotusGlyph className="h-6 w-9 text-gold-deep transition-transform duration-500 group-hover:-translate-y-0.5" />
          <span className="font-display text-[1.45rem] font-semibold tracking-wide text-jade-deep sm:text-2xl">
            LanaPays<span className="text-gold-deep">.Us</span>
          </span>
        </AnchorLink>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
          {nav.map((n) => (
            <AnchorLink
              key={n.id}
              to={n.id}
              className="font-body text-[12px] font-bold uppercase tracking-[0.2em] text-jade-deep/80 transition-colors hover:text-gold-deep"
            >
              {n.label}
            </AnchorLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center rounded-full border border-gold/30 bg-white/50 p-0.5" role="group" aria-label="Language">
            {(["sl", "en"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wider transition-all ${
                  lang === l ? "bg-jade text-cream shadow-sm" : "text-jade-deep/70 hover:text-jade-deep"
                }`}
              >
                {t(l === "sl" ? "lang.sl" : "lang.en")}
              </button>
            ))}
          </div>
          <button type="button" onClick={openLogin} className="btn btn-gold hidden !px-5 !py-2 text-xs sm:inline-flex">
            {t("header.login")}
          </button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-white/50 text-jade-deep md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={t("nav.menu")}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && <button type="button" aria-label={t("nav.menu")} onClick={() => setOpen(false)} className="fixed inset-0 top-16 -z-10 bg-jade-deep/20 md:hidden" />}
      {open && (
        <nav className="max-h-[calc(100svh-4rem)] overflow-y-auto border-t border-gold/20 px-4 pb-5 pt-3 md:hidden" aria-label="Mobile">
          <ul className="space-y-1">
            {nav.map((n) => (
              <li key={n.id}>
                <AnchorLink
                  to={n.id}
                  onNavigate={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 font-body text-sm font-bold uppercase tracking-[0.18em] text-jade-deep hover:bg-jade/10"
                >
                  {n.label}
                </AnchorLink>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => { setOpen(false); openRegister(); }} className="btn btn-jade flex-1 !py-2.5 text-xs">{t("header.register")}</button>
            <button type="button" onClick={() => { setOpen(false); openLogin(); }} className="btn btn-gold flex-1 !py-2.5 text-xs">{t("header.login")}</button>
          </div>
        </nav>
      )}
    </header>
  );
}
