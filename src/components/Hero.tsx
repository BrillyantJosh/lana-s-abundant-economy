import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import Mandala from "./Mandala";
import { LotusGlyph } from "./LotusDivider";
import { scrollToId } from "./AnchorLink";
import { usePathDialogs } from "./PathDialogs";
import heroWebp from "@/assets/hero-lotus.webp";
import heroMobile from "@/assets/hero-lotus-mobile.webp";
import heroJpg from "@/assets/hero-lotus.jpg";
import heroMotion from "@/assets/hero-lotus-motion.mp4";

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function Hero() {
  const { t } = useLanguage();
  const { openRegister, openLogin } = usePathDialogs();

  return (
    <section id="top" className="relative flex min-h-[92svh] w-full flex-col overflow-hidden sm:min-h-[88vh]">
      <video
        className="absolute inset-0 hidden h-full w-full object-cover object-[50%_45%] sm:block sm:object-[50%_55%] motion-reduce:hidden"
        autoPlay
        loop
        muted
        playsInline
        poster={heroJpg}
        aria-hidden="true"
      >
        <source src={heroMotion} type="video/mp4" />
      </video>

      <picture className="absolute inset-0 sm:motion-safe:hidden">
        <source media="(max-width: 640px)" srcSet={heroMobile} type="image/webp" />
        <source srcSet={heroWebp} type="image/webp" />
        <img
          src={heroJpg}
          alt=""
          className="h-full w-full object-cover object-[50%_45%] sm:object-[50%_55%]"
          decoding="async"
        />
      </picture>

      {/* a soft cream veil in the sky so the words rest on the painting */}
      <div className="absolute inset-0 bg-[radial-gradient(95%_46%_at_50%_38%,hsl(44_62%_96%/.9)_0%,hsl(44_62%_96%/.55)_55%,transparent_85%)] sm:bg-[radial-gradient(70%_58%_at_50%_40%,hsl(44_62%_96%/.88)_0%,hsl(44_62%_96%/.5)_50%,transparent_78%)]" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-[hsl(42_50%_95%/.55)] to-[hsl(42_50%_95%)] sm:h-44" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[hsl(44_62%_96%/.55)] to-transparent" />

      <Mandala className="pointer-events-none absolute left-1/2 top-[40%] w-[560px] -translate-x-1/2 -translate-y-1/2 text-gold opacity-[0.13] sm:w-[780px]" />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 pb-24 pt-28 text-center sm:pt-32">
        <div className="max-w-4xl">
          <motion.div {...rise(0)} className="flex justify-center">
            <LotusGlyph className="drift h-9 w-14 text-gold-deep" />
          </motion.div>
          <motion.p {...rise(0.1)} className="kicker mt-3">
            {t("hero.kicker")}
          </motion.p>
          <motion.h1
            {...rise(0.2)}
            className="mt-4 font-display text-[clamp(2.5rem,9vw,5.2rem)] font-semibold leading-[1.02] text-jade-deep [text-shadow:0_2px_24px_hsl(44_60%_96%/.9)]"
          >
            {t("hero.title")}
          </motion.h1>
          <motion.p {...rise(0.32)} className="mt-3 font-display text-[clamp(1.5rem,4.5vw,2.4rem)] italic leading-tight text-gold-deep">
            {t("hero.tagline")}
          </motion.p>
          <motion.p {...rise(0.42)} className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-foreground/85 sm:text-lg">
            {t("hero.lead")}
          </motion.p>
          <motion.div {...rise(0.52)} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button type="button" onClick={openRegister} className="btn btn-jade w-full sm:w-auto">
              {t("hero.cta.register")}
            </button>
            <button type="button" onClick={openLogin} className="btn btn-gold w-full sm:w-auto">
              {t("hero.cta.login")}
            </button>
          </motion.div>
          <motion.div {...rise(0.62)} className="mt-5">
            <Link to="/learn-more" className="font-body text-sm font-bold text-jade-deep/80 underline decoration-gold/60 underline-offset-4 transition-colors hover:text-gold-deep">
              {t("hero.cta.learn")}
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.a
        href="#sistem"
        onClick={(e) => { e.preventDefault(); scrollToId("sistem"); }}
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 font-body text-[11px] font-bold uppercase tracking-[0.28em] text-jade-deep/70 transition-colors hover:text-gold-deep"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        {t("hero.scroll")}
        <ChevronDown className="drift h-5 w-5" />
      </motion.a>
    </section>
  );
}
