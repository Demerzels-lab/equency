"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getWatchlist } from "@/lib/watchlist";
import { NavConnect } from "@/components/NavConnect";

// TODO: replace with EQUENCY's X (Twitter) profile URL when available.
const X_URL = "https://x.com";

const NAV = [
  { href: "/", label: "Intelligence", match: (p: string) => p === "/" || p.startsWith("/company") },
  { href: "/strategies", label: "Strategies", match: (p: string) => p.startsWith("/strategies") },
  { href: "/vault", label: "Vault", match: (p: string) => p.startsWith("/vault") },
];

export function TopBar() {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const sync = () => setCount(getWatchlist().length);
    sync();
    window.addEventListener("equency:watchlist", sync);
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("equency:watchlist", sync);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur transition-colors"
      style={{
        borderColor: scrolled ? "var(--color-line-strong)" : "var(--color-line)",
        background: `color-mix(in oklab, var(--color-bg) ${scrolled ? 88 : 72}%, transparent)`,
      }}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-4">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="EQUENCY home">
            <span style={{ width: 9, height: 9, background: "var(--color-accent)", display: "inline-block", transform: "rotate(45deg)" }} />
            <span className="text-sm font-extrabold tracking-[0.18em] sm:tracking-[0.22em]">EQUENCY</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV.map((n) => <NavItem key={n.href} href={n.href} label={n.label} active={n.match(pathname)} />)}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("equency:open-cmdk"))}
            aria-label="Search (Command-K)"
            className="mono hidden items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[color:var(--color-line-strong)] hover:text-foreground sm:inline-flex"
          >
            <span>⌕</span>
            <kbd className="rounded-[3px] border border-border px-1 text-[10px]">⌘K</kbd>
          </button>
          <Link
            href="/watchlist"
            aria-label="Watchlist"
            className="group inline-flex items-center gap-1.5 rounded-sm border border-border px-2.5 py-1.5 text-xs transition-colors hover:border-[color:var(--color-line-strong)]"
          >
            <span className="transition-transform group-hover:scale-110" style={{ fontSize: 12, color: "var(--color-accent)" }}>★</span>
            {count != null && count > 0 && <span className="mono text-xs tabular-nums">{count}</span>}
          </Link>

          <a
            href={X_URL}
            target="_blank"
            rel="noreferrer"
            aria-label="EQUENCY on X"
            className="inline-flex items-center justify-center rounded-sm border border-border p-2 text-foreground transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
            </svg>
          </a>

          <span aria-hidden className="mx-1 hidden h-5 w-px bg-border sm:block" />

          <NavConnect />
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="flex items-center gap-1 border-t border-border px-3 py-1.5 sm:hidden">
        {NAV.map((n) => <NavItem key={n.href} href={n.href} label={n.label} active={n.match(pathname)} />)}
      </nav>
    </header>
  );
}

function NavItem({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      data-active={active}
      className="group relative px-2.5 py-1.5 text-xs text-[color:var(--color-ink-dim)] transition-colors hover:text-[color:var(--color-ink)] data-[active=true]:text-[color:var(--color-ink)]"
    >
      {label}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2.5 bottom-0 h-px origin-left scale-x-0 transition-transform duration-200 ease-out group-hover:scale-x-100 group-data-[active=true]:scale-x-100"
        style={{ background: "var(--color-accent)" }}
      />
    </Link>
  );
}
