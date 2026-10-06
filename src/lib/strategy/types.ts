// Strategy Engine types (brief §26-29). The strategy FIT and ranking are deterministic
// (computed from real intelligence signals); the reasoning model only narrates "why".
export type StrategyKey = "growth" | "momentum" | "defensive";

export interface StrategyConfig {
  key: StrategyKey;
  name: string;
  tagline: string;
  focus: string[]; // human-readable focus areas (brief §26)
  risk: string; // e.g. "Medium / High"
  holdingPeriod: string;
  maxPositions: number;
  maxPosition: number; // fraction 0..1 (e.g. 0.3 = 30%)
  cashReserve: number; // fraction 0..1
  rebalance: string;
  /** Deterministic weights over intelligence dimensions (sum of positives ~1). */
  weights: {
    momentum: number;
    institutional: number;
    narrative: number;
    fundamentals: number;
  };
  /** How this strategy treats the Risk dimension: tolerant | neutral | averse. */
  riskStance: "tolerant" | "neutral" | "averse";
}

/** User overrides (brief §29) · the user controls the constraints, not the AI. */
export interface UserConstraints {
  maxPositions: number;
  maxPosition: number; // fraction
  cashReserve: number; // fraction
  riskTolerance: "low" | "medium" | "high";
  excluded: string[]; // tickers
}

export interface FitContribution {
  label: string;
  dimension: string;
  value: number | null; // dimension score 0..100
  weight: number;
  basis: string;
}

export interface StrategyFit {
  fit: number; // 0..1
  contributions: FitContribution[];
  riskNote: string;
}

/** One ranked recommendation (brief §27, §28). Serialisable → passed to client. */
export interface Recommendation {
  ticker: string;
  name: string;
  cik: string;
  exchange: string;
  sector?: string;
  daysPublic?: number;
  price?: number;
  changePct?: number;
  score: number | null; // intelligence score
  risk: number | null; // risk dimension 0..100 (higher = riskier)
  fit: number; // 0..1 strategy fit
  fitContributions: FitContribution[];
  riskNote: string;
  drivers: string[]; // top evidence strings
}
