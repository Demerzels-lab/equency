import { NextResponse, type NextRequest } from "next/server";
import { getVaultHistory } from "@/lib/vault-history";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/vault-history?owner=0x… · the owner's Strategy Vaults on mainnet 4663, newest first. */
export async function GET(req: NextRequest) {
  const owner = req.nextUrl.searchParams.get("owner") ?? "";
  if (!/^0x[0-9a-fA-F]{40}$/.test(owner)) {
    return NextResponse.json({ error: "invalid owner" }, { status: 400 });
  }
  try {
    const items = await getVaultHistory(owner);
    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ items: [], error: e instanceof Error ? e.message : "history unavailable" }, { status: 502 });
  }
}
