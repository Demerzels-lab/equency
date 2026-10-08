"use client";

import { usePathname } from "next/navigation";
import { OrbScene } from "./Scenes";

/**
 * Landing-grade backdrop for every inner page: a slowly rotating dot-globe drifting off the
 * top-right edge, aurora glow and star dots, masked to fade into the page. Purely decorative and
 * pointer-transparent; the home page has its own full hero so it is skipped there.
 */
export function PageAmbient() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[820px] overflow-hidden [mask-image:linear-gradient(to_bottom,#000_45%,transparent)]">
      <div className="page-ambient-glow absolute inset-0" />
      <div className="dot-field absolute inset-0 opacity-60" />
      <OrbScene
        kind="core"
        className="!absolute -right-[14%] -top-[18%] aspect-square w-[min(820px,110vw)] opacity-55 md:-right-[6%] md:opacity-75"
      />
    </div>
  );
}
