import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import samoodgovornostImg from "@/assets/samoodgovornost.jpg";
import pathOfLifeImg from "@/assets/path-of-life.jpg";
import economyImg from "@/assets/economy-of-abundance.jpg";

const images = [economyImg, pathOfLifeImg, samoodgovornostImg];

const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    const timer = setInterval(() => setCurrent((p) => (p + 1) % images.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-lg">
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={images[current]}
          alt={t('carousel.alt')}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
        />
      </AnimatePresence>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-3 h-3 rounded-full transition-all ${i === current ? "bg-gold scale-125" : "bg-primary-foreground/50"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
