import { NextResponse } from "next/server";
import { getPriceSeries, type ChartRange } from "@/lib/providers/yahoo";

const VALID: ChartRange[] = ["1D", "5D", "1M", "3M", "6M", "SINCE IPO"];

export async function GET(
  req: Request,
  { params }: { params: Promise<{ ticker: string }> },
) {
  const { ticker } = await params;
  const url = new URL(req.url);
  const range = (url.searchParams.get("range") || "SINCE IPO") as ChartRange;
  const days = Number(url.searchParams.get("days")) || undefined;
  if (!VALID.includes(range)) {
    return NextResponse.json({ error: "bad range" }, { status: 400 });
  }
  const series = await getPriceSeries(ticker.toUpperCase(), range, days);
  if (!series) return NextResponse.json({ error: "unavailable" }, { status: 502 });
  return NextResponse.json(series);
}
