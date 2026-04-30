import {
  AbsoluteFill,
  Audio,
  Sequence,
  Series,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import React from "react";

// Voiceover offsets (in frames at 30fps) — match each chapter's start.
// File durations: ch1 40s, ch2 102s, ch3 128s, ch4 133s, ch5 117s,
// ch6 120s, ch7 90s, ch8 99s, ch9 41s. Each fits comfortably within
// its chapter window with breathing room.
const VOICEOVER = [
  { from: 0, file: "voiceover-ch1.mp3" },        // 0:00 → Ch1 Intro (60s)
  { from: 1800, file: "voiceover-ch2.mp3" },     // 1:00 → Ch2 Why (180s)
  { from: 7200, file: "voiceover-ch3.mp3" },     // 4:00 → Ch3 Tour (300s)
  { from: 16200, file: "voiceover-ch4.mp3" },    // 9:00 → Ch4 AI (300s)
  { from: 25200, file: "voiceover-ch5.mp3" },    // 14:00 → Ch5 Demo (300s)
  { from: 34200, file: "voiceover-ch6.mp3" },    // 19:00 → Ch6 Tech (240s)
  { from: 41400, file: "voiceover-ch7.mp3" },    // 23:00 → Ch7 Deploy (180s)
  { from: 46800, file: "voiceover-ch8.mp3" },    // 26:00 → Ch8 Roadmap (180s)
  { from: 52200, file: "voiceover-ch9.mp3" },    // 29:00 → Ch9 Outro (60s)
];

// =====================================================================
// LongForm — 30-minute explainer for YouTube. 1920×1080 landscape.
// Visual-first (no voiceover required). Chapter-based structure.
// =====================================================================

export type LongFormProps = {
  url: string;
  brand: string;
};

export const longFormDefaults: LongFormProps = {
  url: "bbmw0-technologies-ai.vercel.app",
  brand: "BBMW0 Technologies AI",
};

const FONT = "Inter, system-ui, -apple-system, sans-serif";
const MONO = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";

const COLORS = {
  bg: "#0a0a0f",
  bgElev: "#12121a",
  text: "#f5f5fa",
  dim: "#a0a0b8",
  mute: "#6a6a85",
  border: "#2a2a3a",
  accent: "#7c5cff",
  pink: "#ff5cb1",
  teal: "#22d3a8",
  amber: "#ffb547",
  rose: "#ff5e7e",
  sky: "#5cc8ff",
};

// ============== Persistent Chrome (top bar + bottom progress) ==============

const ChapterBar: React.FC<{ chapter: number; total: number; label: string }> =
  ({ chapter, total, label }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const inAnim = spring({ frame, fps, config: { damping: 16, stiffness: 110 } });

    return (
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 32,
          right: 32,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          opacity: inAnim,
          zIndex: 50,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            background: "rgba(255,255,255,0.04)",
            padding: "10px 18px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.pink})`,
              display: "grid",
              placeItems: "center",
              color: "white",
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 14,
            }}
          >
            B
          </div>
          <span
            style={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: 16,
              color: COLORS.text,
            }}
          >
            BBMW0 Technologies AI
          </span>
        </div>
        <div
          style={{
            fontFamily: FONT,
            color: COLORS.dim,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.1em",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ color: COLORS.accent }}>
            CHAPTER {chapter.toString().padStart(2, "0")}
          </span>
          <span>·</span>
          <span>{label}</span>
          <span>·</span>
          <span>OF {total.toString().padStart(2, "0")}</span>
        </div>
      </div>
    );
  };

const TimeProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const totalSec = durationInFrames / fps;
  const elapsedSec = frame / fps;
  const pct = Math.min(1, elapsedSec / totalSec);
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 32,
        left: 32,
        right: 32,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 50,
      }}
    >
      <div
        style={{
          height: 4,
          background: "rgba(255,255,255,0.12)",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct * 100}%`,
            height: "100%",
            background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.pink})`,
            boxShadow: `0 0 12px ${COLORS.accent}`,
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: MONO,
          fontSize: 12,
          color: COLORS.dim,
          fontWeight: 600,
        }}
      >
        <span>{fmt(elapsedSec)}</span>
        <span>{fmt(totalSec)}</span>
      </div>
    </div>
  );
};

// ============== Slide primitives ==============

