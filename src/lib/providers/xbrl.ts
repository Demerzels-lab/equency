// SEC XBRL companyfacts adapter · Tier-1 fundamentals (brief §6, §63). Free, no key.
// Newly-public companies with no 10-Q/10-K yet return an empty set (us-gaap absent) ·
// we surface that honestly as n/a rather than inventing numbers (brief §0).
import "server-only";
import { SEC_USER_AGENT } from "@/lib/config";

export interface FundamentalItem {
  key: string;
  label: string;
  value: number;
  unit: string;
  filedAt: string;
  fiscalPeriod?: string;
}
export interface Fundamentals {
  items: FundamentalItem[];
  available: boolean;
}

function pad10(cik: string | number): string {
  return String(cik).replace(/\D/g, "").padStart(10, "0");
}

// Concept -> display label. First match wins per row.
const CONCEPTS: Array<{ keys: string[]; label: string }> = [
  { keys: ["Revenues", "RevenueFromContractWithCustomerExcludingAssessedTax"], label: "Revenue" },
  { keys: ["GrossProfit"], label: "Gross profit" },
  { keys: ["OperatingIncomeLoss"], label: "Operating income" },
  { keys: ["NetIncomeLoss"], label: "Net income" },
  { keys: ["ResearchAndDevelopmentExpense"], label: "R&D expense" },
  { keys: ["CashAndCashEquivalentsAtCarryingValue"], label: "Cash & equivalents" },
  { keys: ["Assets"], label: "Total assets" },
  { keys: ["Liabilities"], label: "Total liabilities" },
  { keys: ["StockholdersEquity"], label: "Stockholders' equity" },
];

interface Unit { val: number; end: string; filed: string; fp?: string; form?: string }

export async function getFundamentals(cik: string): Promise<Fundamentals> {
  try {
    const res = await fetch(`https://data.sec.gov/api/xbrl/companyfacts/CIK${pad10(cik)}.json`, {
      headers: { "User-Agent": SEC_USER_AGENT, Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return { items: [], available: false };
    const data = await res.json();
    const gaap = data?.facts?.["us-gaap"];
    if (!gaap) return { items: [], available: false };

    const items: FundamentalItem[] = [];
    for (const { keys, label } of CONCEPTS) {
      for (const concept of keys) {
        const node = gaap[concept];
        if (!node?.units) continue;
        const unitKey = Object.keys(node.units)[0]; // e.g. "USD"
        const arr: Unit[] = node.units[unitKey];
        if (!arr?.length) continue;
        // Most recent reported value.
        const latest = [...arr].sort((a, b) => (a.end < b.end ? 1 : -1))[0];
        items.push({
          key: concept,
          label,
          value: latest.val,
          unit: unitKey,
          filedAt: latest.filed,
          fiscalPeriod: latest.fp,
        });
        break;
      }
    }
    return { items, available: items.length > 0 };
  } catch {
    return { items: [], available: false };
  }
}
