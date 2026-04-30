import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type BulletsProps = {
  heading: string;
  items: string[];
  bg: string;
  accent: string;
};

export const bulletsDefaults: BulletsProps = {
  heading: "Why it works",
  items: ["Touch-first UI", "9:16 by default", "AI does the timing"],
  bg: "#0a0a0f",
  accent: "#7c5cff",
};

export const Bullets: React.FC<BulletsProps> = ({
  heading,
  items,
  bg,
  accent,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headIn = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        background: bg,
        padding: "120px 80px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          opacity: headIn,
          transform: `translateY(${interpolate(headIn, [0, 1], [30, 0])}px)`,
          marginBottom: 60,
        }}
      >
        <div
          style={{
            color: accent,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 28,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          ★ Highlights
        </div>
        <h2
          style={{
            color: "white",
            fontSize: 72,
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            margin: 0,
          }}
        >
          {heading}
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {items.map((item, i) => {
          const start = 20 + i * 12;
          const itemIn = spring({
            frame: frame - start,
            fps,
            config: { damping: 14, stiffness: 100 },
          });
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 28,
                opacity: itemIn,
                transform: `translateX(${interpolate(itemIn, [0, 1], [-40, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: `linear-gradient(135deg, ${accent}, #ff5cb1)`,
                  display: "grid",
                  placeItems: "center",
                  color: "white",
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: "Inter, system-ui, sans-serif",
                  boxShadow: `0 8px 28px ${accent}80`,
                  flexShrink: 0,
                }}
              >
                {i + 1}
              </div>
              <div
                style={{
                  color: "white",
                  fontSize: 48,
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  lineHeight: 1.15,
                }}
              >
                {item}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
