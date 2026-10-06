"use client";

import { EffectComposer, Bloom } from "@react-three/postprocessing";

// Code-split (its own dynamic import in Scene) so lite/static tiers never download postprocessing.
export function Effects() {
  return (
    <EffectComposer>
      <Bloom intensity={0.9} luminanceThreshold={0.08} luminanceSmoothing={0.35} radius={0.75} mipmapBlur />
    </EffectComposer>
  );
}
