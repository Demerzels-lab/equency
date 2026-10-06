import { SectionMark, Display, AsciiIcon } from "@/components/brand";
import { LOOP } from "@/lib/home-content";

export function LoopSection() {
  return (
    <section data-section="loop" className="border-y border-border bg-card/40">
      <div className="mx-auto max-w-[1400px] px-6 py-24">
        <SectionMark n="02" title="A loop that never stops" className="mb-5" />
        <Display as="h2" className="max-w-2xl text-[clamp(1.8rem,4vw,3.2rem)]">
          The Intelligence Core runs a loop, not a one-shot report.
        </Display>
        <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-sm sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--color-line)" }}>
          {LOOP.map((s) => (
            <div key={s.n} className="bg-background/80 p-5 backdrop-blur-sm transition-colors hover:bg-background">
              <div className="flex items-start justify-between">
                <AsciiIcon art={s.art} />
                <span className="mono text-xs text-muted-foreground">{s.n}</span>
              </div>
              <div className="mt-4 text-base font-semibold tracking-tight">{s.title}</div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
