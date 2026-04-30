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
import { THEMES, FONT, MONO, type Beat, type Theme } from "./themes";

// Generic 40-second themed short. Takes a theme + a list of beats + an
// optional audio file (drums or weather). Total duration is the sum of
// each beat's durationInFrames. Default: 40s = 1200 frames @ 30fps.

export type ThemedShortProps = {
  themeId: keyof typeof THEMES;
  beats: Beat[];
  audioUrl?: string;       // e.g. "sounds/drums-1.mp3" — file in public/
  audioVolume?: number;    // 0..1, default 0.45 (so drums aren't loud)
};

// ============== Beat renderers ==============

const fadeIn = (frame: number, fps: number) =>
  spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

const TitleBeat: React.FC<{ b: Extract<Beat, { kind: "title" }>; t: Theme }> = ({
  b,
  t,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = fadeIn(frame, fps);
  const c = fadeIn(frame - 12, fps);
  const d = fadeIn(frame - 24, fps);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        textAlign: "center",
      }}
    >
      {b.eyebrow && (
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 30,
            color: t.accent,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            marginBottom: 28,
            opacity: a,
            transform: `translateY(${interpolate(a, [0, 1], [-18, 0])}px)`,
          }}
        >
          {b.eyebrow}
        </div>
      )}
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 110,
          color: t.text,
          letterSpacing: "-0.04em",
          lineHeight: 1.0,
          opacity: c,
          transform: `translateY(${interpolate(c, [0, 1], [40, 0])}px)`,
          textShadow: `0 0 60px ${t.glow}`,
        }}
      >
        {b.text}
      </div>
      {b.sub && (
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 500,
            fontSize: 36,
            color: t.textDim,
            marginTop: 32,
            maxWidth: 800,
            lineHeight: 1.3,
            opacity: d,
          }}
        >
          {b.sub}
        </div>
      )}
    </div>
  );
};

const BigWord: React.FC<{ b: Extract<Beat, { kind: "bigword" }>; t: Theme }> = ({
  b,
  t,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 10, stiffness: 130 } });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "grid",
        placeItems: "center",
        padding: 60,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 240,
          color: t.text,
          letterSpacing: "-0.05em",
          lineHeight: 0.9,
          textAlign: "center",
          transform: `scale(${a})`,
          textShadow: `0 0 80px ${t.glow}`,
        }}
      >
        {b.text}
      </div>
    </div>
  );
};

const Trio: React.FC<{ b: Extract<Beat, { kind: "trio" }>; t: Theme }> = ({
  b,
  t,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        gap: 28,
      }}
    >
      {b.words.map((word, i) => {
        const a = spring({
          frame: frame - i * 10,
          fps,
          config: { damping: 14, stiffness: 100 },
        });
        return (
          <div
            key={i}
            style={{
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 110,
              color: i === 1 ? t.accent : t.text,
              letterSpacing: "-0.04em",
              lineHeight: 1.0,
              opacity: a,
              transform: `translateX(${interpolate(a, [0, 1], [
                i % 2 === 0 ? -50 : 50,
                0,
              ])}px)`,
              textShadow: i === 1 ? `0 0 50px ${t.glow}` : "none",
            }}
          >
            {word}
          </div>
        );
      })}
    </div>
  );
};

const Stat: React.FC<{ b: Extract<Beat, { kind: "stat" }>; t: Theme }> = ({
  b,
  t,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 8, stiffness: 130 } });
  const c = fadeIn(frame - 18, fps);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 320,
          color: t.accent,
          letterSpacing: "-0.05em",
          lineHeight: 0.85,
          transform: `scale(${a})`,
          textShadow: `0 0 80px ${t.glow}`,
        }}
      >
        {b.number}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 44,
          color: t.text,
          marginTop: 36,
          opacity: c,
          letterSpacing: "-0.01em",
          maxWidth: 800,
          lineHeight: 1.2,
        }}
      >
        {b.label}
      </div>
    </div>
  );
};

const List: React.FC<{ b: Extract<Beat, { kind: "list" }>; t: Theme }> = ({
  b,
  t,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = fadeIn(frame, fps);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 80px",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 76,
          color: t.text,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          marginBottom: 56,
          opacity: a,
          transform: `translateY(${interpolate(a, [0, 1], [-20, 0])}px)`,
        }}
      >
        {b.heading}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {b.items.map((item, i) => {
          const fade = spring({
            frame: frame - 12 - i * 12,
            fps,
            config: { damping: 14, stiffness: 100 },
          });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 24,
                opacity: fade,
                transform: `translateX(${interpolate(fade, [0, 1], [-40, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: t.accent,
                  boxShadow: `0 0 20px ${t.glow}`,
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 48,
                  color: t.text,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                {item}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const CTA: React.FC<{ b: Extract<Beat, { kind: "cta" }>; t: Theme }> = ({
  b,
  t,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = fadeIn(frame, fps);
  const c = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 130,
          color: t.text,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          opacity: a,
          transform: `translateY(${interpolate(a, [0, 1], [40, 0])}px)`,
        }}
      >
        {b.headline}
      </div>
      <div
        style={{
          marginTop: 60,
          padding: "26px 40px",
          background: t.surface,
          border: `3px solid ${t.accent}`,
          borderRadius: 22,
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 36,
          color: t.text,
          opacity: c,
          transform: `scale(${c})`,
          boxShadow: `0 0 50px ${t.glow}`,
          wordBreak: "break-all",
          maxWidth: "100%",
        }}
      >
        {b.url}
      </div>
    </div>
  );
};

const BeatRenderer: React.FC<{ b: Beat; t: Theme }> = ({ b, t }) => {
  switch (b.kind) {
    case "title":
      return <TitleBeat b={b} t={t} />;
    case "bigword":
      return <BigWord b={b} t={t} />;
    case "trio":
      return <Trio b={b} t={t} />;
    case "stat":
      return <Stat b={b} t={t} />;
    case "list":
      return <List b={b} t={t} />;
    case "cta":
      return <CTA b={b} t={t} />;
  }
};

// ============== ThemedShort component ==============

export const ThemedShort: React.FC<ThemedShortProps> = ({
  themeId,
  beats,
  audioUrl,
  audioVolume = 0.45,
}) => {
  const theme = THEMES[themeId];

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <Series>
        {beats.map((b, i) => (
          <Series.Sequence key={i} durationInFrames={b.durationInFrames}>
            <BeatRenderer b={b} t={theme} />
          </Series.Sequence>
        ))}
      </Series>
      {audioUrl && (
        <Audio src={staticFile(audioUrl)} volume={audioVolume} />
      )}
    </AbsoluteFill>
  );
};