const TitleSlide: React.FC<{
  eyebrow?: string;
  title: string;
  subtitle?: string;
  color?: string;
}> = ({ eyebrow, title, subtitle, color = COLORS.accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const b = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const c = spring({
    frame: frame - 30,
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
        padding: "0 100px",
        textAlign: "center",
      }}
    >
      {eyebrow && (
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: 24,
            color,
            letterSpacing: "0.2em",
            marginBottom: 28,
            opacity: a,
            transform: `translateY(${interpolate(a, [0, 1], [-16, 0])}px)`,
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </div>
      )}
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 132,
          color: "white",
          letterSpacing: "-0.04em",
          lineHeight: 0.95,
          maxWidth: 1500,
          opacity: b,
          transform: `translateY(${interpolate(b, [0, 1], [40, 0])}px)`,
          textShadow: `0 0 40px ${color}40`,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 500,
            fontSize: 36,
            color: COLORS.dim,
            marginTop: 32,
            maxWidth: 1200,
            lineHeight: 1.2,
            opacity: c,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};

const BulletSlide: React.FC<{
  heading: string;
  bullets: string[];
  color?: string;
}> = ({ heading, bullets, color = COLORS.accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 140px",
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
          marginBottom: 60,
          opacity: headIn,
          transform: `translateY(${interpolate(headIn, [0, 1], [-20, 0])}px)`,
        }}
      >
        {heading}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {bullets.map((b, i) => {
          const start = 12 + i * 14;
          const inAnim = spring({
            frame: frame - start,
            fps,
            config: { damping: 14, stiffness: 110 },
          });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 32,
                opacity: inAnim,
                transform: `translateX(${interpolate(inAnim, [0, 1], [-50, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: `linear-gradient(135deg, ${color}, ${color}90)`,
                  display: "grid",
                  placeItems: "center",
                  color: "white",
                  fontFamily: FONT,
                  fontWeight: 900,
                  fontSize: 28,
                  boxShadow: `0 4px 18px ${color}60`,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: 48,
                  color: "white",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                {b}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StatSlide: React.FC<{
  bigNumber: string;
  label: string;
  context: string;
  color?: string;
}> = ({ bigNumber, label, context, color = COLORS.accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 10, stiffness: 130 } });
  const b = spring({
    frame: frame - 24,
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
        padding: "0 100px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 800,
          fontSize: 24,
          color,
          letterSpacing: "0.18em",
          marginBottom: 32,
          opacity: a,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 320,
          color: "white",
          letterSpacing: "-0.05em",
          lineHeight: 0.85,
          transform: `scale(${a})`,
          textShadow: `0 0 80px ${color}80`,
        }}
      >
        {bigNumber}
      </div>
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 600,
          fontSize: 36,
          color: COLORS.dim,
          marginTop: 36,
          maxWidth: 1000,
          opacity: b,
          lineHeight: 1.3,
        }}
      >
        {context}
      </div>
    </div>
  );
};

const CodeSlide: React.FC<{ heading: string; code: string; color?: string }> = ({
  heading,
  code,
  color = COLORS.accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const codeIn = spring({
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
        justifyContent: "center",
        padding: "0 120px",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 72,
          color: "white",
          letterSpacing: "-0.03em",
          marginBottom: 40,
          opacity: headIn,
          transform: `translateY(${interpolate(headIn, [0, 1], [-20, 0])}px)`,
        }}
      >
        {heading}
      </div>
      <div
        style={{
          background: COLORS.bgElev,
          border: `2px solid ${color}40`,
          borderRadius: 18,
          padding: "32px 40px",
          fontFamily: MONO,
          fontSize: 24,
          color: COLORS.text,
          lineHeight: 1.5,
          whiteSpace: "pre",
          overflow: "hidden",
          opacity: codeIn,
          transform: `translateY(${interpolate(codeIn, [0, 1], [20, 0])}px)`,
          boxShadow: `0 12px 40px rgba(0,0,0,0.3)`,
        }}
      >
        {code}
      </div>
    </div>
  );
};

const ComparisonSlide: React.FC<{
  heading: string;
  left: { label: string; items: string[]; color: string };
  right: { label: string; items: string[]; color: string };
}> = ({ heading, left, right }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headIn = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const leftIn = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const rightIn = spring({
    frame: frame - 26,
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
        justifyContent: "center",
        padding: "0 100px",
      }}
    >
      <div
        style={{
          fontFamily: FONT,
          fontWeight: 900,
          fontSize: 76,
          color: "white",
          letterSpacing: "-0.03em",
          textAlign: "center",
          marginBottom: 60,
          opacity: headIn,
        }}
      >
        {heading}
      </div>
      <div style={{ display: "flex", gap: 40 }}>
        {[
          { side: left, anim: leftIn, dx: -40 },
          { side: right, anim: rightIn, dx: 40 },
        ].map((s, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              background: `${s.side.color}10`,
              border: `2px solid ${s.side.color}`,
              borderRadius: 24,
              padding: "32px 36px",
              opacity: s.anim,
              transform: `translateX(${interpolate(s.anim, [0, 1], [s.dx, 0])}px)`,
              boxShadow: `0 12px 40px ${s.side.color}40`,
            }}
          >
            <div
              style={{
                fontFamily: FONT,
                fontWeight: 800,
                fontSize: 32,
                color: s.side.color,
                letterSpacing: "0.1em",
                marginBottom: 24,
                textTransform: "uppercase",
              }}
            >
              {s.side.label}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                fontFamily: FONT,
                fontWeight: 600,
                fontSize: 32,
                color: COLORS.text,
                lineHeight: 1.3,
              }}
            >
              {s.side.items.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: 14 }}>
                  <span style={{ color: s.side.color }}>•</span>
                  <span>{it}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============== Chapter scenes ==============

// Helper to wrap a slide with chapter chrome
const Chapter: React.FC<{
  chapter: number;
  label: string;
  total: number;
  bg?: string;
  children: React.ReactNode;
}> = ({ chapter, label, total, bg, children }) => (
  <AbsoluteFill style={{ background: bg ?? COLORS.bg }}>
    <ChapterBar chapter={chapter} total={total} label={label} />
    {children}
    <TimeProgressBar />
  </AbsoluteFill>
);

// ============== Chapter 1: Intro (60s) ==============
const Ch1Intro: React.FC<{ brand: string }> = ({ brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 0-180 frames: brand reveal
  // 180-540 frames: "BBMW0 Technologies AI" big
  // 540-720 frames: "The full walkthrough"
  // 720-1800 frames: chapter list

  if (frame < 180) {
    const a = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
    return (
      <Chapter chapter={1} label="Intro" total={9} bg={COLORS.bg}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              width: 240,
              height: 240,
              borderRadius: 56,
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.pink}, ${COLORS.amber})`,
              display: "grid",
              placeItems: "center",
              color: "white",
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 140,
              transform: `scale(${a})`,
              boxShadow: `0 20px 80px ${COLORS.accent}80`,
            }}
          >
            B
          </div>
        </div>
      </Chapter>
    );
  }

  if (frame < 540) {
    return (
      <Chapter chapter={1} label="Intro" total={9}>
        <TitleSlide
          eyebrow="The full walkthrough"
          title={brand}
          subtitle="A 30-minute tour. Why it exists, how it works, what's inside."
        />
      </Chapter>
    );
  }

  if (frame < 720) {
    return (
      <Chapter chapter={1} label="Intro" total={9}>
        <TitleSlide title="What you'll learn." color={COLORS.pink} />
      </Chapter>
    );
  }

  // Chapter list
  const chapters = [
    "Why mobile-first?",
    "Tour of the editor",
    "5 AIs working as one",
    "Live demo: 3 videos",
    "How it's built",
    "Deploy your own",
    "Roadmap",
    "Outro & thanks",
  ];
  return (
    <Chapter chapter={1} label="Intro" total={9}>
      <BulletSlide
        heading="What you'll learn"
        bullets={chapters}
        color={COLORS.accent}
      />
    </Chapter>
  );
};

