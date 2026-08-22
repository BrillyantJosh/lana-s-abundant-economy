import { Zap, Smartphone, Globe, ScanLine, FileSpreadsheet, QrCode } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/Hero";
import SectionHeading from "@/components/SectionHeading";
import LiveSystem from "@/components/LiveSystem";
import ServiceCard from "@/components/ServiceCard";
import EventsSection from "@/components/EventsSection";
import WhereToBuy from "@/components/WhereToBuy";
import BefCard from "@/components/BefCard";
import SiteFooter from "@/components/SiteFooter";
import { useHashScroll } from "@/components/AnchorLink";

const section = "section-anchor mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24";

const Index = () => {
  const { lang, t } = useLanguage();
  useHashScroll();

  const pillars = [
    {
      icon: <Zap className="h-6 w-6" />, tone: "gold" as const,
      name: t("pillars.simple.name"), domain: "simple.lanapays.us", href: `https://simple.lanapays.us?lang=${lang}`,
      tag: t("pillars.simple.tag"), desc: t("pillars.simple.desc"),
      bullets: [t("pillars.simple.b1"), t("pillars.simple.b2"), t("pillars.simple.b3")], cta: t("pillars.simple.cta"),
    },
    {
      icon: <Smartphone className="h-6 w-6" />, tone: "jade" as const,
      name: t("pillars.mobile.name"), domain: "mobile.lanapays.us", href: "https://mobile.lanapays.us",
      tag: t("pillars.mobile.tag"), desc: t("pillars.mobile.desc"),
      bullets: [t("pillars.mobile.b1"), t("pillars.mobile.b2"), t("pillars.mobile.b3")], cta: t("pillars.mobile.cta"),
    },
    {
      icon: <Globe className="h-6 w-6" />, tone: "lotus" as const,
      name: t("pillars.pay.name"), domain: "pay.lanapays.us", href: `https://pay.lanapays.us?lang=${lang}`,
      tag: t("pillars.pay.tag"), desc: t("pillars.pay.desc"),
      bullets: [t("pillars.pay.b1"), t("pillars.pay.b2"), t("pillars.pay.b3")], cta: t("pillars.pay.cta"),
    },
  ];

  const tech = [
    {
      icon: <ScanLine className="h-6 w-6" />, tone: "jade" as const,
      name: t("tech.pos.name"), domain: "pos.lanapays.us", href: `https://pos.lanapays.us?lang=${lang}`,
      tag: t("tech.pos.tag"), desc: t("tech.pos.desc"),
      bullets: [t("tech.pos.b1"), t("tech.pos.b2"), t("tech.pos.b3")], cta: t("tech.pos.cta"),
    },
    {
      icon: <FileSpreadsheet className="h-6 w-6" />, tone: "gold" as const,
      name: t("tech.feed.name"), domain: "feed.lanapays.us", href: `https://feed.lanapays.us?lang=${lang}`,
      tag: t("tech.feed.tag"), desc: t("tech.feed.desc"),
      bullets: [t("tech.feed.b1"), t("tech.feed.b2"), t("tech.feed.b3")], cta: t("tech.feed.cta"),
    },
    {
      icon: <QrCode className="h-6 w-6" />, tone: "lotus" as const,
      name: t("tech.fund.name"), domain: "lanafund.me", href: "https://lanafund.me",
      tag: t("tech.fund.tag"), desc: t("tech.fund.desc"),
      bullets: [t("tech.fund.b1"), t("tech.fund.b2"), t("tech.fund.b3")], cta: t("tech.fund.cta"),
    },
  ];

  return (
    <div className="paper-bg min-h-screen">
      <SiteHeader overHero />
      <Hero />

      <main className="relative">
        {/* ── Live reference data (LanaConnects.us) ── */}
        <section id="sistem" className={section}>
          <SectionHeading kicker={t("live.kicker")} title={t("live.title")} subtitle={t("live.subtitle")} />
          <LiveSystem />
        </section>

        {/* ── I. Services ── */}
        <section id="sklopi" className={section}>
          <SectionHeading kicker={t("pillars.kicker")} title={t("pillars.title")} subtitle={t("pillars.subtitle")} />
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((p, i) => <ServiceCard key={p.domain} index={i} {...p} />)}
          </div>
        </section>

        {/* ── II. More ── */}
        <section id="vec" className={section}>
          <SectionHeading kicker={t("more.kicker")} title={t("more.title")} subtitle={t("more.subtitle")} />
          <div className="space-y-16 sm:space-y-20">
            <EventsSection />
            <WhereToBuy />
            <BefCard />
          </div>
        </section>

        {/* ── III. Technical solutions ── */}
        <section id="tehnicne" className={section}>
          <SectionHeading kicker={t("tech.kicker")} title={t("tech.title")} subtitle={t("tech.subtitle")} />
          <div className="grid gap-6 md:grid-cols-3">
            {tech.map((p, i) => <ServiceCard key={p.domain} index={i} {...p} />)}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
