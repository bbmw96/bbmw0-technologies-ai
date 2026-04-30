import {
  AbsoluteFill,
  Series,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import React from "react";

// =====================================================================
// FeatureDrop — 60s vertical. Fast-cut feature montage. Hard cuts.
// Each feature gets its own color, layout, and emphasis word style.
// =====================================================================

export type FeatureDropProps = {
  url: string;
};

export const featureDropDefaults: FeatureDropProps = {
  url: "bbmw0-technologies-ai.vercel.app",
};

const FONT = "Inter, system-ui, -apple-system, sans-serif";

// Number badge that grows in
const NumberBadge: React.FC<{ n: number; color: string }> = ({ n, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 10, stiffness: 130 } });
  return (
    <div
      style={{
        position: "absolute",
        top: 100,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 56,
          color,
          letterSpacing: "0.18em",
          opacity: a,
          transform: `scale(${a})`,
          textShadow: `0 0 30px ${color}80`,
        }}
      >
        # {n.toString().padStart(2, "0")}
      </div>
    </div>
  );
};

// ---------- Open ----------
const Open: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 12, stiffness: 140 } });
  const b = spring({
    frame: frame - 14,
    fps,
    config: { damping: 12, stiffness: 130 },
  });
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #2a1a55 0%, #0a0a0f 65%)",
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
          fontSize: 36,
          color: "#7c5cff",
          letterSpacing: "0.22em",
          marginBottom: 24,
          opacity: a,
          textTransform: "uppercase",
        }}
      >
        ✦  FEATURE  DROP  ✦
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 220,
          color: "white",
          lineHeight: 0.9,
          letterSpacing: "-0.05em",
          transform: `scale(${a})`,
          textShadow: "0 0 60px rgba(124,92,255,0.7)",
        }}
      >
        5
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 80,
          color: "white",
          letterSpacing: "-0.03em",
          marginTop: 20,
          opacity: b,
        }}
      >
        in 60 seconds.
      </div>
    </AbsoluteFill>
  );
};

