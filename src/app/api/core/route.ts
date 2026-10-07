import { NextResponse } from "next/server";
import { resolveTickerToCik } from "@/lib/providers/sec";
import { buildCompanyIntelligence } from "@/lib/providers/company";
import { getFundamentals } from "@/lib/providers/xbrl";
import { computeScore } from "@/lib/intelligence/score";

export const revalidate = 30;

/** Deterministic Intelligence Core preview for the hero search (score, dimensions, market).
 *  Skips the Gemini thesis on purpose — only real/SIMULATED-labelled data, sub-2s. */
export async function GET(req: Request) {
  const ticker = new URL(req.url).searchParams.get("ticker")?.trim().toUpperCase();
  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });
  try {
    const cik = await resolveTickerToCik(ticker);
    if (!cik) return NextResponse.json({ error: "not found" }, { status: 404 });
    const ci = await buildCompanyIntelligence(cik);
    const score = computeScore(ci, await getFundamentals(cik));
    return NextResponse.json({
      ticker: ci.identity.ticker || ticker,
      name: ci.identity.name,
      exchange: ci.identity.exchange,
      sector: ci.identity.sicDescription ?? null,
      daysPublic: ci.ipo.daysPublic ?? null,
      ageBucket: ci.ipo.ageBucket ?? null,
      price: ci.market.value.price ?? null,
      changePct: ci.market.value.changePct ?? null,
      marketMode: ci.market.mode,
      overall: score.overall,
      dimensions: score.dimensions,
    });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 500 });
  }
}
