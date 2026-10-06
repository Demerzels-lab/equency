import { notFound } from "next/navigation";
import { resolveTickerToCik } from "@/lib/providers/sec";
import { buildCompanyIntelligence } from "@/lib/providers/company";
import { getFundamentals } from "@/lib/providers/xbrl";
import { getCompanyNews } from "@/lib/providers/finnhub";
import { getPriceSeries } from "@/lib/providers/yahoo";
import { computeScore } from "@/lib/intelligence/score";
import { reason, type ThesisDirection } from "@/lib/intelligence/reasoning";
import { DataModeBadge, Dot, Panel, tierColor } from "@/components/primitives";
import { PriceChart } from "@/components/PriceChart";
import { WatchButton } from "@/components/WatchButton";
import { FundamentalsPanel, NewsPanel, ThesisHistory } from "@/components/sections";
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

  // Everything else in parallel · each adapter is independent and fails soft.
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

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-5">
      {/* ===== HEADER (§15) ===== */}
      <header className="panel mb-3 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight" style={{ textWrap: "balance" } as React.CSSProperties}>
                {ci.identity.name}
              </h1>
              <span className="label">{ci.identity.exchange}: {ci.identity.ticker}</span>
              <WatchButton ticker={symbol} name={ci.identity.name} />
            </div>
            <div className="mono mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs" style={{ color: "var(--color-ink-dim)" }}>
              <span style={{ color: "var(--color-pos)" }}>{ci.ipo.daysPublic ?? "?"} DAYS PUBLIC</span>
              <span style={{ color: "var(--color-ink-faint)" }}>·</span>
              <span>{ci.ipo.ageBucket}</span>
              <span style={{ color: "var(--color-ink-faint)" }}>·</span>
              <span>IPO {fmtDate(ci.ipo.ipoDate)}</span>
              <span style={{ color: "var(--color-ink-faint)" }}>·</span>
              <span className="font-sans">{ci.identity.sicDescription}</span>
            </div>
          </div>
          <div className="flex items-end gap-6">
            <div>
              <div className="mono text-3xl font-semibold leading-none">{fmtUsd(m.value.price)}</div>
              <div className="mono mt-1 text-xs" style={{ color: up ? "var(--color-pos)" : "var(--color-danger)" }}>
                {m.value.change != null ? `${up ? "▲" : "▼"} ${Math.abs(m.value.change).toFixed(2)}` : "·"}
                {m.value.changePct != null ? ` (${up ? "+" : ""}${m.value.changePct.toFixed(2)}%)` : ""}
              </div>
            </div>
            <div className="text-right">
              <DataModeBadge mode={m.mode} />
              <div className="label mt-1">updated {ago(m.asOf)}</div>
            </div>
          </div>
        </div>
      </header>

      {/* ===== PRICE CHART (§15) ===== */}
      <section className="panel mb-3 p-4">
        <div className="mb-1 flex items-center justify-between">
          <span className="label">Price · default Since IPO</span>
          <DataModeBadge mode={priceSeries ? "LIVE" : "SIMULATED"} />
        </div>
        <PriceChart symbol={symbol} daysPublic={ci.ipo.daysPublic} initial={priceSeries} />
      </section>

      {/* ===== THREE COLUMNS (§16) ===== */}
      <div className="grid gap-3 lg:grid-cols-[320px_1fr_300px]">
        {/* --- INTELLIGENCE CORE (§17) --- */}
        <div className="flex flex-col gap-3">
          <Panel
            title="Intelligence Core"
            badge={
              <span className="mono inline-flex items-center gap-1.5 text-[9px]" style={{ color: "var(--color-pos)" }}>
                <Dot color="var(--color-pos)" pulse /> ACTIVE
              </span>
            }
          >
            <div className="flex items-baseline gap-2">
              <span className="mono text-5xl font-semibold leading-none" style={{ color: dirColor }}>
                {score.overall ?? "·"}
              </span>
              <span className="label">/ 100</span>
            </div>
            <div className="mt-4 flex flex-col gap-2.5">
              {score.dimensions.map((d) => (
                <div key={d.key} title={d.basis}>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--color-ink-dim)" }}>{d.label}</span>
                    <span className="mono" style={{ color: d.value == null ? "var(--color-ink-faint)" : "var(--color-ink)" }}>
                      {d.value ?? "n/a"}
                    </span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full" style={{ background: "var(--color-panel-2)" }}>
                    <div
                      className="h-1 rounded-full transition-[width] duration-700"
                      style={{
                        width: `${d.value ?? 0}%`,
                        background: d.key === "risk" ? "var(--color-danger)" : "var(--color-pos)",
                        opacity: d.value == null ? 0.15 : 0.85,
                      }}
                    />
                  </div>
                  <div className="label mt-1 normal-case leading-snug" style={{ letterSpacing: 0, fontSize: 9 }}>{d.basis}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Reasoning Engine" badge={<DataModeBadge mode={reasoningMode} />}>
            <div className="label normal-case" style={{ letterSpacing: 0, color: "var(--color-ink-dim)" }}>{engine}</div>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: "var(--color-ink-dim)" }}>{thesis.summary}</p>
          </Panel>

          <ThesisHistory direction={thesis.direction} since={ci.ipo.ipoDate} />
        </div>

        {/* --- RESEARCH ENVIRONMENT (§18) --- */}
        <div className="flex flex-col gap-3">
          <Panel title="Research Environment" badge={<DataModeBadge mode="LIVE" />}>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {["OFFICIAL", "SEC", "EARNINGS", "NEWS", "X", "OPTIONS", "MARKET", "OWNERSHIP"].map((t) => {
                const live = t === "SEC" || t === "OWNERSHIP" || t === "NEWS" || t === "MARKET";
                return (
                  <span key={t} className="label px-2 py-1" style={{ border: "1px solid var(--color-line)", color: live ? "var(--color-ink)" : "var(--color-ink-faint)" }}>
                    {t}
                  </span>
                );
              })}
            </div>
            <div className="mono flex flex-col text-xs">
              {ci.radar.slice(0, 8).map((e, i) => (
                <a key={i} href={e.url} target="_blank" rel="noreferrer" className="rowlink group flex items-start gap-3 border-b hairline px-1 py-2">
                  <span style={{ color: "var(--color-ink-faint)" }}>{fmtDate(e.at)}</span>
                  <span className="label" style={{ color: tierColor(e.tier) }}>{e.kind}</span>
                  <span className="flex-1 font-sans" style={{ color: "var(--color-ink)" }}>{e.label}</span>
                  <span style={{ color: "var(--color-accent)" }} className="opacity-0 transition-opacity group-hover:opacity-100">↗</span>
                </a>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-center rounded border border-dashed p-6 text-xs" style={{ borderColor: "var(--color-line)", color: "var(--color-ink-faint)" }}>
              <div className="text-center">
                <div className="label">Browser research · VIEW ONLY</div>
                <div className="mt-1 normal-case">Official-website capture not wired in this slice (Playwright adapter pending).</div>
              </div>
            </div>
          </Panel>

          <NewsPanel items={news} />
        </div>

        {/* --- LIVE MARKET (§19) --- */}
        <div className="flex flex-col gap-3">
          <Panel title="Live Market" badge={<DataModeBadge mode={m.mode} />}>
            <Row label="Price" value={fmtUsd(m.value.price)} />
            <Row label="Open" value={fmtUsd(m.value.open)} />
            <Row label="Day High" value={fmtUsd(m.value.dayHigh)} />
            <Row label="Day Low" value={fmtUsd(m.value.dayLow)} />
            <Row label="Prev Close" value={fmtUsd(m.value.prevClose)} />
          </Panel>

          <FundamentalsPanel f={fundamentals} />

          <Panel title="Ownership" badge={<DataModeBadge mode="LIVE" />}>
            <Row label="13D/13G on file" value={String(n13)} />
            <Row label="Insider forms" value={String(nInsider)} />
            <div className="label mt-2 normal-case" style={{ letterSpacing: 0 }}>From SEC ownership filings (VERIFIED).</div>
          </Panel>

          <Panel title="Options" badge={<DataModeBadge mode="SIMULATED" />}>
            <div className="text-xs" style={{ color: "var(--color-ink-faint)" }}>
              Not wired in this slice · needs an options feed (Alpaca/Polygon). Shown to mark coverage, never faked.
            </div>
          </Panel>

          <Panel title="Event Radar">
            <div className="flex flex-col gap-2">
              {ci.radar.slice(0, 6).map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Dot color={tierColor(e.tier)} />
                  <span className="mono" style={{ color: "var(--color-ink-faint)" }}>{ago(e.at)}</span>
                  <span style={{ color: "var(--color-ink-dim)" }}>{e.kind}</span>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      {/* ===== INTELLIGENCE THESIS (§21) ===== */}
      <section className="panel mt-3 p-4">
        <div className="flex items-center justify-between">
          <span className="label">Intelligence Thesis</span>
          <DataModeBadge mode={reasoningMode} />
        </div>
        <div className="mt-2 text-xl font-semibold" style={{ color: dirColor }}>{thesis.direction}</div>
        <div className="mt-4 grid gap-6 md:grid-cols-3">
          <ThesisList title="Why" items={thesis.keyDrivers} sign="+" color="var(--color-pos)" />
          <ThesisList title="Risks" items={thesis.risks} sign="−" color="var(--color-danger)" />
          <ThesisList title="Catalysts" items={thesis.catalysts} sign="→" color="var(--color-warn)" />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <span className="label">Confidence</span>
          <div className="h-1.5 w-40 overflow-hidden rounded-full" style={{ background: "var(--color-panel-2)" }}>
            <div className="h-1.5 rounded-full" style={{ width: `${Math.round(thesis.confidence * 100)}%`, background: dirColor }} />
          </div>
          <span className="mono text-sm">{Math.round(thesis.confidence * 100)}%</span>
        </div>
      </section>

      {/* ===== EVIDENCE / TIMELINE (§62, §22) ===== */}
      <section className="panel mt-3 p-4">
        <span className="label">Evidence · Filing Timeline</span>
        <div className="mono mt-3 flex flex-col text-xs">
          {ci.filings.slice(0, 16).map((f, i) => (
            <a key={i} href={f.url} target="_blank" rel="noreferrer" className="rowlink grid grid-cols-[90px_96px_1fr_auto] items-center gap-3 border-b hairline px-1 py-1.5">
              <span style={{ color: "var(--color-ink-faint)" }}>{f.filedAt}</span>
              <span style={{ color: "var(--color-ink)" }}>{f.form}</span>
              <span className="truncate font-sans" style={{ color: "var(--color-ink-dim)" }}>{f.title || ci.identity.name}</span>
              <span className="label" style={{ color: "var(--color-accent)" }}>SEC ↗</span>
            </a>
          ))}
        </div>
      </section>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs" style={{ color: "var(--color-ink-faint)" }}>
        <span>Profile assembled {ago(ci.assembledAt)} · every panel tagged LIVE / SIMULATED · no fabricated metrics</span>
        <span className="mono">EQUENCY · Intelligence for the newly public</span>
      </footer>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b hairline py-1.5 text-xs last:border-0">
      <span style={{ color: "var(--color-ink-dim)" }}>{label}</span>
      <span className="mono" style={{ color: "var(--color-ink)" }}>{value}</span>
    </div>
  );
}

function ThesisList({ title, items, sign, color }: { title: string; items: string[]; sign: string; color: string }) {
  return (
    <div>
      <div className="label mb-2">{title}</div>
      <ul className="flex flex-col gap-2 text-xs leading-relaxed" style={{ color: "var(--color-ink-dim)" }}>
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="mono" style={{ color }}>{sign}</span>
            <span style={{ textWrap: "pretty" } as React.CSSProperties}>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