// ---------- Feature 1: Touch UI ----------
const F1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const COLOR = "#7c5cff";
  const a = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const b = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  // animated finger swipe
  const swipe = ((frame % 60) / 60) * 600 - 100;

  return (
    <AbsoluteFill style={{ background: "#0a0a0f", overflow: "hidden" }}>
      <NumberBadge n={1} color={COLOR} />

      <div
        style={{
          position: "absolute",
          top: 280,
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 40px",
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 110,
            color: "white",
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            opacity: a,
            transform: `translateY(${interpolate(a, [0, 1], [40, 0])}px)`,
          }}
        >
          Touch.
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 110,
            color: COLOR,
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            marginTop: 12,
            opacity: b,
            textShadow: `0 0 40px ${COLOR}`,
          }}
        >
          Swipe.
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 110,
            color: "white",
            letterSpacing: "-0.04em",
            lineHeight: 0.95,
            marginTop: 12,
            opacity: spring({
              frame: frame - 32,
              fps,
              config: { damping: 14, stiffness: 100 },
            }),
          }}
        >
          Done.
        </div>
      </div>

      {/* swiping finger trail */}
      <div
        style={{
          position: "absolute",
          top: 1200,
          left: swipe,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: COLOR,
          boxShadow: `0 0 60px ${COLOR}, 0 0 120px ${COLOR}80`,
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- Feature 2: 10 languages ----------
const F2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const COLOR = "#22d3a8";
  const a = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const langs = [
    { f: "🇺🇸", t: "Hello" },
    { f: "🇪🇸", t: "Hola" },
    { f: "🇫🇷", t: "Bonjour" },
    { f: "🇩🇪", t: "Hallo" },
    { f: "🇵🇹", t: "Olá" },
    { f: "🇯🇵", t: "こんにちは" },
    { f: "🇨🇳", t: "你好" },
    { f: "🇸🇦", t: "مرحبا" },
    { f: "🇮🇳", t: "नमस्ते" },
    { f: "🇷🇺", t: "Привет" },
  ];

  return (
    <AbsoluteFill style={{ background: "#0a0a0f", overflow: "hidden" }}>
      <NumberBadge n={2} color={COLOR} />
      <div
        style={{
          position: "absolute",
          top: 240,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: a,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 96,
            color: "white",
            letterSpacing: "-0.03em",
            lineHeight: 0.95,
          }}
        >
          Speaks
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 200,
            color: COLOR,
            letterSpacing: "-0.05em",
            lineHeight: 0.85,
            marginTop: 8,
            textShadow: `0 0 60px ${COLOR}80`,
          }}
        >
          10
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 96,
            color: "white",
            letterSpacing: "-0.03em",
            lineHeight: 0.95,
            marginTop: 8,
          }}
        >
          languages.
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: 60,
          right: 60,
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 14,
        }}
      >
        {langs.map((l, i) => {
          const fade = spring({
            frame: frame - 30 - i * 5,
            fps,
            config: { damping: 14, stiffness: 110 },
          });
          return (
            <div
              key={i}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 14,
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontFamily: FONT,
                color: "white",
                fontSize: 28,
                fontWeight: 700,
                opacity: fade,
                transform: `translateX(${interpolate(fade, [0, 1], [-30, 0])}px)`,
              }}
            >
              <span style={{ fontSize: 36 }}>{l.f}</span>
              <span>{l.t}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Feature 3: 5 AIs ----------
const F3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const COLOR = "#ff5cb1";
  const a = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const ais = [
    { e: "🧠", n: "Claude" },
    { e: "🤖", n: "GPT" },
    { e: "💎", n: "Gemini" },
    { e: "🔎", n: "Perplexity" },
    { e: "🦙", n: "Llama" },
  ];

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #2a0a1f 0%, #0a0a0f 70%)",
        overflow: "hidden",
      }}
    >
      <NumberBadge n={3} color={COLOR} />
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: a,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 96,
            color: "white",
            letterSpacing: "-0.03em",
            lineHeight: 0.95,
          }}
        >
          5 AIs.
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 96,
            color: COLOR,
            letterSpacing: "-0.03em",
            lineHeight: 0.95,
            marginTop: 12,
            textShadow: `0 0 50px ${COLOR}`,
          }}
        >
          Working as one.
        </div>
      </div>

      {/* orbiting AI nodes */}
      <div
        style={{
          position: "absolute",
          top: 900,
          left: "50%",
          width: 1,
          height: 1,
        }}
      >
        {ais.map((ai, i) => {
          const angle = (i / 5) * Math.PI * 2 + frame / 60;
          const r = 280;
          return (
            <div
              key={ai.n}
              style={{
                position: "absolute",
                left: Math.cos(angle) * r - 70,
                top: Math.sin(angle) * r - 70,
                width: 140,
                height: 140,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                border: `2px solid ${COLOR}80`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 4,
                color: "white",
                fontFamily: FONT,
                fontWeight: 700,
                boxShadow: `0 0 24px ${COLOR}40`,
              }}
            >
              <span style={{ fontSize: 48 }}>{ai.e}</span>
              <span style={{ fontSize: 14 }}>{ai.n}</span>
            </div>
          );
        })}
        {/* center node */}
        <div
          style={{
            position: "absolute",
            left: -60,
            top: -60,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: `linear-gradient(135deg, #7c5cff, ${COLOR})`,
            display: "grid",
            placeItems: "center",
            color: "white",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 44,
            boxShadow: "0 0 60px rgba(124,92,255,0.8)",
          }}
        >
          B
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Feature 4: PWA install ----------
const F4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const COLOR = "#ffb547";
  const a = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });

  return (
    <AbsoluteFill style={{ background: "#0a0a0f" }}>
      <NumberBadge n={4} color={COLOR} />
      <div
        style={{
          position: "absolute",
          top: 280,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: a,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 88,
            color: "white",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}
        >
          Add to home
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 144,
            color: COLOR,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            marginTop: 8,
            textShadow: `0 0 40px ${COLOR}80`,
          }}
        >
          screen.
        </div>
      </div>
      {/* mocked phone home screen with our app icon */}
      <div
        style={{
          position: "absolute",
          top: 920,
          left: "50%",
          transform: "translateX(-50%)",
          width: 380,
          height: 540,
          background:
            "radial-gradient(ellipse at top, #1a1430, #050510 60%)",
          border: "8px solid #2a2a3a",
          borderRadius: 48,
          padding: 28,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridTemplateRows: "repeat(5, 1fr)",
          gap: 14,
          boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        }}
      >
        {Array.from({ length: 20 }).map((_, i) => {
          const isOur = i === 5;
          const colors = ["#ff5e7e", "#22d3a8", "#5cc8ff", "#ffb547", "#a78bfa"];
          if (isOur) {
            return (
              <div
                key={i}
                style={{
                  background: "linear-gradient(135deg, #5b3aff, #ff8a3b)",
                  borderRadius: 14,
                  display: "grid",
                  placeItems: "center",
                  color: "white",
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 28,
                  boxShadow: `0 6px 18px ${COLOR}, 0 0 0 3px white`,
                  animation: "none",
                }}
              >
                B
              </div>
            );
          }
          return (
            <div
              key={i}
              style={{
                background: colors[i % colors.length],
                borderRadius: 14,
                opacity: 0.2,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Feature 5: free + open source ----------
const F5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const COLOR = "#22d3a8";
  const a = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #0a2a22 0%, #0a0a0f 70%)",
      }}
    >
      <NumberBadge n={5} color={COLOR} />
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: a,
        }}
      >
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 240,
            color: COLOR,
            letterSpacing: "-0.06em",
            lineHeight: 0.85,
            textShadow: `0 0 80px ${COLOR}`,
          }}
        >
          $0
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 88,
            color: "white",
            letterSpacing: "-0.03em",
            marginTop: 24,
          }}
        >
          Open source.
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 64,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "-0.02em",
            marginTop: 20,
          }}
        >
          MIT-licensed.
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 48,
            color: COLOR,
            marginTop: 28,
            opacity: spring({
              frame: frame - 60,
              fps,
              config: { damping: 14, stiffness: 100 },
            }),
          }}
        >
          Forever.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- CTA ----------
