// Niche motifs — real, purpose-drawn line-art silhouettes, one per topic
// niche, used in place of the generic circle/square shapes the background
// Drift layer used before. Added 1 Sep 2026, in direct response to feedback
// that the reels read as "words on shapes" with no real visual content.
//
// Deliberately outline-only, no fill: same constraint the shapes they
// replace always had, since this sits behind 100px+ type and must never
// compete with a word for attention. Every path lives in a 0-100 viewBox so
// it can be sized and positioned exactly like the shapes it replaces.
//
// This is free and unlimited: pure SVG, no generation cost, runs at the
// full publishing cadence. It is not a substitute for real photographic or
// illustrated imagery — see VISUAL-DIRECTION-BRIEF.md for that half of the
// gap and why it is budget-gated (three one-time free generations across
// every connected image/video tool as of 1 Sep 2026) rather than code-gated.
// This raises the floor for every video at zero cost; it does not close the
// gap with a fully imagery-led reference on its own.
//
// Each shape is built from plain SVG primitives (rect, circle, ellipse, line,
// short paths) rather than freehand illustration, on purpose: this file was
// written and reviewed without a working Remotion render available this
// session (Desktop Commander was down), so every path favours geometry that
// is easy to verify correct by reading it over a curve that is easy to get
// subtly wrong unseen. This still needs an actual render-and-watch pass
// before being treated as finished — see the commit message and the
// director report for what is and is not confirmed.

import React from "react";

export type Niche =
  | "tech" | "app" | "productivity" | "science" | "history"
  | "animals" | "space" | "biology" | "food" | "weather"
  | "gaming" | "ai";

