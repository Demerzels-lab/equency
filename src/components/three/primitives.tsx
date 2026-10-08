"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/** Even point distribution on a sphere (Fibonacci lattice). */
export function fibonacciSphere(count: number, radius: number): Float32Array {
  const pts = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    pts[i * 3] = Math.cos(theta) * r * radius;
    pts[i * 3 + 1] = y * radius;
    pts[i * 3 + 2] = Math.sin(theta) * r * radius;
  }
  return pts;
}

/** Points whose opacity fades with depth (front bright, back faint). Additive blending makes the
 *  lattice glow against the dark sky; overlapping dots bloom instead of muddying. */
export function DepthPoints({
  positions,
  color,
  size = 2.2,
  opacity = 0.9,
  additive = true,
}: {
  positions: Float32Array;
  color: string;
  size?: number;
  opacity?: number;
  additive?: boolean;
}) {
  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [positions]);

  const dpr = useThree((s) => s.viewport.dpr);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uSize: { value: size },
          uOpacity: { value: opacity },
          uPixelRatio: { value: dpr },
        },
        vertexShader: /* glsl */ `
          uniform float uSize;
          uniform float uPixelRatio;
          varying float vDepth;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vec3 n = normalize((modelMatrix * vec4(position, 0.0)).xyz);
            vDepth = clamp(dot(n, normalize(cameraPosition)) * 0.5 + 0.5, 0.0, 1.0);
            gl_PointSize = uSize * uPixelRatio * (6.0 / -mv.z);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          uniform float uOpacity;
          varying float vDepth;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            if (d > 0.5) discard;
            float a = smoothstep(0.5, 0.15, d) * mix(0.12, 1.0, pow(vDepth, 1.6)) * uOpacity;
            gl_FragColor = vec4(uColor, a);
          }
        `,
      }),
    [color, size, opacity, dpr, additive],
  );

  return <points geometry={geom} material={mat} />;
}

/** Thin ellipse ring as a line loop. */
export function Ring({
  rx,
  ry = rx,
  color,
  opacity = 0.5,
  segments = 220,
}: {
  rx: number;
  ry?: number;
  color: string;
  opacity?: number;
  segments?: number;
}) {
  const line = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * rx, 0, Math.sin(a) * ry));
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    const m = new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
    return new THREE.Line(g, m);
  }, [rx, ry, color, opacity, segments]);
  return <primitive object={line} />;
}

/** Small body travelling along an ellipse. */
export function Satellite({
  rx,
  ry = rx,
  speed = 0.3,
  phase = 0,
  color,
  size = 0.06,
}: {
  rx: number;
  ry?: number;
  speed?: number;
  phase?: number;
  color: string;
  size?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const a = clock.elapsedTime * speed + phase;
    ref.current?.position.set(Math.cos(a) * rx, 0, Math.sin(a) * ry);
  });
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[size, 20, 20]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh>
        <sphereGeometry args={[size * 2.6, 20, 20]} />
        <meshBasicMaterial color={color} transparent opacity={0.14} depthWrite={false} />
      </mesh>
    </group>
  );
}

/** Rotates children toward the pointer with damping (subtle parallax). */
export function PointerTilt({ children, strength = 0.25 }: { children: React.ReactNode; strength?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ pointer }, dt) => {
    const g = ref.current;
    if (!g) return;
    const k = 1 - Math.exp(-dt * 3);
    g.rotation.y += (pointer.x * strength - g.rotation.y) * k;
    g.rotation.x += (-pointer.y * strength * 0.6 - g.rotation.x) * k;
  });
  return <group ref={ref}>{children}</group>;
}
