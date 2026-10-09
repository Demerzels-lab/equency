// EQUENCY onchain deployments. Addresses verified read-only from chain (not from deploy
// logs) · anyone can confirm them on the explorer. MAINNET (4663) is the production
// deployment wired to the real USDG + Robinhood stock tokens. Testnet (46630) is kept for
// reference only (mock stack · canonical USDG/stock tokens do not exist there).

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
    // Broadcast 2026-10-09 (block 83528933–83528961, deployer/owner 0x8481…C199) and verified
    // on-chain: code present, owner(), factory wiring, TSLA/NVDA registered DISABLED.
    // Custody-only launch: no execution adapter, no Chainlink feeds wired, vaults ship paused.
    // The app treats mainnet as the live network; the in-app unpause stays hidden here until audit.
    live: true,
    explorer: "https://robinhoodchain.blockscout.com",
    deployedAt: "2026-10-09",
    contracts: {
      VaultFactory: "0x8bec1e1d091085D6515FDCe12645dc02c049BeCC",
      Registry: "0xa205A7BF9c81998950933c710CA6bd1D843C217C",
      Oracle: "0xD0CAF431aBd7CaB2eF562E9FCb968A8Adcb12FFA",
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

export function explorerTx(chainId: number, hash: string): string {
  const d = DEPLOYMENTS[chainId];
  return d ? `${d.explorer}/tx/${hash}` : "#";
}

export function shortAddr(a: string): string {
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}
