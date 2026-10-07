import Link from "next/link";
import { Display } from "@/components/brand";
import { Reveal } from "@/components/immersive/Reveal";

const STEPS = [
  { n: "01", t: "Observe", d: "New SEC filings, price, volume and ownership · detected the moment they land on EDGAR." },
  { n: "02", t: "Score", d: "Deterministic dimensions computed from that evidence. Reproducible. The model never touches the number." },
  { n: "03", t: "Narrate", d: "The engine explains the score in plain language · every claim traced back to a source." },
];

export function Loop() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <Reveal>
        <Display as="h2" className="max-w-[18ch] text-[clamp(1.7rem,3.6vw,2.6rem)]">One loop, always on.</Display>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Not a one-shot report · a cycle that re-runs on every new filing and market move.
        </p>
      </Reveal>
      <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 80} className="border-t border-border pt-5">
            <div className="mono text-sm text-[color:var(--color-accent)]">{s.n}</div>
            <div className="mt-3 text-lg font-semibold tracking-tight">{s.t}</div>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.d}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function StrategiesBlock() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <Reveal className="max-w-2xl">
        <Display as="h2" className="text-[clamp(1.7rem,3.6vw,2.6rem)]">Rank the universe by fit.</Display>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Three deterministic strategies · Growth, Momentum, Defensive · rank every newly-public company
          over its Intelligence Core. You pick the strategy and set the constraints; the model only
          narrates the why.
        </p>
        <Link href="/strategies" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-accent)] transition-opacity hover:opacity-80">
          Choose a strategy →
        </Link>
      </Reveal>
    </section>
  );
}

const VAULT_FACTS = [
  "Non-custodial on Robinhood Chain",
  "Limits enforced on-chain · never by the frontend",
  "ERC-4626 vault · 14/14 Foundry tests, incl. a real-USDG fork",
  "Ships paused and capped until external review",
  "Testnet 46630 · live on-chain",
];

export function VaultBlock() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <Reveal className="max-w-2xl">
        <Display as="h2" className="text-[clamp(1.7rem,3.6vw,2.6rem)]">Where intelligence becomes capital.</Display>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          A non-custodial Strategy Vault that holds USDG and buys verified assets within limits the
          contract enforces · the AI never signs a transaction.
        </p>
        <ul className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
          {VAULT_FACTS.map((f) => (
            <li key={f} className="flex gap-2.5">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[color:var(--color-accent-2)]" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <Link href="/vault" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-accent-2)] transition-opacity hover:opacity-80">
          Open the Vault →
        </Link>
      </Reveal>
    </section>
  );
}

export function HonestyBlock() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <Reveal className="max-w-3xl">
        <Display as="h2" className="text-[clamp(1.7rem,3.6vw,2.6rem)]">Every number is live or simulated.</Display>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          The model narrates; it never sets the score. Nothing here is fabricated · when a signal isn&apos;t
          available it shows as unavailable, not invented.
        </p>
        <Link href="/#faq" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-accent)] transition-opacity hover:opacity-80">
          How scoring works →
        </Link>
      </Reveal>
    </section>
  );
}
