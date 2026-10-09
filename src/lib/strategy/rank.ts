// Rank the newly-public universe for a strategy (brief §27, §60). Deterministic signals
// only · NO reasoning-model call here (cost control; the model runs on-demand in the
// recommendation detail). Reuses the Phase-1 Intelligence Core per company.
import "server-only";
import { getNewlyPublicUniverse } from "@/lib/providers/universe";
import { buildCompanyIntelligence } from "@/lib/providers/company";
import { computeScore } from "@/lib/intelligence/score";
import { computeStrategyFit } from "@/lib/strategy/fit";
import type { StrategyConfig, Recommendation } from "@/lib/strategy/types";

/** Candidate pool: the shared, SEC-confirmed newly-public universe (follow-on offerings
 *  already excluded), freshest first. */
export async function getUniverse(pool = 18): Promise<Array<{ cik: string; ticker: string; name: string }>> {
  return (await getNewlyPublicUniverse()).slice(0, pool).map((c) => ({ cik: c.cik, ticker: c.ticker, name: c.name }));
}

const NEWLY_PUBLIC_MAX_DAYS = 180;

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      out[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

export async function rankUniverse(strategy: StrategyConfig, limit = 10): Promise<Recommendation[]> {
  const universe = await getUniverse(18);

  const recs = await mapLimit(universe, 4, async (c): Promise<Recommendation | null> => {
    try {
      const ci = await buildCompanyIntelligence(c.cik);
      const score = computeScore(ci); // no XBRL fetch here · keep ranking cheap
      const { fit, contributions, riskNote } = computeStrategyFit(score, strategy);
      const drivers = score.dimensions
        .filter((d) => d.value != null && d.key !== "risk")
        .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
        .slice(0, 3)
        .map((d) => `${d.label}: ${d.basis}`);
      return {
        ticker: ci.identity.ticker || c.ticker,
        name: ci.identity.name || c.name,
        cik: c.cik,
        exchange: ci.identity.exchange,
        sector: ci.identity.sicDescription,
        daysPublic: ci.ipo.daysPublic,
        price: ci.market.value.price,
        changePct: ci.market.value.changePct,
        score: score.overall,
        risk: score.dimensions.find((d) => d.key === "risk")?.value ?? null,
        fit,
        fitContributions: contributions,
        riskNote,
        drivers,
      };
    } catch {
      return null;
    }
  });

  return recs
    .filter((r): r is Recommendation => r !== null)
    // Keep only genuinely newly-public names (brief §4); a recent 424B4 alone isn't enough.
    .filter((r) => r.daysPublic != null && r.daysPublic <= NEWLY_PUBLIC_MAX_DAYS)
    .sort((a, b) => b.fit - a.fit)
    .slice(0, limit);
}
