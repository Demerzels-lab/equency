import Link from "next/link";
import { searchRecentIpos } from "@/lib/providers/sec";
import { daysSince, fmtDate, ago } from "@/lib/util/dates";
import { Wireframe } from "@/components/Wireframe";
import { Button, Kicker, Display, AsciiIcon, Stat, SectionMark } from "@/components/brand";

export const revalidate = 1800;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

const LOOP = [
  { n: "01", title: "Observe", art: "┌─────┐\n│ ·◉· │\n└─────┘", desc: "Watches price, volume, filings and the event radar." },
  { n: "02", title: "Research", art: "┌╌╌╌╌┐\n│ »__ │\n└╌╌╌╌┘", desc: "Reads SEC filings, market data, news and the company site." },
  { n: "03", title: "Cross-check", art: " ╲ ╱\n  ╳\n ╱ ╲", desc: "Weighs evidence by source tier before it trusts it." },
  { n: "04", title: "Think", art: "  ·°·\n ( ∴ )\n  ·°·", desc: "Synthesises a thesis grounded strictly in that evidence." },
  { n: "05", title: "Update", art: "↺ ·· ↻\n ·  ·\n↻ ·· ↺", desc: "Revises score, thesis and risk, and records why it changed." },
  { n: "06", title: "Monitor", art: "▁▂▃▅▇\n▇▅▃▂▁", desc: "Sleeps until the next meaningful event, then wakes again." },
];

const CAPABILITIES = [
  { tier: "TIER 1", title: "SEC", art: "≡≡≡≡\n□ 10-K\n□ 8-K", items: ["submissions", "XBRL facts", "13D / 13G", "Form 4"] },
  { tier: "TIER 2", title: "Market", art: "    ╱\n  ╱╲╱\n╱", items: ["price · live", "volume", "day range", "since-IPO chart"] },
  { tier: "TIER 1", title: "Ownership", art: "◍ ◍ ◍\n ◍ ◍\n◍ ◍ ◍", items: ["institutional", "insider", "> 5% stakes"] },
  { tier: "PENDING", title: "Options", art: "( ) ( )\n |   |\n ‾   ‾", items: ["IV", "open interest", "unusual activity"] },
  { tier: "TIER 3", title: "News", art: "▤▤▤▤\n▤▤▤▤\n▤▤▤▤", items: ["headlines", "sources", "cross-check"] },
  { tier: "VIEW ONLY", title: "Official site", art: "┌──┐\n│WWW│\n└──┘", items: ["public pages", "capture", "no interaction"] },
];

