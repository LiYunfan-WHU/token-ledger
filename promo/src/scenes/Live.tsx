import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { Headline, Tag, clamp, easeOut, fmt, panelStyle, useSpring } from "./kit";

/** 3–7s: the composer pill ticks live, then zooms into a per-turn readout. */
export const Live = () => {
  const frame = useCurrentFrame();
  // Start mid-scale so the hard cut lands on content, not an empty frame.
  const enter = 0.45 + 0.55 * useSpring(0, 16);
  const zoom = interpolate(frame, [0, 60, 120], [0.9, 1.25, 1.55], { ...clamp, easing: easeOut });
  const rotX = interpolate(frame, [0, 120], [22, 8], clamp);
  const rotY = interpolate(frame, [0, 120], [-18, 10], clamp);

  const progress = interpolate(frame, [6, 110], [0, 1], { ...clamp, easing: easeOut });
  const cost = 26.64 + progress * 4.52;
  const ctx = Math.round(19 + progress * 4);
  const tokens = 7_420 + progress * 11_880;
  const pulse = (Math.sin(frame * 0.6) + 1) / 2;

  return (
    <AbsoluteFill style={{ perspective: 1600, justifyContent: "center", alignItems: "center" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 55%, ${C.violet}33, transparent 55%), radial-gradient(circle at 30% 40%, ${C.blue}22, transparent 50%)`,
        }}
      />
      <div
        style={{
          ...panelStyle,
          width: 1180,
          padding: "34px 40px 46px",
          transform: `scale(${zoom * enter}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          opacity: enter,
        }}
      >
        <div style={{ display: "flex", gap: 18, marginBottom: 34 }}>
          <Pill dim>5/5 tasks</Pill>
          <Pill glow={0.5 + pulse * 0.5}>
            <span style={{ color: C.acid }}>${cost.toFixed(2)}</span>
            <span style={{ color: C.dim }}> · ctx {ctx}%</span>
          </Pill>
          <Pill dim>
            <span style={{ color: C.green }}>+{fmt(tokens)}</span> <span style={{ color: C.red }}>-147</span>
          </Pill>
        </div>
        <div style={{ fontFamily: FONT.ui, fontSize: 30, color: "#5a5f70" }}>Refactor the billing pipeline and add tests…</div>
        <div style={{ height: 3, marginTop: 40, background: C.line, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${ctx * 2.2}%`, background: `linear-gradient(90deg, ${C.blue}, ${C.violet}, ${C.acid})` }} />
        </div>
      </div>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 110, gap: 18 }}>
        <Tag color={C.acid} style={{ opacity: interpolate(frame, [30, 42], [0, 1], clamp) }}>
          ● streaming usage
        </Tag>
        <Headline words={["Live.", "Per", "turn."]} delay={34} size={104} accent={[0]} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Pill = ({ children, dim, glow = 0 }: { children: React.ReactNode; dim?: boolean; glow?: number }) => (
  <div
    style={{
      fontFamily: FONT.mono,
      fontSize: 34,
      padding: "14px 28px",
      borderRadius: 999,
      color: dim ? C.dim : C.text,
      background: dim ? "rgba(255,255,255,0.04)" : "rgba(200,255,61,0.06)",
      border: `1px solid ${dim ? C.line : C.acid + "88"}`,
      boxShadow: glow ? `0 0 ${30 + glow * 50}px ${C.acid}${Math.round(glow * 90).toString(16).padStart(2, "0")}` : undefined,
      fontVariantNumeric: "tabular-nums",
    }}
  >
    {children}
  </div>
);
