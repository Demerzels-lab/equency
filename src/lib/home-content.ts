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

export const FAQ = [
  {
    q: "What is an Intelligence Core?",
    a: "Every newly public company gets a Core that continuously researches its filings, market and signals, then turns them into an evidence-backed thesis you can act on.",
  },
  {
    q: "Where does the data come from?",
    a: "SEC EDGAR (Tier-1: filings, ownership, XBRL fundamentals), market quotes (Finnhub), price history (Yahoo), and the EQUENCY Reasoning Engine for synthesis. Every datum carries its source and freshness.",
  },
  {
    q: "What do 'live' and 'simulated' mean?",
    a: "Live means read from a real source right now. Simulated is an honest placeholder for a feed not yet wired. We never dress a placeholder up as real.",
  },
  {
    q: "Does the AI move my money?",
    a: "No. The AI proposes, a deterministic policy validates, and you approve. The AI never holds a key or signs a transaction.",
  },
  {
    q: "Is the score made up by the model?",
    a: "No. The intelligence score and strategy-fit are computed deterministically from real signals. The model only writes the narrative, grounded in that evidence.",
  },
  {
    q: "Is any of this live onchain?",
    a: "The Strategy Vault is deployed and verified on Robinhood testnet. Mainnet uses the real USDG and ships paused until external review.",
  },
];
