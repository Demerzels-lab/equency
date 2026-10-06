"use client";

import { useEffect, useState } from "react";
import { isWatched, toggleWatch } from "@/lib/watchlist";

export function WatchButton({ ticker, name }: { ticker: string; name: string }) {
  const [watched, setWatched] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setWatched(isWatched(ticker));
    const sync = () => setWatched(isWatched(ticker));
    window.addEventListener("equency:watchlist", sync);
    return () => window.removeEventListener("equency:watchlist", sync);
  }, [ticker]);

  return (
    <button
      onClick={() => setWatched(toggleWatch(ticker, name))}
      aria-pressed={watched}
      className="label inline-flex items-center gap-1.5 px-2.5 py-1.5 transition-colors"
      style={{
        border: `1px solid ${watched ? "var(--color-accent)" : "var(--color-line-strong)"}`,
        color: watched ? "var(--color-accent)" : "var(--color-ink-dim)",
        background: watched ? "color-mix(in oklab, var(--color-accent) 12%, transparent)" : "transparent",
        borderRadius: 3,
        opacity: mounted ? 1 : 0.6,
      }}
    >
      <span style={{ fontSize: 11 }}>{watched ? "★" : "☆"}</span>
      {watched ? "Watching" : "Watch"}
    </button>
  );
}
