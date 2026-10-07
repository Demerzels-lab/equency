"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getWatchlist } from "@/lib/watchlist";
import { NavConnect } from "@/components/NavConnect";

const X_URL = "https://x.com";

const NAV = [
  { href: "/", label: "Intelligence", match: (p: string) => p === "/" || p.startsWith("/company") },
  { href: "/explore", label: "Explore", match: (p: string) => p.startsWith("/explore") || p.startsWith("/compare") },
  { href: "/strategies", label: "Strategies", match: (p: string) => p.startsWith("/strategies") },
  { href: "/vault", label: "Vault", match: (p: string) => p.startsWith("/vault") },
  { href: "/portfolio", label: "Portfolio", match: (p: string) => p.startsWith("/portfolio") },
];

export function TopBar() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const sync = () => setCount(getWatchlist().length);
    sync();
    window.addEventListener("equency:watchlist", sync);
    return () => {
      window.removeEventListener("equency:watchlist", sync);
    };
  }, []);

  return (
    <header className="story-nav" role="banner">
      {/* Brandmark */}
      <Link href="/" className="brandmark" aria-label="EQUENCY Home">
        <span
          className="inline-block h-3 w-3 rotate-45 bg-[color:var(--color-accent)] transition-transform duration-300 hover:rotate-90"
          style={{ boxShadow: "0 0 10px var(--color-accent)" }}
        />
        <span>EQUENCY</span>
      </Link>

      {/* Primary Navigation */}
      <nav aria-label="Primary">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={n.match(pathname) ? "is-active" : undefined}
          >
            {n.label}
          </Link>
        ))}

        {/* Watchlist Counter */}
        <Link
          href="/watchlist"
          aria-label="Watchlist"
          className="inline-flex items-center gap-1.5"
          title="Watchlist"
        >
          <span style={{ color: "var(--color-accent)", fontSize: 13 }}>★</span>
          {count != null && count > 0 && (
            <span className="font-mono text-xs tabular-nums text-foreground">
              {count}
            </span>
          )}
        </Link>

        {/* X (Twitter) Link */}
        <a
          href={X_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="EQUENCY on X"
          className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* Injected Wallet Connect / Open App */}
        <NavConnect />
      </nav>
    </header>
  );
}
