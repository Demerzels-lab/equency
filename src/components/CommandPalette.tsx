"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Entry = { label: string; sub: string; href: string; kind: "nav" | "strategy" | "company" };

const STATIC: Entry[] = [
  { label: "Intelligence", sub: "newly-public universe", href: "/", kind: "nav" },
  { label: "Strategies", sub: "rank by deterministic fit", href: "/strategies", kind: "nav" },
  { label: "Strategy Vault", sub: "capital on Robinhood Chain", href: "/vault", kind: "nav" },
  { label: "Watchlist", sub: "companies you follow", href: "/watchlist", kind: "nav" },
  { label: "Growth", sub: "strategy · medium / high", href: "/strategies/growth", kind: "strategy" },
  { label: "Momentum", sub: "strategy · high", href: "/strategies/momentum", kind: "strategy" },
  { label: "Defensive", sub: "strategy · low / medium", href: "/strategies/defensive", kind: "strategy" },
];

const KIND_LABEL: Record<Entry["kind"], string> = { nav: "Go", strategy: "Strategy", company: "Company" };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [companies, setCompanies] = useState<Entry[]>([]);
  const loaded = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (loaded.current) return;
    loaded.current = true;
    try {
      const r = await fetch("/api/universe");
      const { universe } = (await r.json()) as { universe: { ticker: string; name: string }[] };
      setCompanies(universe.map((c) => ({ label: c.ticker, sub: c.name, href: `/company/${c.ticker}`, kind: "company" as const })));
    } catch { /* ignore */ }
  }, []);

  // ⌘K / Ctrl-K toggles; a navbar button can also open via this event.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
      if (e.key === "Escape") setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("equency:open-cmdk", onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("equency:open-cmdk", onOpen); };
  }, []);

  useEffect(() => {
    if (open) { load(); setQ(""); setActive(0); setTimeout(() => inputRef.current?.focus(), 20); }
  }, [open, load]);

  const results = useMemo(() => {
    const all = [...STATIC, ...companies];
    const s = q.trim().toLowerCase();
    if (!s) return all.slice(0, 10);
    return all.filter((e) => e.label.toLowerCase().includes(s) || e.sub.toLowerCase().includes(s)).slice(0, 12);
  }, [q, companies]);

  const go = useCallback((e?: Entry) => {
    const target = e ?? results[active];
    if (!target) return;
    setOpen(false);
    router.push(target.href);
  }, [results, active, router]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[14vh]" role="dialog" aria-label="Command palette">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg border border-[color:var(--color-line-strong)] bg-[color:var(--color-panel)] shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="text-[color:var(--color-accent)]">⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
              else if (e.key === "Enter") { e.preventDefault(); go(); }
            }}
            placeholder="Search companies, strategies, pages…"
            className="mono w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="label rounded-sm border border-border px-1.5 py-0.5">ESC</kbd>
        </div>
        <ul className="max-h-[52vh] overflow-y-auto py-1">
          {results.length === 0 && <li className="px-4 py-6 text-center text-xs text-muted-foreground">No matches.</li>}
          {results.map((e, i) => (
            <li key={e.href + e.label}>
              <button
                onMouseEnter={() => setActive(i)}
                onClick={() => go(e)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors"
                style={{ background: i === active ? "var(--color-panel-2)" : "transparent" }}
              >
                <span className="mono text-sm" style={{ color: e.kind === "company" ? "var(--color-accent)" : e.kind === "strategy" ? "var(--color-accent-2)" : "var(--color-ink)" }}>{e.label}</span>
                <span className="flex-1 truncate text-xs text-muted-foreground">{e.sub}</span>
                <span className="label">{KIND_LABEL[e.kind]}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
          <span className="mono">↑↓ navigate · ↵ open</span>
          <span className="mono">real SEC universe</span>
        </div>
      </div>
    </div>
  );
}
