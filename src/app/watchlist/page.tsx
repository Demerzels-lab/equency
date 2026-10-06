"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getWatchlist, removeWatch, type WatchEntry } from "@/lib/watchlist";

export default function WatchlistPage() {
  const [list, setList] = useState<WatchEntry[] | null>(null);

  useEffect(() => {
    const sync = () => setList(getWatchlist());
    sync();
    window.addEventListener("equency:watchlist", sync);
    return () => window.removeEventListener("equency:watchlist", sync);
  }, []);

  return (
    <main className="mx-auto max-w-[860px] px-6 py-10">
      <div className="label">Watchlist</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Companies you follow</h1>
      <p className="mt-2 text-sm" style={{ color: "var(--color-ink-dim)" }}>
        Device-local (no account yet in Phase 1). Open any to see its live Intelligence Core.
      </p>

      <div className="mt-8">
        {list == null ? (
          <SkeletonList />
        ) : list.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="panel divide-y" style={{ borderColor: "var(--color-line)" }}>
            {list.map((e) => (
              <div key={e.ticker} className="rowlink flex items-center justify-between px-4 py-3">
                <Link href={`/company/${e.ticker}`} className="flex items-center gap-3 text-sm">
                  <span className="mono" style={{ color: "var(--color-accent)" }}>{e.ticker}</span>
                  <span style={{ color: "var(--color-ink)" }}>{e.name}</span>
                </Link>
                <button
                  onClick={() => removeWatch(e.ticker)}
                  className="label px-2 py-1 transition-colors hover:text-[color:var(--color-danger)]"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span style={{ fontSize: 22, color: "var(--color-ink-faint)" }}>☆</span>
      <div className="text-sm" style={{ color: "var(--color-ink-dim)" }}>
        No companies yet. Open a newly-public company and press <span style={{ color: "var(--color-accent)" }}>Watch</span>.
      </div>
      <Link href="/" className="label mt-1 px-3 py-1.5" style={{ border: "1px solid var(--color-line-strong)", color: "var(--color-ink)" }}>
        Browse newly public →
      </Link>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="panel divide-y" style={{ borderColor: "var(--color-line)" }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3.5">
          <div className="h-3 w-40 animate-pulse rounded" style={{ background: "var(--color-panel-2)" }} />
          <div className="h-3 w-12 animate-pulse rounded" style={{ background: "var(--color-panel-2)" }} />
        </div>
      ))}
    </div>
  );
}
