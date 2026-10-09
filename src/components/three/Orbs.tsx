"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Atmosphere, DepthPoints, PointerTilt, Ring, fibonacciSphere } from "./primitives";

/** Strategy orb: nested gyroscope rings around a glowing core (Boros-ball analogue). */
export function RingOrb({ color = "#ff6a33" }: { color?: string }) {
  const rings = useRef<THREE.Group>(null);
  const layers = useMemo(() => Array.from({ length: 14 }, (_, i) => i), []);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    rings.current?.children.forEach((c, i) => {
      c.rotation.x = Math.sin(t * 0.25 + i * 0.35) * 1.2;
      c.rotation.y = t * (0.08 + i * 0.012);
    });
  });
  return (
    <PointerTilt strength={0.3}>
      <group ref={rings}>
        {layers.map((i) => (
          <group key={i} rotation={[i * 0.22, 0, i * 0.18]}>
            <Ring rx={1.25 + i * 0.045} color={color} opacity={0.3 + (i % 3) * 0.12} segments={160} />
          </group>
        ))}
      </group>
      <mesh>
        <sphereGeometry args={[0.55, 48, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.85, 48, 48]} />
        <meshBasicMaterial color={color} transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </PointerTilt>
  );
}

/** Core orb: dotted lattice globe with an equatorial band (V2-ball analogue). */
export function DotGlobe({ color = "#5470ff" }: { color?: string }) {
  const ref = useRef<THREE.Group>(null);
  const pts = useMemo(() => fibonacciSphere(1800, 1.55), []);
  const inner = useMemo(() => fibonacciSphere(500, 0.9), []);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.18;
  });
  return (
    <PointerTilt strength={0.3}>
      <group ref={ref} rotation={[0.35, 0, 0]}>
        <DepthPoints positions={pts} color={color} size={3.3} highlight={0.6} />
        <DepthPoints positions={inner} color="#e4e9ff" size={2.2} opacity={0.4} />
        <group rotation={[Math.PI / 2 - 0.2, 0, 0]}>
          <Ring rx={1.95} color={color} opacity={0.4} />
          <Ring rx={2.1} color={color} opacity={0.15} />
        </group>
      </group>
      <Atmosphere radius={1.85} color="#dfe6ff" intensity={0.26} power={3.2} />
    </PointerTilt>
  );
}

/** Undulating dotted wave plane — sits behind the partners/marquee section. */
export function DotWave({ color = "#8ea0ff" }: { color?: string }) {
  const cols = 120;
  const rows = 34;
  const ref = useRef<THREE.Points>(null);
  const base = useMemo(() => {
    const p = new Float32Array(cols * rows * 3);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const i = (r * cols + c) * 3;
        p[i] = (c / (cols - 1) - 0.5) * 18;
        p[i + 1] = 0;
        p[i + 2] = (r / (rows - 1) - 0.5) * 6;
      }
    return p;
  }, []);
  const positions = useMemo(() => base.slice(), [base]);
  useFrame(({ clock }) => {
    const pts = ref.current;
    if (!pts) return;
    const t = clock.elapsedTime * 0.6;
    const arr = pts.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < arr.length; i += 3) {
      const x = base[i];
      const z = base[i + 2];
      arr[i + 1] = Math.sin(x * 0.45 + t) * 0.45 + Math.cos(z * 0.9 + t * 0.7) * 0.25;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });
  return (
    <points ref={ref} rotation={[0.42, 0, 0.08]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.045} transparent opacity={0.45} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}
