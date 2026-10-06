"use client";

import dynamic from "next/dynamic";
import type { Tier } from "./useEnvironment";
import { LightField } from "./LightField";
import { Emblem } from "./Emblem";
import { AmbientField } from "./AmbientField";
import { VaultForm } from "./VaultForm";
import { StrategyForm } from "./StrategyForm";

export type SceneVariant = "home" | "ambient" | "vault" | "strategy";

// Bloom is code-split so lite/static + plain-ambient tiers never fetch postprocessing.
const Effects = dynamic(() => import("./Effects").then((m) => m.Effects), { ssr: false });

export function Scene({ tier, variant = "home" }: { tier: Tier; variant?: SceneVariant }) {
  if (variant === "home") {
    return (
      <>
        <LightField tier={tier} />
        <Emblem />
        {tier === "full" ? <Effects /> : null}
      </>
    );
  }
  return (
    <>
      <AmbientField tier={tier} />
      {variant === "vault" ? <VaultForm /> : null}
      {variant === "strategy" ? <StrategyForm /> : null}
      {tier === "full" && variant !== "ambient" ? <Effects /> : null}
    </>
  );
}
