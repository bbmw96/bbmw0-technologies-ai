// Kinetic typography and depth layers.
//
// The first pass (Cinematic.tsx) fixed the worst problem: nothing moved. This
// goes further, because "not static" is not the same as "well made". Four
// things separate amateur motion graphics from professional:
//
//   1. Type animates per WORD, not as a block. Block fades read as PowerPoint.
//   2. Depth. Foreground, midground and background move at different rates,
//      which is what makes a flat screen feel like a space.
//   3. Easing. Linear and default springs feel mechanical. Real motion
//      overshoots slightly and settles.
//   4. Type treatment. Flat fills look like a slide; gradient fills with an
//      inner glow and a subtle stroke look designed.

import React from "react";
import {
  AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Easing,
} from "remotion";
import type { Theme } from "./themes";

/** Overshoot-and-settle. Reads as intentional rather than mechanical. */
export const snap = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 180, mass: 0.6 } });

/** Slow, heavy entrance for large display type. */
export const glide = (frame: number, fps: number, delay = 0) =>
  spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 90, mass: 1.1 } });

/**
 * Per-word entrance with a stagger.
 *
 * Each word rises, unblurs and settles on its own delay. This is the single
 * biggest difference between "text appeared" and "text was animated": the eye
 * tracks the cascade and reads along with it.
 */
