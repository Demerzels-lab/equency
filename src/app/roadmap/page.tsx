import type { Metadata } from "next";
import { Btn } from "@/components/site/Btn";
import { Reveal, SectionTitle } from "@/components/site/motion";
import { ExpansionMap, LifecycleRail, NetworkTree, PhaseNode } from "@/components/roadmap/RoadmapVisuals";
import { IDEA, NETWORK, PHASES, ROADMAP_HERO, TODAY_FLOW } from "@/lib/roadmap";

export const metadata: Metadata = {
  title: "Roadmap · EQUENCY",
  description: "Every new market gets a Mind. EQUENCY is expanding the Intelligence Core to new markets as they emerge.",
};

export default function RoadmapPage() {
  return (
    <main className="page-main">
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl px-5 pb-10 pt-32 md:px-8 md:pt-40">
        <Reveal className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <div className="section-label">{ROADMAP_HERO.eyebrow}</div>
          <h1 className="mt-6 text-balance text-[44px] font-light leading-[1.02] tracking-tight sm:text-6xl md:text-7xl">
            Every new market <span className="editorial-accent">gets a Mind.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-lg text-ink md:text-xl">{ROADMAP_HERO.sub}</p>
          <p className="mt-4 max-w-2xl text-balance font-body text-sm leading-relaxed text-ink-3 md:text-base">{ROADMAP_HERO.support}</p>
        </Reveal>
        <div className="mx-auto mt-12 max-w-5xl">
          <ExpansionMap />
        </div>
      </section>

      {/* ── TODAY → ROADMAP · evolution, not a pivot ─────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <Reveal className="rounded-xl border border-line bg-card/60 p-8">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-mint">
              <span className="size-1.5 animate-pulse rounded-full bg-mint" /> Today · live
            </div>
            <h2 className="mt-4 text-2xl font-light text-ink md:text-3xl">EQUENCY begins with the newly public market.</h2>
            <ol className="mt-6 space-y-2.5 font-mono text-xs uppercase tracking-[0.16em]">
              {TODAY_FLOW.map((s, i) => (
                <li key={s} className="flex items-center gap-3">
                  <span className={i === 0 ? "text-mint" : i >= 4 ? "text-strategy" : "text-core"}>{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-ink-2">{s}</span>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.1} className="rounded-xl border border-dashed border-line-2 p-8">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Roadmap · not live yet</div>
            <h2 className="mt-4 text-2xl font-light text-ink md:text-3xl">From there, the Intelligence Core expands.</h2>
            <p className="mt-3 font-body text-sm leading-relaxed text-ink-3">
              To other markets where new assets need context, memory, and continuous intelligence.
            </p>
            <ol className="mt-6 space-y-2.5 font-mono text-xs uppercase tracking-[0.16em]">
              {PHASES.map((p) => (
                <li key={p.n} className="flex items-center gap-3">
                  <span className={p.accent === "core" ? "text-core" : "text-strategy"}>{p.n}</span>
                  <span className="text-ink-2">{p.market}</span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <div className="hr-fade mx-auto max-w-7xl" />

      {/* ── THE IDEA ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-5 py-24 text-center md:px-8">
        <Reveal>
          <h2 className="text-balance text-4xl font-light leading-tight tracking-tight md:text-6xl">
            {IDEA.headline[0]} <span className="editorial-accent">{IDEA.headline[1]}</span>
          </h2>
        </Reveal>
        <Reveal delay={0.08} className="mx-auto mt-8 max-w-2xl space-y-4 font-body leading-relaxed text-ink-2">
          {IDEA.copy.map((c) => (
            <p key={c}>{c}</p>
          ))}
        </Reveal>
        <Reveal delay={0.16} className="mt-10 flex flex-col items-center gap-1 font-wide text-xs uppercase tracking-[0.24em] text-ink-3 md:text-sm">
          {IDEA.coda.map((c, i) => (
            <span key={c} className={i === IDEA.coda.length - 1 ? "text-ink" : undefined}>{c}</span>
          ))}
        </Reveal>
      </section>

      {/* ── CORE LIFECYCLE ───────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <Reveal><SectionTitle>Core Lifecycle</SectionTitle></Reveal>
        <Reveal delay={0.05}>
          <p className="mx-auto mt-5 max-w-xl text-balance text-center font-body text-ink-2">
            Every Core follows the same life, whatever market it is born into.
          </p>
        </Reveal>
        <div className="mt-14">
          <LifecycleRail />
        </div>
      </section>

      <div className="hr-fade mx-auto max-w-7xl" />

      {/* ── PHASES · nodes on the network spine ──────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24 md:px-8">
        <Reveal><SectionTitle>Where the Core goes next</SectionTitle></Reveal>
        <Reveal delay={0.05}>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-center font-body text-ink-2">
            Four markets, each a new node in the Intelligence Network. These are roadmap targets, not live products,
            and they describe where the network expands, not dates.
          </p>
        </Reveal>
        <div className="mt-16 space-y-16">
          {PHASES.map((p, i) => (
            <PhaseNode key={p.n} phase={p} last={i === PHASES.length - 1} />
          ))}
        </div>
      </section>

      <div className="hr-fade mx-auto max-w-7xl" />

      {/* ── THE NETWORK ──────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-24 md:px-8">
        <Reveal className="text-center">
          <h2 className="text-balance text-4xl font-light tracking-tight md:text-5xl">
            One framework. <span className="editorial-accent">Many markets.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-balance font-body leading-relaxed text-ink-2">
            {NETWORK.copy} <span className="text-ink">{NETWORK.emphasis}</span>
          </p>
        </Reveal>
        <div className="mx-auto mt-14 max-w-4xl">
          <NetworkTree />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="relative isolate mx-auto max-w-4xl px-5 pb-32 pt-10 text-center md:px-8">
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[min(640px,100vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-core)_16%,transparent),transparent)]" />
        <Reveal>
          <h2 className="text-balance text-4xl font-light tracking-tight md:text-5xl">The network is just getting started.</h2>
          <p className="mx-auto mt-5 max-w-xl text-balance font-body text-ink-2">
            New markets create new assets. New assets create new intelligence opportunities.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Btn href="/explore" accent="core" variant="solid" className="min-w-56">Explore Intelligence Cores →</Btn>
            <Btn href="/#freshly-public" accent="ink" className="min-w-56">Explore the Newly Public →</Btn>
          </div>
          <p className="mt-10 font-wide text-[11px] uppercase tracking-[0.24em] text-ink-3">
            An intelligence network for the markets of tomorrow.
          </p>
        </Reveal>
      </section>
    </main>
  );
}
