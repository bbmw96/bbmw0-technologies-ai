import {
  AbsoluteFill,
  Series,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Hook } from "./Hook";
import { Title } from "./Title";
import { Bullets } from "./Bullets";
import { Quote } from "./Quote";
import { CTA } from "./CTA";

// 60 seconds @ 30fps = 1800 frames.
// Split: 0-900 (sample output), 900-1800 (tool demo + CTA).

export type ShowcaseProps = {
  brand: string;
  url: string;
  accent: string;
};

export const showcaseDefaults: ShowcaseProps = {
  brand: "BBMW0 Technologies AI",
  url: "github.com/BBMW0/bbmw0-technologies-ai",
  accent: "#7c5cff",
};

const ProgressBar: React.FC<{
  durationInFrames: number;
  accent: string;
}> = ({ durationInFrames, accent }) => {
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
          background: accent,
          borderRadius: 3,
          boxShadow: `0 0 10px ${accent}`,
        }}
      />
    </div>
  );
};

// ----- Part 2: animated mock of the editor UI -----
const PhoneFrame: React.FC<{
  accent: string;
  brand: string;
  scene: string;
}> = ({ accent, brand, scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inAnim = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80 },
  });

  // Tap animation: every 60 frames, simulate a tap
  const tapPhase = (frame % 60) / 60;
  const tapScale = tapPhase < 0.15 ? 1 - tapPhase : 1;
  const fingerY = interpolate(tapPhase, [0, 0.15, 1], [0, 8, 0]);

  return (
    <div
      style={{
        width: 540,
        height: 1100,
        background: "#12121a",
        border: "8px solid #2a2a3a",
        borderRadius: 64,
        boxShadow: "0 30px 100px rgba(0,0,0,0.6)",
        overflow: "hidden",
        opacity: inAnim,
        transform: `translateY(${interpolate(inAnim, [0, 1], [80, 0])}px) scale(${0.9 + 0.1 * inAnim})`,
        position: "relative",
      }}
    >
      {/* status bar */}
      <div
        style={{
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 28px",
          color: "white",
          fontSize: 18,
          fontWeight: 700,
          fontFamily: "Inter, system-ui",
        }}
      >
        <span>9:41</span>
        <span>● ● ● 100%</span>
      </div>

      {/* header */}
      <div
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 24px",
          borderBottom: "1px solid #2a2a3a",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `linear-gradient(135deg, ${accent}, #ff5cb1)`,
            display: "grid",
            placeItems: "center",
            color: "white",
            fontSize: 18,
            fontWeight: 900,
            fontFamily: "Inter, system-ui",
          }}
        >
          B
        </div>
        <div
          style={{
            color: "white",
            fontFamily: "Inter, system-ui",
            fontWeight: 700,
            fontSize: 17,
          }}
        >
          {brand}
        </div>
      </div>

      {/* preview rectangle (9:16) */}
      <div
        style={{
          margin: "24px auto",
          height: 540,
          width: 305,
          background: `radial-gradient(ellipse at 50% 30%, ${accent}55 0%, #050510 70%)`,
          borderRadius: 24,
          display: "grid",
          placeItems: "center",
          padding: 28,
          textAlign: "center",
          border: "1px solid #2a2a3a",
        }}
      >
        <div>
          <div style={{ fontSize: 86, marginBottom: 16 }}>👀</div>
          <div
            style={{
              color: "white",
              fontFamily: "Inter, system-ui",
              fontWeight: 900,
              fontSize: 28,
              lineHeight: 1.1,
            }}
          >
            POV: you stop scrolling
          </div>
        </div>
      </div>

      {/* scene tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "0 24px",
          marginTop: 8,
          marginBottom: 16,
        }}
      >
        {["Hook", "Title", "Bullets", "CTA"].map((s) => {
          const active = s === scene;
          return (
            <div
              key={s}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                background: active ? accent : "#1a1a26",
                color: active ? "white" : "#a0a0b8",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "Inter, system-ui",
                border: `1px solid ${active ? accent : "#2a2a3a"}`,
                boxShadow: active ? `0 4px 14px ${accent}80` : "none",
              }}
            >
              {s}
            </div>
          );
        })}
      </div>

      {/* prop editor */}
      <div
        style={{
          background: "#1a1a26",
          margin: "0 24px",
          borderRadius: 18,
          padding: 20,
          border: "1px solid #2a2a3a",
        }}
      >
        <div
          style={{
            color: "#6a6a85",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
            fontFamily: "Inter, system-ui",
          }}
        >
          Text
        </div>
        <div
          style={{
            background: "#0a0a0f",
            border: "1px solid #2a2a3a",
            borderRadius: 10,
            padding: 14,
            color: "white",
            fontSize: 15,
            fontFamily: "Inter, system-ui",
            marginBottom: 16,
          }}
        >
          POV: you stop scrolling|
        </div>

        <div
          style={{
            color: "#6a6a85",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
            fontFamily: "Inter, system-ui",
          }}
        >
          Color
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[accent, "#ff5cb1", "#22d3a8", "#ffb547", "#ff5e7e"].map((c, i) => (
            <div
              key={c}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: c,
                border:
                  i === 0
                    ? "2px solid white"
                    : "2px solid #2a2a3a",
              }}
            />
          ))}
        </div>
      </div>

      {/* big render button */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 24,
          right: 24,
          height: 56,
          background: accent,
          borderRadius: 16,
          display: "grid",
          placeItems: "center",
          color: "white",
          fontSize: 17,
          fontWeight: 700,
          fontFamily: "Inter, system-ui",
          boxShadow: `0 6px 20px ${accent}80`,
          transform: `scale(${tapScale})`,
        }}
      >
        Export to MP4
      </div>

      {/* finger / tap indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 18 + fingerY,
          right: 60,
          width: 64,
          height: 64,
          borderRadius: "50%",
          border: "3px solid white",
          background: "rgba(255,255,255,0.15)",
          opacity: tapPhase < 0.15 ? 1 : 0.4,
          transition: "opacity 0.2s",
        }}
      />
    </div>
  );
};

const ToolDemo: React.FC<{ accent: string; brand: string }> = ({
  accent,
  brand,
}) => {
  const frame = useCurrentFrame();
  // 0-180: scene 1 ("Hook"), 180-360: scene 2 ("Title"), 360-540: scene 3 ("Bullets")
  const scene =
    frame < 180 ? "Hook" : frame < 360 ? "Title" : "Bullets";
  const headlineIn = spring({
    frame,
    fps: 30,
    config: { damping: 14, stiffness: 90 },
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, #1a1430 0%, #0a0a0f 60%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "80px 60px 0",
        gap: 28,
      }}
    >
      <div
        style={{
          opacity: headlineIn,
          transform: `translateY(${interpolate(headlineIn, [0, 1], [-30, 0])}px)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            color: accent,
            fontFamily: "Inter, system-ui",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontSize: 22,
            marginBottom: 10,
          }}
        >
          ✦ The Tool ✦
        </div>
        <h1
          style={{
            color: "white",
            fontFamily: "Inter, system-ui",
            fontWeight: 900,
            fontSize: 68,
            margin: 0,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          Made in 30 seconds
          <br />
          on your <span style={{ color: accent }}>phone</span>
        </h1>
      </div>

      <PhoneFrame accent={accent} brand={brand} scene={scene} />
    </AbsoluteFill>
  );
};

const FinalCTA: React.FC<{ accent: string; url: string }> = ({
  accent,
  url,
}) => {
  return <CTA title="Try it yourself" url={url} bg="#0a0a0f" accent={accent} />;
};

// ===========================================================
//  Showcase composition (60s = 1800 frames @ 30fps)
// ===========================================================
export const Showcase: React.FC<ShowcaseProps> = ({
  brand,
  url,
  accent,
}) => {
  const { durationInFrames } = useVideoConfig();
  // Part 1 (sample): 0-900 (30s)
  // Part 2 (tool demo): 900-1620 (24s)
  // Part 3 (CTA): 1620-1800 (6s)

  return (
    <AbsoluteFill style={{ background: "#0a0a0f" }}>
      <Series>
        <Series.Sequence durationInFrames={150}>
          <Hook
            text="POV: you stop scrolling"
            bg="#0a0a0f"
            accent={accent}
            emoji="👀"
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <Title
            title={brand}
            subtitle="Make a Short. In seconds."
            bg="#0a0a0f"
            accent={accent}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={210}>
          <Bullets
            heading="Why this is different"
            items={[
              "Touch-first, 9:16 by default",
              "Swipe between scenes",
              "Export to MP4 in one tap",
            ]}
            bg="#0a0a0f"
            accent={accent}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={150}>
          <Quote
            quote="If you can scroll it, you can edit it."
            author="— BBMW0 Manifesto"
            bg="#0a0a0f"
            accent={accent}
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={120}>
          <Hook
            text="Now look how it works ↓"
            bg="#0a0a0f"
            accent={accent}
            emoji="✨"
          />
        </Series.Sequence>
        <Series.Sequence durationInFrames={720}>
          <ToolDemo accent={accent} brand={brand} />
        </Series.Sequence>
        <Series.Sequence durationInFrames={300}>
          <FinalCTA accent={accent} url={url} />
        </Series.Sequence>
      </Series>

      <ProgressBar
        durationInFrames={durationInFrames}
        accent={accent}
      />
    </AbsoluteFill>
  );
};
