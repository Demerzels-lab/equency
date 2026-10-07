import { searchRecentIpos, getSubmissions } from "@/lib/providers/sec";
import { daysSince, ageBucket } from "@/lib/util/dates";
import { ExploreGrid, type Row } from "@/components/explore/ExploreGrid";
import { UniverseHeatmap } from "@/components/explore/UniverseHeatmap";

export const metadata = { title: "Explore · EQUENCY" };
export const revalidate = 3600;

function isoDaysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const run = async () => { while (i < items.length) { const idx = i++; out[idx] = await fn(items[idx]); } };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return out;
}

export default async function ExplorePage() {
  const today = new Date().toISOString().slice(0, 10);
  let ipos: Awaited<ReturnType<typeof searchRecentIpos>> = [];
  try { ipos = await searchRecentIpos(isoDaysAgo(180), today, "424B4"); } catch { ipos = []; }
  const universe = ipos.filter((i) => i.ticker && !/acquisition/i.test(i.name)).slice(0, 40);

  const rows: Row[] = await mapLimit(universe, 6, async (i) => {
    const d = daysSince(i.filedAt) ?? null;
    let sector = "—";
    try { sector = (await getSubmissions(i.cik)).identity.sicDescription || "—"; } catch { /* keep — */ }
    return { ticker: i.ticker ?? "", name: i.name, daysPublic: d, bucket: String(ageBucket(d ?? undefined) ?? "—"), sector, filedAt: i.filedAt };
  });

  return (
    <main className="mx-auto max-w-[1200px] px-4 py-6">
      <div className="mb-2 label text-[color:var(--color-accent-2)]">Discovery</div>
      <h1 className="text-3xl font-semibold tracking-tight">The newly-public universe</h1>
      <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">
        Every company detected from SEC 424B4 filings in the last 180 days. Filter, sort, watch, or
        line them up to compare. Real SEC data · nothing fabricated.
      </p>

      <div className="mt-6"><UniverseHeatmap rows={rows} /></div>
      <div className="mt-6"><ExploreGrid rows={rows} /></div>
    </main>
  );
}
