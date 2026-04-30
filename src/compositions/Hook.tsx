import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type HookProps = {
  text: string;
  bg: string;
  accent: string;
  emoji: string;
};

export const hookDefaults: HookProps = {
  text: "POV: you stop scrolling",
  bg: "#0a0a0f",
  accent: "#7c5cff",
  emoji: "👀",
};

export const Hook: React.FC<HookProps> = ({ text, bg, accent, emoji }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const emojiBounce = spring({
    frame: frame - 8,
    fps,
    config: { damping: 8, stiffness: 200 },
  });
  const wobble = Math.sin(frame / 6) * 2;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 30%, ${accent}33 0%, ${bg} 65%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 60,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 200,
          transform: `scale(${emojiBounce}) rotate(${wobble}deg)`,
          marginBottom: 40,
          filter: "drop-shadow(0 12px 40px rgba(0,0,0,0.5))",
        }}
      >
        {emoji}
      </div>

      <h1
        style={{
          color: "white",
          fontSize: 96,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1.05,
          margin: 0,
          opacity: interpolate(enter, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(enter, [0, 1], [40, 0])}px)`,
          textShadow: `0 0 40px ${accent}80`,
        }}
      >
        {text}
      </h1>
    </AbsoluteFill>
  );
};
