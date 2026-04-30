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
// Battle — 60s vertical. 5 AIs, 1 prompt, very different answers.
// Sells the consensus value prop visually.
// =====================================================================

export type BattleProps = {
  prompt: string;
  url: string;
};

export const battleDefaults: BattleProps = {
  prompt: "5 morning habits that changed my life",
  url: "bbmw0-technologies-ai.vercel.app",
};

const FONT = "Inter, system-ui, -apple-system, sans-serif";

const PROVIDERS = [
  {
    id: "claude",
    label: "Claude",
    emoji: "🧠",
    color: "#d97757",
    answer: "Mornings I won. Five habits.",
  },
  {
    id: "gpt",
    label: "GPT",
    emoji: "🤖",
    color: "#10a37f",
    answer: "5 small mornings, big change.",
  },
  {
    id: "gemini",
    label: "Gemini",
    emoji: "💎",
    color: "#4285f4",
    answer: "Mornings, rewired. 5 habits.",
  },
  {
    id: "perplexity",
    label: "Perplexity",
    emoji: "🔎",
    color: "#20a3a3",
    answer: "Morning ritual: 5 ways.",
  },
  {
    id: "llama",
    label: "Llama",
    emoji: "🦙",
    color: "#0668e1",
    answer: "5 dawns. New me.",
  },
];

// ---------- Hook: 0-3s ----------
const Hook: React.FC<{ prompt: string }> = ({ prompt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fadeIn = spring({ frame, fps, config: { damping: 14, stiffness: 110 } });
  const fadeIn2 = spring({
    frame: frame - 14,
    fps,
    config: { damping: 14, stiffness: 110 },
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #2a1a55 0%, #0a0a0f 60%)",
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
          color: "#7c5cff",
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 32,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 24,
          opacity: fadeIn,
          transform: `translateY(${interpolate(fadeIn, [0, 1], [-20, 0])}px)`,
        }}
      >
        ✦  1 PROMPT  ✦  5 AIs  ✦
      </div>
      <div
        style={{
          color: "white",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 78,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          opacity: fadeIn2,
          transform: `translateY(${interpolate(fadeIn2, [0, 1], [40, 0])}px)`,
          textShadow: "0 0 40px rgba(124,92,255,0.6)",
        }}
      >
        Who writes
        <br />
        the best hook?
      </div>
      <div
        style={{
          marginTop: 36,
          color: "rgba(255,255,255,0.7)",
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 32,
          fontStyle: "italic",
          opacity: fadeIn2,
        }}
      >
        "{prompt}"
      </div>
    </AbsoluteFill>
  );
};

