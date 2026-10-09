import { ageBucket } from "@/lib/util/dates";
import { ExploreGrid, type Row } from "@/components/explore/ExploreGrid";
import { UniverseHeatmap } from "@/components/explore/UniverseHeatmap";
import { coreMission, coreStatus } from "@/lib/core-identity";
import { getNewlyPublicUniverse } from "@/lib/providers/universe";

export const metadata = { title: "Explore Cores · EQUENCY" };
// Rendered on request, not at build: the universe needs ~185 paced SEC calls on a cold cache and
// parallel build workers would trip SEC's rate limit. Data is cached (unstable_cache), so only
// the first visit after a refresh pays that cost.
export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  let universe: Awaited<ReturnType<typeof getNewlyPublicUniverse>> = [];
  try {
    universe = await getNewlyPublicUniverse();
  } catch {
    universe = [];
  }

  // Day N is counted from each company's IPO (first prospectus), never from a follow-on offering.
  const rows: Row[] = universe.map((c) => ({
    ticker: c.ticker,
    name: c.name,
    daysPublic: c.daysPublic,
    bucket: String(ageBucket(c.daysPublic ?? undefined) ?? "-"),
    sector: c.sector,
    filedAt: c.ipoDate ?? c.latestProspectusAt,
    status: coreStatus(c.daysPublic, c.lastEventAt),
    phase: coreMission(c.daysPublic).phase,
  }));

  return (
    <main className="page-main mx-auto max-w-[1240px] px-6 pt-28 sm:pt-32 pb-20">
      <div className="section-label">CORE / THE INTELLIGENCE NETWORK</div>
      <h1 className="editorial-h2">
        The newly-public <span className="editorial-accent">universe.</span>
      </h1>
      <p className="editorial-lead mt-3 max-w-[62ch]">
        Every company that went public in the last 180 days receives an Intelligence Core. Detected from SEC 424B4
        prospectuses and confirmed against each company&apos;s own filings, so follow-on offerings by older companies are
        excluded. Each Core&apos;s state and mission come from real filings and its age as a public company · nothing is simulated.
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
