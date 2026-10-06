import { SectionMark, Display, AsciiIcon } from "@/components/brand";
import { TiltCard } from "@/components/immersive/TiltCard";
import { CAPABILITIES } from "@/lib/home-content";

function tierColor(tier: string) {
  return tier.startsWith("TIER 1") ? "var(--color-pos)" : tier === "PENDING" ? "var(--color-sim)" : "var(--color-ink-faint)";
}

export function Capabilities() {
  return (
    <section data-section="signals" className="mx-auto max-w-[1400px] px-6 py-24">
      <SectionMark n="03" title="What the Core sees" className="mb-5" />
      <Display as="h2" outline className="text-[clamp(2rem,4.5vw,3.6rem)]">EVIDENCE, TIERED</Display>
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CAPABILITIES.map((c) => (
          <TiltCard key={c.title} className="rounded-sm border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <AsciiIcon art={c.art} />
              <span className="label" style={{ color: tierColor(c.tier) }}>{c.tier}</span>
            </div>
            <div className="mt-4 text-base font-semibold tracking-tight">{c.title}</div>
            <ul className="mt-2 flex flex-col gap-1">
              {c.items.map((it) => (
                <li key={it} className="mono text-[11px] text-muted-foreground">— {it}</li>
              ))}
            </ul>
          </TiltCard>
        ))}
      </div>
    </section>
  );
}
