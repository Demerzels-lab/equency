import "server-only";
import { unstable_cache } from "next/cache";
import { RH_RPC_MAINNET } from "@/lib/config";
import { buildPairCore, discoverRecentPairs, type DiscoveredPair, type PairCore } from "./core";

// Shared caches for the Phase 02 Pair Core (API route + cron warmer). The scan takes ~1-1.5 min:
// cached 30 min. An empty/partial scan throws inside, so it is never cached.
export const pairsCached = unstable_cache(
  async () => {
    const r = await discoverRecentPairs(RH_RPC_MAINNET, { perStock: 1000 });
    if (!r.length) throw new Error("empty scan");
    return r;
  },
  ["pair-core-discover-v4"],
  { revalidate: 1800 },
);

const coreCached = unstable_cache(
  async (token: string, quoteAddress: string | null) => buildPairCore(RH_RPC_MAINNET, quoteAddress === null ? { token } : { token, quoteAddress }),
  ["pair-core-core-v1"],
  { revalidate: 600 },
);

/** One Pair Core; `null` quote means "ask shrine what it is priced in". */
export const pairCoreCached = (token: string, quoteAddress: string | null = null): Promise<PairCore | null> =>
  coreCached(token.toLowerCase(), quoteAddress).catch(() => null);

/** The default view: a token still on its curve, a graduated one, then another curve. */
export async function leadCores(pairs: DiscoveredPair[]): Promise<PairCore[]> {
  const onCurve = pairs.filter((p) => (p.curveProgress ?? 0) < 1);
  const done = pairs.filter((p) => (p.curveProgress ?? 0) >= 1);
  const lead = [onCurve[0], done[0], onCurve[1]].filter(Boolean);
  const cores = await Promise.all(lead.map((p) => pairCoreCached(p.token, p.quoteAddress)));
  return cores.filter((c): c is PairCore => c != null);
}
