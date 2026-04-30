import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type QuoteProps = {
  quote: string;
  author: string;
  bg: string;
  accent: string;
};

export const quoteDefaults: QuoteProps = {
  quote: "If you can scroll it, you can edit it.",
  author: "— BBMW0 Manifesto",
  bg: "#0a0a0f",
  accent: "#7c5cff",
};

export const Quote: React.FC<QuoteProps> = ({
  quote,
  author,
  bg,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const quoteIn = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 80 },
  });
  const authorIn = spring({
    frame: frame - 18,
    fps,
    config: { damping: 14, stiffness: 90 },
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 30% 0%, ${accent}25 0%, ${bg} 70%)`,
        padding: 80,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          color: accent,
          fontSize: 240,
          fontFamily: "Georgia, serif",
          lineHeight: 0.7,
          marginBottom: -40,
          opacity: 0.6,
          transform: `scale(${quoteIn})`,
        }}
      >
        "
      </div>

      <p
        style={{
          color: "white",
          fontSize: 64,
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          lineHeight: 1.15,
          margin: 0,
          opacity: quoteIn,
          transform: `translateY(${interpolate(quoteIn, [0, 1], [30, 0])}px)`,
        }}
      >
        {quote}
      </p>

      <div
        style={{
          marginTop: 48,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: authorIn,
          transform: `translateY(${interpolate(authorIn, [0, 1], [20, 0])}px)`,
        }}
      >
        <div
          style={{
            width: 48,
            height: 4,
            background: accent,
            borderRadius: 2,
          }}
        />
        <span
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 28,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
          }}
        >
          {author}
        </span>
      </div>
    </AbsoluteFill>
  );
};
