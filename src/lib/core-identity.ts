// Intelligence Core identity: the Core's current MISSION and STATE, derived deterministically
// from real data (days public, timestamps of real SEC events). Brand brief §14, §36, §37, §39.
//
// Honesty rule (brief §27, §47): a state is only shown when something real backs it.
//   AWAKE       · the company went public ≤ 7 days ago (the Core was just activated)
//   OBSERVING   · a new SEC filing/event landed in the last 72 h (fresh evidence on file)
//   MONITORING  · nothing new · the Core is watching, not pretending to think
// States that would require a running research job (RESEARCHING, RE-EVALUATING, THESIS SHIFT)
// are intentionally NOT emitted until such jobs exist.

export type CoreState = "AWAKE" | "OBSERVING" | "MONITORING";

export interface CoreStatus {
  state: CoreState;
  /** One line explaining what real data put the Core in this state. */
  basis: string;
}

export interface CoreMission {
  phase: string;
  /** Inclusive day window this mission covers, e.g. "Day 0–7". */
  window: string;
  mission: string;
  focus: string[];
}

const OBSERVING_WINDOW_MS = 72 * 3_600_000;

export function coreStatus(daysPublic: number | null | undefined, lastEventAt?: string | null): CoreStatus {
  if (daysPublic != null && daysPublic <= 7) {
    return { state: "AWAKE", basis: `Activated at IPO · day ${daysPublic} public` };
  }
  const t = lastEventAt ? Date.parse(lastEventAt) : NaN;
  if (!Number.isNaN(t) && Date.now() - t <= OBSERVING_WINDOW_MS) {
    return { state: "OBSERVING", basis: "New SEC filing in the last 72 h" };
  }
  return { state: "MONITORING", basis: "No new filings in 72 h · watching for the next event" };
}

/** Mission by company age (brief §37). The Core's job changes as the company matures. */
export function coreMission(daysPublic: number | null | undefined): CoreMission {
  const d = daysPublic ?? 0;
  if (d <= 7)
    return {
      phase: "IPO Discovery",
      window: "Day 0–7",
      mission: "Establish baseline intelligence on the company and its first days of price discovery.",
      focus: ["IPO details", "Filings", "Business", "Initial valuation", "Early volume"],
    };
  if (d <= 30)
    return {
      phase: "Market Positioning",
      window: "Day 8–30",
      mission: "Understand early market positioning and the first institutional moves.",
      focus: ["Institutional activity", "Price behavior", "Volume", "Catalysts", "First major events"],
    };
  if (d <= 90)
    return {
      phase: "Thesis Test",
      window: "Day 31–90",
      mission: "Test the initial thesis against the first earnings, guidance and execution.",
      focus: ["Earnings", "Guidance", "Execution", "Institutional changes"],
    };
  if (d <= 180)
    return {
      phase: "Durability",
      window: "Day 91–180",
      mission: "Determine whether the company is establishing durable public-market positioning.",
      focus: ["Sustained fundamentals", "Ownership", "Valuation", "Recurring catalysts"],
    };
  return {
    phase: "Established",
    window: "Day 180+",
    mission: "Track whether the thesis holds as the company matures beyond its newly-public window.",
    focus: ["Fundamentals", "Ownership", "Valuation", "Risk"],
  };
}

/** Semantic colour per state (brief §38 "consistent semantic colors for states"). */
export const CORE_STATE_COLOR: Record<CoreState, string> = {
  AWAKE: "var(--color-strategy)",
  OBSERVING: "var(--color-core)",
  MONITORING: "var(--color-pos)",
};

/** "Day 12 public" · the newly-public identity marker (brief §13). */
export function dayLabel(daysPublic: number | null | undefined): string {
  return daysPublic == null ? "Newly public" : `Day ${daysPublic} public`;
}
