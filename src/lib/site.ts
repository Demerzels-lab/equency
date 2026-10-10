// Site chrome + the EQUENCY copy system (brand brief §43). All product data (universe, scores,
// theses, vault state) comes from the real providers · this file only holds navigation and
// static explanatory copy.
//
//   One-liner          Intelligence for the newly public.
//   Product statement  Every newly public company gets an Intelligence Core.
//   Architecture       Intelligence → Strategy → Capital
import { FAQ as HOME_FAQ } from "@/lib/home-content";

export type Accent = "core" | "strategy";

export const BRAND = {
  oneLiner: "Intelligence for the newly public.",
  statement: "Every newly public company gets an Intelligence Core.",
  explanation:
    "EQUENCY continuously researches companies entering the public market, turning filings, market activity, events and emerging signals into an evolving intelligence layer.",
  system: "Intelligence → Strategy → Capital",
};

/** Brand brief §4 · the five ideas a visitor should understand, in order. */
export const MENTAL_MODEL = [
  { n: "01", title: "A company goes public", copy: "A newly public company enters the EQUENCY universe the day its final prospectus lands on SEC EDGAR." },
  { n: "02", title: "It gets an Intelligence Core", copy: "It stops being just a ticker. A persistent intelligence layer is attached to it from day one." },
  { n: "03", title: "The Core researches", copy: "Filings, fundamentals, ownership, price, volume, news and the official site · every datum tagged with its source and freshness." },
  { n: "04", title: "It builds a thesis", copy: "What is happening, why it matters, what supports it, and what could invalidate it. The thesis changes when the evidence does." },
  { n: "05", title: "Intelligence becomes capital", copy: "Turn the thesis into a strategy you review, then deploy through an onchain Strategy Vault. You approve every move." },
];

export type NavItem = {
  label: string;
  href?: string;
  match?: string[];
  children?: { label: string; href: string; desc: string }[];
};

export const NAV: NavItem[] = [
  {
    label: "Core",
    match: ["/explore", "/company", "/compare", "/watchlist"],
    children: [
      { label: "Explore Cores", href: "/explore", desc: "Every newly public company and its Core." },
      { label: "Compare Cores", href: "/compare", desc: "Intelligence Cores, side by side." },
      { label: "Watchlist", href: "/watchlist", desc: "The Cores you follow." },
    ],
  },
  {
    label: "Strategy",
    match: ["/strategies", "/portfolio"],
    children: [
      { label: "Explore Strategies", href: "/strategies", desc: "Turn intelligence into strategy." },
      { label: "Growth", href: "/strategies/growth", desc: "Fundamentals & accumulation." },
      { label: "Momentum", href: "/strategies/momentum", desc: "Price, volume & catalysts." },
      { label: "Defensive", href: "/strategies/defensive", desc: "Balance-sheet quality." },
      { label: "Paper portfolio", href: "/portfolio", desc: "Test a strategy, no capital." },
    ],
  },
  { label: "Vault", href: "/vault", match: ["/vault"] },
  { label: "Roadmap", href: "/roadmap", match: ["/roadmap"] },
  {
    label: "Resources",
    children: [
      { label: "How it works", href: "/#how-it-works", desc: "Company → Core → Thesis → Strategy → Capital." },
      { label: "Inside the Core", href: "/#technology", desc: "Evidence, reasoning, scoring." },
      { label: "FAQ", href: "/#faq", desc: "Data, trust and custody." },
      { label: "Contracts", href: "/vault#contracts", desc: "Live on Robinhood Chain mainnet." },
    ],
  },
];

/** The two layers of one system (brief §10): the Core first, Strategy downstream of it. */
export const PRODUCTS = [
  {
    key: "core" as const,
    title: "CORE",
    badge: "INTELLIGENCE",
    headline: "Every company gets a Core.",
    copy: "A living Intelligence Core researches the company's filings, market and events, remembers what changed, and keeps its thesis current.",
    primary: { label: "Explore Cores", href: "/explore" },
    secondary: { label: "How it works", href: "/#how-it-works" },
  },
  {
    key: "strategy" as const,
    title: "STRATEGY",
    badge: "DOWNSTREAM",
    headline: "Turn intelligence into strategy.",
    copy: "Rank newly public companies against deterministic strategy rules, market signals and Intelligence Core research.",
    primary: { label: "Explore Strategies", href: "/strategies" },
    secondary: { label: "Strategy Vault", href: "/vault" },
  },
];

