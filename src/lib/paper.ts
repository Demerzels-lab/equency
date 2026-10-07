"use client";

// Device-local PAPER portfolio — hypothetical positions, never real capital. Entry price is
// captured (live) when added; P&L is computed against live prices. Honest & labelled PAPER.
const KEY = "equency.paper.v1";

export interface PaperPos { ticker: string; name: string; entry: number; amount: number; at: number }

export function getPaper(): PaperPos[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function save(l: PaperPos[]) {
  localStorage.setItem(KEY, JSON.stringify(l));
  window.dispatchEvent(new Event("equency:paper"));
}
export function addPaper(p: PaperPos): boolean {
  const l = getPaper();
  if (l.some((x) => x.ticker === p.ticker)) return false;
  l.unshift(p);
  save(l);
  return true;
}
export function removePaper(t: string) { save(getPaper().filter((x) => x.ticker !== t.toUpperCase())); }
