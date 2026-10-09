import { Suspense } from "react";
import { notFound } from "next/navigation";
import { resolveTickerToCik } from "@/lib/providers/sec";
import { buildCompanyIntelligence } from "@/lib/providers/company";
import { getFundamentals } from "@/lib/providers/xbrl";
import { getCompanyNews } from "@/lib/providers/finnhub";
import { getPriceSeries } from "@/lib/providers/yahoo";
import { checkEmbeddable, websiteFromFilings } from "@/lib/providers/website";
import { computeScore, type Dimension, type ScoreResult } from "@/lib/intelligence/score";
import { reason, type ThesisDirection } from "@/lib/intelligence/reasoning";
import { DataModeBadge, Dot, Panel, tierColor } from "@/components/primitives";
import { CompanyEmblem } from "@/components/CompanyEmblem";
import { ScoreGauge } from "@/components/ScoreGauge";
import { PriceChart } from "@/components/PriceChart";
import { WatchButton } from "@/components/WatchButton";
import { ResearchConsole, type ActivityEvent, type FeedItem } from "@/components/ResearchConsole";
import { Freshness, TrustLegend, TrustTag } from "@/components/Trust";
import { CompanyWebsitePreview } from "@/components/CompanyWebsitePreview";
import { FundamentalsPanel, NewsPanel } from "@/components/sections";
import { ThesisTimeline } from "@/components/ThesisTimeline";
import { CompareToggle } from "@/components/CompareToggle";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ago, fmtDate } from "@/lib/util/dates";
import { fmtUsd } from "@/lib/util/format";
import type { CompanyIntelligence } from "@/lib/providers/types";
import { MAINNET } from "@/lib/deployments";
import { coreMission, coreStatus, dayLabel } from "@/lib/core-identity";
import { CoreStatusPill } from "@/components/CoreStatus";

export const revalidate = 60;

