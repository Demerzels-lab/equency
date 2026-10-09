// Vault creation history for an owner, read from chain via the Alchemy RPC only.
//
// The obvious approach (eth_getLogs over the factory since deploy) is unavailable: the Alchemy
// free tier caps eth_getLogs at a 10-block range, and Blockscout's API sits behind Cloudflare.
// So, per vault:
//   1. vaultsOf(owner) on the factory              → the owner's vault addresses (authoritative)
//   2. binary-search eth_getCode over block numbers → the block the vault was created in (~20 calls)
//   3. eth_getLogs on that ONE block for VaultCreated(owner, vault) → creation tx hash + params
// Steps 2–3 are immutable facts, cached indefinitely per vault. Live state (paused) is read fresh.
import "server-only";
import { unstable_cache } from "next/cache";
import { RH_RPC_MAINNET } from "@/lib/config";
import { MAINNET } from "@/lib/deployments";

/** Factory deployment block on mainnet 4663 (no vault can predate it). */
const FACTORY_DEPLOY_BLOCK = 83_528_961;
const FACTORY = MAINNET.contracts.VaultFactory.toLowerCase();
// keccak256("VaultCreated(address,address,uint16,uint16,uint8,uint256)")
const VAULT_CREATED_TOPIC = "0x41cc40ef682aa92e66d50e5b0486544dfdcf402e3837fceb60bcf32dd357f136";
// vaultsOf(address) selector
const VAULTS_OF_SELECTOR = "0x6cc811f8";

let rpcId = 1;
async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RH_RPC_MAINNET, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: rpcId++, method, params }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`rpc ${res.status}`);
  const j = (await res.json()) as { result?: T; error?: { message: string } };
  if (j.error) throw new Error(j.error.message);
  return j.result as T;
}

const hex = (n: number) => "0x" + n.toString(16);
const pad32 = (addr: string) => "0x" + addr.toLowerCase().replace(/^0x/, "").padStart(64, "0");
const word = (data: string, i: number) => data.slice(2 + i * 64, 2 + (i + 1) * 64);

export interface VaultHistoryItem {
  vault: string;
  index: number; // 1-based, in creation order
  txHash: string | null;
  block: number | null;
  timestamp: number | null; // unix seconds
  maxPositionBps: number | null;
  cashReserveBps: number | null;
  maxPositions: number | null;
  paused: boolean | null;
}

async function vaultsOf(owner: string): Promise<string[]> {
  // vaultsOf(address) → address[] (ABI: offset, length, items…)
  const data = await rpc<string>("eth_call", [{ to: FACTORY, data: VAULTS_OF_SELECTOR + pad32(owner).slice(2) }, "latest"]);
  if (!data || data === "0x") return [];
  const len = parseInt(word(data, 1), 16);
  return Array.from({ length: len }, (_, i) => "0x" + word(data, 2 + i).slice(24));
}

/** Immutable creation facts for one vault · cached forever (a vault's birth never changes). */
const creationOf = unstable_cache(
  async (vault: string, owner: string) => {
    let lo = FACTORY_DEPLOY_BLOCK;
    let hi = parseInt(await rpc<string>("eth_blockNumber", []), 16);
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const code = await rpc<string>("eth_getCode", [vault, hex(mid)]);
      if (code && code !== "0x") hi = mid;
      else lo = mid + 1;
    }
    const [logs, block] = await Promise.all([
      rpc<Array<{ transactionHash: string; data: string }>>("eth_getLogs", [
        { address: FACTORY, fromBlock: hex(lo), toBlock: hex(lo), topics: [VAULT_CREATED_TOPIC, pad32(owner), pad32(vault)] },
      ]),
      rpc<{ timestamp: string }>("eth_getBlockByNumber", [hex(lo), false]),
    ]);
    const log = logs[0];
    return {
      txHash: log?.transactionHash ?? null,
      block: lo,
      timestamp: block ? parseInt(block.timestamp, 16) : null,
      maxPositionBps: log ? parseInt(word(log.data, 0), 16) : null,
      cashReserveBps: log ? parseInt(word(log.data, 1), 16) : null,
      maxPositions: log ? parseInt(word(log.data, 2), 16) : null,
    };
  },
  ["vault-creation-v1"],
  { revalidate: false },
);

// paused() selector
const PAUSED_SELECTOR = "0x5c975abb";

export async function getVaultHistory(owner: string): Promise<VaultHistoryItem[]> {
  const vaults = await vaultsOf(owner);
  const items: VaultHistoryItem[] = [];
  // Sequential: each vault costs ~20 RPC calls on first sight; keep well inside free-tier throughput.
  for (const [i, vault] of vaults.entries()) {
    let c: Awaited<ReturnType<typeof creationOf>> | null = null;
    try {
      c = await creationOf(vault.toLowerCase(), owner.toLowerCase());
    } catch {
      c = null;
    }
    let paused: boolean | null = null;
    try {
      const p = await rpc<string>("eth_call", [{ to: vault, data: PAUSED_SELECTOR }, "latest"]);
      paused = p && p !== "0x" ? parseInt(p, 16) === 1 : null;
    } catch {
      /* live state best-effort */
    }
    items.push({
      vault,
      index: i + 1,
      txHash: c?.txHash ?? null,
      block: c?.block ?? null,
      timestamp: c?.timestamp ?? null,
      maxPositionBps: c?.maxPositionBps ?? null,
      cashReserveBps: c?.cashReserveBps ?? null,
      maxPositions: c?.maxPositions ?? null,
      paused,
    });
  }
  return items.reverse(); // newest first
}
