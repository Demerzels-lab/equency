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
    <main className="mx-auto max-w-[1000px] px-4 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="label text-[color:var(--color-accent-2)]">Paper portfolio</div>
        <span className="label rounded-sm border px-1.5 py-0.5" style={{ color: "var(--color-sim)", borderColor: "var(--color-sim)" }}>PAPER</span>
      </div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Test a thesis with no capital</h1>
      <p className="mt-2 max-w-[62ch] text-sm text-muted-foreground">
        Hypothetical only · not real money and not the on-chain Vault. Entry is the live price when you
        add a name; P&amp;L tracks live prices from there. Device-local.
      </p>

      {/* totals */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Positions" value={String(rows.length)} />
        <Stat label="Invested" value={fmtUsd(totalCost)} />
        <Stat label="Value" value={fmtUsd(totalValue)} />
        <Stat label="P&L" value={`${totalPnl >= 0 ? "+" : ""}${fmtUsd(totalPnl)} · ${(totalPct * 100).toFixed(2)}%`} color={totalPnl >= 0 ? "var(--color-pos)" : "var(--color-danger)"} />
      </div>

      {/* add */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input value={ticker} onChange={(e) => setTicker(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add ticker (e.g. ADRX)" className="mono h-9 w-48 rounded-sm border border-border bg-transparent px-3 text-sm uppercase outline-none focus:border-[color:var(--color-accent)]" />
        <button onClick={add} disabled={busy} className="label rounded-sm bg-[color:var(--color-ink)] px-3 py-2 text-[color:var(--color-bg)] hover:bg-white disabled:opacity-60">{busy ? "adding…" : "Add $1,000"}</button>
        {err && <span className="text-xs text-[color:var(--color-danger)]">{err}</span>}
        <Link href="/explore" className="label ml-auto text-muted-foreground hover:text-foreground">Browse universe →</Link>
      </div>

      {/* table */}
      <div className="mt-4 overflow-x-auto rounded-sm border border-border">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="label border-b border-border bg-[color:var(--color-panel)] [&>th]:px-3 [&>th]:py-2 [&>th]:text-left">
              <th>Ticker</th><th className="text-right">Entry</th><th className="text-right">Live</th><th className="text-right">P&L %</th><th className="text-right">P&L $</th><th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-xs text-muted-foreground">No paper positions yet. Add a ticker above.</td></tr>}
            {rows.map((r) => (
              <tr key={r.ticker} className="border-b border-border last:border-0">
                <td className="px-3 py-2"><Link href={`/company/${r.ticker}`} className="mono" style={{ color: "var(--color-accent)" }}>{r.ticker}</Link></td>
                <td className="mono px-3 py-2 text-right tabular-nums">{fmtUsd(r.entry)}</td>
                <td className="mono px-3 py-2 text-right tabular-nums">{r.cur != null ? fmtUsd(r.cur) : "—"}</td>
                <td className="mono px-3 py-2 text-right tabular-nums" style={{ color: r.pnlPct == null ? undefined : r.pnlPct >= 0 ? "var(--color-pos)" : "var(--color-danger)" }}>{r.pnlPct != null ? `${r.pnlPct >= 0 ? "+" : ""}${(r.pnlPct * 100).toFixed(2)}%` : "—"}</td>
                <td className="mono px-3 py-2 text-right tabular-nums" style={{ color: r.pnlUsd == null ? undefined : r.pnlUsd >= 0 ? "var(--color-pos)" : "var(--color-danger)" }}>{r.pnlUsd != null ? `${r.pnlUsd >= 0 ? "+" : ""}${fmtUsd(r.pnlUsd)}` : "—"}</td>
                <td className="px-3 py-2 text-right"><button onClick={() => removePaper(r.ticker)} className="label text-muted-foreground hover:text-[color:var(--color-danger)]">remove</button></td>
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
    <div className="min-w-0 rounded-sm border border-border bg-card/50 px-4 py-3">
      <div className="mono truncate text-lg font-semibold tabular-nums" style={{ color }}>{value}</div>
      <div className="label mt-1">{label}</div>
    </div>
  );
}
