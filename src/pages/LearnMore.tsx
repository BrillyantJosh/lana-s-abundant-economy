import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Sprout, Heart, HandCoins, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import lanaLogo from "@/assets/lana-logo.png";
import type { TranslationKey } from "@/i18n/translations";

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
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 text-primary font-display font-bold text-xl hover:opacity-80 transition-opacity">
          <ArrowLeft className="w-5 h-5" />
          <img
            src={lanaLogo}
            alt="Lana"
            className="w-7 h-7 rounded"
            style={{ filter: 'invert(58%) sepia(89%) saturate(400%) hue-rotate(10deg) brightness(95%)' }}
          />
          <span>LanaPays.<span className="text-gold">Us</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${lang === 'en' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('sl')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${lang === 'sl' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              SI
            </button>
          </div>
          <a
            href="https://mobile.lanapays.us"
            className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {t('header.login')}
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        <motion.h1
          className="text-3xl md:text-4xl font-display font-bold text-primary text-center"
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        >
          {t('learn.title')}
        </motion.h1>

        {sectionDefs.map((section, i) => (
          <motion.div
            key={section.titleKey}
            variants={fadeUp}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="p-8 rounded-xl bg-card border border-border"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                <section.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground">{t(section.titleKey)}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{t(section.contentKey)}</p>
            {section.link && (
              <a
                href={section.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-sm font-semibold text-gold hover:underline"
              >
                {section.link.label} →
              </a>
            )}
          </motion.div>
        ))}
      </main>

      <footer className="text-center py-8 text-sm text-muted-foreground border-t border-border">
        {t('footer.copy')}
      </footer>
    </div>
  );
};

export default LearnMore;
