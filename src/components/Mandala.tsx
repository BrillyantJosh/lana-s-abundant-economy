import type { CSSProperties } from "react";

interface MandalaProps {
  className?: string;
  style?: CSSProperties;
  /** slow clockwise rotation (default), 'reverse', or false for a still ornament */
  spin?: boolean | "reverse";
  strokeWidth?: number;
}

const C = 200;

/** Repeat a path `count` times around the centre, optionally offset by half a step. */
function ring(count: number, d: string, offsetDeg = 0, opacity = 1) {
  return Array.from({ length: count }, (_, i) => (
    <path key={i} d={d} opacity={opacity} transform={`rotate(${(360 / count) * i + offsetDeg} ${C} ${C})`} />
  ));
}

function dots(count: number, r: number, size: number, offsetDeg = 0) {
  return Array.from({ length: count }, (_, i) => {
    const a = ((360 / count) * i + offsetDeg) * (Math.PI / 180);
    return <circle key={i} cx={C + r * Math.sin(a)} cy={C - r * Math.cos(a)} r={size} />;
  });
}

/**
 * Procedural line-art mandala. Colour comes from `currentColor`, so set it
 * with a text-* class; keep the opacity low — it is an ornament, not a subject.
 */
export default function Mandala({ className = "", style, spin = true, strokeWidth = 1 }: MandalaProps) {
  const spinClass = spin === "reverse" ? "mandala-spin-reverse" : spin ? "mandala-spin" : "";
  return (
    <svg
      viewBox="0 0 400 400"
      className={`${spinClass} ${className}`}
      style={style}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* outer rings */}
      <circle cx={C} cy={C} r={194} strokeWidth={strokeWidth * 0.9} />
      <circle cx={C} cy={C} r={188} strokeWidth={strokeWidth * 0.5} />
      {/* 24 slender outer petals (r 186 → 140) */}
      {ring(24, "M200 14 C 210 32, 210 48, 200 60 C 190 48, 190 32, 200 14 Z")}
      {/* 16 broad petals (r 134 → 62) */}
      {ring(16, "M200 66 C 224 84, 224 120, 200 138 C 176 120, 176 84, 200 66 Z")}
      {/* thin ribs and small leaves in the gaps between the broad petals */}
      {ring(16, "M200 72 L200 132", 11.25, 0.35)}
      {ring(16, "M200 44 C 206 52, 206 62, 200 68 C 194 62, 194 52, 200 44 Z", 11.25)}
      {/* inner rings */}
      <circle cx={C} cy={C} r={62} />
      <circle cx={C} cy={C} r={58} strokeWidth={strokeWidth * 0.5} />
      {/* 12 inner lotus petals (r 56 → 22) */}
      {ring(12, "M200 144 C 213 152, 213 170, 200 178 C 187 170, 187 152, 200 144 Z")}
      {/* seed dots */}
      <g fill="currentColor" stroke="none" opacity={0.8}>
        {dots(24, 120, 1.6, 7.5)}
        {dots(12, 40, 1.4, 15)}
      </g>
      {/* heart of the flower */}
      <circle cx={C} cy={C} r={18} />
      <circle cx={C} cy={C} r={13} strokeWidth={strokeWidth * 0.6} />
      {ring(8, "M200 186 C 205 190, 205 197, 200 200 C 195 197, 195 190, 200 186 Z")}
      <circle cx={C} cy={C} r={2.4} fill="currentColor" stroke="none" />
    </svg>
  );
}
