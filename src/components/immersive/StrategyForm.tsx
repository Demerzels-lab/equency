"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { scroll } from "./scroll-store";

/** Focal 3D for /strategies: glowing concentric orbital rings (ranking / allocation orbits)
 *  with a bright core. Upper-right of the hero, drifts up on scroll. */
export function StrategyForm() {
  const g = useRef<Group>(null);
  useFrame((_, dt) => {
    const grp = g.current;
    if (!grp) return;
    grp.rotation.z += dt * 0.12;
    grp.rotation.x += (1.0 + scroll.py * 0.12 - grp.rotation.x) * 0.04;
    grp.position.y = 0.9 - scroll.p * 2.4;
    grp.position.x = 2.4 + scroll.px * 0.15;
  });
  const rings: [number, number][] = [[0.55, 0.5], [0.95, 0.36], [1.4, 0.24]];
  return (
    <group ref={g} position={[2.4, 0.9, 0]}>
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#2ee6c5" />
      </mesh>
      {rings.map(([r, o], i) => (
        <mesh key={i} rotation={[0, 0, i * 0.7]}>
          <torusGeometry args={[r, 0.008, 8, 72]} />
          <meshBasicMaterial color="#2ee6c5" transparent opacity={o} />
        </mesh>
      ))}
    </group>
  );
}
