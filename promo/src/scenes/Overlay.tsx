import { AbsoluteFill, interpolate, random, useCurrentFrame } from "remotion";
import { C, SHOTS } from "../theme";
import { clamp } from "./kit";

const CUTS = Object.values(SHOTS).map(([from]) => from).filter((f) => f > 0);

/** Film layer over every shot: cut flashes + RGB-shift, scanlines, grain, vignette. */
export const Overlay = () => {
  const frame = useCurrentFrame();
  const sinceCut = Math.min(...CUTS.map((c) => (frame >= c ? frame - c : Infinity)));
  const flash = interpolate(sinceCut, [0, 6], [0.55, 0], clamp);
  const shift = interpolate(sinceCut, [0, 8], [14, 0], clamp);
  const grainX = Math.floor(random(`gx${frame}`) * 200);
  const grainY = Math.floor(random(`gy${frame}`) * 200);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {shift > 0.5 && (
        <>
          <AbsoluteFill style={{ boxShadow: `inset ${shift}px 0 0 ${C.red}55, inset ${-shift}px 0 0 ${C.blue}55` }} />
          <AbsoluteFill style={{ top: `${random(`bar${frame}`) * 90}%`, height: 6, background: `${C.acid}aa`, mixBlendMode: "screen" }} />
        </>
      )}
      <AbsoluteFill style={{ background: "#fff", opacity: flash, mixBlendMode: "overlay" }} />
      <AbsoluteFill
        style={{
          backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0 1px, transparent 1px 3px)",
          opacity: 0.35,
        }}
      />
      <AbsoluteFill
        style={{
          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.5'/></svg>")`,
          backgroundPosition: `${grainX}px ${grainY}px`,
          opacity: 0.08,
          mixBlendMode: "overlay",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.75) 100%)" }} />
    </AbsoluteFill>
  );
};
