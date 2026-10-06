import Link from "next/link";
import { Display } from "@/components/brand";
import { Dot } from "@/components/primitives";

const EXPLORER = "https://explorer.testnet.chain.robinhood.com";
const X_URL = "https://x.com"; // TODO: EQUENCY's X profile when available

type FLink = { label: string; href: string; external?: boolean };

const COLUMNS: { title: string; links: FLink[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "Intelligence", href: "/" },
      { label: "Strategies", href: "/strategies" },
      { label: "Vault", href: "/vault" },
      { label: "Watchlist", href: "/watchlist" },
    ],
  },
  {
    title: "Protocol",
    links: [
      { label: "Strategy Vault · ERC-4626", href: "/vault" },
      { label: "Block explorer", href: EXPLORER, external: true },
      { label: "Robinhood Chain", href: "https://docs.robinhood.com/chain", external: true },
    ],
  },
  {
    title: "Sources",
    links: [
      { label: "SEC EDGAR", href: "https://www.sec.gov/edgar", external: true },
      { label: "Finnhub · market + news", href: "https://finnhub.io", external: true },
      { label: "On-chain state · live", href: EXPLORER, external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-16 border-t border-border bg-[var(--color-panel)]">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        aria-hidden
        style={{ background: "radial-gradient(60% 100% at 50% 0%, color-mix(in oklab, var(--color-accent-2) 12%, transparent), transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-[1400px] px-6 py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div className="max-w-xs">
            <div className="flex items-center gap-2.5">
              <span className="block h-3 w-3 rotate-45 bg-[var(--color-accent)]" />
              <Display as="div" className="text-2xl leading-none">EQUENCY</Display>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Intelligence for the newly public. A continuous research core, deterministic strategy
              engine, and a non-custodial vault on Robinhood Chain.
            </p>
            <div className="mono mt-5 flex items-center gap-2 text-[11px] text-muted-foreground">
              Intelligence <span className="text-[var(--color-accent)]">→</span> Strategy{" "}
              <span className="text-[var(--color-accent)]">→</span> Capital
            </div>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <div className="label mb-4">{col.title}</div>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <FooterLink {...l} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Chain status */}
        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6">
          <span className="mono inline-flex items-center gap-2 text-[11px] text-muted-foreground">
            <Dot color="var(--color-pos)" pulse /> Testnet 46630 · live on-chain
          </span>
          <span className="mono inline-flex items-center gap-2 text-[11px] text-muted-foreground">
            <Dot color="var(--color-ink-faint)" /> Mainnet 4663 · not deployed
          </span>
        </div>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Every panel is labelled live or simulated. No fabricated metrics, ever.
          </p>
          <div className="flex items-center gap-4">
            <a
              href={X_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="EQUENCY on X"
              className="inline-flex items-center justify-center rounded-sm border border-border p-2 text-foreground transition-colors hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
              </svg>
            </a>
            <span className="mono text-[11px] text-muted-foreground">© 2026 EQUENCY</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ label, href, external }: FLink) {
  const cls = "group inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground";
  const arrow = external ? (
    <span aria-hidden className="text-[var(--color-ink-faint)] transition-colors group-hover:text-[var(--color-accent)]">↗</span>
  ) : null;
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>{label}{arrow}</a>
  ) : (
    <Link href={href} className={cls}>{label}</Link>
  );
}
