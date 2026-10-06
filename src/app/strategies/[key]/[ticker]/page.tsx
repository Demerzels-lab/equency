import Link from "next/link";
import { notFound } from "next/navigation";
import { resolveTickerToCik } from "@/lib/providers/sec";
import { buildCompanyIntelligence } from "@/lib/providers/company";
import { getFundamentals } from "@/lib/providers/xbrl";
import { computeScore } from "@/lib/intelligence/score";
import { computeStrategyFit } from "@/lib/strategy/fit";
import { reasonRecommendation } from "@/lib/intelligence/reasoning";
import { getStrategy } from "@/lib/strategy/strategies";
import { DataModeBadge, Panel } from "@/components/primitives";
import { WatchButton } from "@/components/WatchButton";
import { fmtUsd } from "@/lib/util/format";
import type { CompanyIntelligence } from "@/lib/providers/types";

export const revalidate = 120;

function buildEvidence(ci: CompanyIntelligence, score: ReturnType<typeof computeScore>, strategy: NonNullable<ReturnType<typeof getStrategy>>, fit: number, contributions: { label: string; value: number | null; weight: number; basis: string }[]) {
  const dims = contributions.map((c) => `${c.label}=${c.value ?? "n/a"} (w${c.weight}, ${c.basis})`).join("; ");
  const m = ci.market;
  return [
    `Strategy: ${strategy.name} · focus: ${strategy.focus.join(", ")}`,
    `Company: ${ci.identity.name} (${ci.identity.ticker}, ${ci.identity.exchange}); sector ${ci.identity.sicDescription ?? "?"}`,
    `Days public: ${ci.ipo.daysPublic ?? "?"}`,
    `Market: ${m.mode === "LIVE" ? `$${m.value.price} (${m.value.changePct?.toFixed(2)}% 1d)` : "no live quote"}`,
    `Intelligence score: ${score.overall ?? "n/a"}`,
    `Deterministic strategy-fit: ${(fit * 100).toFixed(0)}/100 from · ${dims}`,
  ].join("\n");
}

