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
//
// ---------------------------------------------------------------------------
// AMENDMENT, 15 Aug 2026 — rule 2 and rule 3 were overcorrections.
//
// Eight reels were rendered and read off contact sheets in one sitting. Every
// frame is type on an unmoving flat fill. Read as stills they look composed;
// played on a phone they look like a slide deck, because for whole seconds at
// a time not one pixel changes. Rule 2 was written against a blurred radial
// glow and it correctly killed that. It also, unintentionally, banned texture
// and movement of any kind, and rule 3 turned every one of the five or six
// beat boundaries into a slide change.
//
// What is added below is motion and texture, NOT decoration:
//
//   Grain      feTurbulence, re-seeded on a short cycle so it crawls. The
//              cheapest possible answer to "a perfectly clean flat block is
//              what a template looks like".
//   Drift      Three planes of large geometry moving at different rates
//              behind the type. Carries no meaning by design.
//   BeatShell  A ~3.5% push-in across each beat plus a 7-frame edge wipe on
//              entry. The push means no frame is ever static; the wipe means
//              a beat boundary reads as an edit rather than a slide advance.
//   Words      Mask reveal instead of fade. Type slides up from behind a
//              hard edge, which is the single biggest difference between
//              this and a PowerPoint transition.
//   Pips       Per-beat progress segments rather than one sweeping bar. A
//              bar says "some left". Segments say "two to go", which is the
//              thing that actually keeps a thumb still.
//
// None of this needs an asset, a credit balance or a network call: it is all
// CSS and SVG, it renders identically every time, and it costs nothing per
// video. That matters more than it sounds — the generative image and video
// connectors on this account have three free generations left between them,
// so anything that depends on them cannot run six times a week.
//
// Rule 1 and rule 4 are untouched, and rule 2's real intent — structure from
// blocks, rules and scale, never from a glow — still holds. There is no blur
// anywhere below.
// ---------------------------------------------------------------------------

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
  /** Closing call to action, rendered on the sign beat of every reel.
   *  Platform-specific: "Subscribe" means nothing on Instagram. Defaults to
   *  the YouTube wording. */
  cta?: string;
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

/** Words arrive one at a time, sliding up from behind a hard mask edge.
 *
 *  This used to be opacity plus a small translate. A fade is what a slide
 *  deck does; a mask reveal is what an edit does, and the difference is most
 *  of the reason the old output read as static. The outer span is the mask —
 *  overflow hidden with padding and an equal negative margin so descenders
 *  (g, y, p) are not sheared off by the very edge doing the revealing. */
const Words: React.FC<{
  text: string; size: number; colour: string; weight?: number;
  delay?: number; stagger?: number; font?: string; lineHeight?: number; tracking?: number;
}> = ({ text, size, colour, weight = 800, delay = 0, stagger = 2, font = SANS, lineHeight = 0.98, tracking = -0.02 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = String(text).split(/\s+/).filter(Boolean);
  const slack = Math.ceil(size * 0.18);
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: `0 ${size * 0.22}px`, lineHeight }}>
      {words.map((w, i) => {
        const a = spring({ frame: frame - delay - i * stagger, fps, config: { damping: 15, stiffness: 240, mass: 0.5 } });
        return (
          <span key={i} style={{
            display: "inline-block", overflow: "hidden",
            paddingBottom: slack, marginBottom: -slack,
          }}>
            {/* Opacity ramps to solid in the first ~45% of the slide. Without
                it the mask produces a hard-edged sliver of a half-arrived
                word, which on a contact sheet reads as a rendering bug rather
                than an animation — frame 60 of the mantis reel showed "tell"
                as a detached fragment under its own line. Reaching full
                opacity early keeps it a reveal, not a fade. */}
            <span style={{
              fontFamily: font, fontSize: size, fontWeight: weight, color: colour,
              letterSpacing: `${tracking}em`, display: "inline-block",
              opacity: Math.min(1, a * 2.2),
              transform: `translateY(${(1 - a) * 108}%)`,
            }}>{w}</span>
          </span>
        );
      })}
    </div>
  );
};

/** Film grain. feTurbulence re-seeded every other frame so it crawls the way
 *  real grain does rather than sitting still like a texture PNG. Kept under
 *  0.1 opacity: this should register as surface, never as noise. The seed is
 *  in the filter id because two beats sharing an id would share a filter. */
const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.09 }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 2) % 10;
  return (
    <svg
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, mixBlendMode: "overlay", pointerEvents: "none" }}
    >
      <filter id={`grain-${seed}`}>
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={seed} stitchTiles="stitch" />
      </filter>
      <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
    </svg>
  );
};

