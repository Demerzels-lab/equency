"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCompare, toggleCompare, clearCompare } from "@/lib/compare";

/** Floating bar that appears once you add companies to compare (from Explore or a company page). */
export function CompareBar() {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    const h = () => setList(getCompare());
    h();
    window.addEventListener("equency:compare", h);
    return () => window.removeEventListener("equency:compare", h);
  }, []);
  if (list.length === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-full border border-[color:var(--color-line-strong)] bg-[color:color-mix(in_oklab,var(--color-panel)_94%,transparent)] px-4 py-2 shadow-2xl backdrop-blur">
        <span className="label hidden sm:inline">Compare</span>
        <div className="flex items-center gap-1.5">
          {list.map((t) => (
            <button key={t} onClick={() => toggleCompare(t)} className="mono inline-flex items-center gap-1 rounded-sm border border-border px-2 py-0.5 text-xs" style={{ color: "var(--color-accent-2)" }} title="remove">
              {t}<span className="text-muted-foreground">×</span>
            </button>
          ))}
        </div>
        <Link href={`/compare?tickers=${list.join(",")}`} className="label rounded-sm bg-[color:var(--color-ink)] px-3 py-1.5 text-[color:var(--color-bg)] transition-colors hover:bg-white">
          Compare →
        </Link>
        <button onClick={clearCompare} className="label text-muted-foreground transition-colors hover:text-foreground">clear</button>
      </div>
    </div>
  );
}
