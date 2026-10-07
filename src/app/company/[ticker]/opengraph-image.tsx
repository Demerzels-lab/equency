import { ImageResponse } from "next/og";
import { resolveTickerToCik } from "@/lib/providers/sec";
import { buildCompanyIntelligence } from "@/lib/providers/company";
import { getFundamentals } from "@/lib/providers/xbrl";
import { computeScore } from "@/lib/intelligence/score";

export const alt = "EQUENCY Intelligence Core";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: raw } = await params;
  let name = "", ticker = raw.toUpperCase(), score: number | null = null, days: number | null = null;
  try {
    const cik = await resolveTickerToCik(raw);
    if (cik) {
      const ci = await buildCompanyIntelligence(cik);
      const s = computeScore(ci, await getFundamentals(cik));
      name = ci.identity.name; ticker = ci.identity.ticker || ticker; score = s.overall; days = ci.ipo.daysPublic ?? null;
    }
  } catch { /* generic card */ }

  const flex = (extra: Record<string, unknown> = {}) => ({ display: "flex", ...extra });

  return new ImageResponse(
    (
      <div style={flex({ width: "100%", height: "100%", flexDirection: "column", justifyContent: "space-between", background: "#050506", color: "#f2f4f7", padding: 64, fontFamily: "sans-serif" })}>
        <div style={flex({ alignItems: "center" })}>
          <div style={flex({ width: 22, height: 22, background: "#2ee6c5", transform: "rotate(45deg)", marginRight: 16 })} />
          <div style={flex({ fontSize: 28, letterSpacing: 6, fontWeight: 800 })}>EQUENCY</div>
          <div style={flex({ marginLeft: "auto", fontSize: 20, color: "#9aa4af" })}>Intelligence Core</div>
        </div>
        <div style={flex({ flexDirection: "column" })}>
          <div style={flex({ fontSize: 34, color: "#7c82f8", letterSpacing: 2, marginBottom: 10 })}>{ticker}</div>
          <div style={flex({ fontSize: 58, fontWeight: 800, lineHeight: 1.04 })}>{name || ticker}</div>
        </div>
        <div style={flex({ alignItems: "flex-end" })}>
          <div style={flex({ flexDirection: "column" })}>
            <div style={flex({ fontSize: 128, fontWeight: 800, color: "#2ee6c5", lineHeight: 1 })}>{score == null ? "·" : String(score)}</div>
            <div style={flex({ fontSize: 22, color: "#9aa4af", marginTop: 6 })}>Intelligence score / 100</div>
          </div>
          <div style={flex({ marginLeft: "auto", fontSize: 22, color: "#9aa4af" })}>{`${days != null ? `${days} days public · ` : ""}Built on Robinhood Chain`}</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
