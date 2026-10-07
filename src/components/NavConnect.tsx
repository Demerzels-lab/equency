"use client";

import { useState } from "react";
import { useWallet } from "@/components/wallet/WalletProvider";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Compact navbar wallet connect, backed by the shared WalletProvider (same connection as
 *  the Vault workbench). Real injected-wallet connect; shows the address once connected. */
export function NavConnect() {
  const { account, connect } = useWallet();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try { await connect(); } finally { setBusy(false); }
  }

  if (account) {
    return (
      <span className="btn btn-sm btn-ghost font-mono text-xs gap-2" title={account}>
        <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--color-pos)" }} />
        {short(account)}
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="btn btn-sm btn-ember"
    >
      {busy ? "connecting…" : (
        <>
          <span className="sm:hidden">Connect</span>
          <span className="hidden sm:inline">Connect Wallet</span>
        </>
      )}
    </button>
  );
}
