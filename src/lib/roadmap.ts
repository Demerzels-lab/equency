// EQUENCY Roadmap content (docs/EQUENCY_Roadmap_Dev_Brief.md). Market expansion of the Intelligence
// Core framework, NOT a feature list and NOT calendar promises. Phases are roadmap targets, not live.

export const ROADMAP_HERO = {
  eyebrow: "Roadmap",
  headline: "Every new market gets a Mind.",
  sub: "EQUENCY is expanding beyond newly public companies to give newly emerging assets and markets their own persistent Intelligence Core.",
  support:
    "A Core does more than analyze an asset once. It continuously observes its environment, researches what matters, remembers what it learns, tracks events and evidence, and develops an evolving thesis over time.",
};

export const LIFECYCLE = [
  { k: "Born", d: "A new market emerges. A Core is initialized with an identity and a mission." },
  { k: "Observe", d: "It watches the asset's environment: filings, markets, onchain activity, events." },
  { k: "Research", d: "It investigates what matters and gathers evidence from primary sources." },
  { k: "Remember", d: "What it learns persists: evidence, events and invalidated assumptions." },
  { k: "Understand", d: "It builds a thesis, and re-evaluates it as the evidence changes." },
  { k: "Evolve", d: "It develops with the asset across its lifecycle." },
] as const;

export interface Phase {
  n: string;
  market: string;
  short: string;
  headline: string;
  copy: string;
  label: string;
  accent: "core" | "strategy";
  /** Two layers the Core understands at once. */
  layers: { title: string; items: string[] }[];
  /** Optional emphasis line / diagram. */
  line?: string;
  flow?: string[];
  conditional?: boolean;
}

export const PHASES: Phase[] = [
  {
    n: "01",
    market: "Newly Tokenized Stocks",
    short: "Tokenized stocks",
    headline: "Give every newly tokenized stock its own Intelligence Core.",
    copy: "The Core connects the underlying company with its onchain representation, creating a persistent intelligence layer that evolves as both markets change.",
    label: "Company + Onchain Intelligence",
    accent: "core",
    layers: [
      { title: "Underlying company", items: ["Fundamentals", "SEC filings", "Earnings", "Corporate events", "News", "Institutional activity"] },
      { title: "Onchain representation", items: ["Token price", "Liquidity", "Volume", "Holders", "Issuer / backing", "Oracle / pricing", "DeFi integrations"] },
    ],
  },
  {
    n: "02",
    market: "Stock-Paired Tokens on Pons",
    short: "Stock-paired tokens",
    headline: "Give every qualifying stock-paired token its own Mind.",
    copy: "Tokens launched with a stock or tokenized stock as the pair. These Cores understand markets across both sides of the pair, connecting onchain behavior with the underlying stock market.",
    label: "Cross-Market Intelligence",
    accent: "strategy",
    line: "One asset. Two markets. One Mind.",
    flow: ["Stock / Tokenized stock", "Onchain token"],
    layers: [
      { title: "Onchain token", items: ["Token & contract", "Liquidity & LP activity", "Holders", "Volume", "Price movement", "Deployer", "Social narrative"] },
      { title: "Underlying stock", items: ["The paired stock", "Its filings & events", "Relationship between both markets"] },
    ],
  },
  {
    n: "03",
    market: "Private / Pre-IPO",
    short: "Private / Pre-IPO",
    headline: "Give private companies intelligence before they become public.",
    copy: "A Private Market Core builds intelligence before the public market exists, allowing the same intelligence layer to evolve with a company as it moves from private to public.",
    label: "Pre-Market Intelligence",
    accent: "core",
    line: "One Core. A continuous intelligence lifecycle.",
    flow: ["Private", "Pre-IPO", "IPO", "Public"],
    layers: [
      { title: "Private company", items: ["Funding history", "Investors", "Valuation", "Products", "Competitors", "Partnerships"] },
      { title: "Signals", items: ["Hiring", "Patents", "Executive activity", "Market positioning", "Private-market developments"] },
    ],
  },
  {
    n: "04",
    market: "Newly Tokenized Commodities",
    short: "Tokenized commodities",
    headline: "Give newly tokenized commodities their own Intelligence Core.",
    copy: "When meaningful tokenized commodity markets emerge, EQUENCY can extend the Intelligence Core framework to understand both the underlying commodity and its onchain representation.",
    label: "Real-World + Onchain Intelligence",
    accent: "strategy",
    conditional: true,
    flow: ["Gold", "Silver", "Oil", "Commodity baskets"],
    layers: [
      { title: "Underlying commodity", items: ["Supply & demand", "Macro conditions", "Inventory", "Futures", "Rates", "Geopolitical events"] },
      { title: "Tokenized asset", items: ["Token price", "Backing & reserves", "Issuer", "Mint / redemption", "Liquidity", "Premium / discount"] },
    ],
  },
];

export const IDEA = {
  headline: ["Not more analysis.", "More intelligence."],
  copy: [
    "EQUENCY is not building a collection of asset analyzers.",
    "We are building a common Intelligence Core framework that can attach persistent intelligence to new markets as they emerge.",
    "Each Core has an identity, a mission, a research environment, memory, evidence, events, and an evolving thesis.",
  ],
  coda: ["The asset changes.", "The market changes.", "The Core keeps learning."],
};

export const NETWORK = {
  headline: "One framework. Many markets.",
  copy: "From public companies to tokenized assets, private markets, and eventually tokenized commodities, EQUENCY is designed around one primitive:",
  emphasis: "persistent intelligence attached to emerging markets.",
};

export const TODAY_FLOW = ["Newly public companies", "Intelligence Core", "Research", "Thesis", "Strategy", "Capital"];
