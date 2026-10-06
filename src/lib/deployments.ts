// EQUENCY onchain deployments. Addresses verified read-only from chain (not from deploy
// logs) · anyone can confirm them on the explorer. Testnet uses a MOCK stack because the
// canonical USDG/stock tokens do not exist on 46630; mainnet will wire the real USDG.

export interface VaultDeployment {
  chainId: number;
  label: string;
  live: boolean;
  explorer: string;
  deployedAt?: string;
  contracts: Record<string, `0x${string}`>;
}

export const DEPLOYMENTS: Record<number, VaultDeployment> = {
  46630: {
    chainId: 46630,
    label: "Robinhood Testnet",
    live: true,
    explorer: "https://explorer.testnet.chain.robinhood.com",
    deployedAt: "2026-10-06",
    contracts: {
      VaultFactory: "0x604B51a2a0a770f1663F94d30aB93Ea886538970",
      Registry: "0x52d182e2C8A53E74E36760d3dA0391FA4e4E0ee7",
      Adapter: "0x48b715816b46B963E50c241a0C5A0CB2773e4bAD",
      Oracle: "0x9B59F7687cf30996592aC2136C4701f1b46625E5",
      USDG: "0xF28F1207Ac74924fc857ed9b8D9E55Dc25CC1fD5",
      TSLA: "0x4854F35A8dD1C3e0B582D013b99682E2eb558479",
      NVDA: "0x88A82CC170151bdA35e51D9b8064CB6d6B9De0b1",
    },
  },
  4663: {
    chainId: 4663,
    label: "Robinhood Mainnet",
    live: false, // deploy script ready (custody-only, real USDG + Chainlink); NOT broadcast
    explorer: "https://robinhoodchain.blockscout.com",
    contracts: {
      // Filled after the mainnet broadcast. Real asset references below are verified on-chain.
      USDG: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
      TSLA: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d",
      NVDA: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
    },
  },
};

export const TESTNET = DEPLOYMENTS[46630];
export const MAINNET = DEPLOYMENTS[4663];

/** Chain id (hex) → deployment. */
export function deploymentByHex(chainHex: string): VaultDeployment | undefined {
  const id = parseInt(chainHex, 16);
  return DEPLOYMENTS[id];
}

export const CHAIN_HEX: Record<number, string> = { 46630: "0xb626", 4663: "0x1237" };

/** Is this deployment actually usable (contracts deployed with a factory)? */
export function isDeployed(d: VaultDeployment | undefined): boolean {
  return !!d && d.live && !!d.contracts.VaultFactory;
}

export function explorerAddr(chainId: number, addr: string): string {
  const d = DEPLOYMENTS[chainId];
  return d ? `${d.explorer}/address/${addr}` : "#";
}

export function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
