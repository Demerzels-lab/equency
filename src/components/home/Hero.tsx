import { Kicker, Display, Button } from "@/components/brand";

export function Hero() {
  return (
    <section data-section="hero" className="relative flex min-h-[min(94vh,940px)] items-center justify-center">
      <div className="mx-auto w-full max-w-3xl px-6 text-center">
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
    </section>
  );
}
