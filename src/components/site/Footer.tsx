import Link from "next/link";
import { FOOTER } from "@/lib/site";
import { Btn } from "./Btn";
import { Logo } from "./Logo";

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-gradient-to-b from-paper to-paper-2">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 md:px-8 lg:grid-cols-[1fr_auto]">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          {FOOTER.map((col) => (
            <div key={col.title}>
              <h3 className="mb-5 text-lg text-core after:ml-2 after:text-ink-3 after:content-['/']">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {"external" in l && l.external ? (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="text-sm text-ink-2 transition-colors hover:text-ink">
                        {l.label} ↗
                      </a>
                    ) : (
                      <Link href={l.href} className="text-sm text-ink-2 transition-colors hover:text-ink">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-5 lg:items-end">
          <div className="flex gap-3">
            <Btn href="/strategies" accent="strategy" className="w-40">Strategy</Btn>
            <Btn href="/explore" accent="core" className="w-40">Core</Btn>
          </div>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="EQUENCY on X"
            className="grid size-10 place-items-center rounded-sm bg-ink/8 text-ink transition-colors hover:bg-ink hover:text-paper lg:size-8"
          >
            <XIcon />
          </a>
          <p className="max-w-xs font-body text-xs leading-relaxed text-ink-3 lg:text-right">
            Verifiable intelligence and non-custodial capital execution for newly public companies on Robinhood Chain.
          </p>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 border-t border-line px-5 py-6 text-xs text-ink-3 sm:flex-row sm:items-center md:px-8">
        <Logo className="text-ink" />
        <span className="font-body">© {new Date().getFullYear()} EQUENCY Protocol. The AI proposes, you approve.</span>
      </div>
    </footer>
  );
}