const paths: Record<Niche, React.ReactNode> = {
  // Chip: body, inner die, and pins on all four sides.
  tech: (
    <>
      <rect x="30" y="30" width="40" height="40" rx="6" />
      <rect x="42" y="42" width="16" height="16" rx="2" />
      <line x1="40" y1="30" x2="40" y2="18" />
      <line x1="50" y1="30" x2="50" y2="18" />
      <line x1="60" y1="30" x2="60" y2="18" />
      <line x1="40" y1="70" x2="40" y2="82" />
      <line x1="50" y1="70" x2="50" y2="82" />
      <line x1="60" y1="70" x2="60" y2="82" />
      <line x1="30" y1="40" x2="18" y2="40" />
      <line x1="30" y1="50" x2="18" y2="50" />
      <line x1="30" y1="60" x2="18" y2="60" />
      <line x1="70" y1="40" x2="82" y2="40" />
      <line x1="70" y1="50" x2="82" y2="50" />
      <line x1="70" y1="60" x2="82" y2="60" />
    </>
  ),
  // App tile: rounded square icon, a notification badge, two UI bars.
  app: (
    <>
      <rect x="22" y="22" width="56" height="56" rx="14" />
      <circle cx="72" cy="28" r="6" />
      <line x1="34" y1="55" x2="66" y2="55" />
      <line x1="34" y1="65" x2="54" y2="65" />
    </>
  ),
  // Checklist: three rows, two ticked, one open.
  productivity: (
    <>
      <rect x="24" y="26" width="10" height="10" rx="2" />
      <path d="M25,31 L29,35 L36,25" />
      <line x1="42" y1="31" x2="78" y2="31" />
      <rect x="24" y="46" width="10" height="10" rx="2" />
      <line x1="42" y1="51" x2="72" y2="51" />
      <rect x="24" y="66" width="10" height="10" rx="2" />
      <path d="M25,71 L29,75 L36,65" />
      <line x1="42" y1="71" x2="76" y2="71" />
    </>
  ),
  // Flask: neck, rounded conical body, a liquid line and one bubble.
  science: (
    <>
      <line x1="46" y1="18" x2="46" y2="38" />
      <line x1="54" y1="18" x2="54" y2="38" />
      <line x1="42" y1="18" x2="58" y2="18" />
      <path d="M46,38 L34,72 Q50,82 66,72 L54,38" />
      <line x1="38" y1="62" x2="62" y2="62" />
      <circle cx="50" cy="52" r="3" />
    </>
  ),
  // Hourglass: two triangles meeting at the waist, capped top and bottom.
  history: (
    <>
      <line x1="28" y1="20" x2="72" y2="20" />
      <path d="M32,20 L68,20 L50,50 Z" />
      <path d="M32,80 L68,80 L50,50 Z" />
      <line x1="28" y1="80" x2="72" y2="80" />
    </>
  ),
  // Paw print: one large pad, four toes.
  animals: (
    <>
      <ellipse cx="50" cy="62" rx="18" ry="14" />
      <ellipse cx="30" cy="38" rx="7" ry="9" />
      <ellipse cx="43" cy="27" rx="7" ry="9" />
      <ellipse cx="57" cy="27" rx="7" ry="9" />
      <ellipse cx="70" cy="38" rx="7" ry="9" />
    </>
  ),
  // Ringed planet, tilted, with two small sparkle stars nearby.
  space: (
    <>
      <circle cx="50" cy="50" r="18" />
      <ellipse cx="50" cy="50" rx="34" ry="10" transform="rotate(-18 50 50)" />
      <path d="M78,20 L82,20 M80,18 L80,22" />
      <path d="M18,74 L22,74 M20,72 L20,76" />
    </>
  ),
  // Leaf: outline, centre vein, two pairs of side veins.
  biology: (
    <>
      <path d="M50,15 Q75,35 65,60 Q55,85 50,85 Q45,85 35,60 Q25,35 50,15 Z" />
      <line x1="50" y1="20" x2="50" y2="82" />
      <line x1="50" y1="40" x2="38" y2="30" />
      <line x1="50" y1="40" x2="62" y2="30" />
      <line x1="50" y1="58" x2="40" y2="50" />
      <line x1="50" y1="58" x2="60" y2="50" />
    </>
  ),
  // Bowl with three wisps of steam.
  food: (
    <>
      <path d="M25,60 Q50,85 75,60" />
      <line x1="25" y1="60" x2="75" y2="60" />
      <path d="M38,50 Q34,42 38,34 Q42,26 38,18" />
      <path d="M50,50 Q46,42 50,34 Q54,26 50,18" />
      <path d="M62,50 Q58,42 62,34 Q66,26 62,18" />
    </>
  ),
  // Cloud with three rain lines.
  weather: (
    <>
      <path d="M28,58 Q22,58 22,50 Q22,42 30,42 Q32,32 44,32 Q54,32 57,40 Q68,40 68,50 Q68,58 60,58 Z" />
      <line x1="34" y1="66" x2="30" y2="76" />
      <line x1="48" y1="66" x2="44" y2="76" />
      <line x1="62" y1="66" x2="58" y2="76" />
    </>
  ),
  // Game controller: body, d-pad, two face buttons.
  gaming: (
    <>
      <path d="M22,50 Q22,36 38,36 L62,36 Q78,36 78,50 Q78,68 66,68 Q60,68 58,58 L42,58 Q40,68 34,68 Q22,68 22,50 Z" />
      <line x1="34" y1="44" x2="34" y2="54" />
      <line x1="29" y1="49" x2="39" y2="49" />
      <circle cx="62" cy="44" r="3" />
      <circle cx="70" cy="50" r="3" />
    </>
  ),
  // Spark plus a small radiating node, standing in for "AI" without a logo.
  ai: (
    <>
      <path d="M50,18 Q53,42 74,46 Q53,50 50,74 Q47,50 26,46 Q47,42 50,18 Z" />
      <circle cx="76" cy="76" r="4" />
      <line x1="76" y1="66" x2="76" y2="72" />
      <line x1="66" y1="76" x2="72" y2="76" />
      <line x1="83" y1="69" x2="79" y2="73" />
    </>
  ),
};

const ORDER: Niche[] = [
  "tech", "app", "productivity", "science", "history",
  "animals", "space", "biology", "food", "weather", "gaming", "ai",
];

const KNOWN = new Set<string>(ORDER);

/** Resolve any incoming niche string to a known motif, falling back to
 *  "tech" so a missing or unrecognised niche never renders a blank frame. */
export const resolveNiche = (n?: string): Niche =>
  n && KNOWN.has(n) ? (n as Niche) : "tech";

/** Second motif for a niche, used for the smaller background plane so two
 *  different niches never look identical even before colour is applied.
 *  Picked deterministically (next in a fixed order) rather than randomly,
 *  so the same niche always pairs with the same second shape across every
 *  video on that channel, which matters for the channel reading as a set. */
export const secondaryNiche = (n: Niche): Niche =>
  ORDER[(ORDER.indexOf(n) + 1) % ORDER.length];

export const Motif: React.FC<{
  niche: Niche; size: number; colour: string; strokeWidth?: number;
}> = ({ niche, size, colour, strokeWidth = 2.4 }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden style={{ display: "block" }}>
    <g fill="none" stroke={colour} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {paths[niche]}
    </g>
  </svg>
);

export default Motif;
