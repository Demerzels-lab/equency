import Link from "next/link";

const EXPLORER = "https://explorer.testnet.chain.robinhood.com";
const X_URL = "https://x.com";

const SECTIONS = [
  {
    num: "01",
    title: "Platform",
    links: [
      { label: "Intelligence", href: "/" },
      { label: "Explore Universe", href: "/explore" },
      { label: "Strategies", href: "/strategies" },
      { label: "Strategy Vault", href: "/vault" },
      { label: "Watchlist", href: "/watchlist" },
    ],
  },
  {
    num: "02",
    title: "Protocol",
    links: [
      { label: "ERC-4626 Vault", href: "/vault" },
      { label: "Block Explorer", href: EXPLORER, external: true },
      { label: "Robinhood Chain", href: "https://docs.robinhood.com/chain", external: true },
      { label: "Foundry Test Suites", href: "/vault#tests" },
    ],
  },
  {
    num: "03",
    title: "Data Sources",
    links: [
      { label: "SEC EDGAR Ingestion", href: "https://www.sec.gov/edgar", external: true },
      { label: "Finnhub Market Stream", href: "https://finnhub.io", external: true },
      { label: "On-Chain State", href: EXPLORER, external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative border-t border-[color:var(--color-line)] bg-[color:var(--color-bg)] py-16 px-6 z-20">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr_1fr] pb-12 border-b border-[color:var(--color-line)]">
          {/* Brand & Manifesto */}
          <div className="space-y-4 max-w-sm">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rotate-45 bg-[color:var(--color-accent)]" />
              <span className="font-sans text-xs font-extrabold tracking-[0.24em] text-[color:var(--color-ink)]">
                EQUENCY
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[color:var(--color-ink-dim)]">
              Continuous research and deterministic intelligence for newly public companies. Verified
              state and non-custodial capital execution on Robinhood Chain.
            </p>
            <div className="font-mono text-[10px] tracking-[0.16em] uppercase text-[color:var(--color-ink-faint)]">
              TESTNET 46630 // ERC-4626 SPEC
            </div>
          </div>

          {/* Editorial Link Columns */}
          {SECTIONS.map((sec) => (
            <div key={sec.title} className="space-y-3">
              <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-[color:var(--color-accent)]">
                {sec.num} / {sec.title}
              </div>
              <ul className="space-y-2">
                {sec.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[color:var(--color-ink-dim)] hover:text-[color:var(--color-ink)] transition-colors duration-150 inline-flex items-center gap-1"
                      >
                        {link.label}
                        <span className="text-[10px] opacity-60">↗</span>
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-xs text-[color:var(--color-ink-dim)] hover:text-[color:var(--color-ink)] transition-colors duration-150"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-[10px] tracking-[0.1em] text-[color:var(--color-ink-faint)] uppercase">
          <div>
            © {new Date().getFullYear()} EQUENCY RESEARCH PROTOCOL. INDEPENDENT ON-CHAIN BUILD.
          </div>
          <div className="flex items-center gap-4">
            <a href={X_URL} target="_blank" rel="noopener noreferrer" className="hover:text-[color:var(--color-ink)]">
              X (TWITTER)
            </a>
            <a href={EXPLORER} target="_blank" rel="noopener noreferrer" className="hover:text-[color:var(--color-ink)]">
              CHAIN EXPLORER
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
