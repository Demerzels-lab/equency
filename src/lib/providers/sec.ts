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

// SEC fair-access caps clients at 10 requests/second and answers bursts with 403 (sometimes 429).
// The newly-public universe confirms every candidate against its own submissions (~60 calls),
// so all SEC traffic in this process goes through one pacer: at most ~8 req/s, with backoff
// retries on 403/429. Cached responses (next.revalidate) return immediately and don't count
// against the limit in practice.
const MIN_GAP_MS = 125;
let nextSlot = 0;
async function pace(): Promise<void> {
  const now = Date.now();
  const at = Math.max(now, nextSlot);
  nextSlot = at + MIN_GAP_MS;
  if (at > now) await new Promise((r) => setTimeout(r, at - now));
}

async function secGet<T>(url: string, revalidate = 300): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    await pace();
    const res = await fetch(url, { headers: UA, next: { revalidate } });
    if (res.ok) return (await res.json()) as T;
    if ((res.status === 403 || res.status === 429) && attempt < 3) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt)); // 1s, 2s, 4s
      continue;
    }
    throw new Error(`SEC ${res.status} ${url}`);
  }
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

/** Newly-public detection via EDGAR full-text search for final IPO prospectuses. EDGAR returns
 *  100 hits per page; page through the full date window (capped) so a 180-day window really
 *  covers 180 days instead of only the newest ~3 months. */
export async function searchRecentIpos(
  startdt: string,
  enddt: string,
  form = "424B4",
  maxPages = 6,
): Promise<IpoHit[]> {
  type Raw = {
    hits: { total?: { value: number }; hits: Array<{ _source: { file_date: string; ciks: string[]; display_names: string[]; file_type: string } }> };
  };
  const base = `https://efts.sec.gov/LATEST/search-index?forms=${form}&startdt=${startdt}&enddt=${enddt}`;
  const first = await secGet<Raw>(base, 1800);
  const all = [...first.hits.hits];
  const total = first.hits.total?.value ?? all.length;
  for (let page = 1; page < maxPages && all.length < total; page++) {
    try {
      const next = await secGet<Raw>(`${base}&from=${page * 100}`, 1800);
      if (next.hits.hits.length === 0) break;
      all.push(...next.hits.hits);
    } catch {
      break; // keep what we have · a partial window is better than none
    }
  }

  return all.map((h) => {
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
