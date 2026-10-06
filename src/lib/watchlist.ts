"use client";

// Client-side watchlist (brief §53). Real, persistent per-browser via localStorage.
// No server/account yet in Phase 1 · honest about that: it's device-local.
export interface WatchEntry {
  ticker: string;
  name: string;
  addedAt: number;
}

const KEY = "equency.watchlist.v1";

export function getWatchlist(): WatchEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function save(list: WatchEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("equency:watchlist"));
}

export function isWatched(ticker: string): boolean {
  return getWatchlist().some((e) => e.ticker === ticker.toUpperCase());
}

export function toggleWatch(ticker: string, name: string): boolean {
  const t = ticker.toUpperCase();
  const list = getWatchlist();
  const idx = list.findIndex((e) => e.ticker === t);
  if (idx >= 0) {
    list.splice(idx, 1);
    save(list);
    return false;
  }
  list.unshift({ ticker: t, name, addedAt: Date.now() });
  save(list);
  return true;
}

export function removeWatch(ticker: string) {
  save(getWatchlist().filter((e) => e.ticker !== ticker.toUpperCase()));
}
