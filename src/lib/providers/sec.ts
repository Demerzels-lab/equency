// SEC EDGAR adapter · Tier-1, always LIVE, no API key (brief §5, §63).
// Only requirement: a descriptive User-Agent with contact email (SEC fair-access).
import "server-only";
import { SEC_USER_AGENT } from "@/lib/config";
import type { Filing, Identity } from "@/lib/providers/types";

const UA = { "User-Agent": SEC_USER_AGENT, Accept: "application/json" };

function pad10(cik: string | number): string {
  return String(cik).replace(/\D/g, "").padStart(10, "0");
}
function cikNum(cik: string | number): string {
  return String(Number(String(cik).replace(/\D/g, "")));
}

async function secGet<T>(url: string, revalidate = 300): Promise<T> {
  const res = await fetch(url, { headers: UA, next: { revalidate } });
  if (!res.ok) throw new Error(`SEC ${res.status} ${url}`);
  return (await res.json()) as T;
}

export interface SecSubmissions {
  identity: Identity;
  filings: Filing[];
  /** ISO date derived as the company's public-market start (best-effort). */
  firstPublicDate?: string;
}

interface RawSubmissions {
  name: string;
  tickers?: string[];
  exchanges?: string[];
  sic?: string;
  sicDescription?: string;
  addresses?: { business?: { stateOrCountryDescription?: string } };
  website?: string;
  filings: {
    recent: {
      form: string[];
      filingDate: string[];
      accessionNumber: string[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
  };
}

export async function getSubmissions(cik: string): Promise<SecSubmissions> {
  const raw = await secGet<RawSubmissions>(
    `https://data.sec.gov/submissions/CIK${pad10(cik)}.json`,
  );
  const r = raw.filings.recent;
  const n = Math.min(r.form.length, 40);
  const filings: Filing[] = [];
  for (let i = 0; i < n; i++) {
    const acc = r.accessionNumber[i];
    const accNoDash = acc.replace(/-/g, "");
    const doc = r.primaryDocument[i];
    filings.push({
      form: r.form[i],
      filedAt: r.filingDate[i],
      accession: acc,
      primaryDoc: doc,
      title: r.primaryDocDescription?.[i] || undefined,
      url: doc
        ? `https://www.sec.gov/Archives/edgar/data/${cikNum(cik)}/${accNoDash}/${doc}`
        : `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${pad10(cik)}&type=&dateb=&owner=include&count=40`,
    });
  }

  // Best-effort public-market start. Prefer the final IPO prospectus (424B*), which is
  // filed at pricing ~1 day before first trade · closest proxy to the IPO date. Only fall
  // back to exchange-registration forms (8-A/EFFECT), which can precede trading by a week.
  const prospectus = new Set(["424B4", "424B1", "424B3", "424B2"]);
  const registration = new Set(["8-A12B", "8-A12G", "EFFECT"]);
  let pDate: string | undefined;
  let rDate: string | undefined;
  for (let i = 0; i < r.form.length; i++) {
    const d = r.filingDate[i];
    if (prospectus.has(r.form[i])) pDate = !pDate || d < pDate ? d : pDate;
    else if (registration.has(r.form[i])) rDate = !rDate || d < rDate ? d : rDate;
  }
  const firstPublicDate = pDate ?? rDate;

  return {
    identity: {
      name: raw.name,
      ticker: raw.tickers?.[0] || "",
      exchange: raw.exchanges?.[0] || "",
      cik: cikNum(cik),
      sic: raw.sic,
      sicDescription: raw.sicDescription,
      country: raw.addresses?.business?.stateOrCountryDescription,
      officialWebsite: raw.website || undefined,
    },
    filings,
    firstPublicDate,
  };
}

/** Resolve a ticker symbol to a CIK via SEC's official mapping (real, free). */
export async function resolveTickerToCik(ticker: string): Promise<string | null> {
  const map = await secGet<Record<string, { cik_str: number; ticker: string; title: string }>>(
    "https://www.sec.gov/files/company_tickers.json",
    86_400,
  );
  const want = ticker.trim().toUpperCase();
  for (const k of Object.keys(map)) {
    if (map[k].ticker?.toUpperCase() === want) return cikNum(map[k].cik_str);
  }
  return null;
}

export interface IpoHit {
  name: string;
  cik: string;
  ticker?: string;
  filedAt: string;
  form: string;
}

/** Newly-public detection via EDGAR full-text search for final IPO prospectuses. */
export async function searchRecentIpos(
  startdt: string,
  enddt: string,
  form = "424B4",
): Promise<IpoHit[]> {
  const url = `https://efts.sec.gov/LATEST/search-index?forms=${form}&startdt=${startdt}&enddt=${enddt}`;
  const raw = await secGet<{
    hits: { hits: Array<{ _source: { file_date: string; ciks: string[]; display_names: string[]; file_type: string } }> };
  }>(url, 1800);

  return raw.hits.hits.map((h) => {
    const dn = h._source.display_names?.[0] || "";
    const tickerMatch = dn.match(/\(([A-Z]{1,6}(?:,\s*[A-Z]{1,6})*)\)/);
    return {
      name: dn.replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+CIK.*$/, "").trim(),
      cik: cikNum(h._source.ciks?.[0] || ""),
      ticker: tickerMatch ? tickerMatch[1].split(",")[0].trim() : undefined,
      filedAt: h._source.file_date,
      form: h._source.file_type,
    };
  });
}
