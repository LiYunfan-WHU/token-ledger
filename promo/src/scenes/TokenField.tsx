import { useLayoutEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ThreeCanvas } from "@remotion/three";
import { random, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";

const COUNT = 900;
const DEPTH = 220;

type Mode = "tunnel" | "grid";

/**
 * Instanced token cubes. Every transform is a pure function of the frame so
 * Remotion's parallel, out-of-order rendering stays deterministic.
 */
const Cubes = ({ speed, mode }: { speed: number; mode: Mode }) => {
  const frame = useCurrentFrame();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const a = random(`a${i}`) * Math.PI * 2;
        const r = 3 + random(`r${i}`) * 16;
        return {
          // Grid mode: a 30×30 lattice of bars on a floor plane.
          x: mode === "grid" ? ((i % 30) - 14.5) * 1.6 : Math.cos(a) * r,
          y: mode === "grid" ? -3 : Math.sin(a) * r,
          z: mode === "grid" ? Math.floor(i / 30) * (DEPTH / 30) : random(`z${i}`) * DEPTH,
          s: 0.12 + random(`s${i}`) ** 3 * 0.6,
          spin: (random(`p${i}`) - 0.5) * 0.2,
          hue: random(`h${i}`),
        };
      }),
    [mode],
  );

  const colors = useMemo(() => {
    const blue = new THREE.Color(C.blue);
    const violet = new THREE.Color(C.violet);
    const acid = new THREE.Color(C.acid);
    const arr = new Float32Array(COUNT * 3);
    seeds.forEach((s, i) => {
      const c = s.hue > 0.94 ? acid : blue.clone().lerp(violet, s.hue);
      c.toArray(arr, i * 3);
    });
    return arr;
  }, [seeds]);

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    seeds.forEach((s, i) => {
      const z = ((s.z + frame * speed) % DEPTH) - DEPTH + 8;
      const gridHeight =
        mode === "grid" ? Math.max(0.05, Math.sin(s.x * 0.35 + z * 0.12 + frame * 0.1) * 1.2 + s.hue ** 4 * 5) : 0;
      dummy.position.set(s.x, s.y + gridHeight * 0.5, z);
      if (mode === "grid") {
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1.1, gridHeight, 1.1);
      } else {
        dummy.rotation.set(frame * s.spin, frame * s.spin * 1.3, 0);
        dummy.scale.setScalar(s.s);
      }
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [frame, seeds, speed, mode, dummy]);

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]}>
      <boxGeometry args={[1, 1, 1]}>
        <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
      </boxGeometry>
      <meshStandardMaterial vertexColors emissive={C.violet} emissiveIntensity={0.35} metalness={0.6} roughness={0.25} />
    </instancedMesh>
  );
};

const Rig = ({ camY, tilt, roll }: { camY: number; tilt: number; roll: number }) => {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(0, camY, 10);
    camera.rotation.set(tilt, 0, roll);
    camera.updateMatrixWorld();
  }, [camera, camY, tilt, roll]);
  return null;
};

export const TokenField = ({
  speed = 1.4,
  mode = "tunnel",
  camY = 0,
  tilt = 0,
  roll = 0,
}: {
  speed?: number;
  mode?: Mode;
  camY?: number;
  tilt?: number;
  roll?: number;
}) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      camera={{ fov: 70, position: [0, camY, 10], rotation: [tilt, 0, roll] }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={[C.bg]} />
      <fog attach="fog" args={[C.bg, 20, 120]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 6]} intensity={180} color={C.blue} />
      <pointLight position={[8, 6, -20]} intensity={400} color={C.violet} />
      <directionalLight position={[-5, 8, 5]} intensity={1.6} color="#ffffff" />
      <Cubes speed={speed} mode={mode} />
      <Rig camY={camY} tilt={tilt} roll={roll} />
    </ThreeCanvas>
  );
};
