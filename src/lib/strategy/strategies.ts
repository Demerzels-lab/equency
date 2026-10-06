import type { StrategyConfig, StrategyKey } from "@/lib/strategy/types";

// MVP strategies (brief §26-27). Defaults match the brief's GROWTH example and extend
// the same shape to MOMENTUM and DEFENSIVE. Weights encode each strategy's focus as a
// deterministic mapping onto the Intelligence Core dimensions.
export const STRATEGIES: Record<StrategyKey, StrategyConfig> = {
  growth: {
    key: "growth",
    name: "Growth",
    tagline: "Revenue acceleration, fundamentals and institutional accumulation.",
    focus: ["revenue growth", "earnings acceleration", "guidance", "business momentum", "institutional ownership", "fundamentals"],
    risk: "Medium / High",
    holdingPeriod: "3–12 months",
    maxPositions: 5,
    maxPosition: 0.3,
    cashReserve: 0.2,
    rebalance: "Weekly",
    weights: { momentum: 0.2, institutional: 0.3, narrative: 0.15, fundamentals: 0.35 },
    riskStance: "tolerant",
  },
  momentum: {
    key: "momentum",
    name: "Momentum",
    tagline: "Price momentum, volume, catalysts and liquidity.",
    focus: ["price momentum", "volume", "options", "catalysts", "volatility", "liquidity"],
    risk: "High",
    holdingPeriod: "2–8 weeks",
    maxPositions: 5,
    maxPosition: 0.25,
    cashReserve: 0.15,
    rebalance: "Weekly",
    weights: { momentum: 0.5, institutional: 0.1, narrative: 0.3, fundamentals: 0.1 },
    riskStance: "neutral",
  },
  defensive: {
    key: "defensive",
    name: "Defensive",
    tagline: "Balance-sheet quality, cash, stability and lower volatility.",
    focus: ["balance sheet", "cash", "debt", "volatility", "institutional stability", "business quality"],
    risk: "Low / Medium",
    holdingPeriod: "6–18 months",
    maxPositions: 6,
    maxPosition: 0.2,
    cashReserve: 0.3,
    rebalance: "Monthly",
    weights: { momentum: 0.05, institutional: 0.3, narrative: 0.1, fundamentals: 0.55 },
    riskStance: "averse",
  },
};

export const STRATEGY_LIST = Object.values(STRATEGIES);

export function getStrategy(key: string): StrategyConfig | null {
  return (STRATEGIES as Record<string, StrategyConfig>)[key] ?? null;
}
