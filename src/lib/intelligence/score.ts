// Deterministic intelligence scoring (brief §12, §17, §60): compute the score from
// REAL signals first; the reasoning model only synthesises language on top. Every
// dimension carries a `basis` (its evidence) and `available` (do we actually have the
// data?). We never emit a number we can't justify from a source.
import type { CompanyIntelligence } from "@/lib/providers/types";
import type { Fundamentals } from "@/lib/providers/xbrl";

export interface Dimension {
  key: string;
  label: string;
  value: number | null; // null => n/a, not fabricated
  available: boolean;
  basis: string;
  /** Where the inputs come from (brief §40 tooltip). */
  source: string;
  /** Timestamp of the newest input behind this dimension (brief §41 freshness). */
  asOf?: string;
}

export interface ScoreResult {
  overall: number | null;
  dimensions: Dimension[];
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

export function computeScore(ci: CompanyIntelligence, fundamentals?: Fundamentals): ScoreResult {
  const forms = ci.filings.map((f) => f.form.toUpperCase());
  const count = (pred: (f: string) => boolean) => forms.filter(pred).length;

  const n13 = count((f) => f.startsWith("SCHEDULE 13"));
  const nInsider = count((f) => f === "4" || f === "3");
  const n8k = count((f) => f.startsWith("8-K"));
  const nPeriodic = count((f) => f.startsWith("10-"));

  // Freshness anchors for each dimension's inputs.
  const latestFiling = ci.filings.reduce<string | undefined>((mx, f) => (!mx || f.filedAt > mx ? f.filedAt : mx), undefined);
  const latest13 = ci.filings.filter((f) => f.form.toUpperCase().startsWith("SCHEDULE 13")).reduce<string | undefined>((mx, f) => (!mx || f.filedAt > mx ? f.filedAt : mx), undefined);
  const latestFact = fundamentals?.items.reduce<string | undefined>((mx, i) => (!mx || i.filedAt > mx ? i.filedAt : mx), undefined);

  const m = ci.market;
  const hasQuote = m.mode === "LIVE" && m.value.price != null;
  const chgPct = m.value.changePct;

  const dims: Dimension[] = [];

  // Momentum · from the live quote's 1-day move (honestly scoped to 1D).
  if (hasQuote && chgPct != null) {
    dims.push({
      key: "momentum",
      label: "Momentum",
      value: clamp(50 + chgPct * 2),
      available: true,
      basis: `1-day move ${chgPct >= 0 ? "+" : ""}${chgPct.toFixed(2)}% (Finnhub, live)`,
      source: "Finnhub live quote",
      asOf: m.asOf,
    });
  } else {
    dims.push({ key: "momentum", label: "Momentum", value: null, available: false, basis: "No live quote (add FINNHUB_API_KEY)", source: "Finnhub live quote" });
  }

  // Institutional · presence of >5% stake disclosures (SC 13D/13G), from SEC.
  dims.push({
    key: "institutional",
    label: "Institutional",
    value: clamp(45 + n13 * 12),
    available: true,
    basis: `${n13} Schedule 13D/13G disclosure${n13 === 1 ? "" : "s"} on file (SEC)`,
    source: "SEC EDGAR · Schedule 13D/13G",
    asOf: latest13 ?? latestFiling,
  });

  // Narrative / disclosure activity · material-event cadence (8-K) + insider signals.
  dims.push({
    key: "narrative",
    label: "Narrative",
    value: clamp(48 + n8k * 6 + Math.min(nInsider, 6) * 3),
    available: true,
    basis: `${n8k} 8-K, ${nInsider} insider form${nInsider === 1 ? "" : "s"} (SEC)`,
    source: "SEC EDGAR · 8-K, Forms 3/4",
    asOf: latestFiling,
  });

  // Fundamentals · from SEC XBRL companyfacts (real). Newly-public issuers with no
  // 10-Q/10-K yet have no us-gaap facts → honestly n/a, never fabricated.
  if (fundamentals?.available) {
    const get = (k: string) => fundamentals.items.find((i) => i.key === k)?.value;
    const net = get("NetIncomeLoss");
    const rev = get("Revenues") ?? get("RevenueFromContractWithCustomerExcludingAssessedTax");
    const cash = get("CashAndCashEquivalentsAtCarryingValue");
    const equity = get("StockholdersEquity");
    let v = 50;
    const notes: string[] = [];
    if (rev != null && rev > 0) { v += 10; notes.push("revenue reported"); }
    if (net != null) { v += net > 0 ? 18 : -8; notes.push(net > 0 ? "profitable" : "net loss"); }
    if (cash != null && cash > 0) { v += 8; notes.push("cash on balance sheet"); }
    if (equity != null && equity > 0) { v += 6; notes.push("positive equity"); }
    dims.push({ key: "fundamentals", label: "Fundamentals", value: clamp(v), available: true, basis: `${notes.join(", ")} (SEC XBRL)`, source: "SEC XBRL companyfacts", asOf: latestFact });
  } else {
    dims.push({
      key: "fundamentals",
      label: "Fundamentals",
      value: null,
      available: false,
      basis: nPeriodic > 0 ? `${nPeriodic} periodic report(s) filed, facts pending` : "No 10-Q/10-K yet · no XBRL fundamentals",
      source: "SEC XBRL companyfacts",
    });
  }

  // Risk · structural: newly public + sector. Higher = riskier (shown, not hidden).
  const newlyPublic = (ci.ipo.daysPublic ?? 999) <= 90;
  const biotech = /pharma|biolog|therapeut/i.test(ci.identity.sicDescription || "");
  const riskRaw = 40 + (newlyPublic ? 20 : 0) + (biotech ? 18 : 0) + (n13 === 0 ? 8 : 0);
  dims.push({
    key: "risk",
    label: "Risk",
    value: clamp(riskRaw),
    available: true,
    basis: [newlyPublic ? "newly public (<90d)" : null, biotech ? "clinical-stage sector" : null, n13 === 0 ? "thin institutional base" : null]
      .filter(Boolean)
      .join(", ") || "baseline",
    source: "Days public, SIC sector, ownership filings (SEC)",
    asOf: latestFiling,
  });

  // Overall · weighted blend of the AVAILABLE positive dimensions; risk inverts.
  const weights: Record<string, number> = { momentum: 0.2, institutional: 0.25, narrative: 0.2, fundamentals: 0.2 };
  let wsum = 0;
  let acc = 0;
  for (const d of dims) {
    if (d.key === "risk" || d.value == null) continue;
    const w = weights[d.key] ?? 0;
    acc += d.value * w;
    wsum += w;
  }
  const riskDim = dims.find((d) => d.key === "risk");
  const riskPenalty = riskDim?.value != null ? (riskDim.value - 50) * 0.15 : 0;
  const overall = wsum > 0 ? clamp(acc / wsum - riskPenalty) : null;

  return { overall, dimensions: dims };
}
