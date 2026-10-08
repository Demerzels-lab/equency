// Official-website resolution + iframe embeddability (Company Web Research panel).
//
// 1. Domain: SEC submissions `website` is almost always empty and Finnhub has no profile for
//    small fresh IPOs, so we fall back to the company's own SEC filing (424B4/S-1/F-1/10-K/20-F),
//    which states "our website address is www.…" · tier-1, issuer-authored, never guessed.
// 2. Embeddability: many sites forbid framing (X-Frame-Options / CSP frame-ancestors) or sit
//    behind a bot wall. We check the real response headers server-side so the UI can show a
//    screenshot instead of an empty "refused to connect" frame.
//
// Prospectuses are 0.5–8 MB (over the 2 MB fetch-cache limit), so the *derived* result is
// cached with unstable_cache (this app does not use Cache Components) and the raw fetch is
// no-store.
import "server-only";
import { unstable_cache } from "next/cache";
import { SEC_USER_AGENT } from "@/lib/config";
import type { Filing } from "@/lib/providers/types";

/** Forms that reliably contain the issuer's website, best first. */
const WEBSITE_FORMS = ["424B4", "424B1", "424B3", "F-1", "S-1", "F-1/A", "S-1/A", "10-K", "20-F"];

// "website" / "web site" / "internet address", then a domain within the same sentence.
const DOMAIN_RE =
  /(?:website|web site|internet address)[^.]{0,120}?((?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:com|ai|io|co|net|org|bio|us|tech|health|inc|group|hk|sg|cn|ca|uk|de|jp|tw|my|au|il))\b/gi;
// Domains that show up in "website" sentences but are not the issuer's.
const NOT_ISSUER = /(^|\.)(sec\.gov|edgar|nasdaq\.com|nyse\.com|finra\.org|investor\.gov|xbrl\.org|jns-associate\.com)$/i;

const normalize = (d: string) => d.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");

/** Pull the most-cited issuer domain out of a filing's text. Exported for tests/tools. */
export function extractWebsiteDomain(html: string): string | null {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&#160;|&nbsp;/g, " ").replace(/\s+/g, " ");
  const counts = new Map<string, number>();
  for (const m of text.matchAll(DOMAIN_RE)) {
    const d = normalize(m[1]);
    if (NOT_ISSUER.test(d)) continue;
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  let best: string | null = null;
  let n = 0;
  for (const [d, c] of counts) if (c > n) [best, n] = [d, c];
  return best;
}

const websiteFromFiling = unstable_cache(
  async (url: string): Promise<string | null> => {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": SEC_USER_AGENT },
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) return null;
      return extractWebsiteDomain(await res.text());
    } catch {
      return null;
    }
  },
  ["sec-filing-website-v1"],
  { revalidate: 30 * 86_400 },
);

/** Official website from the issuer's own SEC filings (+ the form it came from), or null. */
export async function websiteFromFilings(filings: Filing[]): Promise<{ url: string; form: string } | null> {
  const candidates = WEBSITE_FORMS.map((form) => filings.find((f) => f.form.toUpperCase() === form && f.primaryDoc))
    .filter((f): f is Filing => !!f)
    .slice(0, 2);
  for (const f of candidates) {
    const d = await websiteFromFiling(f.url);
    // Bare domain: not every issuer serves www; checkEmbeddable follows the redirect to the canonical host.
    if (d) return { url: `https://${d}`, form: f.form };
  }
  return null;
}

export interface Embeddability {
  /** Final URL after redirects (what the iframe/screenshot should load). */
  url: string;
  embeddable: boolean;
  /** Human-readable reason when not embeddable. */
  reason?: string;
  /** Site sits behind a bot wall (4xx to a plain request) · simple screenshot bots get blocked too. */
  botWall?: boolean;
}

/** Does `frame-ancestors` allow a third-party origin to frame this page? */
function frameAncestorsAllowsUs(csp: string): boolean {
  const fa = csp.split(";").map((s) => s.trim()).find((s) => s.toLowerCase().startsWith("frame-ancestors"));
  if (!fa) return true;
  const sources = fa.split(/\s+/).slice(1);
  return sources.includes("*") || sources.some((s) => /^https?:$/.test(s));
}

export const checkEmbeddable = unstable_cache(
  async (url: string): Promise<Embeddability> => {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        cache: "no-store",
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36" },
        signal: AbortSignal.timeout(8_000),
      });
      const finalUrl = res.url || url;
      void res.body?.cancel();
      if (!res.ok) return { url: finalUrl, embeddable: false, botWall: true, reason: `site answered ${res.status} (bot protection)` };
      // Some servers send the header twice ("SAMEORIGIN, SAMEORIGIN") · the first value is enough.
      const xfo = res.headers.get("x-frame-options")?.split(",")[0].trim().toUpperCase();
      if (xfo && /DENY|SAMEORIGIN|ALLOW-FROM/.test(xfo)) return { url: finalUrl, embeddable: false, reason: `X-Frame-Options: ${xfo}` };
      const csp = res.headers.get("content-security-policy");
      if (csp && !frameAncestorsAllowsUs(csp)) return { url: finalUrl, embeddable: false, reason: "CSP frame-ancestors" };
      return { url: finalUrl, embeddable: true };
    } catch {
      return { url, embeddable: false, reason: "site unreachable from server" };
    }
  },
  ["website-embeddable-v2"],
  { revalidate: 86_400 },
);
