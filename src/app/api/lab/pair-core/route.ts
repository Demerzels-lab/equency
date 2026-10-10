import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { RH_RPC_MAINNET } from "@/lib/config";
import { buildPairCore, discoverRecentPairs, resolveQuote } from "@/lib/pair-core/core";

// PHASE 02 · R&D — Pair Core prototype API (internal preview at /lab/pair-core, not linked in nav).
export const dynamic = "force-dynamic";

// Throws on an empty scan so a blocked/non-Alchemy RPC never gets cached as "no pairs" for 30 min.
// Discovery needs alchemy_getAssetTransfers → RH_RPC_MAINNET must be an Alchemy URL.
const discover = unstable_cache(
  async () => {
    const r = await discoverRecentPairs(RH_RPC_MAINNET, { perStock: 1000 });
    if (!r.length) throw new Error("empty scan");
    return r;
  },
  ["pair-core-discover-v3"],
  { revalidate: 1800 },
);

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
      return NextResponse.json({ core: await buildPairCore(RH_RPC_MAINNET, { token }) });
    }
    const pairs = await discover();
    // Lead with a token still on its curve, then a graduated one: both lives of a stock-paired token.
    const onCurve = pairs.filter((p) => (p.curveProgress ?? 0) < 1);
    const done = pairs.filter((p) => (p.curveProgress ?? 0) >= 1);
    const lead = [onCurve[0], done[0], onCurve[1]].filter(Boolean);
    const cores = await Promise.all(lead.map((p) => buildPairCore(RH_RPC_MAINNET, { token: p.token, quoteAddress: p.quoteAddress })));
    return NextResponse.json({ pairs, cores });
  } catch {
    return NextResponse.json({ pairs: [], cores: [] });
  }
}
