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
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <div className="label text-[color:var(--color-accent-2)]">Compare</div>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">Intelligence Cores, side by side</h1>
      <p className="mt-2 text-sm text-muted-foreground">Deterministic signals only · open a Core for its full thesis. {cols.length}/4 selected.</p>

      {cols.length === 0 ? (
        <div className="mt-8 rounded-sm border border-border p-8 text-center text-sm text-muted-foreground">
          No companies selected. Add some from <Link href="/explore" className="text-[color:var(--color-accent)]">Explore</Link> (the “vs” button).
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <div className="grid gap-3" style={{ gridTemplateColumns: `160px repeat(${cols.length}, minmax(190px, 1fr))` }}>
            {/* header row */}
            <div />
            {cols.map((c) => (
              <div key={c.ticker} className="rounded-sm border border-border bg-card/50 p-4 text-center">
                <div className="flex justify-center"><CompanyEmblem ticker={c.ticker} size={40} /></div>
                <Link href={`/company/${c.ticker}`} className="mono mt-2 block text-sm" style={{ color: "var(--color-accent)" }}>{c.ticker}</Link>
                <div className="mt-0.5 truncate text-xs text-muted-foreground" title={c.ci.identity.name}>{c.ci.identity.name}</div>
                <div className="mt-3 flex justify-center"><ScoreGauge value={c.score.overall} size={104} color="var(--color-accent)" /></div>
                <div className="mono mt-2 text-xs text-muted-foreground">{fmtUsd(c.ci.market.value.price)} · {c.ci.ipo.daysPublic ?? "?"}d</div>
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
      <div className="flex items-center border-t border-border py-3 text-xs text-muted-foreground">{label}</div>
      {cols.map((v, i) => (
        <div key={i} className="flex flex-col justify-center border-t border-border px-3 py-3">
          <div className="flex items-center justify-between">
            <Progress value={v ?? 0} className="h-1.5 w-full flex-1 bg-secondary [&_[data-slot=progress-indicator]]:bg-[var(--c)]" style={{ ["--c" as string]: risk ? "var(--color-danger)" : "var(--color-pos)", opacity: v == null ? 0.3 : 1 }} />
            <span className="mono ml-2 w-8 text-right text-xs" style={{ color: v == null ? "var(--color-ink-faint)" : "var(--color-ink)" }}>{v ?? "n/a"}</span>
          </div>
        </div>
      ))}
    </>
  );
}
