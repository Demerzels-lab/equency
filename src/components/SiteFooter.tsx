import Link from "next/link";

const EXPLORER = "https://explorer.testnet.chain.robinhood.com";
const X_URL = "https://x.com";

const SECTIONS = [
  {
    num: "01",
    title: "Solutions",
    links: [
      { label: "EquencyObserve", href: "/explore" },
      { label: "EquencyScore", href: "/strategies" },
      { label: "EquencyVault", href: "/vault" },
      { label: "EquencyAlpha", href: "/#build" },
    ],
  },
  {
    num: "02",
    title: "Protocol",
    links: [
      { label: "ERC-4626 Vault", href: "/vault" },
      { label: "Block Explorer", href: EXPLORER, external: true },
      { label: "Robinhood Chain", href: "https://docs.robinhood.com/chain", external: true },
      { label: "Foundry Test Suite", href: "/vault#tests" },
    ],
  },
  {
    num: "03",
    title: "Data Sources",
    links: [
      { label: "SEC EDGAR Stream", href: "https://www.sec.gov/edgar", external: true },
      { label: "Finnhub Market Data", href: "https://finnhub.io", external: true },
      { label: "On-Chain State", href: EXPLORER, external: true },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="footer-main">
      <div className="max-w-[1500px] mx-auto">
        <div className="footer-inner">
          {/* Monumental Logo Wordmark on Left */}
          <div className="space-y-6 max-w-lg">
            <div className="footer-logo-text">
              EQUENCY
            </div>
            <p className="font-mono text-xs text-slate-400 leading-relaxed max-w-md">
              Verifiable intelligence and non-custodial capital execution for newly public companies on Robinhood Chain (#46630).
            </p>
            <div className="font-mono text-[11px] text-[#38bdf8] uppercase tracking-wider">
              ● PROVEN BY DETERMINISTIC CONSENSUS
            </div>
          </div>

          {/* Directory Link Groups on Right */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 font-mono text-xs">
            {SECTIONS.map((sec) => (
              <div key={sec.title} className="space-y-4">
                <div className="text-[11px] text-[#38bdf8] uppercase tracking-widest font-bold">
                  {sec.num} // {sec.title}
                </div>
                <ul className="space-y-2.5">
                  {sec.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="eigen-link text-slate-400 hover:text-white transition-colors"
                        >
                          {link.label}
                        </a>
                      ) : (
                        <Link
                          href={link.href}
                          className="eigen-link text-slate-400 hover:text-white transition-colors"
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
        </div>

        {/* Bottom Bar */}
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
          <div>
            © {new Date().getFullYear()} EQUENCY PROTOCOL. BUILT FOR THE AGENTIC ERA.
          </div>
          <div className="flex items-center gap-6">
            <a href={X_URL} target="_blank" rel="noopener noreferrer" className="eigen-link text-slate-400 hover:text-white">
              X (TWITTER)
            </a>
            <a href={EXPLORER} target="_blank" rel="noopener noreferrer" className="eigen-link text-slate-400 hover:text-white">
              EXPLORER
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
