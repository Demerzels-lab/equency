// Site chrome + marketing copy for the Daylight Orbit frontend. All product data (universe,
// scores, theses, vault state) comes from the real providers — this file only holds navigation
// and static explanatory copy.
import { FAQ as HOME_FAQ } from "@/lib/home-content";

export type Accent = "core" | "strategy";

export const HEADLINE_WORDS = ["Researching", "Scoring", "Tracking", "Decoding", "Allocating", "Monitoring"];

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
      { label: "Explore universe", href: "/explore", desc: "Every IPO from SEC 424B4 filings." },
      { label: "Compare", href: "/compare", desc: "Side-by-side Intelligence Cores." },
      { label: "Watchlist", href: "/watchlist", desc: "Companies you follow." },
    ],
  },
  {
    label: "Strategy",
    match: ["/strategies", "/portfolio"],
    children: [
      { label: "All strategies", href: "/strategies", desc: "Deterministic fit ranking." },
      { label: "Growth", href: "/strategies/growth", desc: "Fundamentals & accumulation." },
      { label: "Momentum", href: "/strategies/momentum", desc: "Price, volume & catalysts." },
      { label: "Defensive", href: "/strategies/defensive", desc: "Balance-sheet quality." },
      { label: "Paper portfolio", href: "/portfolio", desc: "Test a thesis, no capital." },
    ],
  },
  { label: "Vault", href: "/vault", match: ["/vault"] },
  {
    label: "Resources",
    children: [
      { label: "How it works", href: "/#technology", desc: "Evidence, reasoning, scoring." },
      { label: "FAQ", href: "/#faq", desc: "Custody, data and AI." },
      { label: "Contracts", href: "/vault#contracts", desc: "Verified on Robinhood Chain." },
    ],
  },
];

export const PRODUCTS = [
  {
    key: "strategy" as const,
    title: "STRATEGY",
    badge: "ALLOCATE",
    copy: "Rank the newly public universe by deterministic strategy-fit, size positions under policy limits, then execute in a non-custodial vault.",
    primary: { label: "Open Strategies", href: "/strategies" },
    secondary: { label: "Strategy Vault", href: "/vault" },
  },
  {
    key: "core" as const,
    title: "CORE",
    badge: "OBSERVE",
    copy: "Every newly public company gets a living Intelligence Core — SEC filings, market data and an AI thesis grounded strictly in evidence.",
    primary: { label: "Explore Cores", href: "/explore" },
    secondary: { label: "How it works", href: "/#technology" },
  },
];

export const CORE_TECH = [
  {
    title: "Evidence Graph",
    copy: "SEC EDGAR filings, XBRL fundamentals, Finnhub market data — every datum tagged with source tier and freshness, LIVE or honestly SIMULATED.",
    visual: "graph" as const,
  },
  {
    title: "Reasoning Engine",
    copy: "An AI model synthesises the thesis — drivers, risks, catalysts — from the evidence packet only. It never invents a number or signs a transaction.",
    visual: "orbit" as const,
  },
  {
    title: "Deterministic Score",
    copy: "Intelligence score and strategy-fit are computed from signals, not by the model. Same inputs, same output — always explainable.",
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
      { label: "Block Explorer", href: "https://explorer.testnet.chain.robinhood.com", external: true },
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
