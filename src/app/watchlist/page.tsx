"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getWatchlist, removeWatch, type WatchEntry } from "@/lib/watchlist";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export default function WatchlistPage() {
  const [list, setList] = useState<WatchEntry[] | null>(null);

  useEffect(() => {
    const sync = () => setList(getWatchlist());
    sync();
    window.addEventListener("equency:watchlist", sync);
    return () => window.removeEventListener("equency:watchlist", sync);
  }, []);

  return (
    <main className="page-main mx-auto max-w-[960px] px-6 pt-28 sm:pt-32 pb-20">
      <div className="section-label mb-2">01 / LOCAL WATCHLIST</div>
      <h1 className="editorial-h2">Companies you <span className="editorial-accent">follow.</span></h1>
      <p className="editorial-lead mt-2 max-w-[60ch]">
        Device-local watchlist. Real-time updates from EDGAR and live market feeds.
      </p>

      <div className="mt-8">
        {list == null ? (
          <SkeletonList />
        ) : list.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="border border-[color:var(--color-line)] bg-[color:var(--color-panel)] overflow-hidden">
            <div className="divide-y divide-[color:var(--color-line)]">
              {list.map((e) => (
                <div key={e.ticker} className="flex items-center justify-between p-4 sm:px-6 hover:bg-[color:var(--color-panel-2)] transition-colors group">
                  <Link href={`/company/${e.ticker}`} className="flex items-center gap-4 text-sm min-w-0">
                    <span className="font-mono font-bold text-sm text-[color:var(--color-accent)] group-hover:underline w-16 shrink-0">{e.ticker}</span>
                    <span className="font-sans font-semibold text-[color:var(--color-ink)] truncate">{e.name}</span>
                  </Link>
                  <button
                    onClick={() => removeWatch(e.ticker)}
                    className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-danger)] transition-colors px-2 py-1 rounded-sm border border-transparent hover:border-[color:var(--color-line)]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-6 py-16 text-center">
      <span className="text-2xl text-[color:var(--color-ink-faint)]">☆</span>
      <div className="text-sm text-[color:var(--color-ink-dim)]">
        No companies added to your watchlist yet.
      </div>
      <Link href="/explore" className="font-mono text-xs text-[color:var(--color-accent)] hover:underline mt-2 inline-flex items-center gap-1.5">
        Browse newly public universe →
      </Link>
    </div>
  );
}

function SkeletonList() {
  return (
    <div className="divide-y divide-[color:var(--color-line)] border border-[color:var(--color-line)] bg-[color:var(--color-panel)]">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between p-4 sm:px-6">
          <div className="h-3 w-40 animate-pulse rounded-full bg-[color:var(--color-panel-2)]" />
          <div className="h-3 w-12 animate-pulse rounded-full bg-[color:var(--color-panel-2)]" />
        </div>
      ))}
    </div>
  );
}
