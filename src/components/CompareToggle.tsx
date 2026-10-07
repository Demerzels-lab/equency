"use client";

import { useEffect, useState } from "react";
import { inCompare, toggleCompare } from "@/lib/compare";

export function CompareToggle({ ticker }: { ticker: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(inCompare(ticker));
    sync();
    window.addEventListener("equency:compare", sync);
    return () => window.removeEventListener("equency:compare", sync);
  }, [ticker]);

  return (
    <button
      onClick={() => toggleCompare(ticker)}
      className="label inline-flex items-center gap-1.5 rounded-sm border px-2.5 py-2 transition-colors"
      style={{ borderColor: on ? "var(--color-accent-2)" : "var(--color-border, var(--color-line))", color: on ? "var(--color-accent-2)" : "var(--color-ink-dim)" }}
    >
      {on ? "In compare ✓" : "+ Compare"}
    </button>
  );
}