const DIRECTION_COLOR: Record<ThesisDirection, string> = {
  STRENGTHENING: "var(--color-pos)",
  NEUTRAL: "var(--color-ink-dim)",
  CAUTIOUS: "var(--color-warn)",
  WEAKENING: "var(--color-danger)",
};

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export default async function CompanyPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const cik = await resolveTickerToCik(ticker);
  if (!cik) notFound();

  let ci: CompanyIntelligence;
  try {
    ci = await buildCompanyIntelligence(cik);
  } catch {
    notFound();
  }
  const symbol = ci.identity.ticker || ticker.toUpperCase();
  const today = new Date().toISOString().slice(0, 10);

  // Deterministic data: the page shell renders as soon as these resolve (no waiting on the LLM).
  const [fundamentals, news, priceSeries] = await Promise.all([
    getFundamentals(cik),
    getCompanyNews(symbol, ci.ipo.ipoDate?.slice(0, 10) ?? isoDaysAgo(30), today),
    getPriceSeries(symbol, "SINCE IPO", ci.ipo.daysPublic),
  ]);
  const score = computeScore(ci, fundamentals);

  const m = ci.market;
  const up = (m.value.changePct ?? 0) >= 0;
  const n13 = ci.filings.filter((f) => f.form.toUpperCase().startsWith("SCHEDULE 13")).length;
  const nInsider = ci.filings.filter((f) => ["3", "4"].includes(f.form.toUpperCase())).length;

  // Core identity · mission from company age, state from the latest real SEC filing (brief §14, §37).
  const lastFiledAt = ci.filings.reduce<string | undefined>((mx, f) => (!mx || f.filedAt > mx ? f.filedAt : mx), undefined);
  const status = coreStatus(ci.ipo.daysPublic, lastFiledAt);
  const mission = coreMission(ci.ipo.daysPublic);
  const vaultAsset = (MAINNET.contracts as Record<string, string | undefined>)[symbol.toUpperCase()];

  const catOf = (kind: string): FeedItem["cat"] =>
    kind === "Ownership" ? "Ownership" : kind === "Insider" ? "Insider" : "SEC";
  const feed: FeedItem[] = [
    ...ci.radar.map((e) => ({ cat: catOf(e.kind), label: e.label, at: e.at, url: e.url, tier: e.tier })),
    ...(news ?? []).map((n) => ({ cat: "News" as const, label: n.headline, at: n.publishedAt, url: n.url, tier: 3, source: n.source })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  // Core activity log · built ONLY from real, timestamped events (brief §15, §27). No scripted lines.
  const filingUrl = (f: { url: string }) => f.url;
  const activity: ActivityEvent[] = [
    {
      at: ci.assembledAt,
      tag: "STATE" as const,
      text: `Core ${status.state} · ${status.basis}. Mission: ${mission.phase}.`,
      source: "Intelligence Core",
    },
    {
      at: ci.assembledAt,
      tag: "SCORE" as const,
      text: `Intelligence score ${score.overall ?? "n/a"}/100 recomputed from ${score.dimensions.filter((d) => d.value != null).length} rule-based signals.`,
      source: "Deterministic score",
      trust: "DERIVED" as const,
    },
    ...(m.mode === "LIVE" && m.value.price != null
      ? [{
          at: m.asOf,
          tag: "OBSERVATION" as const,
          text: `Last price ${fmtUsd(m.value.price)}${m.value.changePct != null ? ` · ${m.value.changePct >= 0 ? "+" : ""}${m.value.changePct.toFixed(2)}% on the day` : ""}.`,
          source: "Finnhub quote",
          trust: "VERIFIED" as const,
        }]
      : []),
    ...ci.filings.slice(0, 5).map((f) => ({
      at: f.filedAt,
      dateOnly: true,
      tag: "EVIDENCE" as const,
      text: `Form ${f.form} filed${f.title ? ` · ${f.title}` : ""}.`,
      source: "SEC EDGAR",
      url: filingUrl(f),
      trust: "VERIFIED" as const,
    })),
    ...(news ?? []).slice(0, 3).map((n) => ({
      at: n.publishedAt,
      tag: "EVIDENCE" as const,
      text: n.headline,
      source: `${n.source} · tier 3, cross-check`,
      url: n.url,
    })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));
  const latest13 = ci.filings.find((f) => f.form.toUpperCase().startsWith("SCHEDULE 13"))?.filedAt;

  return (
    <main className="page-main mx-auto max-w-[1400px] px-6 pt-28 sm:pt-32 pb-20">
      {/* SECTION BREADCRUMB */}
      <div className="flex items-center justify-between pb-3 mb-6 border-b border-[color:var(--color-line)]">
        <div className="section-label mb-0">INTELLIGENCE CORE · ${symbol}</div>
        <div className="font-mono text-[10px] text-[color:var(--color-ink-faint)] tracking-wider uppercase">
          SEC CIK {ci.identity.cik.padStart(10, "0")} · 424B4 AUDITED
        </div>
      </div>

      {/* HEADER */}
      <div className="mb-8 border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 items-start gap-5">
            <CompanyEmblem ticker={symbol} accent="var(--color-accent)" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[color:var(--color-ink)] text-balance">
                  {ci.identity.name}
                </h1>
                <span className="font-mono text-xs font-bold tracking-wider uppercase px-2.5 py-1 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-panel-2)] text-[color:var(--color-accent)]">
                  {ci.identity.exchange}: {ci.identity.ticker}
                </span>
                <WatchButton ticker={symbol} name={ci.identity.name} />
                <CompareToggle ticker={symbol} />
              </div>
              <div className="font-mono mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--color-ink-dim)]">
                <span className="rounded-full border border-[color:var(--color-strategy)]/40 bg-[color:var(--color-strategy)]/10 px-2 py-0.5 font-semibold uppercase tracking-wider text-[color:var(--color-strategy)]">{dayLabel(ci.ipo.daysPublic)}</span>
                <Sep /><span className="uppercase">{ci.ipo.ageBucket}</span>
                <Sep /><span>IPO {fmtDate(ci.ipo.ipoDate)}</span>
                <Sep /><span className="font-sans text-[color:var(--color-ink)]">{ci.identity.sicDescription}</span>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-6">
            <div className="text-right">
              <div className="font-mono text-3xl sm:text-4xl font-extrabold leading-none text-[color:var(--color-ink)] tabular-nums">
                {fmtUsd(m.value.price)}
              </div>
              <div className="font-mono mt-1.5 text-xs font-semibold" style={{ color: up ? "var(--color-pos)" : "var(--color-danger)" }}>
                {m.value.change != null ? `${up ? "▲" : "▼"} ${Math.abs(m.value.change).toFixed(2)}` : ""}
                {m.value.changePct != null ? ` (${up ? "+" : ""}${m.value.changePct.toFixed(2)}%)` : ""}
              </div>
            </div>
            <div className="text-right">
              <DataModeBadge mode={m.mode} />
              <div className="font-mono text-[10px] text-[color:var(--color-ink-faint)] uppercase mt-1.5">
                updated {ago(m.asOf)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CORE IDENTITY · the Core's persistent purpose (brief §35, §36) */}
      <section className="mb-8 grid gap-px overflow-hidden border border-[color:var(--color-line)] bg-[color:var(--color-line)] md:grid-cols-[260px_1fr_1fr]">
        <div className="bg-[color:var(--color-panel)] p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-ink-faint)]">Intelligence Core</div>
          <div className="mt-2.5"><CoreStatusPill status={status} /></div>
          <p className="mt-2.5 font-mono text-[11px] leading-relaxed text-[color:var(--color-ink-dim)]">{status.basis}</p>
        </div>
        <div className="bg-[color:var(--color-panel)] p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-ink-faint)]">Current mission</span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-accent)]">{mission.phase} · {mission.window}</span>
          </div>
          <p className="mt-2.5 text-sm leading-relaxed text-[color:var(--color-ink)]">{mission.mission}</p>
        </div>
        <div className="bg-[color:var(--color-panel)] p-5">
          <div className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-ink-faint)]">Focus</div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {mission.focus.map((f) => (
              <span key={f} className="rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-bg)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-ink-dim)]">{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* VERDICT · deterministic score renders now; the thesis direction/confidence/summary stream in */}
      <section className="mb-8 border border-[color:var(--color-line)] bg-[color:var(--color-panel)] overflow-hidden">
        <div className="grid grid-cols-1 divide-y lg:divide-y-0 lg:divide-x divide-[color:var(--color-line)] lg:grid-cols-[300px_1fr]">
          <div className="flex flex-col justify-between p-6 bg-[color:var(--color-panel-2)]/60">
            <div className="flex items-center justify-between">
              <Suspense fallback={<span className="font-mono text-[10px] text-[color:var(--color-ink-faint)] uppercase">FORMING THESIS…</span>}>
                <DirectionLabel ci={ci} score={score} />
              </Suspense>
              <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[color:var(--color-ink-faint)]">Intelligence score <TrustTag kind="DERIVED" /></span>
            </div>
            <div className="my-6 flex justify-center">
              <ScoreGauge value={score.overall} color="var(--color-accent)" />
            </div>
            <div className="pt-4 border-t border-[color:var(--color-line)]">
              <Suspense fallback={<ConfidenceSkel />}>
                <Confidence ci={ci} score={score} />
              </Suspense>
            </div>
          </div>
          <div className="flex flex-col justify-between gap-6 p-6 sm:p-8 bg-[color:var(--color-panel)]">
            <div>
              <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-accent)]">CURRENT THESIS <TrustTag kind="INTERPRETED" /></div>
              <Suspense fallback={<SummarySkel />}>
                <Summary ci={ci} score={score} />
              </Suspense>
            </div>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-5 pt-6 border-t border-[color:var(--color-line)]">
              {score.dimensions.map((d) => <DimChip key={d.key} d={d} />)}
            </div>
          </div>
        </div>
      </section>

      {/* PRICE CHART */}
      <Panel title="Price · since IPO" badge={<DataModeBadge mode={priceSeries ? "LIVE" : "SIMULATED"} />} className="mb-3">
        <PriceChart symbol={symbol} daysPublic={ci.ipo.daysPublic} initial={priceSeries} />
      </Panel>

      {/* INTELLIGENCE THESIS · streams in */}
      <Suspense fallback={<ThesisSkel />}>
        <ThesisDetail ci={ci} score={score} />
      </Suspense>

      {/* READING LAYOUT · research on the left, market data rail on the right */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_340px]">
        <div className="flex min-w-0 flex-col gap-3">
          {/* COMPANY WEB RESEARCH · View-only Browser Preview (Brief §8, §18, §42) */}
          <Panel title="Company Web Research · Official Domain" badge={<span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border border-[color:var(--color-line)] bg-[color:var(--color-panel-2)] text-[color:var(--color-accent)] font-semibold">VIEW ONLY</span>}>
            <Suspense fallback={<WebsiteSkel />}>
              <WebsitePreviewSection ci={ci} symbol={symbol} />
            </Suspense>
          </Panel>

          <Panel title="Research Environment" badge={<DataModeBadge mode="LIVE" />}>
            <ResearchConsole items={feed} activity={activity} ticker={symbol} />
          </Panel>
          <NewsPanel items={news} />
        </div>

        <div className="flex min-w-0 flex-col gap-3">
          {/* ROBINHOOD CHAIN ONCHAIN HUD (Brief §31, §40, §46) */}
          <Panel title="Capital · Robinhood Chain" badge={<span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded border border-[color:var(--color-line)] bg-[color:var(--color-panel-2)] text-[color:var(--color-pos)] font-semibold">MAINNET 4663</span>}>
            <Row label="Settlement asset" value="USDG (6 decimals)" />
            <Row label="Gas token" value="ETH" />
            <Row label="Vault asset" value={vaultAsset ? `${symbol} · registered` : "Not in AssetRegistry"} />
            <Row label="Oracle" value="Chainlink price adapter" />
            <div className="mt-2 pt-2 border-t border-[color:var(--color-line)] text-[10px] font-mono leading-relaxed text-muted-foreground">
              {vaultAsset
                ? "Registered as a real Robinhood stock token · enabled for allocation once its Chainlink feed is wired."
                : `${symbol} has no Robinhood stock token in the vault registry yet · intelligence only.`}
            </div>
          </Panel>

          <Panel title="Reasoning Engine">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Converts verified evidence into structured interpretations, risks, catalysts and thesis changes. The evidence is the
              source of truth · the score is rule-based and the engine never sets it.
            </p>
          </Panel>

          <Panel title="Live Market" badge={<DataModeBadge mode={m.mode} />}>
            <Row label="Price" value={fmtUsd(m.value.price)} />
            <Row label="Open" value={fmtUsd(m.value.open)} />
            <Row label="Day high" value={fmtUsd(m.value.dayHigh)} />
            <Row label="Day low" value={fmtUsd(m.value.dayLow)} />
            <Row label="Prev close" value={fmtUsd(m.value.prevClose)} />
            <div className="mt-2 flex items-center justify-between">
              <TrustTag kind="VERIFIED" />
              {/* quotes freeze over weekends/holidays · flag only when older than 3 days */}
              <Freshness at={m.mode === "LIVE" ? m.asOf : null} staleAfterHours={72} />
            </div>
          </Panel>

          <FundamentalsPanel f={fundamentals} />

          <Panel title="Ownership" badge={<DataModeBadge mode="LIVE" />}>
            <Row label="13D / 13G on file" value={String(n13)} />
            <Row label="Insider forms" value={String(nInsider)} />
            <div className="mt-2 flex items-center justify-between">
              <TrustTag kind="VERIFIED" />
              <Freshness at={latest13} verb="Latest 13D/G" />
            </div>
          </Panel>

          <Panel title="Event Radar" badge={<TrustTag kind="VERIFIED" />}>
            <div className="flex flex-col gap-2">
              {ci.radar.slice(0, 6).map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Dot color={tierColor(e.tier)} />
                  <span className="mono text-muted-foreground">{ago(e.at)}</span>
                  <span className="text-foreground/80">{e.kind}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Suspense fallback={<Panel title="Thesis history"><div className="text-xs text-muted-foreground">Loading…</div></Panel>}>
            <TimelineWrap ci={ci} score={score} ticker={symbol} ipoDate={ci.ipo.ipoDate} />
          </Suspense>

          {/* CORE MEMORY · honest "coming online" state until server-side memory exists (brief §22, §47) */}
          <Panel title="Core Memory" badge={<span className="font-mono text-[9px] uppercase tracking-wider text-[color:var(--color-sim)]">Coming online</span>}>
            <p className="text-xs leading-relaxed text-muted-foreground">
              What this Core has learned about {ci.identity.name}: company, catalysts, risks, ownership and invalidated
              assumptions. Persistent memory is coming online · today the Core rebuilds from its sources on every
              refresh, and thesis changes are kept in the history above.
            </p>
          </Panel>
        </div>
      </div>

      {/* EVIDENCE TABLE */}
      <Panel title="Evidence · SEC filing timeline" badge={<TrustTag kind="VERIFIED" />} className="mt-3" bodyClassName="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="label h-8 w-27.5">Filed</TableHead>
              <TableHead className="label h-8 w-27.5">Form</TableHead>
              <TableHead className="label h-8">Document</TableHead>
              <TableHead className="label h-8 w-17.5 text-right">Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ci.filings.slice(0, 16).map((f, i) => (
              <TableRow key={i} className="border-border">
                <TableCell className="mono text-xs text-muted-foreground">{f.filedAt}</TableCell>
                <TableCell className="mono text-xs">{f.form}</TableCell>
                <TableCell className="max-w-0 truncate text-xs text-muted-foreground">{f.title || ci.identity.name}</TableCell>
                <TableCell className="text-right">
                  <a href={f.url} target="_blank" rel="noreferrer" className="label" style={{ color: "var(--color-accent)" }}>SEC ↗</a>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <TrustLegend />
        <p className="text-xs text-muted-foreground">Assembled {ago(ci.assembledAt)} · every panel labelled live or simulated · no fabricated metrics</p>
      </div>
    </main>
  );
}

/* ── streamed thesis pieces · all share ONE cached reason() call ── */
type TP = { ci: CompanyIntelligence; score: ScoreResult };

async function DirectionLabel({ ci, score }: TP) {
  const { thesis } = await reason(ci, score);
  return <span className="label" style={{ color: DIRECTION_COLOR[thesis.direction] }}>{thesis.direction}</span>;
}

async function Confidence({ ci, score }: TP) {
  const { thesis } = await reason(ci, score);
  const dirColor = DIRECTION_COLOR[thesis.direction];
  const pct = Math.round(thesis.confidence * 100);
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="label">Confidence</span>
        <span className="mono text-xs">{pct}%</span>
      </div>
      <Progress value={pct} className="mt-1.5 h-1.5 bg-secondary [&_[data-slot=progress-indicator]]:bg-[var(--dir)]" style={{ ["--dir" as string]: dirColor }} />
    </>
  );
}

async function Summary({ ci, score }: TP) {
  const { thesis } = await reason(ci, score);
  return <p className="max-w-[72ch] text-pretty text-sm leading-relaxed text-foreground/90">{thesis.summary}</p>;
}

async function ThesisDetail({ ci, score }: TP) {
  const { thesis, mode } = await reason(ci, score);
  return (
    <Panel title="Current Thesis" badge={<span className="flex items-center gap-2"><TrustTag kind="INTERPRETED" /><DataModeBadge mode={mode} /></span>} className="mb-3" bodyClassName="p-4">
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
        <ThesisList title="Why" items={thesis.keyDrivers} sign="+" color="var(--color-pos)" />
        <ThesisList title="Risks" items={thesis.risks} sign="−" color="var(--color-danger)" />
        <ThesisList title="Catalysts" items={thesis.catalysts} sign="→" color="var(--color-warn)" />
      </div>
    </Panel>
  );
}

async function TimelineWrap({ ci, score, ticker, ipoDate }: TP & { ticker: string; ipoDate?: string }) {
  const { thesis } = await reason(ci, score);
  return <ThesisTimeline ticker={ticker} direction={thesis.direction} score={score.overall} summary={thesis.summary} ipoDate={ipoDate} />;
}

/* ── skeletons ── */
function Bar({ w = "100%" }: { w?: string }) { return <div className="h-3 animate-pulse rounded bg-secondary" style={{ width: w }} />; }
function ConfidenceSkel() { return <div className="flex flex-col gap-2"><Bar w="40%" /><div className="h-1.5 rounded bg-secondary" /></div>; }
function SummarySkel() { return <div className="flex flex-col gap-2"><Bar /><Bar w="94%" /><Bar w="62%" /></div>; }
function ThesisSkel() {
  return (
    <Panel title="Current Thesis" className="mb-3" bodyClassName="p-4">
      <div className="grid gap-8 md:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="flex flex-col gap-2"><Bar w="40%" /><Bar /><Bar w="80%" /></div>)}
      </div>
    </Panel>
  );
}

function Sep() {
  return <span className="text-border">/</span>;
}

function DimChip({ d }: { d: Dimension }) {
  const color = d.key === "risk" ? "var(--color-danger)" : "var(--color-pos)";
  // Brief §40: what feeds it, that it's rule-based, and how fresh the inputs are.
  const tip = `${d.label} · rule-based (deterministic)\nInputs: ${d.source}\n${d.asOf ? `Newest input: ${fmtDate(d.asOf)}` : "No dated input"}`;
  return (
    <div title={tip} className="cursor-help">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-ink-dim)] truncate">{d.label}</span>
        <span className="font-mono text-sm font-bold tabular-nums" style={{ color: d.value == null ? "var(--color-ink-faint)" : "var(--color-ink)" }}>
          {d.value ?? "n/a"}
        </span>
      </div>
      <Progress
        value={d.value ?? 0}
        className="mt-2 h-1 bg-[color:var(--color-panel-2)] [&_[data-slot=progress-indicator]]:bg-[var(--c)]"
        style={{ ["--c" as string]: color, opacity: d.value == null ? 0.3 : 1 }}
      />
      <div className="mt-1.5 font-mono text-[10px] leading-snug text-[color:var(--color-ink-faint)]">{d.basis}</div>
      {d.asOf && <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[color:var(--color-ink-faint)]/80">as of {ago(d.asOf)}</div>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-1.5 text-xs last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="mono text-foreground">{value}</span>
    </div>
  );
}

function ThesisList({ title, items, sign, color }: { title: string; items: string[]; sign: string; color: string }) {
  return (
    <div>
      <div className="label mb-2">{title}</div>
      <ul className="flex flex-col gap-2 text-xs leading-relaxed text-muted-foreground">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="mono" style={{ color }}>{sign}</span>
            <span className="text-pretty">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Resolves the official site (SEC/Finnhub → issuer's own SEC filing) and whether it may be
 *  framed, then renders the preview · streamed so the page shell never waits on it. */
async function WebsitePreviewSection({ ci, symbol }: { ci: CompanyIntelligence; symbol: string }) {
  let url = ci.identity.officialWebsite;
  let source: string | undefined;
  if (!url) {
    const fromFiling = await websiteFromFilings(ci.filings);
    if (fromFiling) {
      url = fromFiling.url;
      source = `SEC ${fromFiling.form}`;
    }
  }
  const embed = url ? await checkEmbeddable(url.startsWith("http") ? url : `https://${url}`) : null;
  return (
    <CompanyWebsitePreview
      url={embed?.url ?? url}
      name={ci.identity.name}
      ticker={symbol}
      embeddable={embed?.embeddable ?? false}
      reason={embed?.reason}
      botWall={embed?.botWall}
      source={source}
    />
  );
}

function WebsiteSkel() {
  return (
    <div className="overflow-hidden rounded-md border border-[color:var(--color-line)]">
      <div className="h-[46px] border-b border-[color:var(--color-line)] bg-[color:var(--color-panel-2)]/60" />
      <div className="grid h-[380px] place-items-center font-mono text-[11px] text-[color:var(--color-ink-faint)]">Resolving official website…</div>
    </div>
  );
}
