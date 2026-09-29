import type { CSSProperties, ReactNode } from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";

export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/** Spring 0→1 starting at `delay` frames into the current Sequence. */
export const useSpring = (delay = 0, damping = 18, mass = 0.7) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass, stiffness: 160 } });
};

/** Kinetic headline: per-word slam-in with blur + letter-spacing collapse. */
export const Headline = ({
  words,
  delay = 0,
  size = 132,
  stagger = 5,
  style,
  accent,
}: {
  words: string[];
  delay?: number;
  size?: number;
  stagger?: number;
  style?: CSSProperties;
  accent?: number[];
}) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        fontFamily: FONT.display,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 0.95,
        color: C.text,
        display: "flex",
        // No wrap: a line must never reflow mid-animation (was shoving the row above).
        flexWrap: "nowrap",
        whiteSpace: "nowrap",
        gap: `0 ${size * 0.28}px`,
        justifyContent: "center",
        textTransform: "uppercase",
        ...style,
      }}
    >
      {words.map((w, i) => {
        const t = interpolate(frame - delay - i * stagger, [0, 12], [0, 1], { ...clamp, easing: easeOut });
        const hot = accent?.includes(i);
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: t,
              // Transform-only animation: scaleX fakes the tracking collapse without changing layout.
              transform: `translateY(${(1 - t) * 60}px) scale(${1.6 - 0.6 * t}) scaleX(${1 + (1 - t) * 0.35})`,
              filter: `blur(${(1 - t) * 18}px)`,
              color: hot ? C.acid : undefined,
              textShadow: hot ? `0 0 40px ${C.acid}66` : `0 0 50px ${C.blue}55`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

/** Small monospace HUD label. */
export const Tag = ({ children, color = C.dim, style }: { children: ReactNode; color?: string; style?: CSSProperties }) => (
  <div
    style={{
      fontFamily: FONT.mono,
      fontSize: 20,
      letterSpacing: "0.3em",
      textTransform: "uppercase",
      color,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Compact number formatter matching the plugin (1.7k, 8.62M). */
export const fmt = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}k` : `${Math.round(n)}`;

/** Glassy panel surface used by all mock UI. */
export const panelStyle: CSSProperties = {
  background: C.panel,
  border: `1px solid ${C.line}`,
  borderRadius: 20,
  boxShadow: `0 40px 120px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1px rgba(77,141,255,0.05)`,
  backdropFilter: "blur(20px)",
};
