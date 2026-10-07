import { Display } from "@/components/brand";
import { Reveal } from "@/components/immersive/Reveal";

const EXPLORER = "https://explorer.testnet.chain.robinhood.com";

const FACTS = ["Chain 4663", "USDG settlement", "ETH gas", "Testnet 46630 · live", "ERC-4626 vault"];

export function BuiltOn() {
  return (
    <section className="relative overflow-hidden border-y border-border py-20">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-25" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{ background: "radial-gradient(50% 60% at 50% 100%, color-mix(in oklab, var(--color-accent-2) 10%, transparent), transparent 70%)" }}
      />
      <Reveal className="relative mx-auto max-w-3xl px-6 text-center">
        <div className="label text-[color:var(--color-accent-2)]">Robinhood Chain native</div>
        <Display as="h2" className="mt-3 text-[clamp(1.9rem,4.5vw,3.4rem)]">Built on Robinhood Chain.</Display>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Settlement in USDG, gas in ETH, and only verified assets — limits enforced on-chain, never
          by the frontend. EQUENCY is an independent project, not affiliated with or endorsed by Robinhood.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {FACTS.map((f) => (
            <span key={f} className="mono rounded-sm border border-border bg-card/50 px-2.5 py-1 text-xs text-muted-foreground">{f}</span>
          ))}
        </div>
        <a
          href={EXPLORER}
          target="_blank"
          rel="noreferrer"
          className="mt-7 inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-accent)] transition-opacity hover:opacity-80"
        >
          View on the block explorer <span aria-hidden>↗</span>
        </a>
      </Reveal>
    </section>
  );
}
