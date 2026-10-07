import { searchRecentIpos } from "@/lib/providers/sec";
import { getSparkline } from "@/lib/providers/yahoo";
import { daysSince } from "@/lib/util/dates";
import { ScrollStage } from "@/components/immersive/ScrollStage";
import { ScrollSignal } from "@/components/home/ScrollSignal";
import { Hero } from "@/components/home/Hero";
import { Pillars } from "@/components/home/Pillars";
import { Numbers } from "@/components/home/Numbers";
import { LiveFeed } from "@/components/home/LiveFeed";
import { BuiltOn } from "@/components/home/BuiltOn";
import { Faq } from "@/components/home/Faq";

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
  const feedItems = ranked.slice(0, 8);
  const sparks: Record<string, number[] | null> = Object.fromEntries(
    await Promise.all(
      feedItems.map(async (i) => [i.ticker ?? "", await getSparkline(i.ticker ?? "", daysSince(i.filedAt) ?? undefined)] as const),
    ),
  );
  const counts = {
    today: ipos.filter((i) => (daysSince(i.filedAt) ?? 99) <= 1).length,
    week: ipos.filter((i) => (daysSince(i.filedAt) ?? 99) <= 7).length,
    d30: ipos.filter((i) => (daysSince(i.filedAt) ?? 99) <= 30).length,
    d90: ipos.length,
  };

  return (
    <ScrollStage>
      <ScrollSignal />
      <Hero universe={ranked.slice(0, 6).map((i) => ({ ticker: i.ticker ?? "", name: i.name }))} />
      <Pillars />
      <Numbers counts={{ week: counts.week, d90: counts.d90 }} />
      <LiveFeed feed={feedItems} sparks={sparks} />
      <BuiltOn />
      <Faq />
    </ScrollStage>
  );
}
