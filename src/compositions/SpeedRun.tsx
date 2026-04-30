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
// SpeedRun — 60s vertical. Real-time speed-run of building a Short.
// Has a giant timer in the corner that ticks from 60.0 → 0.0
// =====================================================================

export type SpeedRunProps = {
  url: string;
};

export const speedRunDefaults: SpeedRunProps = {
  url: "bbmw0-technologies-ai.vercel.app",
};

const FONT = "Inter, system-ui, -apple-system, sans-serif";

// ============== Big timer in corner ==============
const Timer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const remaining = Math.max(
    0,
    (durationInFrames - frame) / fps,
  );
  const seconds = Math.floor(remaining);
  const tenths = Math.floor((remaining - seconds) * 10);
  const display = `${seconds.toString().padStart(2, "0")}.${tenths}`;
  const urgent = remaining < 10;

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        right: 60,
        background: urgent ? "#ff5e7e" : "rgba(0,0,0,0.5)",
        color: "white",
        fontFamily: "ui-monospace, monospace",
        fontWeight: 900,
        fontSize: 56,
        padding: "12px 22px",
        borderRadius: 18,
        zIndex: 50,
        border: `2px solid ${urgent ? "#ff5e7e" : "#7c5cff"}`,
        boxShadow: urgent
          ? "0 0 40px rgba(255,94,126,0.8)"
          : "0 0 20px rgba(124,92,255,0.4)",
      }}
    >
      {display}s
    </div>
  );
};

// ============== Step indicator ==============
const StepHeader: React.FC<{ step: number; label: string; color: string }> = ({
  step,
  label,
  color,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inAnim = spring({ frame, fps, config: { damping: 16, stiffness: 110 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 200,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        opacity: inAnim,
        transform: `translateY(${interpolate(inAnim, [0, 1], [-30, 0])}px)`,
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 22,
          color,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
        }}
      >
        STEP {step} OF 4
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 64,
          color: "white",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          textShadow: `0 0 30px ${color}80`,
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ============== Open ==============
const Open: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });

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
      <Timer />
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 200,
          color: "#ff5e7e",
          lineHeight: 0.9,
          transform: `scale(${a})`,
          textShadow: "0 0 80px rgba(255,94,126,0.8)",
        }}
      >
        ⏱
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 96,
          color: "white",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          marginTop: 32,
          opacity: a,
        }}
      >
        Make a Short.
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 96,
          color: "#7c5cff",
          letterSpacing: "-0.03em",
          lineHeight: 1,
          marginTop: 8,
          opacity: a,
          textShadow: "0 0 30px rgba(124,92,255,0.5)",
        }}
      >
        In 60 seconds.
      </div>
    </AbsoluteFill>
  );
};

