import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { RH_RPC_MAINNET } from "@/lib/config";
import { buildCommodityCore, type Commodity } from "@/lib/commodity-core/core";

// PHASE 04 · R&D (Roadmap · conditional) — Commodity Core API for /lab/commodity-core.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const core = unstable_cache((c: Commodity) => buildCommodityCore(RH_RPC_MAINNET, c), ["commodity-core-v1"], { revalidate: 600 });

/** GET ?c=GOLD|SILVER|OIL → one Commodity Core. */
export async function GET(req: Request) {
  const c = (new URL(req.url).searchParams.get("c") ?? "GOLD").toUpperCase();
  if (c !== "GOLD" && c !== "SILVER" && c !== "OIL") return NextResponse.json({ error: "bad commodity" }, { status: 400 });
  try {
    return NextResponse.json({ core: await core(c) });
  } catch {
    return NextResponse.json({ core: null });
  }
}
