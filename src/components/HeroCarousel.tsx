import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import heroEn from "@/assets/hero-en.jpg";
import heroSl from "@/assets/hero-sl.png";

const HeroCarousel = () => {
  const { lang, t } = useLanguage();
  const heroImage = lang === 'sl' ? heroSl : heroEn;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-lg bg-gradient-to-b from-sky-100 to-green-50">
      <AnimatePresence mode="wait">
        <motion.img
          key={lang}
          src={heroImage}
          alt={t('carousel.alt')}
          className="absolute inset-0 w-full h-full object-contain"
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
