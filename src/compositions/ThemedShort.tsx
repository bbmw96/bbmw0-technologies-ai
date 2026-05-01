import {
  AbsoluteFill,
  Audio,
  Series,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import React from "react";
import {
  THEMES,
  FONT_FAMILIES,
  FONT,
  MONO,
  type Beat,
  type Theme,
  type FontFamilyId,
} from "./themes";

// Generic 40-second themed short. Now supports:
//   - 12 themes
//   - 5 font families (override per render)
//   - 3 layout variants per beat kind
// Uniqueness combinations: 12 * 5 * (3^N beats) >> 1000 per Short.

export type ThemedShortProps = {
  themeId: keyof typeof THEMES;
  beats: Beat[];
  audioUrl?: string;
  audioVolume?: number;
  fontFamilyId?: FontFamilyId; // default "sans"
};

const fadeIn = (frame: number, fps: number) =>
  spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

type BeatCtx = { t: Theme; heading: string; body: string };

// ============== Title (3 variants) ==============
const TitleBeat: React.FC<{ b: Extract<Beat, { kind: "title" }>; ctx: BeatCtx }> = ({ b, ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = fadeIn(frame, fps);
  const c = fadeIn(frame - 12, fps);
  const d = fadeIn(frame - 24, fps);
  const v = b.variant ?? 1;
  const { t, heading, body } = ctx;
  const align: React.CSSProperties = v === 2
    ? { alignItems: "flex-start", textAlign: "left", padding: "0 80px" }
    : v === 3
    ? { alignItems: "flex-end", textAlign: "right", padding: "0 80px" }
    : { alignItems: "center", textAlign: "center", padding: 60 };
  const titleSize = v === 2 ? 96 : v === 3 ? 100 : 110;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex",
      flexDirection: "column", justifyContent: "center", ...align }}>
      {b.eyebrow && (
        <div style={{ fontFamily: heading, fontWeight: 800, fontSize: 30, color: t.accent,
          letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 28,
          opacity: a, transform: `translateY(${interpolate(a, [0, 1], [-18, 0])}px)` }}>
          {b.eyebrow}
        </div>
      )}
      <div style={{ fontFamily: heading, fontWeight: 900, fontSize: titleSize, color: t.text,
        letterSpacing: "-0.04em", lineHeight: 1.0, opacity: c,
        transform: `translateY(${interpolate(c, [0, 1], [40, 0])}px)`,
        textShadow: `0 0 60px ${t.glow}` }}>
        {b.text}
      </div>
      {b.sub && (
        <div style={{ fontFamily: body, fontWeight: 500, fontSize: 36, color: t.textDim,
          marginTop: 32, maxWidth: 800, lineHeight: 1.3, opacity: d }}>
          {b.sub}
        </div>
      )}
    </div>
  );
};

// ============== BigWord (3 variants) ==============
const BigWord: React.FC<{ b: Extract<Beat, { kind: "bigword" }>; ctx: BeatCtx }> = ({ b, ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 10, stiffness: 130 } });
  const v = b.variant ?? 1;
  const { t, heading } = ctx;
  const size = v === 2 ? 200 : v === 3 ? 180 : 240;
  const transform = v === 2
    ? `scale(${a}) rotate(${interpolate(a, [0, 1], [-4, 0])}deg)`
    : v === 3
    ? `translateY(${interpolate(a, [0, 1], [200, 0])}px)`
    : `scale(${a})`;
  const colour = v === 3 ? t.accent : t.text;
  return (
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 60 }}>
      <div style={{ fontFamily: heading, fontWeight: 900, fontSize: size, color: colour,
        letterSpacing: "-0.05em", lineHeight: 0.9, textAlign: "center",
        transform, textShadow: `0 0 80px ${t.glow}` }}>
        {b.text}
      </div>
    </div>
  );
};

// ============== Trio (3 variants) ==============
const Trio: React.FC<{ b: Extract<Beat, { kind: "trio" }>; ctx: BeatCtx }> = ({ b, ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = b.variant ?? 1;
  const { t, heading } = ctx;
  const stack: React.CSSProperties = v === 2
    ? { flexDirection: "row", gap: 12, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }
    : v === 3
    ? { flexDirection: "column", gap: 8, alignItems: "flex-start", padding: "0 80px" }
    : { flexDirection: "column", gap: 28, alignItems: "center" };
  const sizeFor = (i: number) => v === 2 ? 84 : v === 3 ? (i === 1 ? 130 : 100) : 110;
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex",
      justifyContent: "center", padding: 60, ...stack }}>
      {b.words.map((word, i) => {
        const a = spring({ frame: frame - i * 10, fps, config: { damping: 14, stiffness: 100 } });
        const dx = v === 2
          ? interpolate(a, [0, 1], [0, 0])
          : interpolate(a, [0, 1], [i % 2 === 0 ? -50 : 50, 0]);
        return (
          <div key={i} style={{ fontFamily: heading, fontWeight: 900, fontSize: sizeFor(i),
            color: i === 1 ? t.accent : t.text, letterSpacing: "-0.04em", lineHeight: 1.0,
            opacity: a, transform: `translateX(${dx}px)`,
            textShadow: i === 1 ? `0 0 50px ${t.glow}` : "none" }}>
            {word}
          </div>
        );
      })}
    </div>
  );
};

