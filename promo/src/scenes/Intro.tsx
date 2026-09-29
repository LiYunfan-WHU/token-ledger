import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Headline, Tag, clamp, easeOut } from "./kit";
import { TokenField } from "./TokenField";

/** 0–3s: token cubes rush the lens, then the claim slams in. */
export const Intro = () => {
  const frame = useCurrentFrame();
  const speed = interpolate(frame, [0, 30, 90], [4.5, 1.6, 0.9], { ...clamp, easing: easeOut });
  const flash = interpolate(frame, [0, 3, 10], [1, 0.7, 0], clamp);
  const roll = interpolate(frame, [0, 90], [0.12, -0.04], clamp);
  return (
    <AbsoluteFill>
      <TokenField speed={speed} roll={roll} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, transparent 20%, ${C.bg} 78%)` }} />
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 36 }}>
        <Tag color={C.blue} style={{ opacity: interpolate(frame, [18, 30], [0, 1], clamp) }}>
          ◆ token ledger // paseo
        </Tag>
        <Headline words={["Every", "token."]} delay={22} size={150} />
        <Headline words={["Accounted", "for."]} delay={40} size={150} accent={[0, 1]} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff", opacity: flash, mixBlendMode: "screen" }} />
    </AbsoluteFill>
  );
};
