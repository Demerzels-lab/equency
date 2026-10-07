// Assembles the living Intelligence Profile for one company from all available
// sources, tagging each section LIVE or SIMULATED. No fabricated numbers: a section
// is LIVE only when a real source answered (brief §0, §57, §58).
import "server-only";
import { getSubmissions } from "@/lib/providers/sec";
import { getQuote } from "@/lib/providers/finnhub";
import { has } from "@/lib/config";
import { ageBucket, daysSince } from "@/lib/util/dates";
import type {
  CompanyIntelligence,
  Filing,
  RadarEvent,
  SourceTier,
} from "@/lib/providers/types";

/** Map a SEC form type to a human radar label + its significance (brief §10, §20). */
function radarForFiling(f: Filing): RadarEvent | null {
  const form = f.form.toUpperCase();
  const tier: SourceTier = 1;
  const base = { at: `${f.filedAt}T00:00:00Z`, tier, url: f.url };
  if (form.startsWith("8-K")) return { kind: "SEC filing", label: "8-K · material event disclosed", ...base };
  if (form.startsWith("10-Q")) return { kind: "SEC filing", label: "10-Q · quarterly report filed", ...base };
  if (form.startsWith("10-K")) return { kind: "SEC filing", label: "10-K · annual report filed", ...base };
  if (form.startsWith("424")) return { kind: "SEC filing", label: `${form} · IPO prospectus`, ...base };
  if (form.startsWith("SCHEDULE 13D")) return { kind: "Ownership", label: "SC 13D · active >5% stake disclosed", ...base };
  if (form.startsWith("SCHEDULE 13G")) return { kind: "Ownership", label: "SC 13G · passive >5% stake disclosed", ...base };
  if (form === "4") return { kind: "Insider", label: "Form 4 · insider transaction", ...base };
  if (form === "3") return { kind: "Insider", label: "Form 3 · initial insider holdings", ...base };
  if (form === "S-1" || form.startsWith("S-1")) return { kind: "SEC filing", label: "S-1 · registration statement", ...base };
  return { kind: "SEC filing", label: `${form} filed`, ...base };
}

export async function buildCompanyIntelligence(
  cik: string,
): Promise<CompanyIntelligence> {
  const sub = await getSubmissions(cik); // throws if SEC unreachable · surfaced to caller
  const symbol = sub.identity.ticker;

  // Market state · LIVE from Finnhub, else honest SIMULATED placeholder.
  const quote = symbol ? await getQuote(symbol) : null;
  const marketMode = quote ? "LIVE" : "SIMULATED";

  const daysPublic = daysSince(sub.firstPublicDate);

  const radar: RadarEvent[] = sub.filings
    .map(radarForFiling)
    .filter((e): e is RadarEvent => e !== null)
    .slice(0, 12);

  return {
    identity: sub.identity,
    ipo: {
      ipoDate: sub.firstPublicDate,
      daysPublic,
      ageBucket: ageBucket(daysPublic),
    },
    market: {
      value: quote?.market ?? {},
      mode: marketMode,
      source: quote ? "Finnhub" : "none",
      tier: 2,
      asOf: quote?.at ?? new Date().toISOString(),
    },
    filings: sub.filings,
    radar,
    dataModes: {
      identity: "LIVE",
      filings: "LIVE",
      ownership: "LIVE", // 13D/13G/Form 4 come from SEC filings
      market: marketMode,
      reasoning: has.gemini() ? "LIVE" : "SIMULATED",
    },
    assembledAt: new Date().toISOString(),
  };
}
