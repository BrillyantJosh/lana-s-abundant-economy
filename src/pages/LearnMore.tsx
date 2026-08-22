import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Sprout, Heart, HandCoins, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import type { TranslationKey } from "@/i18n/translations";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import SectionHeading from "@/components/SectionHeading";
import Mandala from "@/components/Mandala";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const sectionDefs = [
  { icon: Sprout, titleKey: 'learn.lana8wonder.title' as TranslationKey, contentKey: 'learn.lana8wonder.content' as TranslationKey, link: { label: "Lana8Wonder.com", href: "https://lana8wonder.com" } },
  { icon: Heart, titleKey: 'learn.crowdfunding.title' as TranslationKey, contentKey: 'learn.crowdfunding.content' as TranslationKey },
  { icon: HandCoins, titleKey: 'learn.responsibility.title' as TranslationKey, contentKey: 'learn.responsibility.content' as TranslationKey },
  { icon: TrendingUp, titleKey: 'learn.financing.title' as TranslationKey, contentKey: 'learn.financing.content' as TranslationKey },
];

const LearnMore = () => {
  const { t } = useLanguage();

  return (
    <div className="paper-bg min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:pt-36">
        <Link to="/" className="link-arrow mb-8 text-sm">
          <ArrowLeft className="h-4 w-4" /> {t('learn.back')}
        </Link>
        <SectionHeading kicker={t('hero.kicker')} title={t('learn.title')} />

        <div className="space-y-6">
          {sectionDefs.map((section, i) => (
            <motion.div
              key={section.titleKey}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-[1.6rem] glass card-frame p-6 sm:p-8"
            >
              <Mandala className="pointer-events-none absolute -right-16 -top-16 w-52 text-gold opacity-[0.07]" spin={false} />
              <div className="relative mb-4 flex items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-white/60 text-jade-deep">
                  <section.icon className="h-6 w-6" />
                </div>
                <h2 className="font-display text-2xl font-semibold text-jade-deep sm:text-3xl">{t(section.titleKey)}</h2>
              </div>
              <p className="relative text-[15px] leading-relaxed text-foreground/80 sm:text-base">{t(section.contentKey)}</p>
              {section.link && (
                <a href={section.link.href} target="_blank" rel="noopener noreferrer" className="link-arrow relative mt-4 text-sm">
                  {section.link.label} →
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default LearnMore;
