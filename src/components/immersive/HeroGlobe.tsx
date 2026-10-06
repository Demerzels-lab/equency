"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, type Group, type Points } from "three";
import type { Tier } from "./useEnvironment";
import { scroll } from "./scroll-store";

// Deterministic 0..1 hash (no Math.random in render path → stable across HMR).
function h(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function stars(n: number): Float32Array {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = h(i) * Math.PI * 2;
    const v = Math.acos(2 * h(i + 97) - 1);
    const r = 6 + h(i + 193) * 7;
    a[i * 3] = Math.sin(v) * Math.cos(u) * r;
    a[i * 3 + 1] = Math.cos(v) * r;
    a[i * 3 + 2] = Math.sin(v) * Math.sin(u) * r;
  }
  return a;
}

const RING = { tube: 0.006, seg: 160 } as const;

/** Pendle-style hero: a dark wireframe globe (back hemisphere occluded by a near-black
 *  core), faint orbital rings, and a drifting starfield. Teal + indigo, bloom on full tier. */
export function HeroGlobe({ tier }: { tier: Tier }) {
  const globe = useRef<Group>(null);
  const rings = useRef<Group>(null);
  const starGrp = useRef<Points>(null);
  const lat = tier === "full" ? 40 : 26;
  const lon = tier === "full" ? 28 : 18;
  const starPos = useMemo(() => stars(tier === "full" ? 900 : 450), [tier]);

  useFrame((_, dt) => {
    if (globe.current) {
      globe.current.rotation.y += dt * 0.05 + scroll.px * 0.003;
      globe.current.rotation.x += (-0.15 + scroll.py * 0.12 - globe.current.rotation.x) * 0.04;
    }
    if (rings.current) rings.current.rotation.z += dt * 0.03;
    if (starGrp.current) starGrp.current.rotation.y += dt * 0.006;
    // gentle dolly as the hero scrolls away
    const z = -scroll.p * 2.0;
    if (globe.current) globe.current.position.z = z;
    if (rings.current) rings.current.position.z = z;
  });

  return (
    <group position={[0, 0.15, 0]}>
      {/* starfield */}
      <points ref={starGrp} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPos, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#aeb6ff" size={0.03} sizeAttenuation transparent opacity={0.7} depthWrite={false} blending={AdditiveBlending} />
      </points>

      {/* globe */}
      <group ref={globe}>
        {/* wireframe shell */}
        <mesh>
          <sphereGeometry args={[2.2, lat, lon]} />
          <meshBasicMaterial color="#2ee6c5" wireframe transparent opacity={0.16} />
        </mesh>
        {/* opaque dark core occludes the back hemisphere → "solid globe" read */}
        <mesh scale={0.985}>
          <sphereGeometry args={[2.2, 32, 24]} />
          <meshBasicMaterial color="#070a10" transparent opacity={0.94} />
        </mesh>
        {/* a few indigo accent lines via a second, offset wireframe */}
        <mesh rotation={[0, 0.6, 0.2]} scale={1.002}>
          <sphereGeometry args={[2.2, 10, 7]} />
          <meshBasicMaterial color="#7c82f8" wireframe transparent opacity={0.1} />
        </mesh>
      </group>

      {/* orbital rings */}
      <group ref={rings}>
        <mesh rotation={[1.35, 0.2, 0]}>
          <torusGeometry args={[3.4, RING.tube, 8, RING.seg]} />
          <meshBasicMaterial color="#2ee6c5" transparent opacity={0.22} />
        </mesh>
        <mesh rotation={[1.1, -0.5, 0.6]}>
          <torusGeometry args={[3.75, RING.tube, 8, RING.seg]} />
          <meshBasicMaterial color="#7c82f8" transparent opacity={0.18} />
        </mesh>
        {tier === "full" && (
          <mesh rotation={[1.5, 0.9, -0.3]}>
            <torusGeometry args={[3.1, RING.tube, 8, RING.seg]} />
            <meshBasicMaterial color="#2ee6c5" transparent opacity={0.12} />
          </mesh>
        )}
      </group>
    </group>
  );
}
