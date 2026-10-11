import { NextResponse } from "next/server";
import { RH_RPC_MAINNET } from "@/lib/config";
import { resolveQuote } from "@/lib/pair-core/core";
import { leadCores, pairCoreCached, pairsCached } from "@/lib/pair-core/cached";

// PHASE 02 · Pair Core API (/lab/pair-core, linked from /orion). Warmed daily by /api/cron/warm.
// Needs an Alchemy RPC in RH_RPC_MAINNET (alchemy_getAssetTransfers).
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** GET → stock-paired Pons launches + first Cores · ?token=0x… → one Core · ?quote=0x… → what an asset is. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const token = sp.get("token");
  const quote = sp.get("quote");
  try {
    if (quote) {
      if (!/^0x[0-9a-fA-F]{40}$/.test(quote)) return NextResponse.json({ error: "bad quote" }, { status: 400 });
      return NextResponse.json({ quote: await resolveQuote(RH_RPC_MAINNET, quote) });
    }
    if (token) {
      if (!/^0x[0-9a-fA-F]{40}$/.test(token)) return NextResponse.json({ error: "bad token" }, { status: 400 });
      return NextResponse.json({ core: await pairCoreCached(token) });
    }
    const pairs = await pairsCached();
    return NextResponse.json({ pairs, cores: await leadCores(pairs) });
  } catch {
    return NextResponse.json({ pairs: [], cores: [] });
  }
}
