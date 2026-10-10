import "server-only";
import { unstable_cache } from "next/cache";
import { RH_RPC_MAINNET } from "@/lib/config";
import { buildTokenCore, discoverTokenizations } from "./core";

// Shared caches for the Phase 01 Token Core preview (API route + cron warmer).
// The full scan takes ~1.5-3 min: cached 6 h, and an empty scan is thrown so it is never cached.
export const discoverCached = unstable_cache(
  async () => {
    const r = await discoverTokenizations(RH_RPC_MAINNET);
    if (!r.length) throw new Error("empty scan");
    return r;
  },
  ["token-core-discover-v2"],
  { revalidate: 21_600 },
);

// Resolve the ticker from the cached scan first: findStockToken only pages the most recent mints,
// so older tokenizations (e.g. SKHY) would come back null. A null Core is thrown, never cached.
const coreCached = unstable_cache(
  async (ticker: string) => {
    const hit = (await discoverCached().catch(() => [])).find((t) => t.symbol.toUpperCase() === ticker);
    const core = await buildTokenCore(RH_RPC_MAINNET, hit ? { token: hit.token } : { ticker });
    if (!core) throw new Error(`no token core for ${ticker}`);
    return core;
  },
  ["token-core-core-v2"],
  { revalidate: 600 },
);

export const tokenCoreCached = (ticker: string) => coreCached(ticker).catch(() => null);
