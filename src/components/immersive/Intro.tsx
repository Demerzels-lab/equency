"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./useEnvironment";

const SEEN_KEY = "equency.intro.v1";
type Phase = "init" | "playing" | "closing" | "done";

/** First-visit cinematic splash. Plays ONCE (localStorage), full-screen above everything.
 *  Tiers: full/lite = particle crystallization in WebGL; static = instant CSS brand mark.
 *  Always dismissable (Skip / Esc) and self-dismissing (safety timeout) — never traps the user. */
export function Intro() {
  const [phase, setPhase] = useState<Phase>("init");
  const timers = useRef<number[]>([]);

  const close = useCallback(() => {
    setPhase((p) => {
      if (p === "closing" || p === "done") return p;
      window.setTimeout(() => {
        try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* ignore */ }
        document.documentElement.style.removeProperty("overflow");
        setPhase("done");
      }, 650); // match the CSS fade-out
      return "closing";
    });
  }, []);

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === "1"; } catch { /* ignore */ }
    if (seen) { setPhase("done"); return; }

    // Only greet first-time visitors on the home route. A first visit that lands on a
    // deep link (shared /company or /strategies URL) shouldn't get the splash — mark it
    // seen silently so it never ambushes them mid-session later.
    if (window.location.pathname !== "/") {
      try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* ignore */ }
      setPhase("done");
      return;
    }

    setPhase("playing");
    document.documentElement.style.overflow = "hidden";

    const visibleMs = prefersReducedMotion() ? 900 : 1600;
    timers.current.push(window.setTimeout(close, visibleMs));
    timers.current.push(window.setTimeout(close, 7000)); // hard safety net

    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      timers.current.forEach(clearTimeout);
      document.documentElement.style.removeProperty("overflow");
    };
  }, [close]);

  if (phase === "init" || phase === "done") return null;

  return (
    <div
      role="dialog"
      aria-label="EQUENCY intro"
      className="fixed inset-0 z-100 overflow-hidden bg-bg transition-opacity duration-700 ease-out"
      style={{ opacity: phase === "closing" ? 0 : 1 }}
    >
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-[0.12]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{ background: "radial-gradient(48% 40% at 50% 44%, color-mix(in oklab, var(--color-accent) 12%, transparent), transparent 70%)" }}
      />

      <div className="absolute inset-0" aria-hidden>
        <StaticMark />
      </div>

      {/* Foreground wordmark + tagline, anchored in the lower third */}
      <div className="relative z-10 flex h-full flex-col items-center justify-end gap-4 pb-[16vh]">
        <div className="flex items-center gap-3">
          <span className="block h-3 w-3 rotate-45 bg-accent" />
          <span className="intro-word mono text-lg font-semibold text-foreground sm:text-xl">EQUENCY</span>
        </div>
        <p className="intro-tag max-w-xs px-6 text-center text-sm text-muted-foreground">
          Intelligence for the newly public.
        </p>
        <div className="intro-bar eq-loader-track mt-1"><span className="eq-loader-seg" /></div>
      </div>

      <button
        onClick={close}
        className="label absolute bottom-6 right-6 z-20 rounded-sm border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:border-accent hover:text-foreground"
      >
        Skip →
      </button>
    </div>
  );
}

/** No-WebGL / reduced-motion: a crisp static diamond, no animation loop. */
function StaticMark() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <svg viewBox="-60 -60 120 120" className="h-[clamp(160px,30vmin,280px)] w-[clamp(160px,30vmin,280px)]">
        <polygon points="0,-46 40,0 0,46 -40,0" fill="none" stroke="var(--color-accent)" strokeOpacity="0.2" strokeWidth="0.7" />
        <polygon points="0,-30 26,0 0,30 -26,0" fill="var(--color-accent)" fillOpacity="0.07" stroke="var(--color-accent)" strokeOpacity="0.85" strokeWidth="1" />
      </svg>
    </div>
  );
}