// ============== Stat (3 variants) ==============
const Stat: React.FC<{ b: Extract<Beat, { kind: "stat" }>; ctx: BeatCtx }> = ({ b, ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 8, stiffness: 130 } });
  const c = fadeIn(frame - 18, fps);
  const v = b.variant ?? 1;
  const { t, heading, body } = ctx;
  const numSize = v === 2 ? 260 : v === 3 ? 220 : 320;
  const labelOnTop = v === 2;
  const labelEl = (
    <div style={{ fontFamily: body, fontWeight: 700, fontSize: 44, color: t.text,
      marginTop: labelOnTop ? 0 : 36, marginBottom: labelOnTop ? 36 : 0,
      opacity: c, letterSpacing: "-0.01em", maxWidth: 800, lineHeight: 1.2 }}>
      {b.label}
    </div>
  );
  const numEl = (
    <div style={{ fontFamily: heading, fontWeight: 900, fontSize: numSize, color: t.accent,
      letterSpacing: "-0.05em", lineHeight: 0.85, transform: `scale(${a})`,
      textShadow: `0 0 80px ${t.glow}` }}>
      {b.number}
    </div>
  );
  const align = v === 3 ? "flex-start" : "center";
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex",
      flexDirection: "column", alignItems: align, justifyContent: "center",
      padding: 60, textAlign: align === "center" ? "center" : "left" }}>
      {labelOnTop && labelEl}
      {numEl}
      {!labelOnTop && labelEl}
    </div>
  );
};

// ============== List (3 variants) ==============
const List: React.FC<{ b: Extract<Beat, { kind: "list" }>; ctx: BeatCtx }> = ({ b, ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = fadeIn(frame, fps);
  const v = b.variant ?? 1;
  const { t, heading, body } = ctx;
  const dotShape: React.CSSProperties = v === 2
    ? { width: 22, height: 22, borderRadius: "50%" }
    : v === 3
    ? { width: 6, height: 36, borderRadius: 2 }
    : { width: 16, height: 16, borderRadius: 4 };
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex",
      flexDirection: "column", justifyContent: "center", padding: "0 80px" }}>
      <div style={{ fontFamily: heading, fontWeight: 900, fontSize: 76, color: t.text,
        letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 56, opacity: a,
        transform: `translateY(${interpolate(a, [0, 1], [-20, 0])}px)`,
        textAlign: v === 2 ? "center" : "left" }}>
        {b.heading}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28,
        alignItems: v === 2 ? "center" : "flex-start" }}>
        {b.items.map((item, i) => {
          const fade = spring({ frame: frame - 12 - i * 12, fps, config: { damping: 14, stiffness: 100 } });
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 24,
              opacity: fade, transform: `translateX(${interpolate(fade, [0, 1], [-40, 0])}px)` }}>
              <div style={{ ...dotShape, background: t.accent, boxShadow: `0 0 20px ${t.glow}`, flexShrink: 0 }} />
              <div style={{ fontFamily: body, fontWeight: 700, fontSize: 48, color: t.text,
                letterSpacing: "-0.01em", lineHeight: 1.2 }}>
                {item}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============== CTA (3 variants) ==============
const CTABeat: React.FC<{ b: Extract<Beat, { kind: "cta" }>; ctx: BeatCtx }> = ({ b, ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = fadeIn(frame, fps);
  const c = spring({ frame: frame - 18, fps, config: { damping: 14, stiffness: 100 } });
  const v = b.variant ?? 1;
  const { t, heading } = ctx;
  const monoFont = FONT_FAMILIES.mono.heading;
  const headlineSize = v === 2 ? 110 : v === 3 ? 120 : 130;
  const pillStyle: React.CSSProperties = v === 2
    ? { padding: "30px 50px", borderRadius: 60, background: t.accent, color: "#0a0a0a", fontWeight: 800 }
    : v === 3
    ? { padding: "20px 32px", border: `2px dashed ${t.accent}`, background: "transparent", color: t.text }
    : { padding: "26px 40px", background: t.surface, border: `3px solid ${t.accent}`, color: t.text, borderRadius: 22 };
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 60, textAlign: "center" }}>
      <div style={{ fontFamily: heading, fontWeight: 900, fontSize: headlineSize, color: t.text,
        letterSpacing: "-0.04em", lineHeight: 1, opacity: a,
        transform: `translateY(${interpolate(a, [0, 1], [40, 0])}px)` }}>
        {b.headline}
      </div>
      <div style={{ ...pillStyle, marginTop: 60, fontFamily: monoFont, fontSize: 36,
        opacity: c, transform: `scale(${c})`, boxShadow: `0 0 50px ${t.glow}`,
        wordBreak: "break-all", maxWidth: "100%" }}>
        {b.url}
      </div>
    </div>
  );
};

const BeatRenderer: React.FC<{ b: Beat; ctx: BeatCtx }> = ({ b, ctx }) => {
  switch (b.kind) {
    case "title":   return <TitleBeat b={b} ctx={ctx} />;
    case "bigword": return <BigWord b={b} ctx={ctx} />;
    case "trio":    return <Trio b={b} ctx={ctx} />;
    case "stat":    return <Stat b={b} ctx={ctx} />;
    case "list":    return <List b={b} ctx={ctx} />;
    case "cta":     return <CTABeat b={b} ctx={ctx} />;
  }
};

// ============== ThemedShort component ==============

export const ThemedShort: React.FC<ThemedShortProps> = ({
  themeId, beats, audioUrl, audioVolume = 0.45, fontFamilyId = "sans",
}) => {
  const theme = THEMES[themeId];
  const f = FONT_FAMILIES[fontFamilyId];
  const ctx: BeatCtx = { t: theme, heading: f.heading, body: f.body };

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <Series>
        {beats.map((b, i) => (
          <Series.Sequence key={i} durationInFrames={b.durationInFrames}>
            <BeatRenderer b={b} ctx={ctx} />
          </Series.Sequence>
        ))}
      </Series>
      {audioUrl && <Audio src={staticFile(audioUrl)} volume={audioVolume} />}
    </AbsoluteFill>
  );
};

// Backward-compat re-exports so existing imports keep working.
export { FONT, MONO };