const FCTA: React.FC<{ url: string }> = ({ url }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const u = spring({
    frame: frame - 24,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, #2a1a55 0%, #0a0a0f 70%)",
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
          fontSize: 140,
          color: "white",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          opacity: a,
        }}
      >
        Try it.
      </div>
      <div
        style={{
          fontSize: 100,
          marginTop: 24,
          opacity: a,
        }}
      >
        ↓
      </div>
      <div
        style={{
          marginTop: 28,
          padding: "26px 36px",
          background: "rgba(255,255,255,0.06)",
          border: "3px solid #7c5cff",
          borderRadius: 22,
          fontFamily: "ui-monospace, monospace",
          fontWeight: 700,
          fontSize: 32,
          color: "white",
          opacity: u,
          transform: `scale(${u})`,
          boxShadow: "0 0 50px rgba(124,92,255,0.7)",
          wordBreak: "break-all",
          maxWidth: "100%",
        }}
      >
        {url}
      </div>
    </AbsoluteFill>
  );
};

// ===============================================================
// FeatureDrop composition — 60s = 1800 frames @ 30fps
// ===============================================================
export const FeatureDrop: React.FC<FeatureDropProps> = ({ url }) => {
  return (
    <AbsoluteFill style={{ background: "#0a0a0f" }}>
      <Series>
        <Series.Sequence durationInFrames={120}>
          <Open />
        </Series.Sequence>
        <Series.Sequence durationInFrames={270}>
          <F1 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <F2 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <F3 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={270}>
          <F4 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={270}>
          <F5 />
        </Series.Sequence>
        <Series.Sequence durationInFrames={270}>
          <FCTA url={url} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
