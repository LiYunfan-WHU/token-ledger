import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { Tag, clamp, easeOut, useSpring } from "./kit";
import { TokenField } from "./TokenField";

/** 16–20s: logo lockup over a slow token drift. */
export const Outro = () => {
  const frame = useCurrentFrame();
  const mark = useSpring(4, 12, 0.9);
  const title = interpolate(frame, [10, 34], [0, 1], { ...clamp, easing: easeOut });
  const sub = interpolate(frame, [38, 56], [0, 1], clamp);
  const plug = interpolate(frame, [54, 70], [0, 1], clamp);
  const fade = interpolate(frame, [104, 120], [1, 0], clamp);
  const sweep = interpolate(frame, [14, 50], [-30, 130], clamp);

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <AbsoluteFill style={{ opacity: 0.45 }}>
        <TokenField speed={0.35} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, ${C.bg}cc 25%, ${C.bg} 75%)` }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 40 }}>
        <Mark scale={mark} />
        <div
          style={{
            fontFamily: FONT.display,
            fontWeight: 800,
            fontSize: 156,
            letterSpacing: `${0.02 + (1 - title) * 0.5}em`,
            opacity: title,
            filter: `blur(${(1 - title) * 12}px)`,
            backgroundImage: `linear-gradient(100deg, ${C.text} ${sweep - 20}%, #ffffff ${sweep}%, ${C.text} ${sweep + 20}%)`,
            WebkitBackgroundClip: "text",
            color: "transparent",
            textShadow: `0 0 60px ${C.blue}40`,
          }}
        >
          TOKEN LEDGER
        </div>
        <div style={{ fontFamily: FONT.ui, fontSize: 46, color: C.dim, opacity: sub, transform: `translateY(${(1 - sub) * 20}px)` }}>
          Know where every token went.
        </div>
        <div
          style={{
            opacity: plug,
            padding: "12px 26px",
            border: `1px solid ${C.acid}88`,
            borderRadius: 999,
            boxShadow: `0 0 40px ${C.acid}33`,
          }}
        >
          <Tag color={C.acid} style={{ fontSize: 22 }}>
            paseo plugin
          </Tag>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Stacked-ledger glyph: three offset bars forming a coin stack. */
const Mark = ({ scale }: { scale: number }) => (
  <svg width={150} height={150} viewBox="0 0 100 100" style={{ transform: `scale(${scale}) rotate(${(1 - scale) * -90}deg)`, filter: `drop-shadow(0 0 24px ${C.violet})` }}>
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={C.blue} />
        <stop offset="1" stopColor={C.violet} />
      </linearGradient>
    </defs>
    <rect x="14" y="62" width="72" height="16" rx="8" fill="url(#g)" />
    <rect x="22" y="40" width="64" height="16" rx="8" fill="url(#g)" opacity="0.85" />
    <rect x="30" y="18" width="56" height="16" rx="8" fill={C.acid} />
  </svg>
);