// ============== Chapter 2: Why mobile-first (180s) ==============
const Ch2Why: React.FC = () => {
  const frame = useCurrentFrame();
  // 0-450 (15s): chapter title
  // 450-1800 (45s): stat 1 — phone usage
  // 1800-3150 (45s): stat 2 — desktop editors
  // 3150-4500 (45s): comparison
  // 4500-5400 (30s): conclusion

  if (frame < 450) {
    return (
      <Chapter chapter={2} label="Why mobile-first" total={9}>
        <TitleSlide
          eyebrow="Chapter 2"
          title="Why mobile-first?"
          subtitle="If most of the world is on a phone, why isn't your editor?"
          color={COLORS.sky}
        />
      </Chapter>
    );
  }
  if (frame < 1800) {
    return (
      <Chapter chapter={2} label="Why mobile-first" total={9}>
        <StatSlide
          bigNumber="5h+"
          label="Average daily phone use"
          context="The phone is no longer the second screen. It's the primary one. Tools should match."
          color={COLORS.sky}
        />
      </Chapter>
    );
  }
  if (frame < 3150) {
    return (
      <Chapter chapter={2} label="Why mobile-first" total={9}>
        <StatSlide
          bigNumber="0%"
          label="Of pro video editors built for phones"
          context="Premiere, Final Cut, DaVinci, even web tools — all assume a desktop."
          color={COLORS.amber}
        />
      </Chapter>
    );
  }
  if (frame < 4500) {
    return (
      <Chapter chapter={2} label="Why mobile-first" total={9}>
        <ComparisonSlide
          heading="Two design philosophies"
          left={{
            label: "Desktop-first",
            color: COLORS.rose,
            items: [
              "Multi-panel layout",
              "Hover states everywhere",
              "Tiny click targets",
              "Squeezed onto phones later",
            ],
          }}
          right={{
            label: "Mobile-first",
            color: COLORS.teal,
            items: [
              "9:16 preview by default",
              "Tap targets ≥44pt",
              "One-thumb operation",
              "Adapts up to desktop",
            ],
          }}
        />
      </Chapter>
    );
  }
  return (
    <Chapter chapter={2} label="Why mobile-first" total={9}>
      <TitleSlide
        title="Start where the user is."
        subtitle="That's the whole brief."
        color={COLORS.teal}
      />
    </Chapter>
  );
};

