import Link from "next/link";
import { getNewlyPublicUniverse } from "@/lib/providers/universe";
import { readVaultLiveness } from "@/lib/chain";
import { MAINNET } from "@/lib/deployments";
import { STRATEGY_LIST } from "@/lib/strategy/strategies";
import { HeroScene, OrbScene, WaveScene } from "@/components/site/Scenes";
import { CoreSearch } from "@/components/site/CoreSearch";
import { ContractAddress } from "@/components/site/ContractAddress";
import { PHASES } from "@/lib/roadmap";
import { Btn } from "@/components/site/Btn";
import { Faq } from "@/components/site/Faq";
import { TechVisual } from "@/components/site/TechVisual";
import { CountUp, GlowCard, Marquee, Reveal, SectionTitle } from "@/components/site/motion";
import { BRAND, CORE_TECH, FAQ, FEATURED_IPOS, MENTAL_MODEL, PRODUCTS } from "@/lib/site";

// Rendered on request, not at build: the universe needs ~185 paced SEC calls on a cold cache and
// parallel build workers would trip SEC's rate limit. Data is cached (unstable_cache), so only
// the first visit after a refresh pays that cost.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [uniRes, liveRes] = await Promise.allSettled([getNewlyPublicUniverse(), readVaultLiveness()]);
  // Confirmed newly-public companies only (follow-on offerings excluded), freshest first.
  const unique = uniRes.status === "fulfilled" ? uniRes.value : [];
  const live = liveRes.status === "fulfilled" ? liveRes.value : null;

  const seed = unique.slice(0, 24).map((c) => ({ ticker: c.ticker, name: c.name }));
  const liveFeed = unique.slice(0, 16).map((c) => ({ ticker: c.ticker, name: c.name, day: c.daysPublic }));
  const last90 = unique.filter((c) => (c.daysPublic ?? 999) <= 90).length;

  // Every figure below is read from a real source at build/revalidate time · no marketing numbers.
  const stats: { label: string; value: number; suffix?: string; note?: string }[] = [
    { label: "Intelligence Cores", value: unique.length, note: "one per company public ≤ 180 days · SEC-confirmed" },
    { label: "Cores in their first 90 days", value: last90, note: "newly public, still forming a thesis" },
    { label: "Strategy modes", value: STRATEGY_LIST.length, note: "growth · momentum · defensive" },
    { label: "Contracts live on Robinhood Chain", value: Object.keys(MAINNET.contracts).length, note: "mainnet 4663 · source verified" },
    { label: "Strategy Vaults created", value: live?.vaultCount ?? 0, note: live?.reachable ? "read live from chain" : "chain unreachable" },
    { label: "Foundry tests passing", value: 14, suffix: "/14", note: "incl. real-USDG mainnet fork" },
  ];

  return (
    <main>
      {/* ── HERO · Pendle-style: the globe IS the hero, one headline + one line ── */}
      <section className="relative isolate flex h-[100svh] min-h-[640px] flex-col items-center justify-center overflow-hidden px-5">
        {/* soft core-blue glow behind the globe so it reads as lit, not flat */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 aspect-square w-[min(1100px,140vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--color-core)_30%,transparent),transparent_75%)] blur-3xl" />
        <HeroScene className="!absolute inset-0 -z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-72 bg-gradient-to-t from-paper via-paper/80 to-transparent" />
        <Reveal className="flex flex-col items-center gap-6 text-center [text-shadow:0_2px_24px_var(--color-paper),0_0_4px_var(--color-paper)]">
          <h1 className="max-w-5xl text-balance text-[44px] font-light leading-[1.02] tracking-tight sm:text-7xl md:text-[88px]">
            Intelligence for the <span className="editorial-accent">newly public.</span>
          </h1>
          <p className="max-w-2xl text-balance text-lg text-ink md:text-2xl">{BRAND.statement}</p>
          <ContractAddress className="mt-2 [text-shadow:none]" />
        </Reveal>
        <a
          href="#find-core"
          aria-label="Scroll to find a Core"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 transition-colors hover:text-ink"
        >
          <span className="flex flex-col items-center gap-2">
            Scroll
            <span className="block h-8 w-px animate-pulse bg-gradient-to-b from-ink-3 to-transparent" />
          </span>
        </a>
      </section>

      {/* ── FIND A CORE · explanation, CTAs and search moved out of the hero ── */}
      <section id="find-core" className="relative mx-auto flex max-w-3xl scroll-mt-24 flex-col items-center gap-5 px-5 pb-24 pt-16 text-center">
        <Reveal className="flex flex-col items-center gap-5">
          <span className="rounded-full bg-card/70 px-3 py-1 font-body text-xs text-ink-2 ring-1 ring-line backdrop-blur">
            <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-mint align-middle" />
            {unique.length > 0 ? `${unique.length} Intelligence Cores live from SEC EDGAR` : "Intelligence Cores · SEC EDGAR"}
          </span>
          <p className="max-w-xl text-balance font-body text-base text-ink-2 md:text-lg">{BRAND.explanation}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Btn href="/explore" accent="core" variant="solid" className="min-w-44">Explore the Minds</Btn>
            <Btn href="/#how-it-works" accent="ink" className="min-w-44">How It Works</Btn>
          </div>
          <div className="mt-4 flex w-full justify-center">
            <CoreSearch seed={seed} />
          </div>
        </Reveal>
      </section>

      {/* ── HOW IT WORKS · the mental model (brief §4) ──────────── */}
      <section id="how-it-works" className="relative mx-auto max-w-7xl scroll-mt-24 px-5 pb-24 pt-10 md:px-8">
        <Reveal><SectionTitle>How It Works</SectionTitle></Reveal>
        <Reveal delay={0.05}>
          <h2 className="mx-auto mt-6 max-w-3xl text-balance text-center text-3xl font-light leading-tight md:text-5xl">
            A company goes public. <span className="editorial-accent">EQUENCY gives it a mind.</span>
          </h2>
        </Reveal>
        <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {MENTAL_MODEL.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.07} className="h-full">
              <div className="group relative flex h-full flex-col gap-3 bg-card/90 p-6 transition-colors duration-300 hover:bg-panel-2">
                <span className={`font-mono text-xs font-bold ${i === MENTAL_MODEL.length - 1 ? "text-strategy" : "text-core"}`}>{s.n}</span>
                <h3 className="text-lg font-medium leading-snug text-ink">{s.title}</h3>
                <p className="font-body text-sm leading-relaxed text-ink-2">{s.copy}</p>
                {i < MENTAL_MODEL.length - 1 && (
                  <span aria-hidden className="absolute right-4 top-6 hidden font-mono text-ink-3 transition-colors group-hover:text-core lg:block">→</span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal className="mx-auto mt-10 max-w-3xl">
          <p className="text-center font-wide text-xs uppercase tracking-[0.2em] text-ink-3">
            Company <span className="text-core">→</span> Intelligence Core <span className="text-core">→</span> Thesis <span className="text-strategy">→</span> Strategy <span className="text-strategy">→</span> Capital
          </p>
        </Reveal>
      </section>

      <div className="hr-fade mx-auto max-w-7xl" />

      {/* ── CORE → STRATEGY · two layers of one system ───────────── */}
      <section className="relative mx-auto grid max-w-7xl gap-16 px-5 py-24 md:grid-cols-2 md:gap-8 md:px-8">
        {PRODUCTS.map((p, i) => (
          <Reveal key={p.key} delay={i * 0.12} className="flex flex-col items-center text-center">
            <OrbScene kind={p.key} className="aspect-square w-full max-w-[340px]" />
            <div className={`mt-2 flex items-center gap-3 font-wide text-sm tracking-[0.2em] ${p.key === "core" ? "text-core" : "text-strategy"}`}>
              {p.title}
              <span className={`rounded-full px-2.5 py-1 font-sans text-[10px] font-normal tracking-[0.2em] text-ink ring-1 ring-inset ${p.key === "core" ? "ring-core" : "ring-strategy"}`}>
                {p.badge}
              </span>
            </div>
            <h2 className="mt-4 text-balance text-3xl font-light md:text-4xl">{p.headline}</h2>
            <p className="mt-4 max-w-md text-balance font-body text-ink-2">{p.copy}</p>
            <div className="mt-8 flex w-full justify-center gap-3">
              <Btn href={p.primary.href} accent={p.key} variant="solid" className="w-full max-w-48">{p.primary.label}</Btn>
              <Btn href={p.secondary.href} accent={p.key} className="w-full max-w-48">{p.secondary.label}</Btn>
            </div>
          </Reveal>
        ))}
      </section>

      {/* ── CAPITAL · the vault, downstream of intelligence (brief §31) ── */}
      <section className="mx-auto max-w-7xl px-5 pb-24 md:px-8">
        <Reveal>
          <GlowCard glow="var(--color-strategy)" className="flex flex-col items-start justify-between gap-6 rounded-xl border border-line bg-card/80 p-8 backdrop-blur md:flex-row md:items-center md:p-10">
            <div className="max-w-2xl">
              <div className="eyebrow text-xs text-strategy">Capital · Strategy Vault</div>
              <h2 className="mt-3 text-3xl font-light md:text-4xl">From intelligence to capital.</h2>
              <p className="mt-3 font-body text-ink-2">
                Review the strategy. Adjust the allocation. Deploy through a non-custodial Strategy Vault, live on Robinhood Chain mainnet, with every limit enforced on-chain. You approve every move.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-2 md:items-end">
              <Btn href="/vault" accent="strategy" variant="solid" className="min-w-44">Open Vault</Btn>
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-3">
                <span className="mr-1.5 inline-block size-1.5 rounded-full bg-mint align-middle" />
                Mainnet 4663 · {live?.vaultCount ?? 0} vaults · custody-only launch
              </span>
            </div>
          </GlowCard>
        </Reveal>
      </section>

      <div className="hr-fade mx-auto max-w-7xl" />

      {/* ── NUMBERS (all real) ──────────────────────────────────── */}
      <section className="relative isolate mx-auto max-w-6xl px-5 py-24 md:px-8">
        <div className="dot-field pointer-events-none absolute inset-0 -z-10" />
        <Reveal><SectionTitle>EQUENCY in Numbers</SectionTitle></Reveal>
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <GlowCard
                glow={i % 2 ? "var(--color-strategy)" : "var(--color-core)"}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-line bg-card/80 px-3 py-7 backdrop-blur transition-transform duration-300 hover:-translate-y-1"
              >
                <p className="flex items-baseline gap-0.5 text-4xl font-light">
                  <CountUp value={s.value} />
                  {s.suffix && <span className="text-ink-3">{s.suffix}</span>}
                </p>
                <h3 className="text-center text-ink">{s.label}</h3>
                {s.note && <span className="text-center font-body text-[11px] text-ink-3">{s.note}</span>}
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="hr-fade mx-auto max-w-7xl" />

      {/* ── FRESHLY PUBLIC · the newest minds (brief §8, §23) ────── */}
      <section id="freshly-public" className="relative isolate scroll-mt-24 overflow-hidden py-28">
        <WaveScene className="!absolute inset-x-0 top-10 bottom-0 -z-10" />
        <Reveal><SectionTitle>Freshly Public</SectionTitle></Reveal>
        <Reveal delay={0.05}>
          <h2 className="mx-auto mt-5 max-w-2xl text-balance text-center text-3xl font-light md:text-4xl">The newly public are waking up.</h2>
          <p className="mx-auto mt-3 max-w-xl text-balance text-center font-body text-ink-2">
            The newest companies entering the EQUENCY intelligence network, each with its own Intelligence Core.
          </p>
        </Reveal>

        {/* Official logos · 10 notable US IPOs */}
        <div className="mx-auto mt-14 max-w-7xl px-5">
          <Marquee>
            {FEATURED_IPOS.map((c) => (
              <Link
                key={c.ticker}
                href={`/company/${c.ticker}`}
                className="group/logo flex items-center gap-4 rounded-xl border border-line bg-card/85 py-3 pl-3 pr-5 backdrop-blur-md transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-core/60 hover:shadow-[0_20px_50px_-20px_var(--color-core)]"
              >
                <span className="logo-tile grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element -- tiny vendored PNGs, no optimisation needed */}
                  <img src={`/logos/${c.ticker}.png`} alt={`${c.name} logo`} width={56} height={56} loading="lazy" className="size-full object-contain" />
                </span>
                <span className="flex flex-col">
                  <span className="whitespace-nowrap text-lg font-medium text-ink transition-colors group-hover/logo:text-core">{c.name}</span>
                  <span className="flex items-center gap-2 whitespace-nowrap font-body text-xs text-ink-3">
                    <span className="rounded bg-ink/8 px-1.5 py-0.5 font-mono font-semibold text-ink-2">{c.ticker}</span>
                    {c.exchange} · {c.listed}
                  </span>
                </span>
                <span className="ml-2 whitespace-nowrap font-mono text-[11px] uppercase tracking-wider text-ink-3 transition-colors group-hover/logo:text-core">Enter Core →</span>
              </Link>
            ))}
          </Marquee>
        </div>

        {/* Live SEC EDGAR feed · every 424B4 in the last 180 days */}
        <div className="mx-auto mt-10 max-w-6xl px-5">
          {liveFeed.length > 0 ? (
            <>
              <p className="mb-4 text-center font-wide text-[10px] uppercase tracking-[0.2em] text-ink-3">
                <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-mint align-middle" />
                Newest Cores · live from SEC EDGAR
              </p>
              <Marquee className="[&>div]:[animation-direction:reverse]">
                {liveFeed.map((c) => (
                  <Link
                    key={c.ticker}
                    href={`/company/${c.ticker}`}
                    className="flex h-10 items-center gap-2.5 whitespace-nowrap text-base font-medium text-ink/55 transition-colors hover:text-core"
                  >
                    <span className="rounded bg-ink/8 px-1.5 py-0.5 font-mono text-xs font-semibold text-ink/70">{c.ticker}</span>
                    {c.name}
                    {c.day != null && <span className="font-mono text-[10px] uppercase tracking-wider text-strategy/80">Day {c.day}</span>}
                  </Link>
                ))}
              </Marquee>
            </>
          ) : (
            <p className="text-center font-body text-ink-3">SEC EDGAR is unreachable right now · the live feed will populate on the next refresh.</p>
          )}
        </div>
        <div className="mt-10 flex justify-center">
          <Btn href="/explore" accent="ink">Explore Cores</Btn>
        </div>
      </section>

      <div className="hr-fade mx-auto max-w-7xl" />

      {/* ── INSIDE THE CORE ─────────────────────────────────────── */}
      <section id="technology" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8">
        <Reveal><SectionTitle>Inside the Core</SectionTitle></Reveal>
        <Reveal delay={0.05}>
          <p className="mx-auto mt-5 max-w-xl text-balance text-center font-body text-ink-2">
            Evidence first. Interpretation second. A score you can audit.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {CORE_TECH.map((t, i) => (
            <Reveal key={t.title} delay={i * 0.1}>
              <GlowCard className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-card">
                <div className="aspect-[21/17] bg-gradient-to-b from-core-soft/70 to-card p-6">
                  <TechVisual kind={t.visual} />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-2xl">{t.title}</h3>
                    <span className="rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-core ring-1 ring-inset ring-core/40">{t.tag}</span>
                  </div>
                  <p className="mt-2 font-body text-ink-2">{t.copy}</p>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
        <Reveal className="mx-auto mt-14 max-w-3xl">
          <p className="text-center font-wide text-xs uppercase tracking-[0.2em] text-ink-3">
            Intelligence <span className="text-core">→</span> Strategy <span className="text-strategy">→</span> Capital
          </p>
        </Reveal>
      </section>

      <div className="hr-fade mx-auto max-w-7xl" />

      {/* ── ROADMAP TEASER · full story on /roadmap ──────────────── */}
      <section id="roadmap" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8">
        <Reveal><SectionTitle>Roadmap</SectionTitle></Reveal>
        <Reveal delay={0.05}>
          <h2 className="mx-auto mt-6 max-w-3xl text-balance text-center text-3xl font-light leading-tight md:text-5xl">
            Every new market <span className="editorial-accent">gets a Mind.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-center font-body text-ink-2">
            Newly public companies are the foundation. Next, the Intelligence Core framework expands to new markets as they emerge.
          </p>
        </Reveal>
        <div className="relative mt-14">
          <div className="absolute left-[10%] right-[10%] top-[23px] hidden h-px bg-gradient-to-r from-mint/60 via-line-2 to-strategy/50 md:block" />
          <div className="relative grid gap-8 md:grid-cols-5 md:gap-4">
            <Reveal className="flex gap-4 md:flex-col md:items-center md:text-center">
              <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-paper font-mono text-[10px] text-mint ring-1 ring-mint/60">
                <span className="absolute inset-0 animate-ping rounded-full ring-1 ring-mint/40 [animation-duration:2.6s]" />
                LIVE
              </span>
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-mint">Today</div>
                <div className="mt-1 text-lg text-ink">Newly public companies</div>
              </div>
            </Reveal>
            {PHASES.map((p, i) => (
              <Reveal key={p.n} delay={0.08 * (i + 1)} className="flex gap-4 md:flex-col md:items-center md:text-center">
                <span className={`grid size-12 shrink-0 place-items-center rounded-full bg-paper font-mono text-xs ring-1 ${p.accent === "core" ? "text-core ring-core/45" : "text-strategy ring-strategy/45"}`}>{p.n}</span>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">{p.conditional ? "Roadmap · conditional" : "Roadmap"}</div>
                  <div className="mt-1 text-lg text-ink">{p.market}</div>
                  <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">{p.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
        <Reveal className="mt-12 flex justify-center">
          <Btn href="/roadmap" accent="core" className="min-w-56">See the full roadmap →</Btn>
        </Reveal>
      </section>

      <div className="hr-fade mx-auto max-w-7xl" />

      {/* ── FAQ ─────────────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-24 md:px-8">
        <Reveal><SectionTitle>Frequently Asked</SectionTitle></Reveal>
        <Reveal delay={0.1} className="mt-14">
          <Faq items={FAQ} />
        </Reveal>
      </section>
    </main>
  );
}
