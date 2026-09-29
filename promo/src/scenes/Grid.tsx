import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { Headline, clamp, easeOut, fmt, panelStyle, useSpring } from "./kit";
import { TokenField } from "./TokenField";

const COLUMNS = [
  { label: "input", value: 1_700, cost: 0.02, color: C.blue },
  { label: "cache", value: 8_620_000, cost: 8.62, color: C.violet },
  { label: "output", value: 88_800, cost: 4.44, color: "#7aa7ff" },
  { label: "cost", value: 26.64, cost: 0, color: C.acid, money: true },
];

// Relative bar heights per turn, taken from a real 7-turn session shape.
const TURNS = [0.33, 0.05, 0.06, 0.95, 0.12, 0.1, 0.72];

/** 7–12s: dive over the cost grid while layered panels break usage down. */
export const Grid = () => {
  const frame = useCurrentFrame();
  const tilt = interpolate(frame, [0, 150], [-0.55, -0.25], { ...clamp, easing: easeOut });
  const camY = interpolate(frame, [0, 150], [9, 3], { ...clamp, easing: easeOut });

  return (
    <AbsoluteFill>
      <TokenField mode="grid" speed={2.2} camY={camY} tilt={tilt} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.bg} 0%, transparent 35%, transparent 70%, ${C.bg} 100%)` }} />
      <AbsoluteFill style={{ perspective: 1800, alignItems: "center", paddingTop: 110 }}>
        <div style={{ display: "flex", gap: 28 }}>
          {COLUMNS.map((c, i) => (
            <Stat key={c.label} index={i} {...c} />
          ))}
        </div>
        <Bars />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 80 }}>
        <Headline words={["Input", "·", "Cache", "·", "Output", "·", "Cost"]} delay={70} size={64} stagger={3} accent={[6]} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Stat = ({ label, value, cost, color, money, index }: (typeof COLUMNS)[number] & { index: number }) => {
  const frame = useCurrentFrame();
  const s = useSpring(8 + index * 6, 14);
  const count = interpolate(frame, [10 + index * 6, 70 + index * 6], [0, 1], { ...clamp, easing: easeOut });
  const float = Math.sin((frame + index * 20) * 0.05) * 8;
  return (
    <div
      style={{
        ...panelStyle,
        width: 340,
        padding: "28px 32px",
        opacity: s,
        transform: `translateY(${(1 - s) * 200 + float}px) rotateX(${(1 - s) * 60}deg) translateZ(${index * 10}px)`,
        borderTop: `2px solid ${color}`,
      }}
    >
      <div style={{ fontFamily: FONT.mono, fontSize: 18, letterSpacing: "0.3em", color: C.dim, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 64, color, marginTop: 10, textShadow: `0 0 30px ${color}66` }}>
        {money ? `$${(value * count).toFixed(2)}` : fmt(value * count)}
      </div>
      <div style={{ fontFamily: FONT.mono, fontSize: 20, color: C.dim, marginTop: 6 }}>
        {money ? "+$4.21 uncovered" : `$${(cost * count).toFixed(2)}`}
      </div>
    </div>
  );
};

const Bars = () => {
  const frame = useCurrentFrame();
  const s = useSpring(40, 16);
  return (
    <div
      style={{
        ...panelStyle,
        marginTop: 36,
        width: 1444,
        height: 260,
        padding: "28px 40px",
        display: "flex",
        alignItems: "flex-end",
        gap: 26,
        opacity: s,
        transform: `rotateX(${18 + (1 - s) * 50}deg) translateY(${(1 - s) * 120}px)`,
      }}
    >
      {TURNS.map((h, i) => {
        const grow = interpolate(frame, [50 + i * 4, 80 + i * 4], [0, 1], { ...clamp, easing: easeOut });
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, height: "100%", justifyContent: "flex-end" }}>
            <div
              style={{
                width: "100%",
                height: `${Math.max(4, h * 170 * grow)}px`,
                borderRadius: 8,
                background: `linear-gradient(180deg, ${h > 0.7 ? C.acid : C.violet}, ${C.blue}22)`,
                boxShadow: `0 0 30px ${h > 0.7 ? C.acid : C.violet}55`,
              }}
            />
            <div style={{ fontFamily: FONT.mono, fontSize: 18, color: C.dim }}>#{i + 1}</div>
          </div>
        );
      })}
    </div>
  );
};
