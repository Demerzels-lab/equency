import Link from "next/link";
import { SectionMark, Display } from "@/components/brand";
import { CountUp } from "@/components/immersive/CountUp";
import { Dot } from "@/components/primitives";
import { ago, fmtDate } from "@/lib/util/dates";
import type { IpoHit } from "@/lib/providers/sec";

export function LiveFeed({ feed, counts }: { feed: IpoHit[]; counts: { today: number; week: number; d30: number; d90: number } }) {
  return (
    <section data-section="live" className="mx-auto max-w-[1400px] px-6 py-24">
      <SectionMark n="01" title="Live intelligence, right now" className="mb-5" />
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <Display as="h2" outline className="text-[clamp(2rem,4.5vw,3.6rem)]">NEW PUBLIC<br />MARKET, LIVE</Display>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
            The moment a company prices its IPO, EQUENCY detects the filing and spins up an
            Intelligence Core. These are real SEC detections, timestamps and all.
          </p>
          <div className="mt-8 grid grid-cols-4 gap-4">
            <CountStat label="Today" value={counts.today} />
            <CountStat label="Week" value={counts.week} />
            <CountStat label="30d" value={counts.d30} />
            <CountStat label="90d" value={counts.d90} />
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card/70 backdrop-blur">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="label inline-flex items-center gap-2">
              <Dot color="var(--color-pos)" pulse /> Intelligence feed
            </span>
            <span className="label">{feed.length} detections</span>
          </div>
          <div className="divide-y divide-border">
            {feed.length === 0 && <div className="p-4 text-xs text-muted-foreground">No live detections resolved from SEC EDGAR right now.</div>}
            {feed.map((i) => (
              <Link key={i.cik} href={`/company/${i.ticker}`} className="rowlink flex items-center gap-3 px-4 py-3">
                <span className="mono min-w-[54px] text-xs text-muted-foreground">{ago(`${i.filedAt}T13:30:00Z`)}</span>
                <span className="mono min-w-[56px] text-sm" style={{ color: "var(--color-accent)" }}>{i.ticker}</span>
                <span className="flex-1 truncate text-sm">Intelligence Core initialized · {i.name}</span>
                <span className="label hidden sm:inline">424B4 {fmtDate(i.filedAt)}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CountStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mono text-2xl font-semibold leading-none tabular-nums"><CountUp value={value} /></div>
      <div className="label mt-2">{label}</div>
    </div>
  );
}
