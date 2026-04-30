import {
  AbsoluteFill,
  Series,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import React from "react";

// =============================================================
// Tutorial — 60 second YouTube Short
// 7 segments, each with a distinct visual language. No repeated
// frames, no recycled phone mockup — every section is its own
// animation set.
// =============================================================

export type TutorialProps = {
  brand: string;
  url: string;
};

export const tutorialDefaults: TutorialProps = {
  brand: "BBMW0 Technologies AI",
  url: "github.com/bbmw96/bbmw0-technologies-ai",
};

// ---------- shared atoms ----------

const FONT = "Inter, system-ui, -apple-system, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const StepBadge: React.FC<{
  current: number;
  total: number;
  label: string;
  color: string;
}> = ({ current, total, label, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inAnim = spring({ frame, fps, config: { damping: 16, stiffness: 110 } });

  return (
    <div
      style={{
        position: "absolute",
        top: 80,
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        opacity: inAnim,
        transform: `translateY(${interpolate(inAnim, [0, 1], [-30, 0])}px)`,
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "rgba(255,255,255,0.06)",
          border: `1px solid ${color}`,
          padding: "10px 22px",
          borderRadius: 999,
          color: "white",
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          boxShadow: `0 0 30px ${color}40`,
        }}
      >
        <span style={{ color }}>STEP {current}</span>
        <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
        <span style={{ color: "rgba(255,255,255,0.7)" }}>OF {total}</span>
      </div>
      <div
        style={{
          color: "white",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 64,
          letterSpacing: "-0.02em",
          textAlign: "center",
          lineHeight: 1.05,
          padding: "0 60px",
          textShadow: `0 0 40px ${color}80`,
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              width: i + 1 === current ? 32 : 12,
              height: 12,
              borderRadius: 6,
              background: i + 1 <= current ? color : "rgba(255,255,255,0.18)",
              transition: "all 200ms",
              boxShadow: i + 1 === current ? `0 0 14px ${color}` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
};

const ProgressLine: React.FC<{
  durationInFrames: number;
  color: string;
}> = ({ durationInFrames, color }) => {
  const frame = useCurrentFrame();
  const progress = Math.min(frame / durationInFrames, 1);
  return (
    <div
      style={{
        position: "absolute",
        bottom: 36,
        left: 36,
        right: 36,
        height: 6,
        background: "rgba(255,255,255,0.18)",
        borderRadius: 3,
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: `${progress * 100}%`,
          height: "100%",
          background: color,
          borderRadius: 3,
          boxShadow: `0 0 12px ${color}`,
        }}
      />
    </div>
  );
};

// ---------- 0. Hook (3s) ----------
const HookOpen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const popIn = spring({ frame, fps, config: { damping: 8, stiffness: 130 } });
  const tilt = Math.sin(frame / 6) * 4;
  const fadeOutLine = interpolate(frame, [0, 30, 70, 90], [0, 0, 1, 1]);

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
          fontSize: 320,
          color: "#7c5cff",
          fontFamily: FONT,
          fontWeight: 900,
          lineHeight: 0.85,
          transform: `scale(${popIn}) rotate(${tilt}deg)`,
          textShadow: "0 0 80px rgba(124,92,255,0.8)",
        }}
      >
        ?
      </div>
      <div
        style={{
          color: "white",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 88,
          letterSpacing: "-0.03em",
          marginTop: 40,
          opacity: popIn,
          transform: `translateY(${interpolate(popIn, [0, 1], [40, 0])}px)`,
        }}
      >
        Wait, how?
      </div>
      <div
        style={{
          color: "rgba(255,255,255,0.65)",
          fontFamily: FONT,
          fontWeight: 500,
          fontSize: 36,
          marginTop: 28,
          opacity: fadeOutLine,
        }}
      >
        Make a Short in 60 seconds ↓
      </div>
    </AbsoluteFill>
  );
};