export const KineticText: React.FC<{
  text: string;
  t: Theme;
  font: string;
  size: number;
  weight?: number;
  stagger?: number;
  delay?: number;
  gradient?: boolean;
  align?: "left" | "center" | "right";
  maxWidth?: number;
}> = ({
  text, t, font, size, weight = 900, stagger = 3, delay = 0,
  gradient = false, align = "center", maxWidth = 900,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = String(text || "").split(/\s+/).filter(Boolean);

  return (
    <div style={{
      display: "flex", flexWrap: "wrap", gap: `${size * 0.16}px ${size * 0.26}px`,
      justifyContent: align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start",
      maxWidth, lineHeight: 1.02,
    }}>
      {words.map((w, i) => {
        const a = snap(frame, fps, delay + i * stagger);
        // Blur-in costs almost nothing and adds a lot of perceived polish.
        const blur = interpolate(a, [0, 1], [14, 0], { extrapolateRight: "clamp" });
        const y = interpolate(a, [0, 1], [size * 0.55, 0]);
        const scale = interpolate(a, [0, 1], [0.86, 1]);
        return (
          <span key={i} style={{
            fontFamily: font, fontWeight: weight, fontSize: size,
            letterSpacing: "-0.035em", display: "inline-block",
            opacity: Math.min(1, a * 1.15),
            transform: `translateY(${y}px) scale(${scale})`,
            filter: `blur(${blur}px)`,
            ...(gradient
              ? {
                  background: `linear-gradient(135deg, ${t.text} 0%, ${t.accent} 55%, ${t.accent2} 100%)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }
              : { color: t.text }),
            textShadow: gradient ? "none" : `0 0 ${size * 0.35}px ${t.glow}`,
          }}>
            {w}
          </span>
        );
      })}
    </div>
  );
};

/**
 * Parallax depth field.
 *
 * Soft blurred orbs at three depths moving at different speeds. This is what
 * stops a gradient reading as flat card stock: the eye picks up the relative
 * motion and infers space, even though nothing is literally 3D.
 */
export const DepthField: React.FC<{ t: Theme; seed?: number }> = ({ t, seed = 1 }) => {
  const frame = useCurrentFrame();
  const layers = [
    { n: 3, size: 620, blur: 90, speed: 0.10, opacity: 0.30, colour: t.accent },
    { n: 4, size: 380, blur: 60, speed: 0.22, opacity: 0.24, colour: t.accent2 },
    { n: 5, size: 190, blur: 34, speed: 0.40, opacity: 0.18, colour: t.text },
  ];
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {layers.map((L, li) =>
        Array.from({ length: L.n }).map((_, i) => {
          const k = seed * 7 + li * 13 + i * 29;
          const x = 50 + Math.sin((frame * L.speed + k * 11) / 60) * (26 + li * 6);
          const y = 45 + Math.cos((frame * L.speed + k * 17) / 74) * (30 + li * 5);
          const s = 1 + Math.sin((frame * L.speed + k) / 90) * 0.14;
          return (
            <div key={`${li}-${i}`} style={{
              position: "absolute",
              left: `${x}%`, top: `${y}%`,
              width: L.size, height: L.size, marginLeft: -L.size / 2, marginTop: -L.size / 2,
              borderRadius: "50%", background: L.colour, opacity: L.opacity,
              filter: `blur(${L.blur}px)`, transform: `scale(${s})`,
              mixBlendMode: "screen",
            }} />
          );
        })
      )}
    </AbsoluteFill>
  );
};

/** Thin accent rule that draws itself. Cheap, and reads as designed. */
export const DrawRule: React.FC<{ t: Theme; delay?: number; width?: number }> = ({
  t, delay = 0, width = 220,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = glide(frame, fps, delay);
  return (
    <div style={{
      height: 6, width: interpolate(a, [0, 1], [0, width]), borderRadius: 3,
      background: `linear-gradient(90deg, ${t.accent}, ${t.accent2})`,
      boxShadow: `0 0 24px ${t.glow}`,
    }} />
  );
};

/**
 * Eyebrow chip. Small framed label above a headline.
 * Gives the composition a hierarchy instead of one flat text size.
 */
export const Chip: React.FC<{ children: React.ReactNode; t: Theme; font: string; delay?: number }> = ({
  children, t, font, delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = snap(frame, fps, delay);
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 12,
      padding: "12px 26px", borderRadius: 999,
      border: `2px solid ${t.accent}55`, background: `${t.accent}18`,
      backdropFilter: "blur(8px)",
      opacity: a, transform: `translateY(${interpolate(a, [0, 1], [-24, 0])}px)`,
    }}>
      <div style={{ width: 10, height: 10, borderRadius: 5, background: t.accent,
        boxShadow: `0 0 14px ${t.accent}` }} />
      <span style={{ fontFamily: font, fontWeight: 800, fontSize: 30, letterSpacing: "0.14em",
        textTransform: "uppercase", color: t.text }}>
        {children}
      </span>
    </div>
  );
};

/**
 * Counts up to a number rather than cutting to it. A static figure is ignored;
 * a moving one holds the eye for the second or so it takes to land.
 */
export const CountUp: React.FC<{
  value: string; t: Theme; font: string; size: number; delay?: number;
}> = ({ value, t, font, size, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = interpolate(spring({ frame: frame - delay, fps, config: { damping: 26, stiffness: 70 } }),
    [0, 1], [0, 1]);

  // Animate only the leading numeric run, so "3,000 years" and "88" both work
  // and any prefix or suffix is preserved exactly.
  const m = String(value).match(/^([^\d]*)([\d,.]+)(.*)$/s);
  let shown = String(value);
  if (m) {
    const [, pre, num, post] = m;
    const target = Number(num.replace(/,/g, ""));
    if (Number.isFinite(target)) {
      const cur = Math.round(target * a);
      shown = `${pre}${cur.toLocaleString("en-GB")}${post}`;
    }
  }
  const pop = interpolate(a, [0, 0.85, 1], [0.9, 1.03, 1]);
  return (
    <div style={{
      fontFamily: font, fontWeight: 900, fontSize: size, color: t.text,
      letterSpacing: "-0.05em", transform: `scale(${pop})`,
      textShadow: `0 0 ${size * 0.4}px ${t.glow}`,
      fontVariantNumeric: "tabular-nums",
    }}>
      {shown}
    </div>
  );
};

/** Scanline sweep. One pass per beat, adds a sense of a live display. */
export const Sweep: React.FC<{ t: Theme }> = ({ t }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const p = interpolate(frame, [0, Math.max(1, durationInFrames * 0.55)], [-0.3, 1.3], {
    extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
  });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      <div style={{
        position: "absolute", left: 0, right: 0, top: `${p * 100}%`, height: 240,
        background: `linear-gradient(180deg, transparent, ${t.accent}22, transparent)`,
        filter: "blur(22px)",
      }} />
    </AbsoluteFill>
  );
};
