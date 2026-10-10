import "server-only";
import { unstable_cache } from "next/cache";
import { RH_RPC_MAINNET } from "@/lib/config";
import { buildTokenCore, discoverTokenizations, type TokenCore } from "./core";

// Shared caches for the Phase 01 Token Core preview (API route + cron warmer).
// The full scan takes ~1.5-3 min: cached 6 h. A partial scan (rate-limited RPC) is thrown so it is
// never cached; Robinhood had 194 stock tokens at build time and the count only grows.
export const discoverCached = unstable_cache(
  async () => {
    const r = await discoverTokenizations(RH_RPC_MAINNET);
    if (r.length < 150) throw new Error(`partial scan: ${r.length} tokens`);
    return r;
  },
  ["token-core-discover-v3"],
  { revalidate: 21_600 },
);

// Last build per ticker, served while a Core with a failed onchain read stays uncached.
const partial = new Map<string, TokenCore>();

// Resolve the ticker from the cached scan first: findStockToken only pages the most recent mints,
// so older tokenizations (e.g. SKHY) would come back null. A null Core is thrown, never cached.
const coreCached = unstable_cache(
  async (ticker: string) => {
    const hit = (await discoverCached().catch(() => [])).find((t) => t.symbol.toUpperCase() === ticker);
    const core = await buildTokenCore(RH_RPC_MAINNET, hit ? { token: hit.token } : { ticker });
    if (!core) throw new Error(`no token core for ${ticker}`);
    if (!core.onchain.flowOk) { partial.set(ticker, core); throw new Error(`partial onchain read for ${ticker}`); }
    return core;
  },
  ["token-core-core-v3"],
  { revalidate: 600 },
);

export const tokenCoreCached = (ticker: string) => coreCached(ticker).catch(() => partial.get(ticker) ?? null);
