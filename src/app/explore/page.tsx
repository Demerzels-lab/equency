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
  const run = async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return out;
}

export default async function ExplorePage() {
  const today = new Date().toISOString().slice(0, 10);
  let ipos: Awaited<ReturnType<typeof searchRecentIpos>> = [];
  try {
    ipos = await searchRecentIpos(isoDaysAgo(180), today, "424B4");
  } catch {
    ipos = [];
  }
  // EDGAR returns one hit per 424B4 filing; an issuer can file several (amendments, multiple
  // share classes) → dedupe by ticker so every company appears once.
  const seen = new Set<string>();
  const universe = ipos
    .filter((i) => {
      if (!i.ticker || /acquisition/i.test(i.name) || seen.has(i.ticker)) return false;
      seen.add(i.ticker);
      return true;
    })
    .slice(0, 40);

  const rows: Row[] = await mapLimit(universe, 6, async (i) => {
    const d = daysSince(i.filedAt) ?? null;
    let sector = "-";
    try {
      sector = (await getSubmissions(i.cik)).identity.sicDescription || "-";
    } catch {
      /* keep - */
    }
    return {
      ticker: i.ticker ?? "",
      name: i.name,
      daysPublic: d,
      bucket: String(ageBucket(d ?? undefined) ?? "-"),
      sector,
      filedAt: i.filedAt,
    };
  });

  return (
    <main className="mx-auto max-w-[1240px] px-6 pt-28 sm:pt-32 pb-20">
      <div className="section-label">01 / DISCOVERY & UNIVERSE</div>
      <h1 className="editorial-h2">
        The newly-public <span className="editorial-accent">universe.</span>
      </h1>
      <p className="editorial-lead mt-3 max-w-[62ch]">
        Every company detected from audited SEC 424B4 filings in the last 180 days. Filter, sort, watch,
        or compare. Ground truth directly from EDGAR, with zero fabricated state.
      </p>

      <div className="mt-10 border-t border-[color:var(--color-line)] pt-8">
        <UniverseHeatmap rows={rows} />
      </div>

      <div className="mt-10 border-t border-[color:var(--color-line)] pt-8">
        <ExploreGrid rows={rows} />
      </div>
    </main>
  );
}
