import { searchRecentIpos } from "@/lib/providers/sec";
import { StoryLanding } from "@/components/story/StoryLanding";

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
  const seed = ipos
    .filter((i) => i.ticker && !/acquisition/i.test(i.name))
    .slice(0, 12)
    .map((i) => ({ ticker: i.ticker ?? "", name: i.name }));

  return <StoryLanding seed={seed} />;
}
