"use client";

// Device-local compare set (up to 4 tickers). Honest about being per-browser, like the watchlist.
const KEY = "equency.compare.v1";
export const MAX_COMPARE = 4;

export function getCompare(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(l: string[]) {
  localStorage.setItem(KEY, JSON.stringify(l.slice(0, MAX_COMPARE)));
  window.dispatchEvent(new Event("equency:compare"));
}
export function inCompare(t: string): boolean {
  return getCompare().includes(t.toUpperCase());
}
export function toggleCompare(t: string): boolean {
  const T = t.toUpperCase();
  const l = getCompare();
  const i = l.indexOf(T);
  if (i >= 0) l.splice(i, 1);
  else if (l.length < MAX_COMPARE) l.push(T);
  save(l);
  return l.includes(T);
}
export function clearCompare() { save([]); }