// ---------- Battle Grid: 3-50s — show all 5 answers ----------
const BattleGrid: React.FC<{ prompt: string }> = ({ prompt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Highlight rotates through providers — each one "wins" briefly
  const period = 90; // 3s each
  const activeIdx = Math.min(
    Math.floor(frame / period),
    PROVIDERS.length - 1,
  );

  return (
    <AbsoluteFill style={{ background: "#0a0a0f", padding: 48, gap: 16 }}>
      {/* Top label */}
      <div
        style={{
          textAlign: "center",
          color: "rgba(255,255,255,0.55)",
          fontFamily: FONT,
          fontSize: 22,
          fontWeight: 600,
          marginBottom: 8,
        }}
      >
        Prompt:{" "}
        <span style={{ color: "white", fontStyle: "italic" }}>
          "{prompt}"
        </span>
      </div>

      {/* 5 stacked answer cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18, flex: 1 }}>
        {PROVIDERS.map((p, i) => {
          const cardIn = spring({
            frame: frame - i * 8,
            fps,
            config: { damping: 16, stiffness: 90 },
          });
          const isActive = i === activeIdx;
          const scale = isActive ? 1.02 : 1;
          const pulse = isActive
            ? 1 + 0.012 * Math.sin((frame / fps) * Math.PI * 4)
            : 1;

          return (
            <div
              key={p.id}
              style={{
                flex: 1,
                background: isActive
                  ? `linear-gradient(135deg, ${p.color}40, ${p.color}10)`
                  : "rgba(255,255,255,0.03)",
                border: `2px solid ${isActive ? p.color : "rgba(255,255,255,0.08)"}`,
                borderRadius: 24,
                padding: "22px 28px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                opacity: cardIn,
                transform: `translateX(${interpolate(cardIn, [0, 1], [-60, 0])}px) scale(${scale * pulse})`,
                boxShadow: isActive
                  ? `0 12px 40px ${p.color}80, 0 0 0 1px ${p.color}40 inset`
                  : "none",
                transition: "all 250ms",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontFamily: FONT,
                }}
              >
                <span style={{ fontSize: 36 }}>{p.emoji}</span>
                <span
                  style={{
                    color: p.color,
                    fontWeight: 800,
                    fontSize: 22,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {p.label}
                </span>
                {isActive && (
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 16,
                      color: p.color,
                      background: "rgba(255,255,255,0.06)",
                      padding: "3px 10px",
                      borderRadius: 999,
                      border: `1px solid ${p.color}`,
                      fontWeight: 700,
                    }}
                  >
                    NOW
                  </span>
                )}
              </div>
              <div
                style={{
                  color: "white",
                  fontFamily: FONT,
                  fontSize: 36,
                  fontWeight: 800,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                "{p.answer}"
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- Consensus reveal: 50-60s ----------
const Consensus: React.FC<{ url: string }> = ({ url }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 0-30: zoom-in to "Winner: All of them."
  // 30-90: URL appears + sparkles
  const titleIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 80 },
  });
  const sub = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const urlIn = spring({
    frame: frame - 60,
    fps,
    config: { damping: 14, stiffness: 90 },
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
        overflow: "hidden",
      }}
    >
      {/* Sparkle ring */}
      {Array.from({ length: 16 }).map((_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        const r = 280 + 16 * Math.sin((frame + i * 4) / 8);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `calc(50% + ${Math.cos(angle) * r}px)`,
              top: `calc(50% + ${Math.sin(angle) * r}px)`,
              fontSize: 36,
              opacity: 0.5 + 0.5 * Math.sin((frame + i * 6) / 6),
              color: PROVIDERS[i % 5].color,
            }}
          >
            ✦
          </div>
        );
      })}

      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 56,
          color: "rgba(255,255,255,0.7)",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 16,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [-30, 0])}px)`,
        }}
      >
        🏆 The Winner
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 144,
          color: "white",
          letterSpacing: "-0.04em",
          lineHeight: 0.95,
          opacity: titleIn,
          transform: `scale(${0.8 + 0.2 * titleIn})`,
          textShadow: "0 0 60px rgba(124,92,255,0.7)",
          marginBottom: 32,
        }}
      >
        All of
        <br />
        them.
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 36,
          color: "rgba(255,255,255,0.85)",
          maxWidth: 720,
          lineHeight: 1.2,
          opacity: sub,
          marginBottom: 36,
        }}
      >
        BBMW0 asks all 5, picks the best of each field.
      </div>
      <div
        style={{
          fontFamily: "ui-monospace, monospace",
          fontSize: 30,
          color: "white",
          background: "rgba(255,255,255,0.06)",
          border: "2px solid #7c5cff",
          padding: "18px 28px",
          borderRadius: 18,
          opacity: urlIn,
          transform: `scale(${urlIn})`,
          boxShadow: "0 0 40px rgba(124,92,255,0.6)",
          wordBreak: "break-all",
        }}
      >
        {url}
      </div>
    </AbsoluteFill>
  );
};

// ===============================================================
// Battle composition — 60s = 1800 frames @ 30fps
// ===============================================================
export const Battle: React.FC<BattleProps> = ({ prompt, url }) => {
  return (
    <AbsoluteFill style={{ background: "#0a0a0f" }}>
      <Series>
        <Series.Sequence durationInFrames={90}>
          <Hook prompt={prompt} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={1410}>
          <BattleGrid prompt={prompt} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <Consensus url={url} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
