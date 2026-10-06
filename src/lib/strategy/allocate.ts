// Suggested-allocation math (brief §27, §29). Pure + deterministic so it runs live in
// the browser as the user edits constraints. Fit-weighted, capped at maxPosition, with
// the cash reserve honoured; any overflow from caps spills to cash (never over-allocates).
export interface AllocInput {
  ticker: string;
  fit: number;
}
export interface AllocConstraints {
  maxPositions: number;
  maxPosition: number; // fraction
  cashReserve: number; // fraction
  excluded?: string[];
}
export interface AllocResult {
  allocations: Array<{ ticker: string; pct: number }>; // fraction of total capital
  cashPct: number;
}

export function allocateCapital(recs: AllocInput[], c: AllocConstraints): AllocResult {
  const excluded = new Set((c.excluded ?? []).map((t) => t.toUpperCase()));
  const picked = recs
    .filter((r) => !excluded.has(r.ticker.toUpperCase()))
    .slice(0, Math.max(1, c.maxPositions));

  const investable = Math.max(0, Math.min(1, 1 - c.cashReserve));
  if (picked.length === 0 || investable === 0) {
    return { allocations: [], cashPct: 1 };
  }

  const cap = Math.max(0.01, Math.min(1, c.maxPosition));
  // Weights from fit; fall back to equal if all fits are ~0.
  const totalFit = picked.reduce((s, r) => s + Math.max(0, r.fit), 0);
  const weights = new Map(
    picked.map((r) => [r.ticker, totalFit > 0 ? Math.max(0, r.fit) / totalFit : 1 / picked.length]),
  );

  const alloc = new Map<string, number>(picked.map((r) => [r.ticker, 0]));
  const capped = new Set<string>();
  let remaining = investable;

  // Water-fill: distribute `remaining` by weight, cap, redistribute leftover.
  for (let iter = 0; iter < 8 && remaining > 1e-6; iter++) {
    const active = picked.filter((r) => !capped.has(r.ticker));
    if (active.length === 0) break;
    const wActive = active.reduce((s, r) => s + (weights.get(r.ticker) || 0), 0) || active.length;
    let spilled = 0;
    for (const r of active) {
      const share = ((weights.get(r.ticker) || 1 / active.length) / wActive) * remaining;
      const current = alloc.get(r.ticker) || 0;
      const room = cap - current;
      if (share >= room) {
        alloc.set(r.ticker, cap);
        capped.add(r.ticker);
        spilled += share - room;
      } else {
        alloc.set(r.ticker, current + share);
      }
    }
    remaining = spilled;
  }

  const allocations = picked
    .map((r) => ({ ticker: r.ticker, pct: alloc.get(r.ticker) || 0 }))
    .filter((a) => a.pct > 0.0005);
  const used = allocations.reduce((s, a) => s + a.pct, 0);
  return { allocations, cashPct: Math.max(0, 1 - used) };
}
