import { Kicker, Display, Button } from "@/components/brand";
import { GlobeUniverse, type UniNode } from "@/components/home/GlobeUniverse";

export function Hero({ universe = [] }: { universe?: UniNode[] }) {
  return (
    <section data-section="hero" className="relative flex min-h-[min(94vh,940px)] items-center justify-center overflow-hidden">
      <GlobeUniverse nodes={universe} />
      {/* foreground orbital ring, passing in front of the headline for depth */}
      <svg aria-hidden className="pointer-events-none absolute left-1/2 top-[48%] z-20 h-[130vmin] w-[130vmin] -translate-x-1/2 -translate-y-1/2 opacity-[0.13]" viewBox="-200 -200 400 400" fill="none">
        <ellipse cx="0" cy="0" rx="192" ry="50" stroke="var(--color-accent)" strokeWidth="0.5" transform="rotate(-16)" />
        <ellipse cx="0" cy="0" rx="178" ry="42" stroke="var(--color-accent-2)" strokeWidth="0.5" transform="rotate(22)" />
      </svg>
      <div className="relative z-10 mx-auto w-full max-w-3xl px-6 text-center">
        <div className="flex justify-center">
          <Kicker>Intelligence · Strategy · Capital</Kicker>
        </div>
        <Display className="mx-auto mt-7 text-[clamp(2.6rem,7.5vw,5.75rem)]">
          <span style={{ color: "var(--color-accent-2)" }}>Intelligence</span>{" "}
          <span className="text-foreground">for the newly public.</span>
        </Display>
        <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted-foreground">
          Every newly public company gets an Intelligence Core that continuously researches its
          market, business and signals, grounded in SEC Tier-1 evidence. Every number is tagged live
          or simulated.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Button href="/strategies" variant="primary" arrow>Open the terminal</Button>
          <Button href="/vault" variant="indigo">Strategy Vault</Button>
        </div>
      </div>

      {/* bottom scrim · smooth the hand-off into the next section */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 z-5 h-40 bg-linear-to-b from-transparent to-bg" />
    </section>
  );
}
