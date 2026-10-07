"use client";

// Device-local thesis timeline. When you view a company, the current thesis is recorded — but only
// if it CHANGED from the last snapshot. Over time this accrues the real "why it changed" history
// (brief §13, §22). Honest: per-browser, and only genuine changes are kept.
export interface ThesisSnap { at: number; direction: string; score: number | null; summary: string }

const keyFor = (t: string) => `equency.thesis.${t.toUpperCase()}`;

export function getThesisHistory(ticker: string): ThesisSnap[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(keyFor(ticker)) || "[]"); } catch { return []; }
}

export function recordThesis(ticker: string, snap: Omit<ThesisSnap, "at">): ThesisSnap[] {
  if (typeof window === "undefined") return [];
  const key = keyFor(ticker);
  let list = getThesisHistory(ticker);
  const last = list[0];
  if (!last || last.direction !== snap.direction || last.score !== snap.score) {
    list = [{ ...snap, at: Date.now() }, ...list].slice(0, 12);
    try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* ignore */ }
  }
  return list;
}
