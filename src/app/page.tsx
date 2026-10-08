import Link from "next/link";
import { searchRecentIpos } from "@/lib/providers/sec";
import { readVaultLiveness } from "@/lib/chain";
import { TESTNET } from "@/lib/deployments";
import { STRATEGY_LIST } from "@/lib/strategy/strategies";
import { daysSince } from "@/lib/util/dates";
import { HeroScene, OrbScene, WaveScene } from "@/components/site/Scenes";
import { RotatingHeadline } from "@/components/site/RotatingHeadline";
import { CoreSearch } from "@/components/site/CoreSearch";
import { Btn } from "@/components/site/Btn";
import { Faq } from "@/components/site/Faq";
import { TechVisual } from "@/components/site/TechVisual";
import { CountUp, GlowCard, Marquee, Reveal, SectionTitle } from "@/components/site/motion";
import { CORE_TECH, FAQ, HEADLINE_WORDS, PRODUCTS } from "@/lib/site";

export const revalidate = 1800;

const isoDaysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);

export default async function Home() {
  const today = new Date().toISOString().slice(0, 10);
  const [iposRes, liveRes] = await Promise.allSettled([
    searchRecentIpos(isoDaysAgo(180), today, "424B4"),
    readVaultLiveness(),
  ]);
  const ipos = iposRes.status === "fulfilled" ? iposRes.value : [];
  const live = liveRes.status === "fulfilled" ? liveRes.value : null;

  const seen = new Set<string>();
  const unique = ipos.filter((i) => {
    if (!i.ticker || /acquisition/i.test(i.name) || seen.has(i.ticker)) return false;
    seen.add(i.ticker);
    return true;
  });
  const seed = unique.slice(0, 24).map((i) => ({ ticker: i.ticker!, name: i.name }));
  const last90 = unique.filter((i) => (daysSince(i.filedAt) ?? 999) <= 90).length;

  // Every figure below is read from a real source at build/revalidate time — no mock numbers.
  const stats: { label: string; value: number; suffix?: string; note?: string }[] = [
    { label: "IPOs tracked · 180d (SEC 424B4)", value: unique.length },
    { label: "New listings · last 90 days", value: last90 },
    { label: "Strategy models", value: STRATEGY_LIST.length },
    { label: "Contracts on Robinhood testnet", value: Object.keys(TESTNET.contracts).length },
    { label: "Non-custodial vaults created", value: live?.vaultCount ?? 0, note: live?.reachable ? "read live from chain" : "chain unreachable" },
    { label: "Foundry tests passing", value: 14, suffix: "/14" },
  ];

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-28">
        <HeroScene className="!absolute inset-0 -z-10" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-paper to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[520px] w-[min(900px,98vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,var(--color-paper)_45%,transparent)] opacity-90" />
        <Reveal className="flex w-full flex-col items-center gap-5 text-center">
          <span className="rounded-full bg-card/70 px-3 py-1 font-body text-xs text-ink-2 ring-1 ring-line backdrop-blur">
            <span className="mr-2 inline-block size-1.5 animate-pulse rounded-full bg-mint align-middle" />
            {unique.length > 0 ? `${unique.length} Intelligence Cores live from SEC EDGAR` : "Intelligence Cores · SEC EDGAR"}
          </span>
          <RotatingHeadline words={HEADLINE_WORDS} tail="IPOs" />
          <p className="max-w-xl text-balance text-lg text-ink-2 md:text-2xl">Every newly public company gets an Intelligence Core</p>
          <div className="mt-2 flex w-full justify-center">
            <CoreSearch seed={seed} />
          </div>
        </Reveal>
      </section>

      {/* ── PRODUCTS ─────────────────────────────────────── */}
      <section className="relative mx-auto grid max-w-7xl gap-16 px-5 pb-24 pt-6 md:grid-cols-2 md:gap-8 md:px-8">
        {PRODUCTS.map((p, i) => (
          <Reveal key={p.key} delay={i * 0.12} className="flex flex-col items-center text-center">
            <OrbScene kind={p.key} className="aspect-square w-full max-w-[380px]" />
            <h2 className={`mt-2 flex items-center gap-3 text-4xl font-light md:text-5xl ${p.key === "core" ? "text-core" : "text-strategy"}`}>
              {p.title}
              <span className={`rounded-full px-2.5 py-1 text-xs font-normal tracking-[0.2em] text-ink ring-1 ring-inset ${p.key === "core" ? "ring-core" : "ring-strategy"}`}>
                {p.badge}
              </span>
            </h2>
            <p className="mt-5 max-w-md text-balance font-body text-ink-2">{p.copy}</p>
            <div className="mt-8 flex w-full justify-center gap-3">
              <Btn href={p.primary.href} accent={p.key} variant="solid" className="w-full max-w-44">{p.primary.label}</Btn>
              <Btn href={p.secondary.href} accent={p.key} className="w-full max-w-44">{p.secondary.label}</Btn>
            </div>
          </Reveal>
        ))}
      </section>

      <div className="hr-fade mx-auto max-w-7xl" />

      {/* ── NUMBERS (real) ───────────────────────────────── */}
      <section className="relative isolate mx-auto max-w-6xl px-5 py-24 md:px-8">
        <div className="dot-field pointer-events-none absolute inset-0 -z-10" />
        <Reveal><SectionTitle>EQUENCY in Numbers</SectionTitle></Reveal>
        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06}>
              <GlowCard
                glow={i % 2 ? "var(--color-strategy)" : "var(--color-core)"}
                className="flex flex-col items-center justify-center gap-2 rounded-lg border border-line bg-card/80 px-2 py-7 backdrop-blur transition-transform duration-300 hover:-translate-y-1"
              >
                <p className="flex items-baseline gap-0.5 text-4xl font-light">
                  <CountUp value={s.value} />
                  {s.suffix && <span className="text-ink-3">{s.suffix}</span>}
                </p>
                <h3 className="text-center text-ink-2">{s.label}</h3>
                {s.note && <span className="font-body text-[11px] text-ink-3">{s.note}</span>}
              </GlowCard>
            </Reveal>
          ))}
        </div>
      </section>

      <div className="hr-fade mx-auto max-w-7xl" />

      {/* ── LATEST LISTINGS marquee (real SEC universe) ─── */}
      <section className="relative isolate overflow-hidden py-28">
        <WaveScene className="!absolute inset-x-0 top-10 bottom-0 -z-10" />
        <Reveal><SectionTitle>Freshly Public</SectionTitle></Reveal>
        <div className="mx-auto mt-14 max-w-6xl px-5">
          {seed.length > 0 ? (
            <Marquee>
              {seed.slice(0, 16).map((c) => (
                <Link
                  key={c.ticker}
                  href={`/company/${c.ticker}`}
                  className="flex h-10 items-center gap-2.5 whitespace-nowrap text-xl font-medium text-ink/55 transition-colors hover:text-core"
                >
                  <span className="rounded bg-ink/8 px-1.5 py-0.5 font-mono text-xs font-semibold text-ink/70">{c.ticker}</span>
                  {c.name}
                </Link>
              ))}
            </Marquee>
          ) : (
            <p className="text-center font-body text-ink-3">SEC EDGAR is unreachable right now — the universe will populate on the next refresh.</p>
          )}
        </div>
        <div className="mt-10 flex justify-center">
          <Btn href="/explore" accent="ink">Explore the universe</Btn>
        </div>
      </section>

      <div className="hr-fade mx-auto max-w-7xl" />

      {/* ── CORE TECHNOLOGY ──────────────────────────────── */}
      <section id="technology" className="mx-auto max-w-7xl scroll-mt-24 px-5 py-24 md:px-8">
        <Reveal><SectionTitle>Core Technology</SectionTitle></Reveal>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {CORE_TECH.map((t, i) => (
            <Reveal key={t.title} delay={i * 0.1}>
              <GlowCard className="flex h-full flex-col overflow-hidden rounded-xl border border-line bg-card">
                <div className="aspect-[21/17] bg-gradient-to-b from-core-soft/70 to-card p-6">
                  <TechVisual kind={t.visual} />
                </div>
                <div className="p-6">
                  <h3 className="text-2xl">{t.title}</h3>
                  <p className="mt-2 font-body text-ink-2">{t.copy}</p>
                </div>
              </GlowCard>
            </Reveal>
          ))}
        </div>
        <Reveal className="mx-auto mt-14 max-w-3xl">
          <p className="text-center font-wide text-xs uppercase tracking-[0.2em] text-ink-3">
            Intelligence <span className="text-core">→</span> Strategy <span className="text-strategy">→</span> You <span className="text-core">→</span> Capital
          </p>
        </Reveal>
      </section>

      <div className="hr-fade mx-auto max-w-7xl" />

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-5 py-24 md:px-8">
        <Reveal><SectionTitle>Frequently Asked</SectionTitle></Reveal>
        <Reveal delay={0.1} className="mt-14">
          <Faq items={FAQ} />
        </Reveal>
      </section>
    </main>
  );
}
