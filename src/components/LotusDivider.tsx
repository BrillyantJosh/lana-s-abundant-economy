interface Props {
  className?: string;
  /** wider rule with a larger lotus — used between page sections */
  large?: boolean;
}

/** A lotus bud between two fading gold hairlines. */
export default function LotusDivider({ className = "", large = false }: Props) {
  const w = large ? "w-12 h-8" : "w-8 h-5";
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden="true">
      <span className={`h-px ${large ? "w-32 sm:w-56" : "w-16 sm:w-24"} bg-gradient-to-l from-gold/70 to-transparent`} />
      <LotusGlyph className={`${w} text-gold`} />
      <span className={`h-px ${large ? "w-32 sm:w-56" : "w-16 sm:w-24"} bg-gradient-to-r from-gold/70 to-transparent`} />
    </div>
  );
}

export function LotusGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" className={className} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" aria-hidden="true">
      <path d="M32 36 C 26 28, 26 14, 32 4 C 38 14, 38 28, 32 36 Z" fill="currentColor" fillOpacity={0.12} />
      <path d="M32 36 C 22 32, 12 22, 10 10 C 20 12, 28 22, 32 36 Z" fill="currentColor" fillOpacity={0.08} />
      <path d="M32 36 C 42 32, 52 22, 54 10 C 44 12, 36 22, 32 36 Z" fill="currentColor" fillOpacity={0.08} />
      <path d="M32 36 C 18 36, 6 30, 2 22 C 12 22, 24 28, 32 36 Z" />
      <path d="M32 36 C 46 36, 58 30, 62 22 C 52 22, 40 28, 32 36 Z" />
    </svg>
  );
}
