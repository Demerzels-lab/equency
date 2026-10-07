"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending, CanvasTexture, Color, LinearMipmapLinearFilter, SRGBColorSpace, type Group, type Points } from "three";
import type { Tier } from "./useEnvironment";
import { scroll } from "./scroll-store";

// Deterministic 0..1 hash (no Math.random in render path → stable across HMR).
function hsh(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function stars(n: number): Float32Array {
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = hsh(i) * Math.PI * 2;
    const v = Math.acos(2 * hsh(i + 97) - 1);
    const r = 6 + hsh(i + 193) * 7;
    a[i * 3] = Math.sin(v) * Math.cos(u) * r;
    a[i * 3 + 1] = Math.cos(v) * r;
    a[i * 3 + 2] = Math.sin(v) * Math.sin(u) * r;
  }
  return a;
}

/** Equirectangular grid-and-dots texture drawn to a canvas, with mipmaps → the globe lines
 *  never shimmer when it rotates (GPU minification handles sub-pixel lines). This replaces
 *  `wireframe` GL lines, which are locked to 1px and flicker on any rotating sphere. */
function makeGlobeTexture(aniso: number): CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const w = 1024, h = 512;
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#070b11";
  ctx.fillRect(0, 0, w, h);
  const lon = 18, lat = 10;
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(46,230,197,0.55)";
  for (let i = 0; i <= lon; i++) { const x = (i / lon) * w; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let j = 0; j <= lat; j++) { const y = (j / lat) * h; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
  ctx.fillStyle = "rgba(160,248,232,0.95)";
  for (let i = 0; i <= lon; i++) for (let j = 0; j <= lat; j++) { const x = (i / lon) * w, y = (j / lat) * h; ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill(); }
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.anisotropy = aniso;
  tex.generateMipmaps = true;
  tex.minFilter = LinearMipmapLinearFilter;
  return tex;
}

const RING = { tube: 0.02, seg: 200 } as const;

const rimVert = /* glsl */ `
  varying vec3 vN; varying vec3 vView;
  void main() {
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const rimFrag = /* glsl */ `
  precision mediump float;
  varying vec3 vN; varying vec3 vView; uniform vec3 uColor; uniform float uPow; uniform float uInt;
  void main() {
    float f = pow(1.0 - max(dot(vN, vView), 0.0), uPow);
    gl_FragColor = vec4(uColor, f * uInt);
  }
`;

/** Pendle-style hero: a solid dark globe with a mipmapped grid texture (shimmer-free), a
 *  fresnel atmosphere rim, faint orbital rings and a drifting starfield. Teal + indigo. */
export function HeroGlobe({ tier }: { tier: Tier }) {
  const globe = useRef<Group>(null);
  const rings = useRef<Group>(null);
  const starGrp = useRef<Points>(null);
  const gl = useThree((s) => s.gl);
  const starPos = useMemo(() => stars(tier === "full" ? 900 : 450), [tier]);
  const tex = useMemo(() => makeGlobeTexture(Math.min(8, gl.capabilities.getMaxAnisotropy?.() ?? 1)), [gl]);
  const rimU = useMemo(() => ({ uColor: { value: new Color("#2ee6c5") }, uPow: { value: 2.8 }, uInt: { value: 0.55 } }), []);

  useFrame((_, dt) => {
    if (globe.current) {
      globe.current.rotation.y += dt * 0.05 + scroll.px * 0.006;
      globe.current.rotation.x += (-0.15 + scroll.py * 0.22 - globe.current.rotation.x) * 0.045;
      globe.current.position.x = scroll.px * 0.25;
    }
    if (rings.current) rings.current.rotation.z += dt * 0.03;
    if (starGrp.current) starGrp.current.rotation.y += dt * 0.006;
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
        <pointsMaterial color="#8c93c8" size={0.028} sizeAttenuation transparent opacity={0.4} depthWrite={false} />
      </points>

      {/* globe */}
      <group ref={globe}>
        {/* solid sphere with a mipmapped grid texture — opaque, front-face only (back culled),
            so there is no z-fight and no 1px-line shimmer when it rotates. */}
        <mesh>
          <sphereGeometry args={[2.2, 64, 48]} />
          <meshBasicMaterial map={tex ?? undefined} color={tex ? "#ffffff" : "#0b1016"} />
        </mesh>
        {/* fresnel atmosphere rim (additive halo, no depth write/test) */}
        <mesh scale={1.045}>
          <sphereGeometry args={[2.2, 48, 32]} />
          <shaderMaterial uniforms={rimU} vertexShader={rimVert} fragmentShader={rimFrag} transparent depthWrite={false} depthTest={false} blending={AdditiveBlending} />
        </mesh>
      </group>

      {/* orbital rings — real tubes (not 1px lines), thick enough to stay smooth */}
      <group ref={rings}>
        <mesh rotation={[1.35, 0.2, 0]}>
          <torusGeometry args={[3.4, RING.tube, 10, RING.seg]} />
          <meshBasicMaterial color="#2ee6c5" transparent opacity={0.22} />
        </mesh>
        <mesh rotation={[1.1, -0.5, 0.6]}>
          <torusGeometry args={[3.75, RING.tube, 10, RING.seg]} />
          <meshBasicMaterial color="#7c82f8" transparent opacity={0.2} />
        </mesh>
        {tier === "full" && (
          <mesh rotation={[1.5, 0.9, -0.3]}>
            <torusGeometry args={[3.1, RING.tube, 10, RING.seg]} />
            <meshBasicMaterial color="#2ee6c5" transparent opacity={0.13} />
          </mesh>
        )}
      </group>
    </group>
  );
}