// ---------- 1. Pick a scene (8s) ----------
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

  // Each card "auto-swipes" through center every 36 frames after step badge animates in
  const start = 30;
  const period = 32;
  const activeIdx = Math.min(
    Math.floor(Math.max(0, frame - start) / period),
    cards.length - 1,
  );
  const localProgress =
    ((Math.max(0, frame - start) % period) / period) * 1;

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(160deg, #0a1a2a 0%, #0a0a0f 60%)",
        overflow: "hidden",
      }}
    >
      <StepBadge
        current={1}
        total={5}
        label="Pick a scene"
        color={COLOR}
      />

      {/* Card carousel */}
      <div
        style={{
          position: "absolute",
          top: 720,
          left: 0,
          right: 0,
          height: 600,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          perspective: 1600,
        }}
      >
        {cards.map((c, i) => {
          const offset = i - activeIdx - localProgress;
          const x = offset * 360;
          const scale =
            offset === 0
              ? 1.05
              : Math.max(0.6, 1 - Math.abs(offset) * 0.18);
          const rotate = offset * -8;
          const opacity =
            Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.25;

          return (
            <div
              key={c.id}
              style={{
                position: "absolute",
                width: 440,
                height: 540,
                borderRadius: 32,
                background: `linear-gradient(160deg, ${c.color}, ${c.color}80)`,
                boxShadow: `0 30px 80px ${c.color}50, 0 0 0 1px rgba(255,255,255,0.08) inset`,
                transform: `translateX(${x}px) scale(${scale}) rotateY(${rotate}deg)`,
                opacity,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 28,
                fontFamily: FONT,
                color: "white",
                transition: "all 0ms",
              }}
            >
              <div style={{ fontSize: 200 }}>{c.emoji}</div>
              <div
                style={{
                  fontSize: 56,
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  textShadow: "0 4px 20px rgba(0,0,0,0.5)",
                }}
              >
                {c.id}
              </div>
            </div>
          );
        })}
      </div>

      {/* Big swipe hint */}
      <div
        style={{
          position: "absolute",
          bottom: 220,
          left: 0,
          right: 0,
          textAlign: "center",
          color: COLOR,
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: 36,
          letterSpacing: "0.1em",
          opacity: 0.7 + 0.3 * Math.sin(frame / 8),
        }}
      >
        ← swipe →
      </div>

      <ProgressLine durationInFrames={240} color={COLOR} />
    </AbsoluteFill>
  );
};

// ---------- 2. Edit text (9s) — typewriter ----------
const StepText: React.FC = () => {
  const frame = useCurrentFrame();
  const COLOR = "#ffb547";

  const fullText = "POV: you stop scrolling";
  const typeStart = 30;
  const typeSpeed = 5; // frames per character
  const typedLength = Math.max(
    0,
    Math.min(fullText.length, Math.floor((frame - typeStart) / typeSpeed)),
  );
  const typed = fullText.slice(0, typedLength);
  const showCursor = Math.floor(frame / 8) % 2 === 0;

  // Live preview reflects what's typed
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(160deg, #2a1f0a 0%, #0a0a0f 60%)",
      }}
    >
      <StepBadge
        current={2}
        total={5}
        label="Type your text"
        color={COLOR}
      />

      {/* Big text input mockup */}
      <div
        style={{
          position: "absolute",
          top: 540,
          left: 60,
          right: 60,
          background: "#1a1a26",
          borderRadius: 28,
          padding: 36,
          border: `2px solid ${COLOR}`,
          boxShadow: `0 0 40px ${COLOR}40, inset 0 0 20px ${COLOR}20`,
        }}
      >
        <div
          style={{
            color: COLOR,
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          ✎ Headline
        </div>
        <div
          style={{
            color: "white",
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: 56,
            lineHeight: 1.15,
            minHeight: 120,
            letterSpacing: "-0.01em",
          }}
        >
          {typed}
          <span
            style={{
              opacity: showCursor ? 1 : 0,
              color: COLOR,
              marginLeft: 4,
            }}
          >
            ▍
          </span>
        </div>
      </div>

      {/* Live preview reflects */}
      <div
        style={{
          position: "absolute",
          top: 1000,
          left: 60,
          right: 60,
          height: 720,
          borderRadius: 32,
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(124,92,255,0.4) 0%, #050510 70%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          textAlign: "center",
          border: "1px solid #2a2a3a",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            color: "rgba(255,255,255,0.4)",
            fontFamily: FONT,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "0.1em",
          }}
        >
          ⦿ LIVE PREVIEW
        </div>
        <div style={{ fontSize: 140, marginBottom: 28 }}>👀</div>
        <div
          style={{
            color: "white",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 64,
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            minHeight: 160,
            textShadow: "0 0 40px rgba(124,92,255,0.6)",
          }}
        >
          {typed || " "}
        </div>
      </div>

      <ProgressLine durationInFrames={270} color={COLOR} />
    </AbsoluteFill>
  );
};

