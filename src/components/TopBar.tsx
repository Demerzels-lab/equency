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
      <Link href="/" className="brandmark shrink-0" aria-label="EQUENCY Home">
        <span
          className="inline-block h-3.5 w-3.5 rotate-45 bg-[#0284c7] transition-transform duration-300 hover:rotate-90 rounded-[2px]"
          style={{ boxShadow: "0 2px 8px rgba(2, 132, 199, 0.35)" }}
        />
        <span className="font-mono font-bold tracking-[0.18em] text-slate-900">EQUENCY</span>
      </Link>

      {/* Primary Navigation from Project Brief */}
      <nav aria-label="Primary" className="flex items-center gap-1 sm:gap-1.5">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={n.match(pathname) ? "is-active text-xs sm:text-[13.5px]" : "text-xs sm:text-[13.5px] text-slate-600 hover:text-slate-900"}
          >
            {n.label}
          </Link>
        ))}

        {/* Watchlist Counter */}
        <Link
          href="/watchlist"
          aria-label="Watchlist"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-slate-600 hover:text-slate-900 transition-colors"
          title="Watchlist"
        >
          <span className="text-[#0284c7] text-sm leading-none">★</span>
          {count != null && count > 0 && (
            <span className="font-mono text-xs tabular-nums text-slate-900 font-semibold">
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
          className="hidden md:inline-flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors p-1.5"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* Wallet Connect Button */}
        <NavConnect />
      </nav>
    </header>
  );
}