export default async function Home() {
  const today = new Date().toISOString().slice(0, 10);
  let ipos: Awaited<ReturnType<typeof searchRecentIpos>> = [];
  try {
    ipos = await searchRecentIpos(isoDaysAgo(90), today, "424B4");
  } catch {
    ipos = [];
  }
  const ranked = ipos.filter((i) => i.ticker && !/acquisition/i.test(i.name));
  const counts = {
    today: ipos.filter((i) => (daysSince(i.filedAt) ?? 99) <= 1).length,
    week: ipos.filter((i) => (daysSince(i.filedAt) ?? 99) <= 7).length,
    d30: ipos.filter((i) => (daysSince(i.filedAt) ?? 99) <= 30).length,
    d90: ipos.length,
  };
  const feed = ranked.slice(0, 8);

  return (
    <main>
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden border-b hairline">
        <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.5]" />
        {/* wireframe · right half on desktop, faint bg on mobile */}
        <div className="pointer-events-auto absolute inset-y-0 right-0 hidden w-[52%] lg:block">
          <Wireframe className="h-full w-full" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-30 lg:hidden">
          <Wireframe className="h-full w-full" />
        </div>

        {/* right-edge vertical micro text */}
        <div className="absolute right-3 top-1/2 hidden -translate-y-1/2 lg:block" style={{ writingMode: "vertical-rl" }}>
          <span className="label" style={{ letterSpacing: "0.3em" }}>Drag or move to explore perspective</span>
        </div>

        <div className="relative mx-auto grid min-h-[min(86vh,880px)] max-w-[1400px] grid-cols-1 content-center gap-8 px-6 py-20 lg:grid-cols-2">
          <div className="max-w-xl">
            <Kicker>A living intelligence terminal</Kicker>
            <Display className="mt-6 text-[clamp(2.75rem,7vw,6rem)]">
              Intelligence<br />for the<br />newly public.
            </Display>
            <p className="mt-7 max-w-md text-sm leading-relaxed" style={{ color: "var(--color-ink-dim)" }}>
              Every newly public company gets an Intelligence Core that continuously researches its
              market, business and signals, grounded in SEC Tier-1 evidence. Every number is tagged
              live or simulated.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button href="/company/ADRX" variant="primary" arrow>Open the terminal</Button>
              <Button href="/strategies" variant="ghost" plus>Explore strategies</Button>
            </div>
          </div>
        </div>

        {/* hero footer bar */}
        <div className="relative border-t hairline">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-6 px-6 py-4">
            <div className="flex items-center gap-8">
              <Kicker>Scroll to travel</Kicker>
              <div className="hidden items-center gap-6 sm:flex">
                <Stat label="This week" value={counts.week} />
                <span style={{ width: 1, height: 28, background: "var(--color-line)" }} />
                <Stat label="30 days" value={counts.d30} />
                <span style={{ width: 1, height: 28, background: "var(--color-line)" }} />
                <Stat label="90 days" value={counts.d90} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-5">
              <SectionMark n="00" title="The terminal" />
              <SectionMark n="01" title="Live" />
              <SectionMark n="02" title="The loop" />
              <SectionMark n="03" title="What it sees" />
              <SectionMark n="04" title="Universe" />
            </div>
          </div>
        </div>
      </section>

      {/* ============ 01 · LIVE ============ */}
      <section className="mx-auto max-w-[1400px] px-6 py-20">
        <SectionMark n="01" title="Live intelligence, right now" className="mb-5" />
        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <Display as="h2" outline className="text-[clamp(2rem,4.5vw,3.6rem)]">NEW PUBLIC<br />MARKET, LIVE</Display>
            <p className="mt-6 max-w-sm text-sm leading-relaxed" style={{ color: "var(--color-ink-dim)" }}>
              The moment a company prices its IPO, EQUENCY detects the filing and spins up an
              Intelligence Core. These are real SEC detections, timestamps and all.
            </p>
            <div className="mt-8 grid grid-cols-4 gap-4">
              <Stat label="Today" value={counts.today} />
              <Stat label="Week" value={counts.week} />
              <Stat label="30d" value={counts.d30} />
              <Stat label="90d" value={counts.d90} />
            </div>
          </div>

          <div className="panel">
            <div className="flex items-center justify-between border-b hairline px-4 py-2.5">
              <span className="label inline-flex items-center gap-2">
                <span className="pulse" style={{ display: "inline-block", width: 6, height: 6, borderRadius: 9999, background: "var(--color-pos)", color: "var(--color-pos)" }} />
                Intelligence feed
              </span>
              <span className="label" style={{ letterSpacing: 0 }}>{feed.length} detections</span>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--color-line)" }}>
              {feed.length === 0 && <div className="p-4 text-xs" style={{ color: "var(--color-ink-faint)" }}>No live detections resolved from SEC EDGAR right now.</div>}
              {feed.map((i) => (
                <Link key={i.cik} href={`/company/${i.ticker}`} className="rowlink flex items-center gap-3 px-4 py-3">
                  <span className="mono text-xs" style={{ color: "var(--color-ink-faint)", minWidth: 54 }}>{ago(`${i.filedAt}T13:30:00Z`)}</span>
                  <span className="mono text-sm" style={{ color: "var(--color-accent)", minWidth: 56 }}>{i.ticker}</span>
                  <span className="flex-1 truncate text-sm" style={{ color: "var(--color-ink)" }}>
                    Intelligence Core initialized · {i.name}
                  </span>
                  <span className="label hidden sm:inline" style={{ letterSpacing: 0 }}>424B4 {fmtDate(i.filedAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ 02 · THE LOOP (a real sequence → numbers earned) ============ */}
      <section className="border-y hairline" style={{ background: "var(--color-panel)" }}>
        <div className="mx-auto max-w-[1400px] px-6 py-20">
          <SectionMark n="02" title="A loop that never stops" className="mb-5" />
          <Display as="h2" className="max-w-2xl text-[clamp(1.8rem,4vw,3.2rem)]">The Intelligence Core runs a loop, not a one-shot report.</Display>
          <div className="mt-10 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--color-line)" }}>
            {LOOP.map((s) => (
              <div key={s.n} className="p-5" style={{ background: "var(--color-bg)" }}>
                <div className="flex items-start justify-between">
                  <AsciiIcon art={s.art} />
                  <span className="mono text-xs" style={{ color: "var(--color-ink-faint)" }}>{s.n}</span>
                </div>
                <div className="mt-4 text-base font-semibold tracking-tight">{s.title}</div>
                <p className="mt-1.5 text-xs leading-relaxed" style={{ color: "var(--color-ink-dim)" }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ 03 · WHAT IT SEES ============ */}
      <section className="mx-auto max-w-[1400px] px-6 py-20">
        <SectionMark n="03" title="What the Core sees" className="mb-5" />
        <Display as="h2" outline className="text-[clamp(2rem,4.5vw,3.6rem)]">EVIDENCE, TIERED</Display>
        <div className="mt-10 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3" style={{ background: "var(--color-line)" }}>
          {CAPABILITIES.map((c) => (
            <div key={c.title} className="p-5" style={{ background: "var(--color-bg)" }}>
              <div className="flex items-start justify-between">
                <AsciiIcon art={c.art} />
                <span className="label" style={{ color: c.tier.startsWith("TIER 1") ? "var(--color-pos)" : c.tier === "PENDING" ? "var(--color-sim)" : "var(--color-ink-faint)" }}>{c.tier}</span>
              </div>
              <div className="mt-4 text-base font-semibold tracking-tight">{c.title}</div>
              <ul className="mt-2 flex flex-col gap-1">
                {c.items.map((it) => (
                  <li key={it} className="label normal-case" style={{ letterSpacing: 0, color: "var(--color-ink-dim)" }}>· {it}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ============ 04 · UNIVERSE ============ */}
      <section className="border-t hairline">
        <div className="mx-auto max-w-[1400px] px-6 py-20">
          <div className="mb-5 flex items-center justify-between">
            <SectionMark n="04" title="Just public · open the Intelligence Core" />
            <span className="label" style={{ letterSpacing: 0 }}>SEC EDGAR · 424B4</span>
          </div>
          <div className="panel overflow-hidden">
            {ranked.length === 0 ? (
              <div className="p-4 text-xs" style={{ color: "var(--color-ink-faint)" }}>
                No recent IPO prospectuses resolved. Try the slice directly:{" "}
                <Link href="/company/ADRX" className="underline" style={{ color: "var(--color-accent)" }}>/company/ADRX</Link>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--color-line)" }}>
                {ranked.slice(0, 14).map((i, idx) => (
                  <Link key={i.cik} href={`/company/${i.ticker}`} className="rowlink grid grid-cols-[32px_80px_1fr_auto] items-center gap-3 px-4 py-3.5 text-sm">
                    <span className="mono text-xs" style={{ color: "var(--color-ink-faint)" }}>{String(idx + 1).padStart(2, "0")}</span>
                    <span className="mono" style={{ color: "var(--color-accent)" }}>{i.ticker}</span>
                    <span className="truncate" style={{ color: "var(--color-ink)" }}>{i.name}</span>
                    <span className="mono text-xs" style={{ color: "var(--color-ink-faint)" }}>{fmtDate(i.filedAt)} →</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t hairline">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-8">
          <Display as="div" className="text-xl">EQUENCY</Display>
          <span className="label normal-case" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>
            Intelligence → Strategy → Capital · built for Robinhood Chain · no fabricated metrics
          </span>
        </div>
      </footer>
    </main>
  );
}