// ---------- 3. Pick color (8s) ----------
const StepColor: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const COLOR = "#ff5cb1";

  const palette = [
    "#7c5cff",
    "#ff5cb1",
    "#22d3a8",
    "#ffb547",
    "#ff5e7e",
    "#5cc8ff",
    "#a78bfa",
    "#f472b6",
  ];

  const start = 36;
  const period = 22;
  const idx = Math.min(
    Math.floor(Math.max(0, frame - start) / period),
    palette.length - 1,
  );
  const activeColor = palette[idx];

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(160deg, #2a0a1f 0%, #0a0a0f 60%)",
      }}
    >
      <StepBadge
        current={3}
        total={5}
        label="Pick a color"
        color={COLOR}
      />

      {/* Big color sphere reflecting current selection */}
      <div
        style={{
          position: "absolute",
          top: 580,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 480,
            height: 480,
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, white 0%, ${activeColor} 30%, ${activeColor}40 100%)`,
            boxShadow: `0 0 120px ${activeColor}, inset 0 -40px 80px rgba(0,0,0,0.4)`,
            transition: "all 200ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </div>

      {/* Color hex label */}
      <div
        style={{
          position: "absolute",
          top: 1140,
          left: 0,
          right: 0,
          textAlign: "center",
          color: "white",
          fontFamily: MONO,
          fontWeight: 700,
          fontSize: 56,
          letterSpacing: "0.05em",
          textShadow: `0 0 30px ${activeColor}`,
        }}
      >
        {activeColor.toUpperCase()}
      </div>

      {/* Palette grid */}
      <div
        style={{
          position: "absolute",
          bottom: 200,
          left: 80,
          right: 80,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 28,
        }}
      >
        {palette.map((c, i) => {
          const isActive = i === idx;
          const tapPulse =
            isActive
              ? 1 +
                0.06 *
                  Math.sin(((frame - start - i * period) / fps) * Math.PI * 4)
              : 1;
          return (
            <div
              key={c}
              style={{
                aspectRatio: "1",
                borderRadius: "50%",
                background: c,
                border: isActive
                  ? "8px solid white"
                  : "4px solid rgba(255,255,255,0.1)",
                boxShadow: isActive
                  ? `0 0 40px ${c}, 0 8px 30px rgba(0,0,0,0.4)`
                  : "0 4px 14px rgba(0,0,0,0.4)",
                transform: `scale(${tapPulse})`,
                transition: "all 200ms",
              }}
            />
          );
        })}
      </div>

      <ProgressLine durationInFrames={240} color={COLOR} />
    </AbsoluteFill>
  );
};

// ---------- 4. AI fill (10s) ----------
const StepAI: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const COLOR = "#22d3a8";

  // Phase 1 (30-100): typing the prompt
  // Phase 2 (100-130): sparkle burst
  // Phase 3 (130+):  fields populate one by one
  const promptText = "morning coffee routines";
  const typingStart = 30;
  const typedChars = Math.max(
    0,
    Math.min(promptText.length, Math.floor((frame - typingStart) / 3)),
  );
  const typed = promptText.slice(0, typedChars);

  const sparkleStart = 100;
  const sparkleProgress = Math.max(
    0,
    Math.min(1, (frame - sparkleStart) / 25),
  );

  const fillStart = 130;
  const fields = [
    { label: "HEADLINE", value: "POV: you actually woke up early" },
    { label: "EMOJI", value: "☕" },
    { label: "BG", value: "#0a0a0f" },
    { label: "ACCENT", value: "#22d3a8" },
  ];

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(160deg, #0a2a22 0%, #0a0a0f 60%)",
        overflow: "hidden",
      }}
    >
      <StepBadge
        current={4}
        total={5}
        label="Or just describe it"
        color={COLOR}
      />

      {/* Prompt input */}
      <div
        style={{
          position: "absolute",
          top: 580,
          left: 60,
          right: 60,
          background: "linear-gradient(90deg, rgba(34,211,168,0.12), rgba(124,92,255,0.08))",
          border: `2px solid ${COLOR}`,
          borderRadius: 28,
          padding: 36,
          display: "flex",
          alignItems: "center",
          gap: 24,
          boxShadow: `0 0 40px ${COLOR}40`,
        }}
      >
        <div style={{ fontSize: 64 }}>✨</div>
        <div
          style={{
            color: "white",
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 44,
            flex: 1,
            minHeight: 60,
            letterSpacing: "-0.01em",
          }}
        >
          {typed || (
            <span style={{ color: "rgba(255,255,255,0.3)" }}>
              describe your video…
            </span>
          )}
          {typedChars < promptText.length && frame >= typingStart && (
            <span
              style={{
                opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0,
                color: COLOR,
                marginLeft: 2,
              }}
            >
              ▍
            </span>
          )}
        </div>
      </div>

      {/* Sparkle burst */}
      {frame >= sparkleStart && sparkleProgress < 1 && (
        <div
          style={{
            position: "absolute",
            top: 600,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: 10 }).map((_, i) => {
            const angle = (i / 10) * Math.PI * 2;
            const r = sparkleProgress * 280;
            const opacity = Math.max(0, 1 - sparkleProgress);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 540 + Math.cos(angle) * r,
                  top: 100 + Math.sin(angle) * r,
                  fontSize: 56,
                  opacity,
                  transform: `rotate(${i * 45}deg)`,
                }}
              >
                ✦
              </div>
            );
          })}
        </div>
      )}

      {/* Fields populate */}
      <div
        style={{
          position: "absolute",
          top: 940,
          left: 60,
          right: 60,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {fields.map((f, i) => {
          const fadeIn = spring({
            frame: frame - (fillStart + i * 14),
            fps,
            config: { damping: 14, stiffness: 110 },
          });
          return (
            <div
              key={f.label}
              style={{
                background: "#1a1a26",
                border: "1px solid #2a2a3a",
                borderRadius: 18,
                padding: "20px 28px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: fadeIn,
                transform: `translateX(${interpolate(
                  fadeIn,
                  [0, 1],
                  [-60, 0],
                )}px)`,
                boxShadow:
                  fadeIn > 0.7 ? `0 0 0 2px ${COLOR}40` : "none",
              }}
            >
              <div
                style={{
                  color: COLOR,
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: "0.12em",
                }}
              >
                {f.label}
              </div>
              <div
                style={{
                  color: "white",
                  fontFamily: f.label === "BG" || f.label === "ACCENT" ? MONO : FONT,
                  fontWeight: 600,
                  fontSize: f.label === "EMOJI" ? 44 : 28,
                  textAlign: "right",
                  maxWidth: "70%",
                }}
              >
                {f.value}
              </div>
            </div>
          );
        })}
      </div>

      <ProgressLine durationInFrames={300} color={COLOR} />
    </AbsoluteFill>
  );
};

// ---------- 5. Export (9s) ----------
const StepExport: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const COLOR = "#ff5e7e";

  const tapStart = 50;
  const tapProgress = Math.max(0, Math.min(1, (frame - tapStart) / 8));
  const tapScale = 1 - tapProgress * 0.06;

  const renderStart = 60;
  const renderEnd = 200;
  const renderProgress = Math.max(
    0,
    Math.min(1, (frame - renderStart) / (renderEnd - renderStart)),
  );

  const fileFlyStart = 210;
  const fileFly = spring({
    frame: frame - fileFlyStart,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  const ytStart = 240;
  const ytIn = spring({
    frame: frame - ytStart,
    fps,
    config: { damping: 14, stiffness: 110 },
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(160deg, #2a0a14 0%, #0a0a0f 60%)",
        overflow: "hidden",
      }}
    >
      <StepBadge
        current={5}
        total={5}
        label="Tap to export"
        color={COLOR}
      />

      {/* Big export button */}
      <div
        style={{
          position: "absolute",
          top: 660,
          left: 80,
          right: 80,
          height: 220,
          borderRadius: 36,
          background: `linear-gradient(135deg, ${COLOR}, #ff8e7c)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          color: "white",
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 72,
          letterSpacing: "-0.02em",
          transform: `scale(${tapScale})`,
          boxShadow:
            renderProgress > 0
              ? "0 8px 30px rgba(0,0,0,0.4)"
              : `0 16px 60px ${COLOR}80`,
          opacity: renderProgress < 1 ? 1 : 0.6,
        }}
      >
        <span style={{ fontSize: 80 }}>⬇</span>
        Export to MP4
      </div>

      {/* Finger tap circle */}
      {frame < tapStart + 20 && frame >= tapStart - 20 && (
        <div
          style={{
            position: "absolute",
            top: 760,
            right: 200,
            width: 140,
            height: 140,
            borderRadius: "50%",
            border: "8px solid white",
            opacity: 1 - Math.max(0, (frame - tapStart) / 20),
            transform: `scale(${1 + (frame - tapStart) / 20})`,
            zIndex: 10,
          }}
        />
      )}

      {/* Render progress */}
      {frame >= renderStart && (
        <div
          style={{
            position: "absolute",
            top: 920,
            left: 80,
            right: 80,
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.7)",
              fontFamily: MONO,
              fontWeight: 700,
              fontSize: 28,
              marginBottom: 14,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>Rendering Showcase…</span>
            <span style={{ color: COLOR }}>
              {Math.round(renderProgress * 100)}%
            </span>
          </div>
          <div
            style={{
              height: 18,
              background: "rgba(255,255,255,0.12)",
              borderRadius: 9,
              overflow: "hidden",
              border: "1px solid #2a2a3a",
            }}
          >
            <div
              style={{
                width: `${renderProgress * 100}%`,
                height: "100%",
                background: `linear-gradient(90deg, ${COLOR}, #ff8e7c)`,
                boxShadow: `0 0 20px ${COLOR}`,
                transition: "width 50ms linear",
              }}
            />
          </div>
        </div>
      )}

      {/* MP4 file flying out */}
      {frame >= fileFlyStart && (
        <div
          style={{
            position: "absolute",
            top: interpolate(fileFly, [0, 1], [1100, 1340]),
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: fileFly,
            transform: `scale(${fileFly})`,
            zIndex: 6,
          }}
        >
          <div
            style={{
              width: 220,
              height: 280,
              borderRadius: 22,
              background: "linear-gradient(160deg, #1a1a26, #0a0a0f)",
              border: `3px solid ${COLOR}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              boxShadow: `0 12px 40px ${COLOR}80`,
            }}
          >
            <div style={{ fontSize: 96 }}>🎬</div>
            <div
              style={{
                color: "white",
                fontFamily: MONO,
                fontWeight: 700,
                fontSize: 24,
              }}
            >
              short.mp4
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.5)",
                fontFamily: MONO,
                fontSize: 16,
              }}
            >
              1080×1920 · 60s
            </div>
          </div>
        </div>
      )}

      {/* YouTube confirm */}
      {frame >= ytStart && (
        <div
          style={{
            position: "absolute",
            top: 1500,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            opacity: ytIn,
            transform: `translateY(${interpolate(ytIn, [0, 1], [40, 0])}px)`,
          }}
        >
          <div
            style={{
              padding: "20px 36px",
              background: "#FF0000",
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              gap: 16,
              color: "white",
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 32,
              boxShadow: "0 12px 40px rgba(255,0,0,0.5)",
            }}
          >
            <span style={{ fontSize: 40 }}>▶</span>
            Posted to Shorts
          </div>
        </div>
      )}

      <ProgressLine durationInFrames={270} color={COLOR} />
    </AbsoluteFill>
  );
};

// ---------- 6. CTA (13s) — final call to action ----------
const TutCTA: React.FC<{ url: string; brand: string }> = ({ url, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const COLOR = "#7c5cff";

  const titleIn = spring({ frame, fps, config: { damping: 14, stiffness: 90 } });
  const urlIn = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const brandIn = spring({
    frame: frame - 240,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  // Confetti dots
  const confetti = Array.from({ length: 30 }).map((_, i) => {
    const seed = i * 31.7;
    const x = (seed * 17.3) % 1080;
    const startY = -50 - ((seed * 7.1) % 200);
    const speed = 4 + ((seed * 0.13) % 4);
    const y = startY + frame * speed;
    const rotate = frame * (3 + ((seed * 0.05) % 4));
    const colors = ["#7c5cff", "#ff5cb1", "#22d3a8", "#ffb547", "#5cc8ff"];
    const color = colors[i % colors.length];
    return { x, y, rotate, color };
  });

  const arrowPulse = (Math.sin(frame / 6) + 1) / 2;

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, #2a1a55 0%, #0a0a0f 70%)",
        overflow: "hidden",
      }}
    >
      {/* Confetti */}
      {confetti.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: c.x,
            top: c.y,
            width: 14,
            height: 28,
            background: c.color,
            borderRadius: 3,
            transform: `rotate(${c.rotate}deg)`,
            opacity: 0.85,
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          top: 380,
          left: 0,
          right: 0,
          textAlign: "center",
          zIndex: 5,
        }}
      >
        <h1
          style={{
            color: "white",
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 140,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            margin: 0,
            opacity: titleIn,
            transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)`,
            textShadow: `0 0 60px ${COLOR}80`,
          }}
        >
          Now you.
        </h1>
        <h2
          style={{
            color: COLOR,
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 100,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            margin: "12px 0 0",
            opacity: titleIn,
          }}
        >
          Try it.
        </h2>
      </div>

      <div
        style={{
          position: "absolute",
          top: 920,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 120,
          color: COLOR,
          transform: `translateY(${arrowPulse * 16 - 8}px)`,
          opacity: titleIn,
        }}
      >
        ↓
      </div>

      <div
        style={{
          position: "absolute",
          top: 1080,
          left: 60,
          right: 60,
          padding: "32px 40px",
          background: "rgba(255,255,255,0.04)",
          border: `3px solid ${COLOR}`,
          borderRadius: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          opacity: urlIn,
          transform: `scale(${urlIn})`,
          boxShadow: `0 0 60px ${COLOR}80, inset 0 0 30px ${COLOR}30`,
          zIndex: 5,
        }}
      >
        <div
          style={{
            fontSize: 56,
          }}
        >
          🐙
        </div>
        <div
          style={{
            color: "white",
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 38,
            letterSpacing: "-0.01em",
            wordBreak: "break-all",
          }}
        >
          {url}
        </div>
      </div>

      {/* Brand outro */}
      <div
        style={{
          position: "absolute",
          top: 1480,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          opacity: brandIn,
          transform: `translateY(${interpolate(brandIn, [0, 1], [30, 0])}px)`,
          zIndex: 5,
        }}
      >
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: 24,
            background: `linear-gradient(135deg, ${COLOR}, #ff5cb1)`,
            display: "grid",
            placeItems: "center",
            color: "white",
            fontSize: 52,
            fontWeight: 900,
            fontFamily: FONT,
            boxShadow: `0 12px 40px ${COLOR}90`,
          }}
        >
          B
        </div>
        <div
          style={{
            color: "rgba(255,255,255,0.85)",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 36,
            letterSpacing: "-0.01em",
          }}
        >
          {brand}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ===========================================================
// Tutorial composition — 60s = 1800 frames
// ===========================================================
export const Tutorial: React.FC<TutorialProps> = ({ brand, url }) => {
  return (
    <AbsoluteFill style={{ background: "#0a0a0f" }}>
      <Series>
        <Series.Sequence durationInFrames={90}>
          <HookOpen />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <StepPick />
        </Series.Sequence>
        <Series.Sequence durationInFrames={270}>
          <StepText />
        </Series.Sequence>
        <Series.Sequence durationInFrames={240}>
          <StepColor />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <StepAI />
        </Series.Sequence>
        <Series.Sequence durationInFrames={270}>
          <StepExport />
        </Series.Sequence>
        <Series.Sequence durationInFrames={390}>
          <TutCTA url={url} brand={brand} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
