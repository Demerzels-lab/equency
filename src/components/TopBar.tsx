"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getWatchlist } from "@/lib/watchlist";
import { CopyField } from "@/components/CopyField";
import { cn } from "@/lib/cn";

// Canonical USDG (Global Dollar) on Robinhood Chain mainnet · verified on-chain.
const USDG = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";

export function TopBar() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setCount(getWatchlist().length);
    sync();
    window.addEventListener("equency:watchlist", sync);
    return () => window.removeEventListener("equency:watchlist", sync);
  }, []);

  const onIntel = pathname === "/" || pathname.startsWith("/company");
  const onStrategies = pathname.startsWith("/strategies");
  const onVault = pathname.startsWith("/vault");

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{ borderColor: "var(--color-line)", background: "color-mix(in oklab, var(--color-bg) 78%, transparent)" }}
    >
      <div className="flex items-center justify-between gap-4 px-4 py-2.5">
        <div className="flex items-center gap-5">
          <Link href="/" className="flex items-center gap-2">
            <span style={{ width: 9, height: 9, background: "var(--color-accent)", display: "inline-block", transform: "rotate(45deg)" }} />
            <span className="text-sm font-extrabold tracking-[0.22em]">EQUENCY</span>
          </Link>
          <nav className="hidden items-center gap-1 text-xs sm:flex">
            <NavItem href="/" label="Intelligence" active={onIntel} />
            <NavItem href="/strategies" label="Strategies" active={onStrategies} />
            <NavItem href="/vault" label="Vault" active={onVault} />
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <CopyField label="USDG" value={USDG} display="0x5fc5…1d168" className="hidden lg:flex" />
          <div className="hidden items-center gap-1.5 md:flex" title="Built on Robinhood Chain (brief §46)">
            <span style={{ display: "inline-block", width: 5, height: 5, borderRadius: 9999, background: "var(--color-pos)" }} />
            <span className="label normal-case" style={{ letterSpacing: 0 }}>Mainnet · 4663</span>
          </div>
          <Link href="/watchlist" className="label flex items-center gap-1.5 hover:text-[color:var(--color-ink)]">
            <span style={{ fontSize: 11, color: "var(--color-accent)" }}>★</span>
            <span className="hidden sm:inline">Watchlist</span>
            {count != null && count > 0 && <span className="mono" style={{ color: "var(--color-ink)" }}>{count}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}

function NavItem({ href, label, active, soon }: { href?: string; label: string; active?: boolean; soon?: boolean }) {
  const base = "px-2 py-1 rounded-[2px] transition-colors";
  if (soon) {
    return (
      <span className={cn(base, "cursor-not-allowed")} style={{ color: "var(--color-ink-faint)" }} title="Later phase · not built yet">
        {label} <span className="label" style={{ fontSize: 8 }}>soon</span>
      </span>
    );
  }
  return (
    <Link href={href!} className={base} style={{ color: active ? "var(--color-ink)" : "var(--color-ink-dim)", background: active ? "var(--color-panel-2)" : "transparent" }}>
      {label}
    </Link>
  );
}
