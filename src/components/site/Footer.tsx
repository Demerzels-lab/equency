import Link from "next/link";
import { FOOTER, X_HANDLE, X_URL } from "@/lib/site";
import { Btn } from "./Btn";
import { Logo } from "./Logo";
import { XIcon } from "./XIcon";

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
            <Btn href="/explore" accent="core" className="w-40">Explore Cores</Btn>
            <Btn href="/strategies" accent="strategy" className="w-40">Strategies</Btn>
          </div>
          <a
            href={X_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`EQUENCY on X (${X_HANDLE})`}
            className="group inline-flex items-center gap-2.5 text-sm text-ink-2 transition-colors hover:text-ink"
          >
            <span className="grid size-10 place-items-center rounded-sm bg-ink/8 text-ink transition-colors group-hover:bg-ink group-hover:text-paper lg:size-8">
              <XIcon />
            </span>
            Follow {X_HANDLE}
          </a>
          <div className="max-w-xs lg:text-right">
            <p className="text-base text-ink">Intelligence for the newly public.</p>
            <p className="mt-1 font-body text-xs leading-relaxed text-ink-3">
              Every newly public company gets an Intelligence Core. Intelligence → Strategy → Capital, on Robinhood Chain.
            </p>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 border-t border-line px-5 py-6 text-xs text-ink-3 sm:flex-row sm:items-center md:px-8">
        <Logo className="text-ink" />
        <span className="font-body">© {new Date().getFullYear()} EQUENCY. Research and strategy tooling, not financial advice. You approve every move.</span>
      </div>
    </footer>
  );
}
