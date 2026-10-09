// Static content for the home page sections (the agent loop, capabilities, FAQ).
// Kept out of the page component so section components can import it directly.

export const LOOP = [
  { n: "01", title: "Observe", art: "┌─────┐\n│ ·◉· │\n└─────┘", desc: "Watches price, volume, filings and the event radar." },
  { n: "02", title: "Research", art: "┌╌╌╌╌┐\n│ »__ │\n└╌╌╌╌┘", desc: "Reads SEC filings, market data, news and the company site." },
  { n: "03", title: "Cross-check", art: " ╲ ╱\n  ╳\n ╱ ╲", desc: "Weighs evidence by source tier before it trusts it." },
  { n: "04", title: "Think", art: "  ·°·\n ( ∴ )\n  ·°·", desc: "Synthesises a thesis grounded strictly in that evidence." },
  { n: "05", title: "Update", art: "↺ ·· ↻\n ·  ·\n↻ ·· ↺", desc: "Revises score, thesis and risk, and records why it changed." },
  { n: "06", title: "Monitor", art: "▁▂▃▅▇\n▇▅▃▂▁", desc: "Sleeps until the next meaningful event, then wakes again." },
];

export const CAPABILITIES = [
  { tier: "TIER 1", title: "SEC", art: "≡≡≡≡\n□ 10-K\n□ 8-K", items: ["submissions", "XBRL facts", "13D / 13G", "Form 4"] },
  { tier: "TIER 2", title: "Market", art: "    ╱\n  ╱╲╱\n╱", items: ["price · live", "volume", "day range", "since-IPO chart"] },
  { tier: "TIER 1", title: "Ownership", art: "◍ ◍ ◍\n ◍ ◍\n◍ ◍ ◍", items: ["institutional", "insider", "> 5% stakes"] },
  { tier: "PENDING", title: "Options", art: "( ) ( )\n |   |\n ‾   ‾", items: ["IV", "open interest", "unusual activity"] },
  { tier: "TIER 3", title: "News", art: "▤▤▤▤\n▤▤▤▤\n▤▤▤▤", items: ["headlines", "sources", "cross-check"] },
  { tier: "VIEW ONLY", title: "Official site", art: "┌──┐\n│WWW│\n└──┘", items: ["public pages", "capture", "no interaction"] },
];

// Brand brief §28 · rewritten around the Core model, kept strictly to what is implemented today.
export const FAQ = [
  {
    q: "What does an Intelligence Core actually do?",
    a: "It monitors and researches one newly public company · SEC filings, ownership, fundamentals, market data, news and the official site · and turns that evidence into structured intelligence and an evolving thesis.",
  },
  {
    q: "Where does the data come from?",
    a: "SEC EDGAR (filings, ownership, XBRL fundamentals), Finnhub (live quotes and news) and Yahoo (price history). Every output keeps its source and timestamp so you can inspect the evidence yourself.",
  },
  {
    q: "Does the Core run continuously?",
    a: "It refreshes from its sources on a rolling cycle (market data within about a minute, filings within minutes). When nothing new has happened it says MONITORING · it never fakes activity.",
  },
  {
    q: "Is the Core just an AI model?",
    a: "No. It combines structured data, deterministic rule-based signals, evidence tracking and a reasoning engine that writes the narrative. The score is computed by rules, not by the model.",
  },
  {
    q: "Can the thesis change?",
    a: "Yes. The thesis is re-derived whenever the evidence changes, and every genuine change is recorded in the Core's thesis history.",
  },
  {
    q: "Does the Core make investment decisions?",
    a: "No. The Core produces intelligence and strategy recommendations. Capital only moves through your own Strategy Vault, under limits enforced on-chain, and only when you approve.",
  },
  {
    q: "Is any of this live onchain?",
    a: "Yes. The Strategy Vault is live on Robinhood Chain mainnet (4663) with the real USDG, and its source is verified. Vaults ship paused; real-USDG deposits open after the external audit.",
  },
  {
    q: "Is this financial advice?",
    a: "No. EQUENCY provides research, intelligence and strategy tooling. You are responsible for your own investment decisions.",
  },
];
