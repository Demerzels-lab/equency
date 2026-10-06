import { Display, Button } from "@/components/brand";

/** CTA section. The glowing WebGL Emblem renders behind this via the fixed canvas; a static
 *  CSS diamond shows in the `static` tier. */
export function CtaDiamond() {
  return (
    <section data-section="cta" className="relative overflow-hidden border-t border-border">
      <div className="relative mx-auto flex max-w-[1400px] flex-col items-center px-6 py-32 text-center">
        {/* static diamond (visible when WebGL is off; the canvas emblem sits behind otherwise) */}
        <div aria-hidden className="mb-10 h-28 w-28 rotate-45 border border-[color:var(--color-accent)]" style={{ boxShadow: "0 0 60px -10px color-mix(in oklab, var(--color-accent) 60%, transparent), inset 0 0 40px -12px color-mix(in oklab, var(--color-accent) 50%, transparent)" }} />
        <Display as="h2" className="text-[clamp(2.2rem,6vw,5rem)]">Research the new<br />public market.</Display>
        <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground">
          Intelligence to strategy to capital, with every number traceable to its source.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button href="/company/ADRX" variant="primary" arrow>Open the terminal</Button>
          <Button href="/strategies" variant="ghost" plus>Explore strategies</Button>
        </div>
      </div>
    </section>
  );
}
