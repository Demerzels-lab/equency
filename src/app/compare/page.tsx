import Link from "next/link";
import { resolveTickerToCik } from "@/lib/providers/sec";
import { buildCompanyIntelligence } from "@/lib/providers/company";
import { getFundamentals } from "@/lib/providers/xbrl";
import { computeScore } from "@/lib/intelligence/score";
import { CompanyEmblem } from "@/components/CompanyEmblem";
import { ScoreGauge } from "@/components/ScoreGauge";
import { Progress } from "@/components/ui/progress";
import { fmtUsd } from "@/lib/util/format";

export const metadata = { title: "Compare · EQUENCY" };
export const revalidate = 120;

async function load(ticker: string) {
  try {
    const cik = await resolveTickerToCik(ticker);
    if (!cik) return null;
    const ci = await buildCompanyIntelligence(cik);
    const f = await getFundamentals(cik);
    const score = computeScore(ci, f);
    return { ci, score, ticker: ci.identity.ticker || ticker.toUpperCase() };
  } catch { return null; }
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ tickers?: string }> }) {
  const { tickers } = await searchParams;
  const list = (tickers ?? "").split(",").map((t) => t.trim().toUpperCase()).filter(Boolean).slice(0, 4);
  const cols = (await Promise.all(list.map(load))).filter((x): x is NonNullable<typeof x> => !!x);
  const dims = cols[0]?.score.dimensions ?? [];

  return (
    <main className="mx-auto max-w-[1240px] px-6 pt-28 sm:pt-32 pb-20">
      <div className="section-label mb-2">01 / COMPARATIVE EVALUATION</div>
      <h1 className="editorial-h2">Intelligence Cores, <span className="editorial-accent">side by side.</span></h1>
      <p className="editorial-lead mt-2 max-w-[62ch]">Deterministic signals only · open a Core for its full thesis. {cols.length}/4 selected.</p>

      {cols.length === 0 ? (
        <div className="mt-8 border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-12 text-center text-sm text-[color:var(--color-ink-dim)]">
          No companies selected for comparison. Add companies from <Link href="/explore" className="font-semibold text-[color:var(--color-accent)] hover:underline">Explore Universe</Link> using the “VS” toggle.
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto border border-[color:var(--color-line)] bg-[color:var(--color-panel)] p-6">
          <div className="grid gap-3" style={{ gridTemplateColumns: `160px repeat(${cols.length}, minmax(190px, 1fr))` }}>
            {/* header row */}
            <div className="flex items-end pb-4 font-mono text-[10px] tracking-wider uppercase text-[color:var(--color-ink-faint)]">
              DIMENSION MATRIX
            </div>
            {cols.map((c) => (
              <div key={c.ticker} className="border border-[color:var(--color-line)] bg-[color:var(--color-panel-2)]/40 p-5 text-center">
                <div className="flex justify-center"><CompanyEmblem ticker={c.ticker} size={42} /></div>
                <Link href={`/company/${c.ticker}`} className="font-mono mt-2.5 block text-sm font-bold text-[color:var(--color-accent)] hover:underline">{c.ticker}</Link>
                <div className="mt-0.5 truncate text-xs text-[color:var(--color-ink-dim)]" title={c.ci.identity.name}>{c.ci.identity.name}</div>
                <div className="mt-3 flex justify-center"><ScoreGauge value={c.score.overall} size={90} color="var(--color-accent)" /></div>
                <div className="font-mono mt-2 text-xs text-[color:var(--color-ink-dim)] tabular-nums">{fmtUsd(c.ci.market.value.price)} · {c.ci.ipo.daysPublic ?? "?"}d</div>
              </div>
            ))}

            {/* dimension matrix */}
            {dims.map((d, di) => (
              <DimRow key={d.key} label={d.label} cols={cols.map((c) => c.score.dimensions[di]?.value ?? null)} risk={d.key === "risk"} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

function DimRow({ label, cols, risk }: { label: string; cols: (number | null)[]; risk?: boolean }) {
  return (
    <>
      <div className="flex items-center border-t border-[color:var(--color-line)] py-3 font-mono text-xs text-[color:var(--color-ink-dim)]">{label}</div>
      {cols.map((v, i) => (
        <div key={i} className="flex flex-col justify-center border-t border-[color:var(--color-line)] px-3 py-3">
          <div className="flex items-center justify-between">
            <Progress value={v ?? 0} className="h-1.5 w-full flex-1 bg-[color:var(--color-panel-2)] [&_[data-slot=progress-indicator]]:bg-[var(--c)]" style={{ ["--c" as string]: risk ? "var(--color-danger)" : "var(--color-pos)", opacity: v == null ? 0.3 : 1 }} />
            <span className="font-mono ml-2.5 w-8 text-right text-xs tabular-nums font-semibold" style={{ color: v == null ? "var(--color-ink-faint)" : "var(--color-ink)" }}>{v ?? "n/a"}</span>
          </div>
        </div>
      ))}
    </>
  );
}
