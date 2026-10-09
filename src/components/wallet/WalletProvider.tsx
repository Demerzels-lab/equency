"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Eth = {
  request: (a: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (e: string, cb: (x: unknown) => void) => void;
  removeListener?: (e: string, cb: (x: unknown) => void) => void;
};
export type AddChainParams = {
  chainId: string;
  chainName: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  rpcUrls: string[];
  blockExplorerUrls: string[];
};
const getEth = (): Eth | undefined => (globalThis as unknown as { ethereum?: Eth }).ethereum;

interface WalletCtx {
  account: string | null;
  chainId: string | null; // hex
  hasWallet: boolean;
  connect: () => Promise<void>;
  switchChain: (hex: string, add?: AddChainParams) => Promise<void>;
  eth: () => Eth | undefined;
}
const Ctx = createContext<WalletCtx | null>(null);

export function useWallet(): WalletCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWallet must be used within <WalletProvider>");
  return c;
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [hasWallet, setHasWallet] = useState(false);

  useEffect(() => {
    const eth = getEth();
    setHasWallet(!!eth);
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((a) => setAccount(((a as string[])?.[0]) ?? null)).catch(() => {});
    eth.request({ method: "eth_chainId" }).then((c) => setChainId(c as string)).catch(() => {});
    const onA = (a: unknown) => setAccount(((a as string[])?.[0]) ?? null);
    const onC = (c: unknown) => setChainId(c as string);
    eth.on?.("accountsChanged", onA);
    eth.on?.("chainChanged", onC);
    return () => { eth.removeListener?.("accountsChanged", onA); eth.removeListener?.("chainChanged", onC); };
  }, []);

  const connect = useCallback(async () => {
    const eth = getEth();
    if (!eth) { window.open("https://metamask.io/download/", "_blank"); return; }
    const a = (await eth.request({ method: "eth_requestAccounts" })) as string[];
    setAccount(a?.[0] ?? null);
    setChainId((await eth.request({ method: "eth_chainId" })) as string);
  }, []);

  const switchChain = useCallback(async (hex: string, add?: AddChainParams) => {
    const eth = getEth();
    if (!eth) return;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
    } catch {
      if (add) await eth.request({ method: "wallet_addEthereumChain", params: [add] });
    }
    setChainId((await eth.request({ method: "eth_chainId" })) as string);
  }, []);

  return <Ctx.Provider value={{ account, chainId, hasWallet, connect, switchChain, eth: getEth }}>{children}</Ctx.Provider>;
}


