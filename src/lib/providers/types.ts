// Core data model for a newly-public company's Intelligence Core (brief §6, §9).
// Every datum carries provenance: which source, which tier, when, and whether it is
// LIVE (read from a real source now) or SIMULATED (placeholder, honestly labelled).

export type DataMode = "LIVE" | "SIMULATED";

/** Source reliability tiers (brief §63). */
export type SourceTier = 1 | 2 | 3;

export const SOURCE_TIER: Record<string, SourceTier> = {
  SEC: 1,
  "Company IR": 1,
  Exchange: 1,
  Finnhub: 2,
  Polygon: 2,
  Alpaca: 2,
  FMP: 2,
  News: 3,
  X: 3,
};

/** A single piece of evidence behind a claim (brief §62). */
export interface Evidence {
  claim: string;
  detail?: string;
  source: string; // e.g. "SEC", "Finnhub"
  tier: SourceTier;
  url?: string;
  /** ISO timestamp the underlying datum was produced/filed. */
  filedAt?: string;
  confidence?: "high" | "medium" | "low";
}

/** Wraps any value with provenance so the UI can always answer: what/where/when/mode. */
export interface Sourced<T> {
  value: T;
  mode: DataMode;
  source: string;
  tier: SourceTier;
  /** ISO timestamp this datum was fetched/produced. */
  asOf: string;
  /** For filings: when the source document was filed (distinct from fetch time, brief §58). */
  filedAt?: string;
  url?: string;
}

export interface Identity {
  name: string;
  ticker: string;
  exchange: string;
  cik: string;
  sic?: string;
  sicDescription?: string;
  country?: string;
  officialWebsite?: string;
}

export interface IpoInfo {
  ipoDate?: string; // ISO date of first trading / pricing
  daysPublic?: number;
  ageBucket?: "NEW" | "RECENT" | "EARLY PUBLIC" | "EMERGING" | "SEASONED";
  ipoPrice?: number;
}

export interface MarketState {
  price?: number;
  change?: number;
  changePct?: number;
  dayHigh?: number;
  dayLow?: number;
  open?: number;
  prevClose?: number;
  marketCap?: number;
  volume?: number;
}

export interface Filing {
  form: string;
  filedAt: string;
  accession: string;
  primaryDoc?: string;
  url: string;
  title?: string;
}

export interface NewsItem {
  headline: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface RadarEvent {
  kind: string; // "SEC filing", "Ownership", "Insider", "Price", ...
  label: string;
  at: string; // ISO
  tier: SourceTier;
  url?: string;
}

/** The living intelligence profile assembled from all sources. */
export interface CompanyIntelligence {
  identity: Identity;
  ipo: IpoInfo;
  market: Sourced<MarketState>;
  filings: Filing[];
  radar: RadarEvent[];
  /** How each major section resolved · drives the LIVE/SIMULATED badges. */
  dataModes: Record<string, DataMode>;
  /** When the whole profile was assembled (ISO). */
  assembledAt: string;
}
