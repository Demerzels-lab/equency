import { NextResponse } from "next/server";
import { getQuote } from "@/lib/providers/finnhub";

export const dynamic = "force-dynamic";
export const revalidate = 30;

/** Live prices for the paper portfolio. Real quotes or null, never invented. */
export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("symbols") ?? "";
  const symbols = raw.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 20);
  const entries = await Promise.all(
    symbols.map(async (s) => {
      try { const q = await getQuote(s); return [s, q?.market.price ?? null] as const; }
      catch { return [s, null] as const; }
    }),
  );
  return NextResponse.json({ quotes: Object.fromEntries(entries) });
}
