"use client";

import { EffectComposer, Bloom, SMAA } from "@react-three/postprocessing";

// Code-split (its own dynamic import in Scene) so lite/static tiers never download postprocessing.
// multisampling (MSAA) + SMAA keep thin rotating features (rings, grid, dots) from shimmering,
// and the higher bloom threshold/smoothing stops near-threshold pixels flickering frame-to-frame.
export function Effects() {
  return (
    <EffectComposer multisampling={8}>
      <Bloom intensity={0.6} luminanceThreshold={0.22} luminanceSmoothing={0.7} radius={0.7} mipmapBlur />
      <SMAA />
    </EffectComposer>
  );
}