// ============== Chapter 3: Tour of the editor (300s) ==============
const Ch3Tour: React.FC = () => {
  const frame = useCurrentFrame();
  // 6 sub-segments of 50s each
  const seg = Math.floor(frame / 1500);

  if (seg === 0) {
    return (
      <Chapter chapter={3} label="Tour" total={9}>
        <TitleSlide
          eyebrow="Chapter 3"
          title="Tour of the editor"
          subtitle="Five scenes, one editor, every detail explained."
          color={COLORS.pink}
        />
      </Chapter>
    );
  }
  if (seg === 1) {
    return (
      <Chapter chapter={3} label="Hook" total={9}>
        <BulletSlide
          heading="The Hook scene"
          bullets={[
            "Big bouncing emoji + giant headline",
            "Spring animation pops it in",
            "Edit text + emoji + colors",
            "Default duration: 5 seconds",
          ]}
          color={COLORS.accent}
        />
      </Chapter>
    );
  }
  if (seg === 2) {
    return (
      <Chapter chapter={3} label="Title" total={9}>
        <BulletSlide
          heading="The Title scene"
          bullets={[
            "Brand mark + main title",
            "Animated underline grows",
            "Subtitle slides in below",
            "Best for product reveals",
          ]}
          color={COLORS.pink}
        />
      </Chapter>
    );
  }
  if (seg === 3) {
    return (
      <Chapter chapter={3} label="Bullets" total={9}>
        <BulletSlide
          heading="The Bullets scene"
          bullets={[
            "Heading + 3 list items",
            "Each bullet slides in left-to-right",
            "Numbered badges for each",
            "Used for comparison or features",
          ]}
          color={COLORS.teal}
        />
      </Chapter>
    );
  }
  if (seg === 4) {
    return (
      <Chapter chapter={3} label="Quote" total={9}>
        <BulletSlide
          heading="The Quote scene"
          bullets={[
            "Big serif quote mark",
            "Quote text with author cite",
            "Animated colored underline",
            "Best for testimonials or claims",
          ]}
          color={COLORS.amber}
        />
      </Chapter>
    );
  }
  return (
    <Chapter chapter={3} label="CTA" total={9}>
      <BulletSlide
        heading="The CTA scene"
        bullets={[
          "Big hooky title + arrow",
          "Pulsing arrow draws the eye",
          "Glowing URL or call-to-action box",
          "Always the last scene",
        ]}
        color={COLORS.rose}
      />
    </Chapter>
  );
};

