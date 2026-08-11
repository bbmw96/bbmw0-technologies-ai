// Editorial Reel — the first archetype of the visual rebuild.
//
// WHY THIS EXISTS
// The existing ThemedShort renders every beat as centred text floating on a
// soft radial blur. Preview stills showed the result: content occupies a band
// across the middle and roughly three quarters of a 1080x1920 frame is empty
// gradient. Twelve videos shipped that way, differing only in hue, which is
// why they read as one video posted repeatedly.
//
// The rules this composition follows, all of them reactions to what the
// stills actually showed:
//
//   1. FILL THE FRAME. Type is set to the edges with a hard margin, not
//      centred in a void. Nothing floats.
//   2. FLAT COLOUR, NO GLOW. Structure comes from blocks, rules and scale,
//      not from a blurred light source. Flat colour also compresses well,
//      which is half the reason the old output looked soft.
//   3. HARD CUTS. Beats snap. No cross-fade, because a fade on a 5-second
//      beat reads as lag on a phone.
//   4. ONE IDEA PER BEAT, and the idea is a real fact, never filler.
//
// Content comes entirely from props, so nothing here invents a number.

import React from "react";
import {
  AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, interpolate, spring, Audio, staticFile,
} from "remotion";

export type ReelBeat =
  | { kind: "code"; chars: string; caption: string; durationInFrames: number }
  | { kind: "statement"; lead?: string; text: string; note?: string; durationInFrames: number }
  | { kind: "credit"; name: string; role: string; year: string; durationInFrames: number }
  | { kind: "figure"; value: string; unit?: string; context: string; durationInFrames: number }
  | { kind: "kicker"; text: string; durationInFrames: number }
  | { kind: "sign"; handle: string; line: string; durationInFrames: number };

export type ReelProps = {
  palette: { bg: string; ink: string; accent: string; muted: string };
  beats: ReelBeat[];
  /** Ambient bed. Ducked automatically whenever voiceUrl is also set. */
  audioUrl?: string;
  audioVolume?: number;
  /** Narration. The primary track when present; the bed sits under it. */
  voiceUrl?: string;
  voiceVolume?: number;
  /** Hold the narration back this many frames. The opening beat has to finish
   *  its own animation before anyone speaks over it — on the Konami reel the
   *  code types itself in silence, and the voice arrives on the last glyph. */
  voiceDelayInFrames?: number;
};

/** How far the ambient bed drops when narration is present.
 *  A fixed duck rather than a sidechain: the browser does not expose the
 *  voice's envelope during render, so a dynamic duck cannot be computed.
 *  Fixed is predictable and, unlike a badly tuned compressor, never pumps. */
const BED_DUCK = 0.38;

const SANS = '"Helvetica Neue", Inter, Arial, system-ui, sans-serif';
const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';

/** Snap in. Stiff and short: on a phone, slow easing reads as lag. */
const useSnap = (delay = 0) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 220, mass: 0.5 } });
};

/** A colour block that wipes across, used to divide the frame. */
const Wipe: React.FC<{ colour: string; top: string; height: string; delay?: number; from?: "left" | "right" }> =
({ colour, top, height, delay = 0, from = "left" }) => {
  const a = useSnap(delay);
  const w = interpolate(a, [0, 1], [0, 100], { extrapolateRight: "clamp" });
  return (
    <div style={{
      position: "absolute", top, height, background: colour,
      [from]: 0, width: `${w}%`,
    } as React.CSSProperties} />
  );
};

