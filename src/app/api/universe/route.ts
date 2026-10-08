import { NextResponse } from "next/server";
import { searchRecentIpos } from "@/lib/providers/sec";

export const revalidate = 1800;

function isoDaysAgo(d: number): string {
  return new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);
}

/** Real newly-public universe (SEC 424B4) for the ⌘K command palette. */
export async function GET() {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const ipos = await searchRecentIpos(isoDaysAgo(90), today, "424B4");
    const seen = new Set<string>();
    const universe = ipos
      .filter((i) => {
        if (!i.ticker || /acquisition/i.test(i.name) || seen.has(i.ticker)) return false;
        seen.add(i.ticker);
        return true;
      })
      .slice(0, 48)
      .map((i) => ({ ticker: i.ticker, name: i.name, filedAt: i.filedAt, cik: i.cik }));
    return NextResponse.json({ universe });
  } catch {
    return NextResponse.json({ universe: [] });
  }
}
