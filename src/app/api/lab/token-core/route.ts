import { NextResponse } from "next/server";
import { discoverCached, tokenCoreCached } from "@/lib/token-core/cached";

// PHASE 01 · Token Core preview API (/lab/token-core, linked from /roadmap).
// Needs an Alchemy RPC in RH_RPC_MAINNET (alchemy_getAssetTransfers). Warmed daily by /api/cron/warm.
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** GET → tokenized stocks (+ the newly public bridge) · ?ticker=SKHY → one Token Core. */
export async function GET(req: Request) {
  const ticker = new URL(req.url).searchParams.get("ticker");
  try {
    if (ticker) {
      if (!/^[A-Za-z.]{1,6}$/.test(ticker)) return NextResponse.json({ error: "bad ticker" }, { status: 400 });
      return NextResponse.json({ core: await tokenCoreCached(ticker.toUpperCase()) });
    }
    return NextResponse.json({ list: await discoverCached() });
  } catch {
    return NextResponse.json({ list: [] });
  }
}
