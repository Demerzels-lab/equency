import { searchRecentIpos } from "@/lib/providers/sec";
import { daysSince } from "@/lib/util/dates";
import { ScrollStage } from "@/components/immersive/ScrollStage";
import { Hero } from "@/components/home/Hero";
import { LiveFeed } from "@/components/home/LiveFeed";
import { LoopSection } from "@/components/home/LoopSection";
import { Capabilities } from "@/components/home/Capabilities";
import { Constellation } from "@/components/home/Constellation";
import { Faq } from "@/components/home/Faq";
import { CtaDiamond } from "@/components/home/CtaDiamond";
import { Display } from "@/components/brand";

export const revalidate = 1800;

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

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

  return (
    <ScrollStage>
      <Hero counts={counts} />
      <LiveFeed feed={ranked.slice(0, 8)} counts={counts} />
      <LoopSection />
      <Capabilities />
      <Constellation companies={ranked.slice(0, 16)} />
      <Faq />
      <CtaDiamond />
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-8">
          <Display as="div" className="text-xl">EQUENCY</Display>
          <span className="label normal-case tracking-normal text-muted-foreground">
            Intelligence → Strategy → Capital · built for Robinhood Chain · no fabricated metrics
          </span>
        </div>
      </footer>
    </ScrollStage>
  );
}
