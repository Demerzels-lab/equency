// The newly-public universe · ONE source of truth for Home, Explore, ⌘K search and strategy
// ranking, so every surface agrees on who is "newly public" and on each company's Day N.
//
// EDGAR full-text search for recent 424B4s is only the candidate list: a 424B4 is also filed for
// FOLLOW-ON offerings by companies that IPO'd long ago (e.g. BMGL: IPO Feb 2025, follow-on Oct
// 2026). Each candidate is therefore confirmed against its own SEC submissions: Day N is counted
// from the company's FIRST prospectus (sec.getSubmissions → firstPublicDate), and only companies
// still inside the newly-public window are kept.
import "server-only";
import { unstable_cache } from "next/cache";
import { getSubmissions, searchRecentIpos } from "@/lib/providers/sec";
import { daysSince } from "@/lib/util/dates";

export const NEWLY_PUBLIC_WINDOW_DAYS = 180;

export interface UniverseCompany {
  cik: string;
  ticker: string;
  name: string;
  /** First public-market date (first 424B prospectus, else exchange registration). */
  ipoDate?: string;
  daysPublic: number | null;
  sector: string;
  /** Most recent SEC filing date · drives the Core's OBSERVING state. */
  lastEventAt?: string;
  /** Date of the 424B4 that surfaced the company in search (IPO or follow-on). */
  latestProspectusAt: string;
}

const isoDaysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);

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

/** Per-company confirmation, cached separately for 3 h: a company's IPO date never changes and
 *  its latest filing only needs hour-level freshness (OBSERVING = filed in the last 72 h). So a
 *  30-min universe refresh costs ~3 EDGAR search calls, not ~185 submissions calls. */
const confirmCompany = unstable_cache(
  async (cik: string) => {
    try {
      const sub = await getSubmissions(cik);
      return {
        firstPublicDate: sub.firstPublicDate,
        ticker: sub.identity.ticker,
        sector: sub.identity.sicDescription,
        lastEventAt: sub.filings.reduce<string | undefined>((m, f) => (!m || f.filedAt > m ? f.filedAt : m), undefined),
      };
    } catch {
      return null;
    }
  },
  ["universe-confirm-v1"],
  { revalidate: 10_800 },
);

async function build(): Promise<UniverseCompany[]> {
  const today = new Date().toISOString().slice(0, 10);
  const hits = await searchRecentIpos(isoDaysAgo(NEWLY_PUBLIC_WINDOW_DAYS), today, "424B4");

  // Dedupe by issuer (a company can file several 424B4s: amendments, share classes, follow-ons).
  const seen = new Set<string>();
  const candidates = hits.filter((h) => {
    if (!h.ticker || !h.cik || /acquisition/i.test(h.name) || seen.has(h.cik)) return false;
    seen.add(h.cik);
    return true;
  });

  const rows = await mapLimit(candidates, 6, async (h): Promise<UniverseCompany | null> => {
    const c = await confirmCompany(h.cik);
    if (!c) return null; // SEC submissions unavailable · can't confirm, so don't list it
    const ipoDate = c.firstPublicDate ?? h.filedAt;
    const days = daysSince(ipoDate) ?? null;
    if (days == null || days > NEWLY_PUBLIC_WINDOW_DAYS) return null; // follow-on of an older company
    return {
      cik: h.cik,
      ticker: c.ticker || h.ticker!,
      name: h.name,
      ipoDate,
      daysPublic: days,
      sector: c.sector || "-",
      lastEventAt: c.lastEventAt,
      latestProspectusAt: h.filedAt,
    };
  });

  const out = rows.filter((r): r is UniverseCompany => r !== null).sort((a, b) => (a.daysPublic ?? 0) - (b.daysPublic ?? 0));
  // Never cache an empty universe (SEC outage / rate limit): throwing skips the cache write.
  if (out.length === 0 && candidates.length > 0) throw new Error("newly-public universe: SEC confirmation failed");
  return out;
}

/** Confirmed newly-public companies, freshest first. Cached 30 min (≈60 SEC calls per build). */
export const getNewlyPublicUniverse = unstable_cache(build, ["newly-public-universe-v3"], { revalidate: 1800 });
