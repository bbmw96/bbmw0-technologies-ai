import {
  AbsoluteFill,
  Audio,
  Series,
  interpolate,

  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import React from "react";
import {
  MovingBackdrop, Grain, Vignette, ProgressBar, BeatDots, CutFlash, useDrift,
} from "./Cinematic";
import {
  KineticText, DepthField, DrawRule, Chip, CountUp, Sweep, snap, glide,
} from "./Kinetic";
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

type BeatCtx = { t: Theme; heading: string; body: string };

// ============== Title (3 variants) ==============
const TitleBeat: React.FC<{ b: Extract<Beat, { kind: "title" }>; ctx: BeatCtx }> = ({ b, ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = b.variant ?? 1;
  const { t, heading, body } = ctx;
  const centred = v !== 2;
  const size = v === 2 ? 92 : v === 3 ? 100 : 108;
  const sub = glide(frame, fps, 26);

  return (
    <AbsoluteFill style={{
      justifyContent: "center",
      alignItems: centred ? "center" : "flex-start",
      padding: centred ? "0 88px" : "0 88px 0 96px",
      textAlign: centred ? "center" : "left",
      gap: 30,
    }}>
      {b.eyebrow && <Chip t={t} font={heading}>{b.eyebrow}</Chip>}
      <KineticText text={b.text} t={t} font={heading} size={size}
        align={centred ? "center" : "left"} delay={8} gradient />
      <DrawRule t={t} delay={20} width={centred ? 260 : 200} />
      {b.sub && (
        <div style={{
          fontFamily: body, fontWeight: 500, fontSize: 36, color: t.textDim,
          maxWidth: 820, lineHeight: 1.32, opacity: sub,
          transform: `translateY(${interpolate(sub, [0, 1], [22, 0])}px)`,
        }}>
          {b.sub}
        </div>
      )}
    </AbsoluteFill>
  );
};

const BigWord: React.FC<{ b: Extract<Beat, { kind: "bigword" }>; ctx: BeatCtx }> = ({ b, ctx }) => {
  const v = b.variant ?? 1;
  const { t, heading } = ctx;
  const size = v === 2 ? 128 : v === 3 ? 116 : 140;
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 76px", textAlign: "center" }}>
      <Sweep t={t} />
      <KineticText text={b.text} t={t} font={heading} size={size}
        stagger={4} delay={4} gradient maxWidth={940} />
    </AbsoluteFill>
  );
};

const Trio: React.FC<{ b: Extract<Beat, { kind: "trio" }>; ctx: BeatCtx }> = ({ b, ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = b.variant ?? 1;
  const { t, heading } = ctx;
  const words = b.words || [];
  const size = v === 2 ? 96 : v === 3 ? 118 : 106;
  return (
    <AbsoluteFill style={{
      justifyContent: "center", alignItems: "center", padding: "0 76px", gap: 22,
    }}>
      {words.map((w, i) => {
        const a = snap(frame, fps, 6 + i * 11);
        const dir = i % 2 === 0 ? -1 : 1;
        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 20,
            opacity: a,
            transform: `translateX(${interpolate(a, [0, 1], [dir * 90, 0])}px)`,
          }}>
            <div style={{
              width: 14, height: 14, borderRadius: 7,
              background: i === 1 ? t.accent2 : t.accent,
              boxShadow: `0 0 20px ${t.glow}`,
            }} />
            <span style={{
              fontFamily: heading, fontWeight: 900,
              fontSize: i === 1 ? size * 1.14 : size,
              color: i === 1 ? t.accent : t.text,
              letterSpacing: "-0.04em",
              textShadow: `0 0 ${size * 0.3}px ${t.glow}`,
            }}>
              {w}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Stat: React.FC<{ b: Extract<Beat, { kind: "stat" }>; ctx: BeatCtx }> = ({ b, ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const v = b.variant ?? 1;
  const { t, heading, body } = ctx;
  const size = v === 2 ? 230 : v === 3 ? 200 : 260;
  const lab = glide(frame, fps, 28);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 76px", textAlign: "center", gap: 26 }}>
      <Sweep t={t} />
      <CountUp value={String(b.number)} t={t} font={heading} size={size} delay={4} />
      <DrawRule t={t} delay={22} width={200} />
      {b.label && (
        <div style={{
          fontFamily: body, fontWeight: 600, fontSize: 42, color: t.textDim,
          maxWidth: 780, lineHeight: 1.28, opacity: lab,
          transform: `translateY(${interpolate(lab, [0, 1], [24, 0])}px)`,
        }}>
          {b.label}
        </div>
      )}
    </AbsoluteFill>
  );
};

const List: React.FC<{ b: Extract<Beat, { kind: "list" }>; ctx: BeatCtx }> = ({ b, ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { t, heading, body } = ctx;
  const items = b.items || [];
  return (
    <AbsoluteFill style={{ justifyContent: "center", padding: "0 80px", gap: 34 }}>
      {b.heading && <Chip t={t} font={heading}>{b.heading}</Chip>}
      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {items.map((it, i) => {
          const a = snap(frame, fps, 14 + i * 8);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 26,
              opacity: a,
              transform: `translateX(${interpolate(a, [0, 1], [-64, 0])}px)`,
            }}>
              <div style={{
                minWidth: 76, height: 76, borderRadius: 20,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: `linear-gradient(135deg, ${t.accent}, ${t.accent2})`,
                boxShadow: `0 0 34px ${t.glow}`,
                fontFamily: heading, fontWeight: 900, fontSize: 38, color: "#0b0b12",
              }}>
                {i + 1}
              </div>
              <div style={{
                fontFamily: body, fontWeight: 650, fontSize: 46, color: t.text,
                lineHeight: 1.18, letterSpacing: "-0.02em",
              }}>
                {it}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const CTABeat: React.FC<{ b: Extract<Beat, { kind: "cta" }>; ctx: BeatCtx }> = ({ b, ctx }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { t, heading, body } = ctx;
  const url = glide(frame, fps, 24);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 76px", textAlign: "center", gap: 30 }}>
      <KineticText text={b.headline} t={t} font={heading} size={104} delay={4} gradient maxWidth={880} />
      <DrawRule t={t} delay={18} width={240} />
      {b.url && (
        <div style={{
          fontFamily: body, fontWeight: 700, fontSize: 34, color: t.textDim,
          letterSpacing: "0.02em", opacity: url,
          transform: `translateY(${interpolate(url, [0, 1], [20, 0])}px)`,
          padding: "14px 30px", borderRadius: 999,
          border: `2px solid ${t.border}`, background: t.surface,
        }}>
          {b.url}
        </div>
      )}
    </AbsoluteFill>
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
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      <CinematicShell theme={theme} beats={beats} ctx={ctx} />
      {audioUrl && <Audio src={staticFile(audioUrl)} volume={audioVolume} />}
    </AbsoluteFill>
  );
};

/**
 * Wraps the beat series in the shared cinematic layer.
 *
 * Split into its own component because useDrift calls useVideoConfig, which
 * must run inside the composition. Layer order matters: backdrop, then the
 * content, then grain, vignette and chrome on top, so texture sits OVER the
 * type rather than under it.
 */
const CinematicShell: React.FC<{
  theme: Theme;
  beats: Beat[];
  ctx: BeatCtx;
}> = ({ theme, beats, ctx }) => {
  const { scale, x, y, progress } = useDrift();
  const frame = useCurrentFrame();

  // Which beat is on screen, for the orientation dots.
  let acc = 0;
  let current = 0;
  for (let i = 0; i < beats.length; i++) {
    acc += beats[i].durationInFrames;
    current = i;
    if (frame < acc) break;
  }

  return (
    <>
      <MovingBackdrop t={theme} />
      <DepthField t={theme} seed={beats.length} />
      <AbsoluteFill style={{ transform: `scale(${scale}) translate(${x}px, ${y}px)` }}>
        <Series>
          {beats.map((b, i) => (
            <Series.Sequence key={i} durationInFrames={b.durationInFrames}>
              <AbsoluteFill>
                <BeatRenderer b={b} ctx={ctx} />
                <CutFlash t={theme} />
              </AbsoluteFill>
            </Series.Sequence>
          ))}
        </Series>
      </AbsoluteFill>
      <Vignette />
      <Grain />
      <BeatDots t={theme} total={beats.length} current={current} />
      <ProgressBar t={theme} progress={progress} />
    </>
  );
};

// Backward-compat re-exports so existing imports keep working.
export { FONT, MONO };