// ============== Step 1: pick (8s) ==============
const StepPick: React.FC = () => {
  const frame = useCurrentFrame();
  const COLOR = "#5cc8ff";
  const cards = [
    { id: "Hook", emoji: "👀", color: "#7c5cff" },
    { id: "Title", emoji: "🅱️", color: "#ff5cb1" },
    { id: "Bullets", emoji: "📋", color: "#22d3a8" },
    { id: "Quote", emoji: "💬", color: "#ffb547" },
    { id: "CTA", emoji: "🚀", color: "#ff5e7e" },
  ];
  const period = 36;
  const idx = Math.min(Math.floor(frame / period), cards.length - 1);

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #0a1a2a, #0a0a0f 60%)" }}>
      <Timer />
      <StepHeader step={1} label="Pick a scene" color={COLOR} />
      <div
        style={{
          position: "absolute",
          top: 800,
          left: 0,
          right: 0,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          padding: "0 60px",
        }}
      >
        {cards.map((c, i) => {
          const isActive = i === idx;
          return (
            <div
              key={c.id}
              style={{
                aspectRatio: "1",
                borderRadius: 24,
                background: isActive
                  ? `linear-gradient(160deg, ${c.color}, ${c.color}90)`
                  : "rgba(255,255,255,0.04)",
                border: isActive
                  ? `4px solid white`
                  : "2px solid rgba(255,255,255,0.1)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: "white",
                fontFamily: FONT,
                boxShadow: isActive ? `0 12px 40px ${c.color}80` : "none",
                transform: isActive ? "scale(1.04)" : "scale(0.96)",
                transition: "all 200ms",
                gridColumn: i === 4 ? "1 / 3" : undefined,
              }}
            >
              <div style={{ fontSize: 100 }}>{c.emoji}</div>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.02em" }}>
                {c.id}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ============== Step 2: type (10s) ==============
const StepType: React.FC = () => {
  const frame = useCurrentFrame();
  const COLOR = "#ffb547";
  const text = "POV: you stop scrolling";
  const start = 18;
  const speed = 4;
  const typed = text.slice(
    0,
    Math.max(0, Math.min(text.length, Math.floor((frame - start) / speed))),
  );
  const cursor = Math.floor(frame / 8) % 2 === 0;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #2a1f0a, #0a0a0f 60%)" }}>
      <Timer />
      <StepHeader step={2} label="Type your hook" color={COLOR} />
      <div
        style={{
          position: "absolute",
          top: 720,
          left: 60,
          right: 60,
          background: "rgba(255,255,255,0.04)",
          border: `3px solid ${COLOR}`,
          borderRadius: 28,
          padding: 40,
          boxShadow: `0 0 40px ${COLOR}50`,
        }}
      >
        <div
          style={{
            color: COLOR,
            fontFamily: FONT,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "0.16em",
            marginBottom: 18,
          }}
        >
          ✎ HEADLINE
        </div>
        <div
          style={{
            color: "white",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 56,
            lineHeight: 1.15,
            letterSpacing: "-0.01em",
            minHeight: 140,
          }}
        >
          {typed}
          {typed.length < text.length && (
            <span
              style={{ opacity: cursor ? 1 : 0, color: COLOR, marginLeft: 4 }}
            >
              ▍
            </span>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============== Step 3: AI fill (10s) ==============
const StepAI: React.FC = () => {
  const frame = useCurrentFrame();
  const COLOR = "#22d3a8";
  const fields = [
    { l: "EMOJI", v: "👀" },
    { l: "ACCENT", v: "#7c5cff" },
    { l: "BG", v: "#0a0a0f" },
  ];

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #0a2a22, #0a0a0f 60%)" }}>
      <Timer />
      <StepHeader step={3} label="AI fills the rest" color={COLOR} />
      <div
        style={{
          position: "absolute",
          top: 720,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div
          style={{
            background: `linear-gradient(90deg, ${COLOR}30, transparent)`,
            border: `2px solid ${COLOR}`,
            borderRadius: 22,
            padding: "20px 26px",
            color: "white",
            fontFamily: FONT,
            fontSize: 28,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 36 }}>✨</span>
          <span style={{ flex: 1 }}>Tap "Fill"</span>
          <span
            style={{
              fontSize: 16,
              color: COLOR,
              fontWeight: 800,
              letterSpacing: "0.1em",
            }}
          >
            BBMW0 AI
          </span>
        </div>
        {fields.map((f, i) => {
          const start = 30 + i * 12;
          const inAnim = spring({
            frame: frame - start,
            fps: 30,
            config: { damping: 14, stiffness: 100 },
          });
          return (
            <div
              key={f.l}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 18,
                padding: "20px 26px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: inAnim,
                transform: `translateY(${interpolate(inAnim, [0, 1], [40, 0])}px)`,
              }}
            >
              <span
                style={{
                  color: COLOR,
                  fontFamily: FONT,
                  fontWeight: 800,
                  fontSize: 22,
                  letterSpacing: "0.12em",
                }}
              >
                {f.l}
              </span>
              <span
                style={{
                  color: "white",
                  fontFamily:
                    f.l === "EMOJI" ? "inherit" : "ui-monospace, monospace",
                  fontSize: f.l === "EMOJI" ? 56 : 32,
                  fontWeight: 700,
                }}
              >
                {f.v}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ============== Step 4: export (10s) ==============
const StepExport: React.FC = () => {
  const frame = useCurrentFrame();
  const COLOR = "#ff5e7e";
  const progress = Math.min(1, Math.max(0, (frame - 30) / 180));

  return (
    <AbsoluteFill style={{ background: "linear-gradient(160deg, #2a0a14, #0a0a0f 60%)" }}>
      <Timer />
      <StepHeader step={4} label="Export to MP4" color={COLOR} />
      <div
        style={{
          position: "absolute",
          top: 760,
          left: 80,
          right: 80,
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <div
          style={{
            height: 200,
            background: `linear-gradient(135deg, ${COLOR}, #ff8e7c)`,
            borderRadius: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            color: "white",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 64,
            letterSpacing: "-0.02em",
            boxShadow: `0 12px 50px ${COLOR}80`,
          }}
        >
          <span style={{ fontSize: 80 }}>⬇</span>
          Export
        </div>
        <div>
          <div
            style={{
              color: "white",
              fontFamily: "ui-monospace, monospace",
              fontWeight: 700,
              fontSize: 28,
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Rendering...</span>
            <span style={{ color: COLOR }}>{Math.round(progress * 100)}%</span>
          </div>
          <div
            style={{
              height: 24,
              background: "rgba(255,255,255,0.1)",
              borderRadius: 12,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${COLOR}, #ff8e7c)`,
                boxShadow: `0 0 20px ${COLOR}`,
              }}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ============== Outro: Done (5s) ==============
const Outro: React.FC<{ url: string }> = ({ url }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inAnim = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const urlIn = spring({
    frame: frame - 24,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 50%, #1a3a1a 0%, #0a0a0f 70%)",
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
          fontSize: 200,
          color: "#22d3a8",
          textShadow: "0 0 80px rgba(34,211,168,0.7)",
          transform: `scale(${inAnim})`,
        }}
      >
        ✓
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 120,
          color: "white",
          letterSpacing: "-0.04em",
          lineHeight: 1,
          marginTop: 24,
          opacity: inAnim,
        }}
      >
        Posted.
      </div>
      <div
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 28,
          color: "white",
          background: "rgba(255,255,255,0.06)",
          border: "2px solid #7c5cff",
          padding: "18px 28px",
          borderRadius: 18,
          marginTop: 40,
          opacity: urlIn,
          transform: `scale(${urlIn})`,
          boxShadow: "0 0 40px rgba(124,92,255,0.5)",
          wordBreak: "break-all",
        }}
      >
        {url}
      </div>
    </AbsoluteFill>
  );
};

// ===============================================================
// SpeedRun composition — 60s = 1800 frames @ 30fps
// ===============================================================
export const SpeedRun: React.FC<SpeedRunProps> = ({ url }) => {
  return (
    <AbsoluteFill style={{ background: "#0a0a0f" }}>
      <Series>
        <Series.Sequence durationInFrames={150}>
          <Open />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <StepPick />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <StepType />
        </Series.Sequence>
        <Series.Sequence durationInFrames={330}>
          <StepAI />
        </Series.Sequence>
        <Series.Sequence durationInFrames={420}>
          <StepExport />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <Outro url={url} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
