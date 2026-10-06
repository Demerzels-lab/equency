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
      <span className="mono inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-border px-2 py-1.5 text-xs sm:px-2.5" title={account}>
        <span style={{ width: 6, height: 6, borderRadius: 9999, background: "var(--color-pos)" }} />
        {short(account)}
      </span>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="label shrink-0 whitespace-nowrap rounded-sm bg-[color:var(--color-ink)] px-2.5 py-1.5 tracking-[0.1em] text-[color:var(--color-bg)] transition-colors hover:bg-white disabled:opacity-60 sm:px-3 sm:tracking-[0.12em]"
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
