// Server-side liveness read · proves the vault is deployed by reading chain state, not by
// trusting a deploy log (web3-ship §8). Raw JSON-RPC, no extra deps. Fails soft.
import "server-only";
import { RH_RPC_TESTNET } from "@/lib/config";
import { TESTNET } from "@/lib/deployments";

async function rpc(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(RH_RPC_TESTNET, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`rpc ${res.status}`);
  const j = await res.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}

export interface VaultLiveness {
  reachable: boolean;
  factoryHasCode: boolean;
  vaultCount: number | null;
}

// vaultCount() selector = keccak256("vaultCount()")[:4]
const VAULT_COUNT_SELECTOR = "0xa7c6a100";

export async function readVaultLiveness(): Promise<VaultLiveness> {
  const factory = TESTNET.contracts.VaultFactory;
  try {
    const code = (await rpc("eth_getCode", [factory, "latest"])) as string;
    const factoryHasCode = typeof code === "string" && code !== "0x" && code.length > 2;
    let vaultCount: number | null = null;
    try {
      const r = (await rpc("eth_call", [{ to: factory, data: VAULT_COUNT_SELECTOR }, "latest"])) as string;
      if (typeof r === "string" && r !== "0x") vaultCount = parseInt(r, 16);
    } catch {
      /* selector/decoding best-effort */
    }
    return { reachable: true, factoryHasCode, vaultCount };
  } catch {
    return { reachable: false, factoryHasCode: false, vaultCount: null };
  }
}
