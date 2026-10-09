"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Atmosphere, DepthPoints, PointerTilt, Ring, Satellite, fibonacciSphere } from "./primitives";
import { seeded } from "@/lib/rand";

// Dark-sky palette: "INK" is a near-white starlight tone so the globe reads as a lit, pearl-like
// object on the night bg; the Core blue stays as the tint on the far side and the orbits.
const INK = "#e4e9ff";
const PEARL = "#c7d2ff";
const CORE = "#6680ff";
const STRATEGY = "#ff6a33";

/** Latitude/longitude wireframe globe with back-face fading. */
function WireGlobe({ radius = 2.2 }: { radius?: number }) {
  const lines = useMemo(() => {
    const group = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending });
    for (let lat = -75; lat <= 75; lat += 15) {
      const r = Math.cos((lat * Math.PI) / 180) * radius;
      const y = Math.sin((lat * Math.PI) / 180) * radius;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    }
    for (let lon = 0; lon < 180; lon += 15) {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 128; i++) {
        const a = (i / 128) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
      }
      const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
      l.rotation.y = (lon * Math.PI) / 180;
      group.add(l);
    }
    return group;
  }, [radius]);
  return <primitive object={lines} />;
}

/** Beam of parallel streaks leaving the globe (the "comet" accent from the reference). */
function Beam() {
  const ref = useRef<THREE.Group>(null);
  const streaks = useMemo(() => {
    const r = seeded(7);
    return Array.from({ length: 9 }, (_, i) => ({
      offset: (i - 4) * 0.045,
      len: 1.4 + r() * 1.4,
      speed: 0.6 + r() * 0.6,
      phase: r(),
    }));
  }, []);
  useFrame(({ clock }) => {
    ref.current?.children.forEach((c, i) => {
      const s = streaks[i];
      const t = (clock.elapsedTime * s.speed * 0.25 + s.phase) % 1;
      c.position.y = 2.1 + t * 2.2;
      (c as THREE.Mesh).scale.y = s.len * (1 - t * 0.5);
      ((c as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = Math.sin(t * Math.PI) * 0.75;
    });
  });
  return (
    <group ref={ref} rotation={[0, 0, -0.85]} position={[0.2, 0.2, 0.4]}>
      {streaks.map((s, i) => (
        <mesh key={i} position={[s.offset, 2.4, 0]}>
          <planeGeometry args={[0.012, 1]} />
          <meshBasicMaterial color={i % 3 === 0 ? STRATEGY : CORE} transparent opacity={0.5} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Dust({ count = 700 }: { count?: number }) {
  const positions = useMemo(() => {
    const r = seeded(42);
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (r() - 0.5) * 22;
      p[i * 3 + 1] = (r() - 0.5) * 12;
      p[i * 3 + 2] = (r() - 0.5) * 8 - 3;
    }
    return p;
  }, [count]);
  const ref = useRef<THREE.Points>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.006;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={INK} size={0.02} transparent opacity={0.55} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

/** Hero centrepiece: wire globe + point shell + tilted orbits with satellites + beam + dust. */
export function HeroPlanet() {
  const globe = useRef<THREE.Group>(null);
  const shell = useMemo(() => fibonacciSphere(2600, 2.24), []);
  // Shrink the whole system on narrow (portrait) viewports so orbits stay in frame.
  const aspect = useThree((s) => s.size.width / s.size.height);
  const scale = Math.min(1, Math.max(0.55, aspect / 1.6));

  useFrame((_, dt) => {
    if (globe.current) globe.current.rotation.y += dt * 0.06;
  });

  return (
    <>
      <Dust />
      <PointerTilt strength={0.18}>
        <group position={[0, -1.15, 0]} scale={scale}>
          <group ref={globe} rotation={[0.25, 0, 0.12]}>
            <WireGlobe />
            <DepthPoints positions={shell} color={PEARL} size={4.2} opacity={1} highlight={0.75} />
          </group>
          {/* limb glow · outside the rotating group so it stays a stable halo */}
          <Atmosphere radius={2.62} color="#dfe6ff" intensity={0.5} />
          <Atmosphere radius={3.05} color={CORE} intensity={0.22} power={3.4} />

          <group rotation={[1.38, 0, 0.12]}>
            <Ring rx={5.6} ry={1.6} color={INK} opacity={0.26} />
            <Ring rx={5.66} ry={1.64} color={INK} opacity={0.08} />
            <Satellite rx={5.6} ry={1.6} speed={0.12} color={STRATEGY} size={0.07} />
          </group>
          <group rotation={[1.05, 0.5, -0.45]}>
            <Ring rx={3.3} color={CORE} opacity={0.32} />
            <Satellite rx={3.3} speed={0.22} phase={2} color={CORE} size={0.06} />
          </group>
          <group rotation={[1.9, -0.4, 0.6]}>
            <Ring rx={2.9} ry={2.6} color={INK} opacity={0.22} />
            <Satellite rx={2.9} ry={2.6} speed={-0.3} phase={4} color={INK} size={0.045} />
          </group>
          <Beam />
        </group>
      </PointerTilt>
    </>
  );
}
