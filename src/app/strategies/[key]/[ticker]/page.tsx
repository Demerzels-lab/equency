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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  const { reasoning, mode, engine } = await reasonRecommendation(buildEvidence(ci, score, strategy, fit, contributions));

  const fitPct = Math.round(fit * 100);
  const suggested = Math.round(strategy.maxPosition * 100);
  const availDims = contributions.filter((c) => c.value != null).length;
  const confidence = Math.round((availDims / Math.max(1, contributions.length)) * 100);
  const accent = fitPct >= 66 ? "var(--color-pos)" : fitPct >= 45 ? "var(--color-warn)" : "var(--color-danger)";

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-6">
      <Link href={`/strategies/${strategy.key}`} className="label hover:text-foreground">← {strategy.name} ranking</Link>

      <Panel className="mt-3" bodyClassName="px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{ci.identity.name}</h1>
              <span className="label">{ci.identity.exchange}: {ci.identity.ticker}</span>
              <Badge variant="outline" className="label rounded-sm border-border">{strategy.name} candidate</Badge>
            </div>
            <div className="mono mt-1.5 text-xs text-muted-foreground">
              {ci.ipo.daysPublic ?? "?"} days public · {ci.identity.sicDescription} · {fmtUsd(ci.market.value.price)}
              {ci.market.value.changePct != null ? ` (${ci.market.value.changePct >= 0 ? "+" : ""}${ci.market.value.changePct.toFixed(2)}%)` : ""}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <WatchButton ticker={ci.identity.ticker} name={ci.identity.name} />
            <Link href={`/company/${ci.identity.ticker}`} className="label inline-flex items-center rounded-sm border border-border px-3 py-2 transition-colors hover:border-accent-surface hover:text-foreground">
              Intelligence Core →
            </Link>
          </div>
        </div>
      </Panel>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Metric label="Strategy fit" value={`${fitPct}%`} color={accent} bar={fit} />
        <Metric label="Suggested allocation" value={`${suggested}%`} sub="cap for this name · your constraints apply" />
        <Metric label="Confidence" value={`${confidence}%`} sub={`${availDims}/${contributions.length} signals available`} bar={confidence / 100} color="var(--color-accent)" />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-3">
          <Panel title="Why selected" badge={<DataModeBadge mode={mode} />}>
            <div className="label normal-case tracking-normal text-muted-foreground">{engine}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{reasoning.summary}</p>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
              {reasoning.whySelected.map((w, i) => (
                <li key={i} className="flex gap-2"><span className="mono" style={{ color: "var(--color-pos)" }}>+</span><span className="text-pretty">{w}</span></li>
              ))}
            </ul>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-2">
            <Panel title="Risks" badge={<DataModeBadge mode={mode} />}>
              <ul className="flex flex-col gap-2 text-xs text-muted-foreground">
                {reasoning.risks.map((r, i) => (
                  <li key={i} className="flex gap-2"><span className="mono" style={{ color: "var(--color-danger)" }}>−</span><span className="text-pretty">{r}</span></li>
                ))}
              </ul>
            </Panel>
            <Panel title="Fit rationale" badge={<DataModeBadge mode={mode} />}>
              <p className="text-xs leading-relaxed text-muted-foreground">{reasoning.fitRationale}</p>
              <div className="label mt-2 normal-case tracking-normal text-muted-foreground">{riskNote}</div>
            </Panel>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Panel title="Fit breakdown · deterministic" badge={<DataModeBadge mode="LIVE" />}>
            <div className="flex flex-col gap-3">
              {contributions.map((c) => (
                <div key={c.label}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{c.label} <span className="label">w{c.weight}</span></span>
                    <span className="mono" style={{ color: c.value == null ? "var(--color-ink-faint)" : "var(--color-ink)" }}>{c.value ?? "n/a"}</span>
                  </div>
                  <Progress value={c.value ?? 0} className="mt-1.5 h-1 bg-secondary [&_[data-slot=progress-indicator]]:bg-[var(--color-accent)]" style={{ opacity: c.value == null ? 0.3 : 1 }} />
                  <div className="mt-1 text-[10px] leading-snug text-muted-foreground">{c.basis}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Add to vault">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Create a Strategy Vault position on Robinhood Chain. Onchain execution lives in the Vault tab.
            </p>
            <Link href="/vault" className="label mt-3 inline-flex w-full items-center justify-center rounded-sm border border-border py-2 transition-colors hover:border-accent-surface hover:text-foreground">
              Open the Vault →
            </Link>
          </Panel>
        </div>
      </div>

      <footer className="mt-4 text-xs text-muted-foreground">
        Fit &amp; allocation are deterministic and reproducible · the model only narrates · every claim traces to SEC / market evidence.
      </footer>
    </main>
  );
}

function Metric({ label, value, sub, color, bar }: { label: string; value: string; sub?: string; color?: string; bar?: number }) {
  return (
    <Panel bodyClassName="p-4">
      <div className="label">{label}</div>
      <div className="mono mt-1.5 text-3xl font-semibold leading-none" style={{ color: color ?? "var(--color-ink)" }}>{value}</div>
      {bar != null && (
        <Progress value={Math.round(bar * 100)} className="mt-2 h-1 bg-secondary [&_[data-slot=progress-indicator]]:bg-[var(--c)]" style={{ ["--c" as string]: color ?? "var(--color-accent)" }} />
      )}
      {sub && <div className="label mt-2 normal-case tracking-normal leading-snug text-muted-foreground">{sub}</div>}
    </Panel>
  );
}