// ============== Chapter 4: 5 AIs (300s) ==============
const Ch4AI: React.FC = () => {
  const frame = useCurrentFrame();

  const segs = Math.floor(frame / 1500);

  if (segs === 0) {
    return (
      <Chapter chapter={4} label="AI Consensus" total={9}>
        <TitleSlide
          eyebrow="Chapter 4"
          title="5 AIs. One brain."
          subtitle="Each model has a different strength. Why not use them all?"
          color={COLORS.accent}
        />
      </Chapter>
    );
  }
  if (segs === 1) {
    return (
      <Chapter chapter={4} label="The 5 providers" total={9}>
        <BulletSlide
          heading="The 5 providers"
          bullets={[
            "🧠 Claude — beautiful copywriting",
            "🤖 GPT — reliable, fast structured output",
            "💎 Gemini — multimodal, large context",
            "🔎 Perplexity — facts grounded in web search",
            "🦙 Llama (Groq) — sub-second responses, free tier",
          ]}
          color={COLORS.accent}
        />
      </Chapter>
    );
  }
  if (segs === 2) {
    return (
      <Chapter chapter={4} label="Consensus mode" total={9}>
        <TitleSlide
          eyebrow="The trick"
          title="Ask all of them. Pick the majority."
          subtitle="The /api/ai endpoint calls every configured model in parallel and votes per field."
          color={COLORS.teal}
        />
      </Chapter>
    );
  }
  if (segs === 3) {
    return (
      <Chapter chapter={4} label="The route" total={9}>
        <CodeSlide
          heading="One file. All 5 models."
          color={COLORS.amber}
          code={`// api/ai.ts (Vercel edge function)
export default async function handler(req) {
  const { prompt, sceneId, mode } = await req.json();

  if (mode === "consensus") {
    const results = await Promise.all(
      availableProviders().map(p =>
        callOne(p, prompt, sceneId)
      )
    );
    return Response.json({
      suggestion: consensusMerge(results),
    });
  }
  // ... single-provider path
}`}
        />
      </Chapter>
    );
  }
  if (segs === 4) {
    return (
      <Chapter chapter={4} label="Why this matters" total={9}>
        <BulletSlide
          heading="Why this matters"
          bullets={[
            "No single model is best at everything",
            "Free models cover the basics for free",
            "Paid models add quality on top",
            "User can pin to one, or let consensus pick",
          ]}
          color={COLORS.pink}
        />
      </Chapter>
    );
  }
  return (
    <Chapter chapter={4} label="The result" total={9}>
      <TitleSlide
        title="Better answers, no lock-in."
        subtitle="Use whatever you have. Add more when you want."
        color={COLORS.teal}
      />
    </Chapter>
  );
};

// ============== Chapter 5: Live Demo (300s) ==============
const Ch5Demo: React.FC = () => {
  const frame = useCurrentFrame();
  const segs = Math.floor(frame / 1500);

  const demos = [
    {
      label: "Demo 1: Morning routines",
      prompt: "5 habits that changed my mornings",
      bullets: [
        "Tap Hook scene",
        "Type the prompt in the AI bar",
        "Pick Gemini, tap Fill",
        "All fields populate in 2 seconds",
        "Tap Export",
      ],
      color: COLORS.amber,
    },
    {
      label: "Demo 2: Product launch",
      prompt: "Introducing the new BBMW0 v2",
      bullets: [
        "Tap Title scene",
        "Type product name + tagline",
        "Pick Claude (great copy)",
        "Get a polished tagline + subtitle",
        "Customize the gradient color",
      ],
      color: COLORS.pink,
    },
    {
      label: "Demo 3: Book recap",
      prompt: "Atomic Habits — 3 ideas",
      bullets: [
        "Tap Bullets scene",
        "Type the book title + topic",
        "Pick consensus mode",
        "Get the 3 best takes from 3 AIs merged",
        "Add a Quote scene next",
      ],
      color: COLORS.teal,
    },
  ];

  if (segs === 0) {
    return (
      <Chapter chapter={5} label="Live Demo" total={9}>
        <TitleSlide
          eyebrow="Chapter 5"
          title="Watch this."
          subtitle="3 different videos in 5 minutes. One phone. One editor."
          color={COLORS.rose}
        />
      </Chapter>
    );
  }
  if (segs <= 3) {
    const d = demos[segs - 1];
    return (
      <Chapter chapter={5} label={d.label} total={9}>
        <BulletSlide
          heading={d.label + ": " + d.prompt}
          bullets={d.bullets}
          color={d.color}
        />
      </Chapter>
    );
  }
  if (segs === 4) {
    return (
      <Chapter chapter={5} label="Recap" total={9}>
        <StatSlide
          bigNumber="3"
          label="Different videos"
          context="Different scenes, different AIs, different tones — all from one phone in five minutes."
          color={COLORS.teal}
        />
      </Chapter>
    );
  }
  return (
    <Chapter chapter={5} label="Recap" total={9}>
      <TitleSlide
        title="On a phone."
        subtitle="That's the whole point."
        color={COLORS.accent}
      />
    </Chapter>
  );
};

