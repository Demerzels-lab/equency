import { notFound } from "next/navigation";
import { resolveTickerToCik } from "@/lib/providers/sec";
import { buildCompanyIntelligence } from "@/lib/providers/company";
import { getFundamentals } from "@/lib/providers/xbrl";
import { getCompanyNews } from "@/lib/providers/finnhub";
import { getPriceSeries } from "@/lib/providers/yahoo";
import { computeScore, type Dimension } from "@/lib/intelligence/score";
import { reason, type ThesisDirection } from "@/lib/intelligence/reasoning";
import { DataModeBadge, Dot, Panel, tierColor } from "@/components/primitives";
import { PriceChart } from "@/components/PriceChart";
import { WatchButton } from "@/components/WatchButton";
import { ResearchConsole, type FeedItem } from "@/components/ResearchConsole";
import { FundamentalsPanel, NewsPanel, ThesisHistory } from "@/components/sections";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ago, fmtDate } from "@/lib/util/dates";
import { fmtUsd } from "@/lib/util/format";
import type { CompanyIntelligence } from "@/lib/providers/types";

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

  const [fundamentals, news, priceSeries] = await Promise.all([
    getFundamentals(cik),
    getCompanyNews(symbol, ci.ipo.ipoDate?.slice(0, 10) ?? isoDaysAgo(30), today),
    getPriceSeries(symbol, "SINCE IPO", ci.ipo.daysPublic),
  ]);

  const score = computeScore(ci, fundamentals);
  const { thesis, mode: reasoningMode, engine } = await reason(ci, score);
  const dirColor = DIRECTION_COLOR[thesis.direction];

  const m = ci.market;
  const up = (m.value.changePct ?? 0) >= 0;
  const n13 = ci.filings.filter((f) => f.form.toUpperCase().startsWith("SCHEDULE 13")).length;
  const nInsider = ci.filings.filter((f) => ["3", "4"].includes(f.form.toUpperCase())).length;

  const catOf = (kind: string): FeedItem["cat"] =>
    kind === "Ownership" ? "Ownership" : kind === "Insider" ? "Insider" : "SEC";
  const feed: FeedItem[] = [
    ...ci.radar.map((e) => ({ cat: catOf(e.kind), label: e.label, at: e.at, url: e.url, tier: e.tier })),
    ...(news ?? []).map((n) => ({ cat: "News" as const, label: n.headline, at: n.publishedAt, url: n.url, tier: 3, source: n.source })),
  ].sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-5">
      {/* HEADER */}
      <Panel className="mb-3" bodyClassName="px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-balance">{ci.identity.name}</h1>
              <span className="label">{ci.identity.exchange}: {ci.identity.ticker}</span>
              <WatchButton ticker={symbol} name={ci.identity.name} />
            </div>
            <div className="mono mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
              <span style={{ color: "var(--color-pos)" }}>{ci.ipo.daysPublic ?? "?"} days public</span>
              <Sep /><span>{ci.ipo.ageBucket}</span>
              <Sep /><span>IPO {fmtDate(ci.ipo.ipoDate)}</span>
              <Sep /><span className="font-sans">{ci.identity.sicDescription}</span>
            </div>
          </div>
          <div className="flex items-end gap-6">
            <div className="text-right">
              <div className="mono text-3xl font-semibold leading-none">{fmtUsd(m.value.price)}</div>
              <div className="mono mt-1 text-xs" style={{ color: up ? "var(--color-pos)" : "var(--color-danger)" }}>
                {m.value.change != null ? `${up ? "▲" : "▼"} ${Math.abs(m.value.change).toFixed(2)}` : ""}
                {m.value.changePct != null ? ` (${up ? "+" : ""}${m.value.changePct.toFixed(2)}%)` : ""}
              </div>
            </div>
            <div className="text-right">
              <DataModeBadge mode={m.mode} />
              <div className="label mt-1">updated {ago(m.asOf)}</div>
            </div>
          </div>
        </div>
      </Panel>

      {/* VERDICT · the quick read: score, direction, confidence, one-line thesis + dimension strip */}
      <section className="mb-3 overflow-hidden rounded-sm border border-border bg-card">
        <div className="grid gap-px bg-border lg:grid-cols-[300px_1fr]">
          <div
            className="flex flex-col justify-between bg-card px-5 py-4"
            style={{ background: `linear-gradient(145deg, color-mix(in oklab, ${dirColor} 9%, var(--color-card)), var(--color-card) 60%)` }}
          >
            <div className="flex items-center justify-between">
              <span className="label" style={{ color: dirColor }}>{thesis.direction}</span>
              <span className="mono inline-flex items-center gap-1.5 text-[9px]" style={{ color: "var(--color-pos)" }}>
                <Dot color="var(--color-pos)" pulse /> ACTIVE
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="mono text-6xl font-semibold leading-none" style={{ color: dirColor }}>{score.overall ?? "·"}</span>
              <span className="label">/ 100</span>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <span className="label">Confidence</span>
                <span className="mono text-xs">{Math.round(thesis.confidence * 100)}%</span>
              </div>
              <Progress
                value={Math.round(thesis.confidence * 100)}
                className="mt-1.5 h-1.5 bg-secondary [&_[data-slot=progress-indicator]]:bg-[var(--dir)]"
                style={{ ["--dir" as string]: dirColor }}
              />
            </div>
          </div>
          <div className="flex flex-col justify-between gap-4 bg-card px-5 py-4">
            <p className="max-w-[72ch] text-pretty text-sm leading-relaxed text-foreground/90">{thesis.summary}</p>
            <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-5">
              {score.dimensions.map((d) => <DimChip key={d.key} d={d} />)}
            </div>
          </div>
        </div>
      </section>

      {/* PRICE CHART */}
      <Panel title="Price · since IPO" badge={<DataModeBadge mode={priceSeries ? "LIVE" : "SIMULATED"} />} className="mb-3">
        <PriceChart symbol={symbol} daysPublic={ci.ipo.daysPublic} initial={priceSeries} />
      </Panel>

      {/* INTELLIGENCE THESIS · the reasoning, up front */}
      <Panel title="Intelligence Thesis" badge={<DataModeBadge mode={reasoningMode} />} className="mb-3" bodyClassName="p-4">
        <div className="grid gap-x-8 gap-y-6 md:grid-cols-3">
          <ThesisList title="Why" items={thesis.keyDrivers} sign="+" color="var(--color-pos)" />
          <ThesisList title="Risks" items={thesis.risks} sign="−" color="var(--color-danger)" />
          <ThesisList title="Catalysts" items={thesis.catalysts} sign="→" color="var(--color-warn)" />
        </div>
      </Panel>

      {/* READING LAYOUT · research on the left, market data rail on the right */}
      <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-3">
          <Panel title="Research Environment" badge={<DataModeBadge mode="LIVE" />}>
            <ResearchConsole items={feed} />
          </Panel>
          <NewsPanel items={news} />
        </div>

        <div className="flex flex-col gap-3">
          <Panel title="Reasoning Engine" badge={<DataModeBadge mode={reasoningMode} />}>
            <div className="label normal-case tracking-normal text-muted-foreground">{engine}</div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Dimensions are scored deterministically from filings and market data. The engine narrates the thesis · it never sets the score.
            </p>
          </Panel>

          <Panel title="Live Market" badge={<DataModeBadge mode={m.mode} />}>
            <Row label="Price" value={fmtUsd(m.value.price)} />
            <Row label="Open" value={fmtUsd(m.value.open)} />
            <Row label="Day high" value={fmtUsd(m.value.dayHigh)} />
            <Row label="Day low" value={fmtUsd(m.value.dayLow)} />
            <Row label="Prev close" value={fmtUsd(m.value.prevClose)} />
          </Panel>

          <FundamentalsPanel f={fundamentals} />

          <Panel title="Ownership" badge={<DataModeBadge mode="LIVE" />}>
            <Row label="13D / 13G on file" value={String(n13)} />
            <Row label="Insider forms" value={String(nInsider)} />
            <div className="label mt-2 normal-case tracking-normal text-muted-foreground">SEC ownership filings · verified</div>
          </Panel>

          <Panel title="Options" badge={<DataModeBadge mode="SIMULATED" />}>
            <div className="text-xs text-muted-foreground">Options feed pending (Alpaca / Polygon). Shown to mark coverage, never faked.</div>
          </Panel>

          <Panel title="Event Radar">
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

          <ThesisHistory direction={thesis.direction} since={ci.ipo.ipoDate} />
        </div>
      </div>

      {/* EVIDENCE TABLE */}
      <Panel title="Evidence · filing timeline" className="mt-3" bodyClassName="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="label h-8 w-[110px]">Filed</TableHead>
              <TableHead className="label h-8 w-[110px]">Form</TableHead>
              <TableHead className="label h-8">Document</TableHead>
              <TableHead className="label h-8 w-[70px] text-right">Source</TableHead>
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

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Assembled {ago(ci.assembledAt)} · every panel labelled live or simulated · no fabricated metrics</span>
        <span className="mono">EQUENCY</span>
      </footer>
    </main>
  );
}

function Sep() {
  return <span className="text-border">/</span>;
}

function DimChip({ d }: { d: Dimension }) {
  const color = d.key === "risk" ? "var(--color-danger)" : "var(--color-pos)";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="label truncate normal-case tracking-normal text-muted-foreground">{d.label}</span>
        <span className="mono text-sm leading-none" style={{ color: d.value == null ? "var(--color-ink-faint)" : "var(--color-ink)" }}>{d.value ?? "n/a"}</span>
      </div>
      <Progress
        value={d.value ?? 0}
        className="mt-2 h-1 bg-secondary [&_[data-slot=progress-indicator]]:bg-[var(--c)]"
        style={{ ["--c" as string]: color, opacity: d.value == null ? 0.3 : 1 }}
      />
      <div className="mt-1.5 text-[10px] leading-snug text-muted-foreground">{d.basis}</div>
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