/** Three planes of large geometry drifting at different rates. Outlines only,
 *  low opacity, no fill — it has to survive behind 100px type without ever
 *  competing with a word. It carries no meaning and is not supposed to: its
 *  entire job is that the background is in motion, so a held frame does not
 *  read as a screenshot. Rates differ so the planes separate into depth. */
const Drift: React.FC<{ ink: string; accent: string }> = ({ ink, accent }) => {
  const frame = useCurrentFrame();
  const plane = (rate: number, size: number, x: number, y: number, c: string, o: number, round: boolean, spin: number) =>
    ({
      position: "absolute" as const,
      width: size, height: size, left: `${x}%`, top: `${y}%`,
      borderRadius: round ? "50%" : 0,
      border: `${round ? 3 : 2}px solid ${c}`,
      opacity: o,
      transform: `translateY(${-frame * rate}px) rotate(${frame * spin}deg)`,
    });
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }} aria-hidden>
      <div style={plane(0.50, 780, -26, 62, accent, 0.10, true, 0)} />
      <div style={plane(0.28, 540, 58, 82, ink, 0.07, false, 0.045)} />
      <div style={plane(0.88, 300, 72, 10, accent, 0.12, true, 0)} />
      <div style={plane(0.16, 200, 8, 30, ink, 0.06, false, -0.07)} />
    </div>
  );
};

/** Every beat sits on this: flat fill, drift, grain, a slow push in, and a
 *  wipe on entry.
 *
 *  The push is 3.5% across the whole beat. It is deliberately below the
 *  threshold where anyone notices it happening — the point is not the zoom,
 *  it is that no frame in the video is ever identical to the one before it.
 *
 *  The entry wipe replaces the hard cut of rule 3. Seven frames, a quarter of
 *  a second: too fast to read as a fade on a phone, slow enough that a beat
 *  boundary looks like an edit instead of a slide advance. */
