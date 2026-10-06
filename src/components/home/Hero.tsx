import { Kicker, Display, Button, Stat, SectionMark } from "@/components/brand";

export function Hero({ counts }: { counts: { week: number; d30: number; d90: number } }) {
  return (
    <section data-section="hero" className="relative flex min-h-[min(92vh,920px)] flex-col justify-center">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-20">
        <Kicker>A living intelligence terminal</Kicker>
        <Display className="mt-6 max-w-[11ch] text-[clamp(2.75rem,8.5vw,7.5rem)]">
          Intelligence for the newly public.
        </Display>
        <p className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground">
          Every newly public company gets an Intelligence Core that continuously researches its
          market, business and signals, grounded in SEC Tier-1 evidence. Every number is tagged live
          or simulated.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Button href="/company/ADRX" variant="primary" arrow>Open the terminal</Button>
          <Button href="/strategies" variant="ghost" plus>Explore strategies</Button>
        </div>
      </div>

      {/* hero footer bar */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-8">
            <Kicker>Scroll to travel</Kicker>
            <div className="hidden items-center gap-6 sm:flex">
              <Stat label="This week" value={counts.week} />
              <Sep /><Stat label="30 days" value={counts.d30} />
              <Sep /><Stat label="90 days" value={counts.d90} />
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-5">
            <SectionMark n="00" title="Terminal" />
            <SectionMark n="01" title="Live" />
            <SectionMark n="02" title="Loop" />
            <SectionMark n="03" title="Signals" />
            <SectionMark n="04" title="Universe" />
          </nav>
        </div>
      </div>
    </section>
  );
}

function Sep() {
  return <span className="h-7 w-px bg-border" />;
}
