import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type TitleProps = {
  title: string;
  subtitle: string;
  bg: string;
  accent: string;
};

export const titleDefaults: TitleProps = {
  title: "BBMW0 Technologies AI",
  subtitle: "Make a Short. In seconds.",
  bg: "#0a0a0f",
  accent: "#7c5cff",
};

export const Title: React.FC<TitleProps> = ({
  title,
  subtitle,
  bg,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const titleIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 90 },
  });
  const subIn = spring({
    frame: frame - 10,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  const lineGrow = interpolate(frame, [12, 30], [0, 1], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const breathe =
    1 + Math.sin((frame / durationInFrames) * Math.PI * 2) * 0.015;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${bg} 0%, #1a1430 100%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 28,
          background: `linear-gradient(135deg, ${accent}, #ff5cb1)`,
          marginBottom: 40,
          display: "grid",
          placeItems: "center",
          color: "white",
          fontSize: 56,
          fontWeight: 900,
          fontFamily: "Inter, system-ui, sans-serif",
          boxShadow: `0 16px 60px ${accent}90`,
          transform: `scale(${titleIn * breathe})`,
        }}
      >
        B
      </div>

      <h1
        style={{
          color: "white",
          fontSize: 84,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          lineHeight: 1.0,
          margin: 0,
          opacity: titleIn,
          transform: `translateY(${interpolate(titleIn, [0, 1], [30, 0])}px)`,
        }}
      >
        {title}
      </h1>

      <div
        style={{
          height: 4,
          width: `${lineGrow * 60}%`,
          background: accent,
          borderRadius: 2,
          marginTop: 28,
          marginBottom: 28,
          boxShadow: `0 0 20px ${accent}`,
        }}
      />

      <p
        style={{
          color: "rgba(255,255,255,0.78)",
          fontSize: 36,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 500,
          margin: 0,
          opacity: subIn,
          transform: `translateY(${interpolate(subIn, [0, 1], [20, 0])}px)`,
          maxWidth: 720,
        }}
      >
        {subtitle}
      </p>
    </AbsoluteFill>
  );
};
