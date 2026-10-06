// Deterministic strategy-fit (brief §12, §27): map a company's Intelligence Core
// dimensions onto a strategy's weighted focus, then apply the strategy's risk stance.
// Fully reproducible and explainable · the model never touches this number.
import type { ScoreResult } from "@/lib/intelligence/score";
import type { StrategyConfig, StrategyFit, FitContribution } from "@/lib/strategy/types";

const DIM_LABEL: Record<string, string> = {
  momentum: "Momentum",
  institutional: "Institutional",
  narrative: "Narrative",
  fundamentals: "Fundamentals",
};

export function computeStrategyFit(score: ScoreResult, strategy: StrategyConfig): StrategyFit {
  const byKey = new Map(score.dimensions.map((d) => [d.key, d]));
  const contributions: FitContribution[] = [];

  let wsum = 0;
  let acc = 0;
  for (const [dim, weight] of Object.entries(strategy.weights)) {
    const d = byKey.get(dim);
    const value = d?.value ?? null;
    contributions.push({
      label: DIM_LABEL[dim] ?? dim,
      dimension: dim,
      value,
      weight,
      basis: d?.basis ?? "no data",
    });
    if (value != null) {
      acc += value * weight;
      wsum += weight;
    }
  }
  // Reweight over available dimensions so a missing feed lowers confidence, not the score.
  let base = wsum > 0 ? acc / wsum : 50;

  // Risk stance.
  const risk = byKey.get("risk")?.value ?? 50;
  let riskNote: string;
  if (strategy.riskStance === "averse") {
    const penalty = Math.max(0, risk - 45) * 0.6;
    base -= penalty;
    riskNote = `Defensive: risk ${risk} penalised −${Math.round(penalty)}`;
  } else if (strategy.riskStance === "tolerant") {
    riskNote = `Growth: tolerant of elevated risk (${risk})`;
  } else {
    riskNote = `Momentum: risk ${risk} treated neutrally`;
  }

  const fit = Math.max(0, Math.min(1, base / 100));
  return { fit, contributions, riskNote };
}
