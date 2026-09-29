import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { Headline, Tag, clamp, easeOut, fmt, panelStyle, useSpring } from "./kit";

const AGENTS = [
  { name: "billing-refactor", model: "claude-fable-5", tokens: 8_710_000, cost: 26.64, color: C.acid },
  { name: "api-migration", model: "gpt-5-codex", tokens: 4_120_000, cost: 11.38, color: C.blue },
  { name: "docs-sweep", model: "claude-fable-5", tokens: 1_930_000, cost: 5.07, color: C.violet },
  { name: "flaky-test-hunt", model: "gpt-5-codex", tokens: 960_000, cost: 2.41, color: "#7aa7ff" },
];
const TOTAL = AGENTS.reduce((s, a) => s + a.cost, 0);

/** 12–16s: multi-agent overview + timeline with a pulsing grand total. */
export const Run = () => {
  const frame = useCurrentFrame();
  const drift = interpolate(frame, [0, 120], [40, -40], clamp);
  const count = interpolate(frame, [10, 80], [0, 1], { ...clamp, easing: easeOut });
  const beat = Math.max(0, Math.sin(frame * 0.52)) ** 8;

  return (
    <AbsoluteFill style={{ perspective: 2000 }}>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 70% 30%, ${C.blue}26, transparent 50%)` }} />
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 60, transform: `translateX(${drift}px)` }}>
        <div style={{ ...panelStyle, width: 900, padding: "36px 40px", transform: "rotateY(14deg)" }}>
          <Tag style={{ marginBottom: 22 }}>overview · 4 agents</Tag>
          {AGENTS.map((a, i) => (
            <Row key={a.name} index={i} {...a} />
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, transform: "rotateY(-12deg)" }}>
          <Tag color={C.acid}>total run cost</Tag>
          <div
            style={{
              fontFamily: FONT.display,
              fontWeight: 800,
              fontSize: 150,
              color: C.acid,
              textShadow: `0 0 ${40 + beat * 80}px ${C.acid}${beat > 0.3 ? "cc" : "66"}`,
              transform: `scale(${1 + beat * 0.04})`,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            ${(TOTAL * count).toFixed(2)}
          </div>
          <Timeline />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 70 }}>
        <Headline words={["See", "the", "whole", "run."]} delay={40} size={96} accent={[2, 3]} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Row = ({ name, model, tokens, cost, color, index }: (typeof AGENTS)[number] & { index: number }) => {
  const s = useSpring(index * 5, 15);
  const frame = useCurrentFrame();
  const p = interpolate(frame, [10 + index * 5, 70 + index * 5], [0, 1], { ...clamp, easing: easeOut });
  const fill = (p * cost) / AGENTS[0].cost;
  return (
    <div style={{ padding: "18px 0", borderTop: index ? `1px solid ${C.line}` : undefined, opacity: s, transform: `translateX(${(1 - s) * -120}px)` }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 18, fontFamily: FONT.ui }}>
        <span style={{ width: 12, height: 12, borderRadius: 6, background: color, boxShadow: `0 0 16px ${color}` }} />
        <span style={{ fontSize: 34, color: C.text, fontWeight: 600, flex: 1 }}>{name}</span>
        <span style={{ fontFamily: FONT.mono, fontSize: 24, color: C.dim, width: 180, textAlign: "right" }}>{fmt(tokens * p)}</span>
        <span style={{ fontFamily: FONT.mono, fontSize: 32, color: C.text, width: 150, textAlign: "right" }}>${(cost * p).toFixed(2)}</span>
      </div>
      <div style={{ display: "flex", gap: 18, alignItems: "center", marginTop: 10, paddingLeft: 30 }}>
        <span style={{ fontFamily: FONT.mono, fontSize: 18, color: C.dim, width: 240 }}>{model}</span>
        <div style={{ flex: 1, height: 6, background: C.line, borderRadius: 3 }}>
          <div style={{ width: `${fill * 100}%`, height: "100%", borderRadius: 3, background: color, boxShadow: `0 0 12px ${color}` }} />
        </div>
      </div>
    </div>
  );
};

const Timeline = () => {
  const frame = useCurrentFrame();
  const head = interpolate(frame, [20, 110], [0, 1], clamp);
  const ticks = Array.from({ length: 22 }, (_, i) => i / 21);
  return (
    <div style={{ ...panelStyle, width: 640, padding: "22px 28px" }}>
      <Tag style={{ fontSize: 16, marginBottom: 16 }}>timeline</Tag>
      <div style={{ position: "relative", height: 70 }}>
        <div style={{ position: "absolute", top: 34, left: 0, right: 0, height: 2, background: C.line }} />
        {ticks.map((t, i) => {
          const on = t <= head;
          const h = 14 + ((i * 37) % 11) * 4;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${t * 100}%`,
                top: 35 - h / 2,
                width: 6,
                height: h,
                borderRadius: 3,
                background: on ? (i % 5 === 3 ? C.acid : C.violet) : "rgba(255,255,255,0.08)",
                boxShadow: on ? `0 0 10px ${C.violet}` : undefined,
              }}
            />
          );
        })}
        <div style={{ position: "absolute", left: `${head * 100}%`, top: 0, bottom: 0, width: 2, background: C.acid, boxShadow: `0 0 20px ${C.acid}` }} />
      </div>
    </div>
  );
};
