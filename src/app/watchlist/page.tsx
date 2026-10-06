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
    <main className="mx-auto max-w-[860px] px-6 py-10">
      <div className="label">Watchlist</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Companies you follow</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Device-local for now. Open any to see its live Intelligence Core.
      </p>

      <div className="mt-8">
        {list == null ? (
          <SkeletonList />
        ) : list.length === 0 ? (
          <EmptyState />
        ) : (
          <Card className="gap-0 overflow-hidden rounded-sm border-border bg-card py-0 shadow-none">
            <Table>
              <TableBody>
                {list.map((e) => (
                  <TableRow key={e.ticker} className="border-border">
                    <TableCell>
                      <Link href={`/company/${e.ticker}`} className="flex items-center gap-3 text-sm">
                        <span className="mono w-16" style={{ color: "var(--color-accent)" }}>{e.ticker}</span>
                        <span>{e.name}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="w-20 text-right">
                      <button onClick={() => removeWatch(e.ticker)} className="label transition-colors hover:text-[color:var(--color-danger)]">
                        Remove
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center gap-3 rounded-sm border-border bg-card px-6 py-14 text-center shadow-none">
      <span className="text-2xl text-muted-foreground">☆</span>
      <div className="text-sm text-muted-foreground">
        No companies yet. Open a newly-public company and press <span style={{ color: "var(--color-accent)" }}>Watch</span>.
      </div>
      <Link href="/" className="label mt-1 inline-flex items-center rounded-sm border border-border px-3 py-1.5 transition-colors hover:border-accent-surface hover:text-foreground">
        Browse newly public →
      </Link>
    </Card>
  );
}

function SkeletonList() {
  return (
    <Card className="gap-0 divide-y divide-border overflow-hidden rounded-sm border-border bg-card py-0 shadow-none">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3.5">
          <div className="h-3 w-40 animate-pulse rounded bg-secondary" />
          <div className="h-3 w-12 animate-pulse rounded bg-secondary" />
        </div>
      ))}
    </Card>
  );
}
