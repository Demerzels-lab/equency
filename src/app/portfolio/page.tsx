"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getPaper, addPaper, removePaper, type PaperPos } from "@/lib/paper";
import { fmtUsd } from "@/lib/util/format";

export default function PortfolioPage() {
  const [pos, setPos] = useState<PaperPos[]>([]);
  const [quotes, setQuotes] = useState<Record<string, number | null>>({});
  const [ticker, setTicker] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const refreshQuotes = useCallback(async (list: PaperPos[]) => {
    const syms = list.map((p) => p.ticker);
    if (syms.length === 0) { setQuotes({}); return; }
    try {
      const r = await fetch(`/api/quote?symbols=${syms.join(",")}`);
      const { quotes } = (await r.json()) as { quotes: Record<string, number | null> };
      setQuotes(quotes);
    } catch { /* keep */ }
  }, []);

  useEffect(() => {
    const sync = () => { const l = getPaper(); setPos(l); refreshQuotes(l); };
    sync();
    window.addEventListener("equency:paper", sync);
    return () => window.removeEventListener("equency:paper", sync);
  }, [refreshQuotes]);

  async function add() {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch(`/api/quote?symbols=${t}`);
      const { quotes } = (await r.json()) as { quotes: Record<string, number | null> };
      const price = quotes[t];
      if (price == null) { setErr(`No live price for ${t}.`); return; }
      addPaper({ ticker: t, name: t, entry: price, amount: 1000, at: Date.now() });
      setTicker("");
    } catch { setErr("Could not add."); }
    finally { setBusy(false); }
  }

  const rows = pos.map((p) => {
    const cur = quotes[p.ticker] ?? null;
    const pnlPct = cur != null ? (cur / p.entry - 1) : null;
    const pnlUsd = pnlPct != null ? pnlPct * p.amount : null;
    const value = pnlPct != null ? p.amount * (1 + pnlPct) : p.amount;
    return { ...p, cur, pnlPct, pnlUsd, value };
  });
  const totalCost = rows.reduce((s, r) => s + r.amount, 0);
  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalPnl = totalValue - totalCost;
  const totalPct = totalCost ? totalPnl / totalCost : 0;

  return (
    <main className="page-main mx-auto max-w-[1240px] px-6 pt-28 sm:pt-32 pb-20">
      <div className="flex items-center gap-3">
        <div className="section-label mb-0">STRATEGY / PAPER PORTFOLIO</div>
        <span className="font-mono text-[10px] tracking-widest uppercase border border-[color:var(--color-sim)] text-[color:var(--color-sim)] px-2 py-0.5 rounded-sm">
          DEVICE-LOCAL
        </span>
      </div>
      <h1 className="editorial-h2 mt-4">
        Test a thesis <span className="editorial-accent">with zero capital.</span>
      </h1>
      <p className="editorial-lead mt-2 max-w-[62ch]">
        Hypothetical simulation only. Entry is recorded from live quotes upon addition; P&amp;L continuously
        tracks subsequent market prints.
      </p>

      {/* totals */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Active Positions" value={String(rows.length)} />
        <Stat label="Total Invested" value={fmtUsd(totalCost)} />
        <Stat label="Portfolio Value" value={fmtUsd(totalValue)} />
        <Stat label="Simulated P&L" value={`${totalPnl >= 0 ? "+" : ""}${fmtUsd(totalPnl)} · ${(totalPct * 100).toFixed(2)}%`} color={totalPnl >= 0 ? "var(--color-pos)" : "var(--color-danger)"} />
      </div>

      {/* add */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add ticker (e.g. ADRX)"
          className="font-mono h-10 w-56 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-4 text-xs uppercase text-[color:var(--color-ink)] outline-none focus:border-[color:var(--color-accent)] transition-colors placeholder:normal-case placeholder:text-[color:var(--color-ink-faint)]"
        />
        <button
          onClick={add}
          disabled={busy}
          className="font-mono text-xs font-semibold rounded-full bg-[color:var(--color-ink)] px-5 h-10 text-[color:var(--color-bg)] hover:bg-white transition-all disabled:opacity-50 cursor-pointer"
        >
          {busy ? "Executing…" : "Allocate $1,000"}
        </button>
        {err && <span className="font-mono text-xs text-[color:var(--color-danger)]">{err}</span>}
        <Link href="/explore" className="font-mono text-xs text-[color:var(--color-accent)] hover:underline ml-auto inline-flex items-center gap-1">
          Browse newly public universe →
        </Link>
      </div>

      {/* table */}
      <div className="mt-6 overflow-x-auto border border-[color:var(--color-line)] bg-[color:var(--color-panel)]">
        <table className="w-full min-w-[680px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-panel-2)]/50">
              <th className="py-3.5 px-5 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)]">TICKER</th>
              <th className="py-3.5 px-5 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)] text-right">ENTRY</th>
              <th className="py-3.5 px-5 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)] text-right">LIVE PRICE</th>
              <th className="py-3.5 px-5 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)] text-right">RETURN %</th>
              <th className="py-3.5 px-5 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)] text-right">PROFIT / LOSS</th>
              <th className="py-3.5 px-5 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)] text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--color-line)]">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 px-5 text-center font-mono text-xs text-[color:var(--color-ink-faint)]">
                  No simulated positions recorded yet. Add a ticker above to test your thesis.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.ticker} className="hover:bg-[color:var(--color-panel-2)] transition-colors duration-150 group">
                <td className="py-4 px-5">
                  <Link href={`/company/${r.ticker}`} className="font-mono font-bold text-sm text-[color:var(--color-accent)] hover:underline">
                    {r.ticker}
                  </Link>
                </td>
                <td className="py-4 px-5 font-mono text-sm font-semibold text-right tabular-nums text-[color:var(--color-ink)]">{fmtUsd(r.entry)}</td>
                <td className="py-4 px-5 font-mono text-sm font-semibold text-right tabular-nums text-[color:var(--color-ink)]">{r.cur != null ? fmtUsd(r.cur) : "-"}</td>
                <td className="py-4 px-5 font-mono text-sm font-semibold text-right tabular-nums" style={{ color: r.pnlPct == null ? undefined : r.pnlPct >= 0 ? "var(--color-pos)" : "var(--color-danger)" }}>
                  {r.pnlPct != null ? `${r.pnlPct >= 0 ? "+" : ""}${(r.pnlPct * 100).toFixed(2)}%` : "-"}
                </td>
                <td className="py-4 px-5 font-mono text-sm font-semibold text-right tabular-nums" style={{ color: r.pnlUsd == null ? undefined : r.pnlUsd >= 0 ? "var(--color-pos)" : "var(--color-danger)" }}>
                  {r.pnlUsd != null ? `${r.pnlUsd >= 0 ? "+" : ""}${fmtUsd(r.pnlUsd)}` : "-"}
                </td>
                <td className="py-4 px-5 text-right">
                  <button
                    onClick={() => removePaper(r.ticker)}
                    className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-danger)] transition-colors px-2 py-1 rounded-sm border border-transparent hover:border-[color:var(--color-line)] cursor-pointer"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-5">
      <div className="font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)]">{label}</div>
      <div className="font-mono mt-1 text-xl font-bold tracking-tight tabular-nums" style={{ color: color || "var(--color-ink)" }}>
        {value}
      </div>
    </div>
  );
}
