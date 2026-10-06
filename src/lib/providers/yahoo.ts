// Yahoo Finance chart adapter · free, no key. Real daily/intraday OHLC for the
// price chart (brief §15). Returns null when unavailable so the UI stays honest.
import "server-only";

export interface PricePoint {
  t: number; // unix seconds
  close: number;
}
export interface PriceSeries {
  symbol: string;
  points: PricePoint[];
  prevClose?: number;
  asOf: string;
  range: string;
}

export type ChartRange = "1D" | "5D" | "1M" | "3M" | "6M" | "SINCE IPO";

/** Map a UI range to Yahoo's {range, interval}, choosing span from days-public for Since IPO. */
export function rangeParams(range: ChartRange, daysPublic?: number): { range: string; interval: string } {
  switch (range) {
    case "1D": return { range: "1d", interval: "5m" };
    case "5D": return { range: "5d", interval: "30m" };
    case "1M": return { range: "1mo", interval: "1d" };
    case "3M": return { range: "3mo", interval: "1d" };
    case "6M": return { range: "6mo", interval: "1d" };
    case "SINCE IPO": {
      const d = daysPublic ?? 30;
      if (d <= 5) return { range: "5d", interval: "30m" };
      if (d <= 30) return { range: "1mo", interval: "1d" };
      if (d <= 90) return { range: "3mo", interval: "1d" };
      return { range: "6mo", interval: "1d" };
    }
  }
}

export async function getPriceSeries(
  symbol: string,
  range: ChartRange,
  daysPublic?: number,
): Promise<PriceSeries | null> {
  const { range: r, interval } = rangeParams(range, daysPublic);
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${r}&interval=${interval}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, next: { revalidate: 120 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;
    const ts: number[] = result.timestamp ?? [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];
    const points: PricePoint[] = [];
    for (let i = 0; i < ts.length; i++) {
      const c = closes[i];
      if (c != null) points.push({ t: ts[i], close: c });
    }
    if (points.length < 2) return null;
    return {
      symbol,
      points,
      prevClose: result.meta?.chartPreviousClose,
      asOf: new Date().toISOString(),
      range,
    };
  } catch {
    return null;
  }
}
