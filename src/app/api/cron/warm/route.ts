import { NextResponse, type NextRequest } from "next/server";
import { getNewlyPublicUniverse } from "@/lib/providers/universe";
import { discoverCached } from "@/lib/token-core/cached";

// Cache warmer for the newly-public universe, called by Vercel Cron (vercel.json).
// Schedule is daily (06:00 UTC) because the Hobby plan rejects any cron that runs more than once a
// day. On Pro, tighten it to "*/20 * * * *".
// The universe needs ~185 paced SEC calls on a cold cache (~25 s). Hitting it on a schedule means
// visitors always read a warm cache: a stale entry is served instantly and refreshed in the
// background, and per-company confirmations (3 h cache) stay warm so a refresh costs ~3 calls.
export const dynamic = "force-dynamic";
export const maxDuration = 300; // the Phase 01 Token Core scan takes ~1.5-3 min

export async function GET(req: NextRequest) {
  // Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when CRON_SECRET is set.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const t0 = Date.now();
  try {
    const [universe, tokens] = await Promise.all([getNewlyPublicUniverse(), discoverCached().catch(() => [])]);
    return NextResponse.json({ ok: true, cores: universe.length, tokenized: tokens.length, ms: Date.now() - t0 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "warm failed", ms: Date.now() - t0 }, { status: 502 });
  }
}
