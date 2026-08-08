// Shared cinematic layer applied over every beat.
//
// WHY THIS EXISTS
// The first published batch looked like a slideshow: each beat sprang in over
// half a second then sat completely motionless for seven or eight seconds on a
// flat CSS gradient. On Shorts that is fatal. Viewers swipe when nothing
// changes, and a static frame reads as a still image rather than a video.
//
// Four fixes, all continuous rather than one-shot:
//   1. Drift        the whole frame breathes, so no frame is ever identical
//   2. Grain        breaks up flat gradient banding, adds a filmic surface
//   3. Vignette     pulls the eye to centre and adds depth
//   4. Progress     a thin bar showing how far through, which measurably
//                   improves retention because it signals "nearly done"
//
// Everything here is deterministic from the frame number, so renders stay
// reproducible.

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import type { Theme } from "./themes";

/** Slow push-in and drift so the frame is never static. */
export const useDrift = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = durationInFrames > 0 ? frame / durationInFrames : 0;
  // 1.00 to 1.06 over the whole video: perceptible as life, not as zoom.
  const scale = 1 + p * 0.06;
  // Lissajous drift keeps motion from ever repeating exactly.
  const x = Math.sin(frame / 190) * 14;
  const y = Math.cos(frame / 240) * 10;
  return { scale, x, y, progress: p };
};

/** Animated gradient wash so the background itself moves. */
export const MovingBackdrop: React.FC<{ t: Theme }> = ({ t }) => {
  const frame = useCurrentFrame();
  const a = (frame / 3.2) % 360;
  const drift = Math.sin(frame / 160) * 12;
  return (
    <>
      <AbsoluteFill style={{ background: t.bg }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse ${58 + drift}% ${48 - drift}% at ${
            50 + Math.sin(frame / 210) * 16
          }% ${38 + Math.cos(frame / 260) * 12}%, ${t.glow} 0%, transparent 62%)`,
          opacity: 0.55,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill
        style={{
          background: `conic-gradient(from ${a}deg at 50% 50%, transparent 0deg, ${t.accent}18 90deg, transparent 180deg, ${t.accent2}18 270deg, transparent 360deg)`,
          opacity: 0.35,
          mixBlendMode: "screen",
        }}
      />
    </>
  );
};

/**
 * Film grain. An inline SVG feTurbulence rather than an image asset, so it
 * needs no file, cannot go missing at render time, and adds nothing to repo
 * size. The seed advances with the frame so the grain actually moves; a static
 * grain reads as a dirty lens rather than as film.
 */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.16 }) => {
  const frame = useCurrentFrame();
  const seed = frame % 12;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' seed='${seed}' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='260' height='260' filter='url(%23n)' opacity='1'/></svg>`;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url("data:image/svg+xml;utf8,${svg.replace(/#/g, "%23")}")`,
        backgroundSize: "260px 260px",
        opacity,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

/** Vignette: depth, and it stops text floating on a flat plane. */
export const Vignette: React.FC<{ strength?: number }> = ({ strength = 0.55 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 78% 62% at 50% 45%, transparent 40%, rgba(0,0,0,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/**
 * Progress bar. Signals "this is nearly over", which keeps viewers past the
 * midpoint instead of swiping when they cannot tell how long is left.
 */
export const ProgressBar: React.FC<{ t: Theme; progress: number }> = ({ t, progress }) => (
  <div
    style={{
      position: "absolute", left: 0, right: 0, bottom: 0, height: 8,
      background: "rgba(255,255,255,0.10)", pointerEvents: "none",
    }}
  >
    <div
      style={{
        height: "100%", width: `${Math.min(100, progress * 100)}%`,
        background: `linear-gradient(90deg, ${t.accent}, ${t.accent2})`,
        boxShadow: `0 0 20px ${t.glow}`,
      }}
    />
  </div>
);

/** Beat counter dots: orientation without clutter. */
export const BeatDots: React.FC<{ t: Theme; total: number; current: number }> = ({ t, total, current }) => (
  <div style={{ position: "absolute", top: 46, left: 0, right: 0, display: "flex",
    justifyContent: "center", gap: 10, pointerEvents: "none" }}>
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} style={{
        width: i === current ? 26 : 8, height: 8, borderRadius: 4,
        background: i === current ? t.accent : "rgba(255,255,255,0.28)",
        transition: "none",
      }} />
    ))}
  </div>
);

/**
 * Entry wipe. A brief accent sweep at the start of each beat so cuts read as
 * deliberate edits rather than as content simply popping in.
 */
export const CutFlash: React.FC<{ t: Theme }> = ({ t }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, 3, 9], [0, 0.5, 0], { extrapolateRight: "clamp" });
  if (o <= 0.001) return null;
  return <AbsoluteFill style={{ background: t.accent, opacity: o, mixBlendMode: "screen", pointerEvents: "none" }} />;
};