// ============== Chapter 6: How it's built (240s) ==============
const Ch6Tech: React.FC = () => {
  const frame = useCurrentFrame();
  const segs = Math.floor(frame / 1200); // 6 segments of 40s

  if (segs === 0) {
    return (
      <Chapter chapter={6} label="How it's built" total={9}>
        <TitleSlide
          eyebrow="Chapter 6"
          title="How it's built."
          subtitle="The whole stack, in plain English."
          color={COLORS.amber}
        />
      </Chapter>
    );
  }
  if (segs === 1) {
    return (
      <Chapter chapter={6} label="Remotion" total={9}>
        <BulletSlide
          heading="Remotion — videos in React"
          bullets={[
            "Compositions are pure React components",
            "Animate with useCurrentFrame() + spring()",
            "Renders to MP4 via Chrome Headless",
            "Same components work in @remotion/player",
          ]}
          color={COLORS.accent}
        />
      </Chapter>
    );
  }
  if (segs === 2) {
    return (
      <Chapter chapter={6} label="Vite + React" total={9}>
        <BulletSlide
          heading="Vite + React 18 + TypeScript"
          bullets={[
            "Vite for instant dev server + production build",
            "React 18 for the editor UI",
            "TypeScript end-to-end for type safety",
            "Service worker for offline PWA support",
          ]}
          color={COLORS.pink}
        />
      </Chapter>
    );
  }
  if (segs === 3) {
    return (
      <Chapter chapter={6} label="Vercel" total={9}>
        <BulletSlide
          heading="Vercel — hosting + serverless"
          bullets={[
            "Free tier hosts the static editor",
            "/api/ai runs as an edge function",
            "Env vars hold provider API keys",
            "Auto-redeploy on git push",
          ]}
          color={COLORS.teal}
        />
      </Chapter>
    );
  }
  if (segs === 4) {
    return (
      <Chapter chapter={6} label="The whole repo" total={9}>
        <CodeSlide
          heading="The whole project structure"
          color={COLORS.sky}
          code={`bbmw0-technologies-ai/
├── src/
│   ├── App.tsx              # mobile-first layout
│   ├── i18n.ts              # 10-language strings
│   ├── components/          # AIBar, PropEditor, ...
│   └── compositions/        # all video scenes
│       ├── Hook|Title|...   # 5 presets
│       ├── Showcase.tsx     # 60s marketing reel
│       ├── Tutorial.tsx     # 60s how-it-works
│       ├── Battle.tsx       # 60s AI comparison
│       ├── SpeedRun.tsx     # 60s creation timer
│       ├── FeatureDrop.tsx  # 60s feature montage
│       └── LongForm.tsx     # 30-min explainer
├── api/
│   └── ai.ts                # 5-provider AI router
└── public/                  # PWA manifest, icons`}
        />
      </Chapter>
    );
  }
  return (
    <Chapter chapter={6} label="The result" total={9}>
      <StatSlide
        bigNumber="< 5k"
        label="Lines of TypeScript"
        context="Small enough to read in an afternoon, big enough to do real work."
        color={COLORS.amber}
      />
    </Chapter>
  );
};

