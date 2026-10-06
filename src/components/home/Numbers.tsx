"use client";

import { CountUp } from "@/components/immersive/CountUp";
import { STRATEGY_LIST } from "@/lib/strategy/strategies";
import { TESTNET } from "@/lib/deployments";
import { Display } from "@/components/brand";

const CONTRACTS = Object.keys(TESTNET.contracts).length;
const STRATEGIES = STRATEGY_LIST.length;

type Item =
  | { kind: "num"; value: number; label: string; sub: string; color?: string }
  | { kind: "text"; value: string; label: string; sub: string; color?: string };

export function Numbers({ counts }: { counts: { week: number; d90: number } }) {
  const items: Item[] = [
    { kind: "num", value: counts.d90, label: "Newly public", sub: "tracked · last 90 days" },
    { kind: "num", value: counts.week, label: "Priced this week", sub: "detected from SEC filings" },
    { kind: "num", value: STRATEGIES, label: "Strategies", sub: "Growth · Momentum · Defensive" },
    { kind: "text", value: "14 / 14", label: "Foundry tests", sub: "passing · incl. real-USDG fork", color: "var(--color-pos)" },
    { kind: "num", value: CONTRACTS, label: "Smart contracts", sub: "deployed on testnet 46630" },
    { kind: "text", value: "Live", label: "Testnet", sub: "Robinhood Chain · 46630", color: "var(--color-pos)" },
  ];

  return (
    <section className="mx-auto max-w-350 px-6 py-20">
      <div className="mb-12 text-center">
        <div className="label text-[color:var(--color-accent-2)]">EQUENCY in numbers</div>
        <Display as="h2" className="mt-3 text-[clamp(1.8rem,4vw,3rem)]">Real coverage, honestly counted.</Display>
        <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">
          Every figure is read from a real source · SEC EDGAR, the strategy engine, and the on-chain
          deployment. Nothing here is fabricated.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="min-w-0 rounded-lg border border-border bg-card/50 px-6 py-7">
            <div className="mono text-4xl font-semibold leading-none tabular-nums" style={{ color: it.color ?? "var(--color-ink)" }}>
              {it.kind === "num" ? <CountUp value={it.value} /> : it.value}
            </div>
            <div className="mt-3 text-sm font-medium">{it.label}</div>
            <div className="label mt-1 normal-case tracking-normal text-muted-foreground">{it.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
