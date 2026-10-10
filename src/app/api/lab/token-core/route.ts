import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { RH_RPC_MAINNET } from "@/lib/config";
import { buildTokenCore, discoverTokenizations } from "@/lib/token-core/core";

// PHASE 01 · R&D — Token Core prototype API (internal preview at /lab/token-core, not in nav).
// Needs an Alchemy RPC in RH_RPC_MAINNET (alchemy_getAssetTransfers).
export const dynamic = "force-dynamic";

// The full scan takes ~2-3 min; cache 6 h and never cache an empty result.
const discover = unstable_cache(
  async () => {
    const r = await discoverTokenizations(RH_RPC_MAINNET);
    if (!r.length) throw new Error("empty scan");
    return r;
  },
  ["token-core-discover-v1"],
  { revalidate: 21_600 },
);
const core = unstable_cache((ticker: string) => buildTokenCore(RH_RPC_MAINNET, { ticker }), ["token-core-core-v1"], { revalidate: 600 });

/** GET → tokenized stocks (+ the newly public bridge) · ?ticker=SKHY → one Token Core. */
export async function GET(req: Request) {
  const ticker = new URL(req.url).searchParams.get("ticker");
  try {
    if (ticker) {
      if (!/^[A-Za-z.]{1,6}$/.test(ticker)) return NextResponse.json({ error: "bad ticker" }, { status: 400 });
      return NextResponse.json({ core: await core(ticker.toUpperCase()) });
    }
    const list = await discover();
    return NextResponse.json({ list });
  } catch {
    return NextResponse.json({ list: [] });
  }
}
