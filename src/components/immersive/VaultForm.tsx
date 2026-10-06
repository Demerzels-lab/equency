"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { scroll } from "./scroll-store";

/** Focal 3D for /vault: a glowing gem (the asset) inside a wireframe cage (the vault).
 *  Sits in the hero upper-right and drifts up as you scroll into the content. */
export function VaultForm() {
  const g = useRef<Group>(null);
  useFrame((_, dt) => {
    const grp = g.current;
    if (!grp) return;
    grp.rotation.y += dt * 0.28;
    grp.rotation.x += (0.4 + scroll.py * 0.12 - grp.rotation.x) * 0.04;
    grp.position.y = 1.0 - scroll.p * 2.4;
    grp.position.x = 2.4 + scroll.px * 0.15;
  });
  return (
    <group ref={g} position={[2.4, 1.0, 0]}>
      <mesh>
        <octahedronGeometry args={[0.85, 0]} />
        <meshBasicMaterial color="#2ee6c5" wireframe transparent opacity={0.85} />
      </mesh>
      <mesh scale={0.84}>
        <octahedronGeometry args={[0.85, 0]} />
        <meshBasicMaterial color="#071a17" transparent opacity={0.55} />
      </mesh>
      <mesh scale={1.7}>
        <icosahedronGeometry args={[0.85, 0]} />
        <meshBasicMaterial color="#2ee6c5" wireframe transparent opacity={0.14} />
      </mesh>
    </group>
  );
}