export default async function RecommendationDetail({ params }: { params: Promise<{ key: string; ticker: string }> }) {
  const { key, ticker } = await params;
  const strategy = getStrategy(key);
  if (!strategy) notFound();
  const cik = await resolveTickerToCik(ticker);
  if (!cik) notFound();

  let ci: CompanyIntelligence;
  try {
    ci = await buildCompanyIntelligence(cik);
  } catch {
    notFound();
  }
  const fundamentals = await getFundamentals(cik);
  const score = computeScore(ci, fundamentals);
  const { fit, contributions, riskNote } = computeStrategyFit(score, strategy);
  const { reasoning, mode, engine } = await reasonRecommendation(
    buildEvidence(ci, score, strategy, fit, contributions),
  );

  const fitPct = Math.round(fit * 100);
  const suggested = Math.round(strategy.maxPosition * 100);
  const availDims = contributions.filter((c) => c.value != null).length;
  const confidence = Math.round((availDims / Math.max(1, contributions.length)) * 100);
  const accent = fitPct >= 66 ? "var(--color-pos)" : fitPct >= 45 ? "var(--color-warn)" : "var(--color-danger)";

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-6">
      <Link href={`/strategies/${strategy.key}`} className="label hover:text-[color:var(--color-ink)]">← {strategy.name} ranking</Link>

      {/* Header */}
      <header className="panel mt-3 flex flex-wrap items-start justify-between gap-4 px-4 py-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{ci.identity.name}</h1>
            <span className="label">{ci.identity.exchange}: {ci.identity.ticker}</span>
            <span className="label" style={{ border: "1px solid var(--color-line)", padding: "2px 6px" }}>{strategy.name} candidate</span>
          </div>
          <div className="mono mt-1.5 text-xs" style={{ color: "var(--color-ink-dim)" }}>
            {ci.ipo.daysPublic ?? "?"} days public · {ci.identity.sicDescription} · {fmtUsd(ci.market.value.price)}
            {ci.market.value.changePct != null ? ` (${ci.market.value.changePct >= 0 ? "+" : ""}${ci.market.value.changePct.toFixed(2)}%)` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WatchButton ticker={ci.identity.ticker} name={ci.identity.name} />
          <Link href={`/company/${ci.identity.ticker}`} className="label px-2.5 py-1.5" style={{ border: "1px solid var(--color-line-strong)", color: "var(--color-ink-dim)" }}>
            Intelligence Core →
          </Link>
        </div>
      </header>

      {/* Key metrics (brief §28) */}
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Metric label="Strategy Fit" value={`${fitPct}%`} color={accent} bar={fit} />
        <Metric label="Suggested Allocation" value={`${suggested}%`} sub="cap for this name (your constraints apply)" />
        <Metric label="Confidence" value={`${confidence}%`} sub={`${availDims}/${contributions.length} signals available`} bar={confidence / 100} />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_320px]">
        {/* Why selected (Gemini, grounded) */}
        <div className="flex flex-col gap-3">
          <Panel title="Why Selected" badge={<DataModeBadge mode={mode} />}>
            <div className="label normal-case" style={{ letterSpacing: 0, color: "var(--color-ink-dim)" }}>{engine}</div>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--color-ink-dim)" }}>{reasoning.summary}</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm" style={{ color: "var(--color-ink-dim)" }}>
              {reasoning.whySelected.map((w, i) => (
                <li key={i} className="flex gap-2"><span className="mono" style={{ color: "var(--color-pos)" }}>+</span><span>{w}</span></li>
              ))}
            </ul>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2">
            <Panel title="Risks" badge={<DataModeBadge mode={mode} />}>
              <ul className="flex flex-col gap-2 text-xs" style={{ color: "var(--color-ink-dim)" }}>
                {reasoning.risks.map((r, i) => (
                  <li key={i} className="flex gap-2"><span className="mono" style={{ color: "var(--color-danger)" }}>−</span><span>{r}</span></li>
                ))}
              </ul>
            </Panel>
            <Panel title="Strategy Fit Rationale" badge={<DataModeBadge mode={mode} />}>
              <p className="text-xs leading-relaxed" style={{ color: "var(--color-ink-dim)" }}>{reasoning.fitRationale}</p>
              <div className="label mt-2 normal-case" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>{riskNote}</div>
            </Panel>
          </div>
        </div>

        {/* Deterministic fit breakdown (the real numbers) */}
        <div className="flex flex-col gap-3">
          <Panel title="Fit Breakdown · Deterministic" badge={<DataModeBadge mode="LIVE" />}>
            <div className="flex flex-col gap-3">
              {contributions.map((c) => (
                <div key={c.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--color-ink-dim)" }}>{c.label} <span className="label" style={{ letterSpacing: 0 }}>w{c.weight}</span></span>
                    <span className="mono" style={{ color: c.value == null ? "var(--color-ink-faint)" : "var(--color-ink)" }}>{c.value ?? "n/a"}</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full" style={{ background: "var(--color-panel-2)" }}>
                    <div className="h-1 rounded-full" style={{ width: `${c.value ?? 0}%`, background: "var(--color-accent)", opacity: c.value == null ? 0.15 : 0.85 }} />
                  </div>
                  <div className="label mt-0.5 normal-case leading-snug" style={{ letterSpacing: 0, fontSize: 9 }}>{c.basis}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Add to Vault">
            <div className="text-xs leading-relaxed" style={{ color: "var(--color-ink-faint)" }}>
              Connect a wallet to create a Strategy Vault position. Onchain execution on Robinhood Chain
              arrives in Phase 3 · no capital moves here.
            </div>
            <button disabled className="label mt-3 w-full py-2" style={{ border: "1px dashed var(--color-line-strong)", color: "var(--color-ink-faint)", cursor: "not-allowed" }}>
              Connect Wallet · Phase 3
            </button>
          </Panel>
        </div>
      </div>

      <footer className="mt-4 text-xs" style={{ color: "var(--color-ink-faint)" }}>
        Fit & allocation are deterministic and reproducible; the model only narrates. Every claim traces to SEC/market evidence.
      </footer>
    </main>
  );
}

function Metric({ label, value, sub, color, bar }: { label: string; value: string; sub?: string; color?: string; bar?: number }) {
  return (
    <div className="panel p-4">
      <div className="label">{label}</div>
      <div className="mono mt-1.5 text-3xl font-semibold leading-none" style={{ color: color ?? "var(--color-ink)" }}>{value}</div>
      {bar != null && (
        <div className="mt-2 h-1 overflow-hidden rounded-full" style={{ background: "var(--color-panel-2)" }}>
          <div className="h-1 rounded-full" style={{ width: `${Math.round(bar * 100)}%`, background: color ?? "var(--color-accent)" }} />
        </div>
      )}
      {sub && <div className="label mt-2 normal-case leading-snug" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>{sub}</div>}
    </div>
  );
}