// ============== Chapter 7: Deploy your own (180s) ==============
const Ch7Deploy: React.FC = () => {
  const frame = useCurrentFrame();
  const segs = Math.floor(frame / 1080); // 5 segments of 36s

  if (segs === 0) {
    return (
      <Chapter chapter={7} label="Deploy your own" total={9}>
        <TitleSlide
          eyebrow="Chapter 7"
          title="Deploy your own."
          subtitle="90 seconds from clone to public URL. Free."
          color={COLORS.teal}
        />
      </Chapter>
    );
  }
  if (segs === 1) {
    return (
      <Chapter chapter={7} label="Step 1: Click" total={9}>
        <TitleSlide
          eyebrow="Step 1"
          title="Click the Deploy button."
          subtitle="On the README. Big purple button. You can't miss it."
          color={COLORS.accent}
        />
      </Chapter>
    );
  }
  if (segs === 2) {
    return (
      <Chapter chapter={7} label="Step 2: Auth" total={9}>
        <TitleSlide
          eyebrow="Step 2"
          title="Sign in with GitHub."
          subtitle="Vercel forks the repo into your account. One click."
          color={COLORS.pink}
        />
      </Chapter>
    );
  }
  if (segs === 3) {
    return (
      <Chapter chapter={7} label="Step 3: Keys (optional)" total={9}>
        <BulletSlide
          heading="Step 3: Add API keys (optional)"
          bullets={[
            "GROQ_API_KEY — free, fastest",
            "GOOGLE_GEMINI_API_KEY — free tier",
            "ANTHROPIC_API_KEY — paid, best copy",
            "Or skip — local heuristic still works",
          ]}
          color={COLORS.amber}
        />
      </Chapter>
    );
  }
  return (
    <Chapter chapter={7} label="Step 4: Deploy" total={9}>
      <TitleSlide
        eyebrow="Step 4"
        title="Click Deploy."
        subtitle="90 seconds later: yourname.vercel.app — anyone in the world can use it."
        color={COLORS.teal}
      />
    </Chapter>
  );
};

// ============== Chapter 8: Roadmap (180s) ==============
const Ch8Road: React.FC = () => {
  const frame = useCurrentFrame();
  const segs = Math.floor(frame / 1800); // 3 segments of 60s

  if (segs === 0) {
    return (
      <Chapter chapter={8} label="Roadmap" total={9}>
        <TitleSlide
          eyebrow="Chapter 8"
          title="What's next."
          subtitle="The roadmap. What we're shipping. How to help."
          color={COLORS.sky}
        />
      </Chapter>
    );
  }
  if (segs === 1) {
    return (
      <Chapter chapter={8} label="Coming soon" total={9}>
        <BulletSlide
          heading="Coming soon"
          bullets={[
            "In-browser MP4 export via WebCodecs",
            "Server render via @remotion/lambda",
            "Audio uploads + auto-ducking",
            "Caption auto-sync with Whisper",
            "App Store + Play Store wrapper",
          ]}
          color={COLORS.accent}
        />
      </Chapter>
    );
  }
  return (
    <Chapter chapter={8} label="Contribute" total={9}>
      <BulletSlide
        heading="How to contribute"
        bullets={[
          "★ Star the repo on GitHub",
          "Open an issue for bugs or ideas",
          "Send a PR — even a single language helps",
          "Share your videos with #bbmw0",
        ]}
        color={COLORS.pink}
      />
    </Chapter>
  );
};

