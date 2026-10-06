"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getWatchlist } from "@/lib/watchlist";
import { NavConnect } from "@/components/NavConnect";
import { cn } from "@/lib/utils";

// TODO: replace with EQUENCY's X (Twitter) profile URL when available.
const X_URL = "https://x.com";

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

        <div className="flex items-center gap-2">
          <Link
            href="/watchlist"
            aria-label="Watchlist"
            className="inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-xs transition-colors hover:border-[color:var(--color-line-strong)]"
          >
            <span style={{ fontSize: 12, color: "var(--color-accent)" }}>★</span>
            {count != null && count > 0 && <span className="mono text-xs">{count}</span>}
          </Link>

          <a
            href={X_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="EQUENCY on X"
            className="inline-flex items-center justify-center rounded-sm border border-border p-2 text-foreground transition-colors hover:border-[color:var(--color-line-strong)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
            </svg>
          </a>

          <NavConnect />
        </div>
      </div>
    </header>
  );
}

function NavItem({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn("rounded-[2px] px-2 py-1 transition-colors")}
      style={{ color: active ? "var(--color-ink)" : "var(--color-ink-dim)", background: active ? "var(--color-panel-2)" : "transparent" }}
    >
      {label}
    </Link>
  );
}
