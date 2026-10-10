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
  ["token-core-discover-v1"],
  { revalidate: 21_600 },
);

export const tokenCoreCached = unstable_cache((ticker: string) => buildTokenCore(RH_RPC_MAINNET, { ticker }), ["token-core-core-v1"], { revalidate: 600 });
