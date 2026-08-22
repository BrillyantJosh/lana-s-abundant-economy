import { motion } from "framer-motion";
import Mandala from "./Mandala";
import LotusDivider from "./LotusDivider";

interface Props {
  kicker: string;
  title: string;
  subtitle?: string;
  /** sub-section heading (smaller, left aligned, no mandala) */
  compact?: boolean;
  icon?: React.ReactNode;
  aside?: React.ReactNode;
  id?: string;
}

export default function SectionHeading({ kicker, title, subtitle, compact = false, icon, aside, id }: Props) {
  if (compact) {
    return (
      <div id={id} className="section-anchor flex flex-wrap items-end justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3 sm:gap-4">
          {icon && (
            <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-gold/40 bg-white/50 text-gold-deep shadow-[0_8px_20px_-12px_rgba(120,90,20,.6)]">
              {icon}
            </span>
          )}
          <div>
            <p className="kicker">{kicker}</p>
            <h3 className="font-display text-2xl sm:text-3xl font-semibold text-jade-deep leading-tight">{title}</h3>
            {subtitle && <p className="text-sm sm:text-base text-muted-foreground mt-1">{subtitle}</p>}
          </div>
        </div>
        {aside}
      </div>
    );
  }

  return (
    <motion.div
      className="relative text-center mb-8 sm:mb-12"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Mandala className="pointer-events-none absolute left-1/2 top-1/2 w-[320px] sm:w-[420px] -translate-x-1/2 -translate-y-1/2 text-gold opacity-[0.09]" spin={false} />
      <div className="relative">
        <p className="kicker">{kicker}</p>
        <h2 className="mt-3 font-display text-[2.1rem] leading-[1.08] sm:text-5xl font-semibold text-jade-deep">{title}</h2>
        {subtitle && <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">{subtitle}</p>}
        <LotusDivider className="mt-6" />
      </div>
    </motion.div>
  );
}
