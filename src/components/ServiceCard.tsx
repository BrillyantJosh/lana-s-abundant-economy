import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Mandala from "./Mandala";

interface Props {
  index: number;
  icon: React.ReactNode;
  name: string;
  domain: string;
  href: string;
  tag: string;
  desc: string;
  bullets: string[];
  cta: string;
  tone?: "jade" | "gold" | "lotus";
}

const TONES = {
  jade: { ring: "border-jade/40 text-jade-deep bg-jade/10", bar: "from-transparent via-jade/60 to-transparent" },
  gold: { ring: "border-gold/50 text-gold-deep bg-gold/10", bar: "from-transparent via-gold/80 to-transparent" },
  lotus: { ring: "border-lotus-deep/40 text-[hsl(352_40%_40%)] bg-lotus/30", bar: "from-transparent via-lotus-deep/60 to-transparent" },
};

export default function ServiceCard({ index, icon, name, domain, href, tag, desc, bullets, cta, tone = "jade" }: Props) {
  const t = TONES[tone];
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: index * 0.12, ease: "easeOut" }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[1.6rem] glass card-frame p-7 sm:p-8 transition-transform duration-500 hover:-translate-y-1.5"
    >
      <Mandala className="pointer-events-none absolute -right-16 -top-16 w-56 text-gold opacity-[0.07] transition-opacity duration-700 group-hover:opacity-[0.14]" spin={false} />
      <div className={`absolute inset-x-10 top-[7px] h-px bg-gradient-to-r ${t.bar}`} />

      <div className="relative flex items-start gap-4">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${t.ring} shadow-[0_10px_24px_-14px_rgba(30,60,45,.7)]`}>
          {icon}
        </span>
        <div className="flex min-h-[3.5rem] min-w-0 flex-col justify-center">
          <h3 className="font-display text-2xl font-semibold leading-tight text-jade-deep sm:text-[1.55rem] lg:text-[1.7rem]">{name}</h3>
          <a href={href} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-block font-body text-[11px] font-bold uppercase tracking-[0.22em] text-gold-deep/90 hover:text-gold-deep">
            {domain}
          </a>
        </div>
      </div>

      <p className="relative mt-5 font-display text-xl italic text-jade-deep/90 leading-snug">{tag}</p>
      <p className="relative mt-3 text-[15px] leading-relaxed text-foreground/80">{desc}</p>

      <ul className="relative mt-5 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/85">
            <svg viewBox="0 0 16 16" className="mt-[5px] h-3 w-3 shrink-0 text-gold" fill="currentColor" aria-hidden="true">
              <path d="M8 1 C 9.5 4, 9.5 8, 8 11 C 6.5 8, 6.5 4, 8 1 Z" />
              <path d="M8 11 C 5 10.5, 2.5 8, 2 5 C 4.5 5.5, 7 8, 8 11 Z" opacity={0.7} />
              <path d="M8 11 C 11 10.5, 13.5 8, 14 5 C 11.5 5.5, 9 8, 8 11 Z" opacity={0.7} />
            </svg>
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="relative mt-auto pt-7">
        <a href={href} target="_blank" rel="noopener noreferrer" className="link-arrow text-[15px]">
          {cta}
          <ArrowUpRight className="h-4 w-4" />
        </a>
      </div>
    </motion.article>
  );
}