export const CORE_TECH = [
  {
    title: "Evidence Graph",
    tag: "SOURCE OF TRUTH",
    copy: "The evidence behind the Core's current thesis. SEC filings, XBRL fundamentals and market data, each tagged with its source tier and freshness · LIVE, or honestly marked SIMULATED.",
    visual: "graph" as const,
  },
  {
    title: "Reasoning Engine",
    tag: "INTERPRETS",
    copy: "Converts verified evidence into structured interpretations, risks, catalysts and thesis changes. The evidence is the source of truth · the engine never invents a number or signs a transaction.",
    visual: "orbit" as const,
  },
  {
    title: "Deterministic Score",
    tag: "RULE-BASED",
    copy: "A transparent score built from defined market, fundamental and ownership signals. Same inputs, same output · every point explainable, never a model's guess.",
    visual: "bars" as const,
  },
];

export const FAQ = HOME_FAQ;

export const FOOTER = [
  {
    title: "Core",
    links: [
      { label: "Explore", href: "/explore" },
      { label: "Compare", href: "/compare" },
      { label: "Watchlist", href: "/watchlist" },
    ],
  },
  {
    title: "Strategy",
    links: [
      { label: "Growth", href: "/strategies/growth" },
      { label: "Momentum", href: "/strategies/momentum" },
      { label: "Defensive", href: "/strategies/defensive" },
      { label: "Paper portfolio", href: "/portfolio" },
    ],
  },
  {
    title: "Protocol",
    links: [
      { label: "Strategy Vault", href: "/vault" },
      { label: "Contracts", href: "/vault#contracts" },
      { label: "Roadmap", href: "/roadmap" },
      { label: "Block Explorer", href: "https://robinhoodchain.blockscout.com", external: true },
    ],
  },
  {
    title: "Data",
    links: [
      { label: "SEC EDGAR", href: "https://www.sec.gov/edgar", external: true },
      { label: "Finnhub", href: "https://finnhub.io", external: true },
      { label: "Robinhood Chain", href: "https://docs.robinhood.com/chain", external: true },
    ],
  },
];

/** Ten notable US-listed IPOs shown with their official logos in the landing's "Freshly Public"
 *  strip. Logos are vendored in /public/logos (official marks, nominative use); every ticker
 *  resolves in SEC's company_tickers.json so the link opens a real Intelligence Core. */
/** $EQUENCY ("Equency Mind") token on Robinhood Chain mainnet (4663), 18 decimals, 1B supply.
 *  NEXT_PUBLIC_TOKEN_CA overrides it; an empty string falls back to "Announcing soon". */
export const TOKEN_CA = (process.env.NEXT_PUBLIC_TOKEN_CA ?? "0x8c1ccd1ab61d1d6eb79ea1fa4173965dcbefb85c").trim();
export const TOKEN_EXPLORER = TOKEN_CA ? `https://robinhoodchain.blockscout.com/token/${TOKEN_CA}` : "";

/** Official EQUENCY account on X. */
export const X_URL = "https://x.com/Equencymind";
export const X_HANDLE = "@Equencymind";

export const FEATURED_IPOS: { ticker: string; name: string; exchange: "NASDAQ" | "NYSE"; listed: string }[] = [
  { ticker: "FIG", name: "Figma", exchange: "NYSE", listed: "Jul 2025" },
  { ticker: "CRCL", name: "Circle", exchange: "NYSE", listed: "Jun 2025" },
  { ticker: "CRWV", name: "CoreWeave", exchange: "NASDAQ", listed: "Mar 2025" },
  { ticker: "KLAR", name: "Klarna", exchange: "NYSE", listed: "Sep 2025" },
  { ticker: "CHYM", name: "Chime", exchange: "NASDAQ", listed: "Jun 2025" },
  { ticker: "GEMI", name: "Gemini", exchange: "NASDAQ", listed: "Sep 2025" },
  { ticker: "BLSH", name: "Bullish", exchange: "NYSE", listed: "Aug 2025" },
  { ticker: "ETOR", name: "eToro", exchange: "NASDAQ", listed: "May 2025" },
  { ticker: "RBRK", name: "Rubrik", exchange: "NYSE", listed: "Apr 2024" },
  { ticker: "RDDT", name: "Reddit", exchange: "NYSE", listed: "Mar 2024" },
];