// ============== Chapter 9: Outro (60s) ==============
const Ch9Outro: React.FC<{ url: string; brand: string }> = ({ url, brand }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const a = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
  const u = spring({
    frame: frame - 30,
    fps,
    config: { damping: 14, stiffness: 100 },
  });
  const conf = Array.from({ length: 30 }).map((_, i) => {
    const seed = i * 31.7;
    const x = (seed * 17.3) % 1920;
    const startY = -50 - ((seed * 7.1) % 200);
    const speed = 4 + ((seed * 0.13) % 4);
    const y = startY + frame * speed;
    const rot = frame * (3 + ((seed * 0.05) % 4));
    const cs = [COLORS.accent, COLORS.pink, COLORS.teal, COLORS.amber, COLORS.sky];
    return { x, y, rot, c: cs[i % 5] };
  });

  return (
    <Chapter chapter={9} label="Outro" total={9}>
      <div
        style={{
          position: "absolute",
          inset: 0,
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
        {conf.map((c, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: c.x,
              top: c.y,
              width: 14,
              height: 28,
              background: c.c,
              borderRadius: 3,
              transform: `rotate(${c.rot}deg)`,
              opacity: 0.85,
            }}
          />
        ))}
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: 144,
            color: "white",
            letterSpacing: "-0.04em",
            opacity: a,
            transform: `translateY(${interpolate(a, [0, 1], [40, 0])}px)`,
            zIndex: 5,
          }}
        >
          Thanks for watching.
        </div>
        <div
          style={{
            fontFamily: FONT,
            fontWeight: 600,
            fontSize: 40,
            color: COLORS.dim,
            marginTop: 24,
            opacity: a,
            zIndex: 5,
          }}
        >
          Built mobile-first. Shipped open source.
        </div>
        <div
          style={{
            marginTop: 60,
            padding: "24px 40px",
            background: "rgba(255,255,255,0.06)",
            border: `3px solid ${COLORS.accent}`,
            borderRadius: 22,
            fontFamily: MONO,
            fontWeight: 700,
            fontSize: 36,
            color: "white",
            opacity: u,
            transform: `scale(${u})`,
            boxShadow: `0 0 60px ${COLORS.accent}80`,
            zIndex: 5,
          }}
        >
          {url}
        </div>
        <div
          style={{
            marginTop: 60,
            display: "flex",
            alignItems: "center",
            gap: 16,
            zIndex: 5,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 18,
              background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.pink})`,
              display: "grid",
              placeItems: "center",
              color: "white",
              fontFamily: FONT,
              fontWeight: 900,
              fontSize: 40,
              boxShadow: `0 8px 32px ${COLORS.accent}80`,
            }}
          >
            B
          </div>
          <div
            style={{
              fontFamily: FONT,
              fontWeight: 800,
              fontSize: 32,
              color: "white",
            }}
          >
            {brand}
          </div>
        </div>
      </div>
    </Chapter>
  );
};

// =====================================================================
// LongForm composition — 30 minutes = 54000 frames @ 30fps, 1920×1080
// =====================================================================
export const LongForm: React.FC<LongFormProps> = ({ url, brand }) => {
  return (
    <AbsoluteFill style={{ background: COLORS.bg }}>
      <Series>
        <Series.Sequence durationInFrames={1800}>
          <Ch1Intro brand={brand} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={5400}>
          <Ch2Why />
        </Series.Sequence>
        <Series.Sequence durationInFrames={9000}>
          <Ch3Tour />
        </Series.Sequence>
        <Series.Sequence durationInFrames={9000}>
          <Ch4AI />
        </Series.Sequence>
        <Series.Sequence durationInFrames={9000}>
          <Ch5Demo />
        </Series.Sequence>
        <Series.Sequence durationInFrames={7200}>
          <Ch6Tech />
        </Series.Sequence>
        <Series.Sequence durationInFrames={5400}>
          <Ch7Deploy />
        </Series.Sequence>
        <Series.Sequence durationInFrames={5400}>
          <Ch8Road />
        </Series.Sequence>
        <Series.Sequence durationInFrames={1800}>
          <Ch9Outro url={url} brand={brand} />
        </Series.Sequence>
      </Series>
      {/* Voiceover track — 9 chapter MP3s aligned to chapter starts.
          Each Audio plays from frame `from` until the file ends; if a
          file is missing, Remotion logs a warning but keeps rendering. */}
      {VOICEOVER.map((vo) => (
        <Sequence key={vo.file} from={vo.from}>
          <Audio src={staticFile(vo.file)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
ckground: COLORS.bg }}>
      <Series>
        <Series.Sequence durationInFrames={1800}>
          <Ch1Intro brand={brand} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={5400}>
          <Ch2Why />
        </Series.Sequence>
        <Series.Sequence durationInFrames={9000}>
          <Ch3Tour />
        </Series.Sequence>
        <Series.Sequence durationInFrames={9000}>
          <Ch4AI />
        </Series.Sequence>
        <Series.Sequence durationInFrames={9000}>
          <Ch5Demo />
        </Series.Sequence>
        <Series.Sequence durationInFrames={7200}>
          <Ch6Tech />
        </Series.Sequence>
        <Series.Sequence durationInFrames={5400}>
          <Ch7Deploy />
        </Series.Sequence>
        <Series.Sequence durationInFrames={5400}>
          <Ch8Road />
        </Series.Sequence>
        <Series.Sequence durationInFrames={1800}>
          <Ch9Outro url={url} brand={brand} />
        </Series.Sequence>
      </Series>
      {VOICEOVER.map((vo) => (
        <Sequence key={vo.file} from={vo.from}>
          <Audio src={staticFile(vo.file)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
 a warning but keeps rendering. */}
      {VOICEOVER.map((vo) => (
        <Sequence key={vo.file} from={vo.from}>
          <Audio src={staticFile(vo.file)} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
