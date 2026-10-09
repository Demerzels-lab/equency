import { NextResponse } from "next/server";
import { getNewlyPublicUniverse } from "@/lib/providers/universe";

// Rendered on request, not at build: the universe needs ~185 paced SEC calls on a cold cache and
// parallel build workers would trip SEC's rate limit. Data is cached (unstable_cache), so only
// the first visit after a refresh pays that cost.
export const dynamic = "force-dynamic";

/** Confirmed newly-public universe (shared with Home/Explore) for ⌘K and the hero Core search. */
export async function GET() {
  try {
    const universe = (await getNewlyPublicUniverse())
      .slice(0, 48)
      .map((c) => ({ ticker: c.ticker, name: c.name, ipoDate: c.ipoDate, daysPublic: c.daysPublic, cik: c.cik }));
    return NextResponse.json({ universe });
  } catch {
    return NextResponse.json({ universe: [] });
  }
}
