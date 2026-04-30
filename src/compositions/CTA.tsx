import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type CTAProps = {
  title: string;
  url: string;
  bg: string;
  accent: string;
};

export const ctaDefaults: CTAProps = {
  title: "Try it yourself",
  url: "github.com/BBMW0/bbmw0-technologies-ai",
  bg: "#0a0a0f",
  accent: "#7c5cff",
};

export const CTA: React.FC<CTAProps> = ({ title, url, bg, accent }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const arrowPulse = (Math.sin(frame / 6) + 1) / 2; // 0..1
  const urlIn = spring({
    frame: frame - 14,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, #1a0f2e 0%, ${bg} 100%)`,
        padding: 80,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <h1
        style={{
          color: "white",
          fontSize: 96,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          margin: 0,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [40, 0])}px)`,
          marginBottom: 24,
        }}
      >
        {title}
      </h1>

      <div
        style={{
          fontSize: 96,
          marginBottom: 24,
          transform: `translateY(${arrowPulse * 16 - 8}px)`,
          opacity: titleIn,
        }}
      >
        ↓
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `2px solid ${accent}`,
          borderRadius: 24,
          padding: "28px 36px",
          color: "white",
          fontSize: 38,
          fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
          fontWeight: 600,
          letterSpacing: "-0.01em",
          opacity: urlIn,
          transform: `scale(${urlIn})`,
          boxShadow: `0 0 40px ${accent}80, inset 0 0 20px ${accent}30`,
          maxWidth: "100%",
          wordBreak: "break-all",
        }}
      >
        {url}
      </div>
    </AbsoluteFill>
  );
};