const BeatShell: React.FC<{
  bg: string; ink: string; accent: string; dur: number; children: React.ReactNode;
}> = ({ bg, ink, accent, dur, children }) => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, Math.max(1, dur)], [1, 1.035], { extrapolateRight: "clamp" });
  const enter = interpolate(frame, [0, 7], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 45%" }}>
        <Drift ink={ink} accent={accent} />
        {children}
      </AbsoluteFill>
      <Grain />
      <div style={{
        position: "absolute", inset: 0, background: bg, pointerEvents: "none",
        transform: `translateY(${-enter * 101}%)`,
      }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- beats

const PAD = 72;

const CodeBeat: React.FC<{ b: Extract<ReelBeat, { kind: "code" }>; p: ReelProps["palette"] }> = ({ b, p }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chars = [...b.chars];
  return (
    <BeatShell bg={p.bg} ink={p.ink} accent={p.accent} dur={b.durationInFrames}>
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
    </BeatShell>
  );
};

const StatementBeat: React.FC<{ b: Extract<ReelBeat, { kind: "statement" }>; p: ReelProps["palette"] }> = ({ b, p }) => (
  // bg is p.accent directly. It used to be p.bg with a full-height accent
  // Wipe painted over it, but that wipe sat above the drift layer and hid it
  // completely — the shell's own entry wipe does the same reveal job.
  <BeatShell bg={p.accent} ink={p.bg} accent={p.bg} dur={b.durationInFrames}>
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
  </BeatShell>
);

const CreditBeat: React.FC<{ b: Extract<ReelBeat, { kind: "credit" }>; p: ReelProps["palette"] }> = ({ b, p }) => {
  const a = useSnap(4);
  return (
    <BeatShell bg={p.bg} ink={p.ink} accent={p.accent} dur={b.durationInFrames}>
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
    </BeatShell>
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
    // Strokes are p.bg here, not p.ink: this beat's field IS p.ink, so an
    // ink-coloured drift plane would be invisible against it.
    <BeatShell bg={p.ink} ink={p.bg} accent={p.accent} dur={b.durationInFrames}>
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
    </BeatShell>
  );
};

const KickerBeat: React.FC<{ b: Extract<ReelBeat, { kind: "kicker" }>; p: ReelProps["palette"] }> = ({ b, p }) => (
  <BeatShell bg={p.bg} ink={p.ink} accent={p.accent} dur={b.durationInFrames}>
    <div style={{ position: "absolute", inset: `${PAD}px ${PAD}px`, display: "flex", alignItems: "center" }}>
      <Words text={b.text} size={112} colour={p.ink} weight={900} delay={2} stagger={3} />
    </div>
    <Wipe colour={p.accent} top="88%" height="12%" delay={16} />
  </BeatShell>
);

// The call to action lives HERE, in the composition, not in the topic data.
//
// Put in topics-rich.json it would be one field among twenty, forgotten on the
// first topic somebody adds in a hurry, and then silently absent from that
// video forever. In the sign beat it is structural: every reel ends with it,
// and no topic can omit it by accident.
//
// Wording is per-platform because "Subscribe" is a YouTube verb and Instagram
// does not have one. cta is threaded down from props; generate-shorts sets it
// from the channel's platform, and the default is the YouTube form because
// that is where most of these end up.
const SignBeat: React.FC<{
  b: Extract<ReelBeat, { kind: "sign" }>; p: ReelProps["palette"]; cta: string;
}> = ({ b, p, cta }) => {
  const a = useSnap(2);
  // Arrives after the line and the rule, so it reads as a closing address
  // rather than competing with the last thing the video actually said.
  const c = useSnap(26);
  return (
    // Field is p.accent, so both drift colours come off the other two stops.
    <BeatShell bg={p.accent} ink={p.bg} accent={p.ink} dur={b.durationInFrames}>
      <div style={{ position: "absolute", inset: `${PAD}px ${PAD}px`, display: "flex", flexDirection: "column", justifyContent: "flex-end", paddingBottom: 160 }}>
        <Words text={b.line} size={82} colour={p.bg} weight={900} delay={2} />
        <div style={{ height: 5, background: p.bg, width: `${a * 100}%`, margin: "44px 0 30px", opacity: 0.6 }} />

        {/* Set larger than the handle and in the sans face: this is the ask,
            and the handle is only the address it points at. */}
        <div style={{
          fontFamily: SANS, fontSize: 54, fontWeight: 900, color: p.bg,
          letterSpacing: "-0.02em", lineHeight: 1.05,
          opacity: c, transform: `translateY(${(1 - c) * 18}px)`,
        }}>{cta}</div>

        <div style={{
          fontFamily: MONO, fontSize: 40, letterSpacing: "0.14em", color: p.bg,
          opacity: c * 0.85, marginTop: 18,
        }}>
          {b.handle}
        </div>
      </div>
    </BeatShell>
  );
};

// ---------------------------------------------------------------- shell

const renderBeat = (b: ReelBeat, p: ReelProps["palette"], cta: string) => {
  switch (b.kind) {
    case "code":      return <CodeBeat b={b} p={p} />;
    case "statement": return <StatementBeat b={b} p={p} />;
    case "credit":    return <CreditBeat b={b} p={p} />;
    case "figure":    return <FigureBeat b={b} p={p} />;
    case "kicker":    return <KickerBeat b={b} p={p} />;
    case "sign":      return <SignBeat b={b} p={p} cta={cta} />;
    default:          return null;
  }
};

export const EditorialReel: React.FC<ReelProps> = ({
  palette, beats, audioUrl, audioVolume = 0.4,
  voiceUrl, voiceVolume = 1, voiceDelayInFrames = 0,
  cta = "Subscribe for more.",
}) => {
  const frame = useCurrentFrame();
  const bedVolume = voiceUrl ? audioVolume * BED_DUCK : audioVolume;
  // Start frame of each beat, computed once so the pips and the sequences
  // agree. Deriving them twice is how a progress indicator drifts out of
  // sync with the thing it is indicating.
  const starts: number[] = [];
  beats.reduce((acc, b) => { starts.push(acc); return acc + b.durationInFrames; }, 0);
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
            {renderBeat(b, palette, cta)}
          </Sequence>
        );
      })}
      {/* Beat pips, replacing the single sweeping hairline.
          A continuous bar only says "some left". Segments say "two to go",
          and a countable remainder is what actually holds a thumb.
          mixBlendMode difference against white inverts whatever is behind,
          so the pips stay legible on every beat — including the figure beat,
          whose field is palette.ink, and the sign beat, whose field is
          palette.accent. A fixed colour would have vanished on one of them. */}
      <div style={{ position: "absolute", left: PAD, right: PAD, bottom: 30, display: "flex", gap: 8, mixBlendMode: "difference" }}>
        {beats.map((b, i) => {
          const done = starts[i];
          const t = Math.max(0, Math.min(1, (frame - done) / Math.max(1, b.durationInFrames)));
          return (
            <div key={i} style={{ flex: b.durationInFrames, height: 5, background: "rgba(255,255,255,0.26)", overflow: "hidden" }}>
              <div style={{ width: `${t * 100}%`, height: "100%", background: "#fff" }} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

export default EditorialReel;
