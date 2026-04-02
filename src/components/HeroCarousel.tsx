import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import heroEn from "@/assets/hero-en.jpg";
import heroSl from "@/assets/hero-sl.png";

const HeroCarousel = () => {
  const { lang, t } = useLanguage();
  const heroImage = lang === 'sl' ? heroSl : heroEn;

  return (
    <div className="relative w-screen left-1/2 -translate-x-1/2 h-[90vw] sm:h-[60vw] max-h-[650px] min-h-[280px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.img
          key={lang}
          src={heroImage}
          alt={t('carousel.alt')}
          className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>
    </div>
  );
};

export default HeroCarousel;
