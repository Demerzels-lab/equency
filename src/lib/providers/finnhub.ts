// Finnhub adapter · Tier-2 market data. Free tier: /quote (live price) + /company-news.
// Returns null (not fake data) when no key is configured, so callers fall back to
// an honest SIMULATED state instead of inventing numbers (brief §0, §19).
import "server-only";
import { FINNHUB_API_KEY, has } from "@/lib/config";
import type { MarketState, NewsItem } from "@/lib/providers/types";

const BASE = "https://finnhub.io/api/v1";

async function fh<T>(path: string, revalidate: number): Promise<T | null> {
  if (!has.finnhub()) return null;
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`${BASE}${path}${sep}token=${FINNHUB_API_KEY}`, {
    next: { revalidate },
  });
  if (!res.ok) return null;
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return null; // premium redirect / html
  return (await res.json()) as T;
}

interface RawQuote {
  c: number; // current
  d: number; // change
  dp: number; // change percent
  h: number;
  l: number;
  o: number;
  pc: number; // previous close
  t: number; // unix seconds
}

/** Live quote. null => caller should present SIMULATED. */
export async function getQuote(
  symbol: string,
): Promise<{ market: MarketState; at: string } | null> {
  const q = await fh<RawQuote>(`/quote?symbol=${encodeURIComponent(symbol)}`, 30);
  if (!q || !q.c) return null;
  return {
    market: {
      price: q.c,
      change: q.d,
      changePct: q.dp,
      dayHigh: q.h,
      dayLow: q.l,
      open: q.o,
      prevClose: q.pc,
    },
    at: q.t ? new Date(q.t * 1000).toISOString() : new Date().toISOString(),
  };
}

export async function getCompanyNews(
  symbol: string,
  from: string,
  to: string,
): Promise<NewsItem[] | null> {
  const raw = await fh<Array<{ headline: string; source: string; url: string; datetime: number }>>(
    `/company-news?symbol=${encodeURIComponent(symbol)}&from=${from}&to=${to}`,
    900,
  );
  if (!raw) return null;
  return raw.slice(0, 10).map((n) => ({
    headline: n.headline,
    source: n.source,
    url: n.url,
    publishedAt: new Date(n.datetime * 1000).toISOString(),
  }));
}
