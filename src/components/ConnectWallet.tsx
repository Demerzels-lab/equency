"use client";

import { useState } from "react";

// Minimal real wallet connect via the injected provider (no heavy deps). It genuinely
// connects and can add/switch to Robinhood Chain mainnet, where the EQUENCY vault contracts
// are deployed (custody-only, vaults ship paused until audit).
const RH_MAINNET = {
  chainId: "0x1237", // 4663
  chainName: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.mainnet.chain.robinhood.com/rpc"],
  blockExplorerUrls: ["https://robinhoodchain.blockscout.com"],
};

type Eth = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
function getEth(): Eth | undefined {
  return (globalThis as unknown as { ethereum?: Eth }).ethereum;
}

export function ConnectWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function connect() {
    setError(null);
    const eth = getEth();
    if (!eth) {
      setError("No EVM wallet detected. Install MetaMask, Rabby, or a WalletConnect-compatible wallet.");
      return;
    }
    setBusy(true);
    try {
      const accts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      setAccount(accts?.[0] ?? null);
      setChainId((await eth.request({ method: "eth_chainId" })) as string);
    } catch {
      setError("Connection request was rejected.");
    } finally {
      setBusy(false);
    }
  }

  async function switchToRobinhood() {
    const eth = getEth();
    if (!eth) return;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: RH_MAINNET.chainId }] });
    } catch {
      try {
        await eth.request({ method: "wallet_addEthereumChain", params: [RH_MAINNET] });
      } catch {
        setError("Could not add Robinhood Chain to the wallet.");
        return;
      }
    }
    setChainId((await eth.request({ method: "eth_chainId" })) as string);
  }

  const short = account ? `${account.slice(0, 6)}…${account.slice(-4)}` : null;
  const onRH = chainId === RH_MAINNET.chainId; // 4663

  if (!account) {
    return (
      <div>
        <button
          onClick={connect}
          disabled={busy}
          className="group inline-flex items-center gap-4 bg-[color:var(--color-ink)] px-6 py-4 text-sm font-medium tracking-tight text-[color:var(--color-bg)] transition-colors hover:bg-white disabled:opacity-60"
        >
          {busy ? "Connecting…" : "Connect Wallet"}
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </button>
        <p className="label mt-2 normal-case" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>
          Contracts live on Robinhood Chain mainnet (4663) with real USDG. Connect to continue.
        </p>
        {error && <p className="mt-2 text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}
      </div>
    );
  }

  return (
    <div className="panel p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="label">Connected</div>
          <div className="mono mt-1 text-sm" style={{ color: "var(--color-ink)" }}>{short}</div>
        </div>
        <div className="text-right">
          <div className="label">Network</div>
          <div className="mono mt-1 text-sm" style={{ color: onRH ? "var(--color-pos)" : "var(--color-warn)" }}>
            {onRH ? "Robinhood Chain" : `chain ${chainId}`}
          </div>
        </div>
      </div>
      {!onRH && (
        <button onClick={switchToRobinhood} className="label mt-3 w-full py-2 transition-colors hover:text-[color:var(--color-accent)]" style={{ border: "1px solid var(--color-line-strong)" }}>
          Switch to Robinhood Chain
        </button>
      )}
      <div className="mt-3 border-t hairline pt-3 text-xs leading-relaxed" style={{ color: "var(--color-ink-faint)" }}>
        {onRH ? (
          <>
            EQUENCY Strategy Vault contracts are <span style={{ color: "var(--color-pos)" }}>live on Robinhood Chain mainnet</span> with
            the real USDG. Vaults ship paused; real-USDG deposits open after the external audit.
          </>
        ) : (
          <>
            EQUENCY runs on <span style={{ color: "var(--color-pos)" }}>Robinhood Chain mainnet (4663)</span>. Switch networks to continue.
          </>
        )}
      </div>
      {error && <p className="mt-2 text-xs" style={{ color: "var(--color-danger)" }}>{error}</p>}
    </div>
  );
}