/** Words arrive one at a time. Reading rhythm, and it keeps the frame alive. */
const Words: React.FC<{
  text: string; size: number; colour: string; weight?: number;
  delay?: number; stagger?: number; font?: string; lineHeight?: number; tracking?: number;
}> = ({ text, size, colour, weight = 800, delay = 0, stagger = 2, font = SANS, lineHeight = 0.98, tracking = -0.02 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = String(text).split(/\s+/).filter(Boolean);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: `0 ${size * 0.22}px`, lineHeight }}>
      {words.map((w, i) => {
        const a = spring({ frame: frame - delay - i * stagger, fps, config: { damping: 15, stiffness: 240, mass: 0.5 } });
        return (
          <span key={i} style={{
            fontFamily: font, fontSize: size, fontWeight: weight, color: colour,
            letterSpacing: `${tracking}em`, display: "inline-block",
            opacity: a, transform: `translateY(${(1 - a) * size * 0.35}px)`,
          }}>{w}</span>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- beats

const PAD = 72;

const CodeBeat: React.FC<{ b: Extract<ReelBeat, { kind: "code" }>; p: ReelProps["palette"] }> = ({ b, p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = [...b.chars];
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <Wipe colour={p.accent} top="0%" height="26%" delay={0} />
      <div style={{
        position: "absolute", inset: `26% ${PAD}px 0`, display: "flex",
        flexDirection: "column", justifyContent: "center",
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
          {chars.map((c, i) => {
            const a = spring({ frame: frame - 6 - i * 4, fps, config: { damping: 12, stiffness: 260, mass: 0.5 } });
            return (
              <span key={i} style={{
                fontFamily: MONO, fontSize: 132, fontWeight: 700, color: p.ink,
                opacity: a, transform: `scale(${0.6 + a * 0.4})`, display: "inline-block",
              }}>{c}</span>
            );
          })}
        </div>
        <div style={{ height: 6, background: p.accent, width: "38%", marginTop: 56 }} />
        <div style={{ marginTop: 34 }}>
          <Words text={b.caption} size={46} colour={p.muted} weight={600} delay={chars.length * 4 + 10} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StatementBeat: React.FC<{ b: Extract<ReelBeat, { kind: "statement" }>; p: ReelProps["palette"] }> = ({ b, p }) => (
  <AbsoluteFill style={{ background: p.bg }}>
    <Wipe colour={p.accent} top="0%" height="100%" delay={0} />
    <div style={{ position: "absolute", inset: `${PAD}px ${PAD}px`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {b.lead ? (
        <div style={{ fontFamily: MONO, fontSize: 30, letterSpacing: "0.22em", color: p.bg, opacity: 0.72, marginBottom: 34 }}>
          {b.lead.toUpperCase()}
        </div>
      ) : null}
      <Words text={b.text} size={104} colour={p.bg} weight={900} delay={4} />
      {b.note ? (
        <div style={{ marginTop: 44, maxWidth: "86%" }}>
          <Words text={b.note} size={40} colour={p.bg} weight={500} delay={20} lineHeight={1.25} tracking={0} />
        </div>
      ) : null}
    </div>
  </AbsoluteFill>
);

const CreditBeat: React.FC<{ b: Extract<ReelBeat, { kind: "credit" }>; p: ReelProps["palette"] }> = ({ b, p }) => {
  const a = useSnap(4);
  return (
    <AbsoluteFill style={{ background: p.bg }}>
      <div style={{ position: "absolute", inset: `${PAD}px ${PAD}px`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{
          fontFamily: MONO, fontSize: 190, fontWeight: 700, color: "transparent",
          WebkitTextStroke: `2px ${p.muted}`, lineHeight: 0.9,
          opacity: a, transform: `translateX(${(1 - a) * -40}px)`,
        }}>{b.year}</div>
        <div style={{ height: 6, background: p.accent, width: 140, margin: "38px 0 34px" }} />
        <Words text={b.name} size={88} colour={p.ink} weight={800} delay={12} />
        <div style={{ marginTop: 28, maxWidth: "88%" }}>
          <Words text={b.role} size={40} colour={p.muted} weight={500} delay={26} lineHeight={1.25} tracking={0} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FigureBeat: React.FC<{ b: Extract<ReelBeat, { kind: "figure" }>; p: ReelProps["palette"] }> = ({ b, p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 16, stiffness: 200, mass: 0.6 } });
  // Count up to the real number. The value comes from props, never invented.
  const target = parseInt(String(b.value).replace(/[^0-9]/g, ""), 10);
  const shown = Number.isFinite(target)
    ? String(Math.round(interpolate(a, [0, 1], [0, target]))).padStart(String(target).length, "0")
    : b.value;
  return (
    <AbsoluteFill style={{ background: p.ink }}>
      <Wipe colour={p.bg} top="34%" height="66%" delay={2} from="right" />
      <div style={{ position: "absolute", inset: `${PAD}px ${PAD}px`, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 22 }}>
          <span style={{ fontFamily: SANS, fontSize: 300, fontWeight: 900, color: p.accent, lineHeight: 0.82, letterSpacing: "-0.04em" }}>
            {shown}
          </span>
          {b.unit ? (
            <span style={{ fontFamily: SANS, fontSize: 76, fontWeight: 800, color: p.accent }}>{b.unit}</span>
          ) : null}
        </div>
        {/* p.ink, not p.bg. The wipe above paints the lower two thirds in
            p.bg, and this line sits inside that band — set in p.bg it was
            dark on dark and rendered invisible. The contact sheet showed the
            beat as a bare number with no context at all. */}
        <div style={{ marginTop: 48, maxWidth: "90%" }}>
          <Words text={b.context} size={48} colour={p.ink} weight={600} delay={18} lineHeight={1.2} tracking={0} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const KickerBeat: React.FC<{ b: Extract<ReelBeat, { kind: "kicker" }>; p: ReelProps["palette"] }> = ({ b, p }) => (
  <AbsoluteFill style={{ background: p.bg }}>
    <div style={{ position: "absolute", inset: `${PAD}px ${PAD}px`, display: "flex", alignItems: "center" }}>
      <Words text={b.text} size={112} colour={p.ink} weight={900} delay={2} stagger={3} />
    </div>
    <Wipe colour={p.accent} top="88%" height="12%" delay={16} />
  </AbsoluteFill>
);

const SignBeat: React.FC<{ b: Extract<ReelBeat, { kind: "sign" }>; p: ReelProps["palette"] }> = ({ b, p }) => {
  const a = useSnap(2);
  return (
    <AbsoluteFill style={{ background: p.accent }}>
      <div style={{ position: "absolute", inset: `${PAD}px ${PAD}px`, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 160 }}>
        <Words text={b.line} size={82} colour={p.bg} weight={900} delay={2} />
        <div style={{ height: 5, background: p.bg, width: `${a * 100}%`, margin: "44px 0 30px", opacity: 0.6 }} />
        <div style={{ fontFamily: MONO, fontSize: 40, letterSpacing: "0.14em", color: p.bg, opacity: 0.85 }}>
          {b.handle}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- shell

const renderBeat = (b: ReelBeat, p: ReelProps["palette"]) => {
  switch (b.kind) {
    case "code":      return <CodeBeat b={b} p={p} />;
    case "statement": return <StatementBeat b={b} p={p} />;
    case "credit":    return <CreditBeat b={b} p={p} />;
    case "figure":    return <FigureBeat b={b} p={p} />;
    case "kicker":    return <KickerBeat b={b} p={p} />;
    case "sign":      return <SignBeat b={b} p={p} />;
    default:          return null;
  }
};

export const EditorialReel: React.FC<ReelProps> = ({
  palette, beats, audioUrl, audioVolume = 0.4,
  voiceUrl, voiceVolume = 1, voiceDelayInFrames = 0,
}) => {
  const { durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const bedVolume = voiceUrl ? audioVolume * BED_DUCK : audioVolume;
  let cursor = 0;
  return (
    <AbsoluteFill style={{ background: palette.bg }}>
      {audioUrl ? <Audio src={staticFile(audioUrl)} volume={bedVolume} /> : null}
      {/* Narration last so it sits on top of the bed in the mix graph. */}
      {voiceUrl ? (
        <Sequence from={voiceDelayInFrames} name="narration">
          <Audio src={staticFile(voiceUrl)} volume={voiceVolume} />
        </Sequence>
      ) : null}
      {beats.map((b, i) => {
        const from = cursor;
        cursor += b.durationInFrames;
        return (
          <Sequence key={i} from={from} durationInFrames={b.durationInFrames}>
            {renderBeat(b, palette)}
          </Sequence>
        );
      })}
      {/* Progress hairline. Signals how far through, which keeps people past
          the midpoint instead of swiping when they cannot tell. */}
      <div style={{ position: "absolute", left: 0, bottom: 0, height: 6, background: palette.accent,
        width: `${Math.min(100, (frame / Math.max(1, durationInFrames)) * 100)}%`, opacity: 0.9 }} />
    </AbsoluteFill>
  );
};

export default EditorialReel;
