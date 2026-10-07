// EQUENCY Reasoning Engine (brief §11, §12, §61). The model vendor is abstracted
// behind this module · the frontend never sees it. The model only SYNTHESISES a
// thesis from evidence we pass in; it does not fetch, decide capital, or emit the
// numeric score (that is deterministic, see score.ts). Output is strictly structured.
import "server-only";
import { cache } from "react";
import { GEMINI_API_KEY, GEMINI_MODEL, has } from "@/lib/config";
import type { CompanyIntelligence } from "@/lib/providers/types";
import type { ScoreResult } from "@/lib/intelligence/score";

export type ThesisDirection = "STRENGTHENING" | "NEUTRAL" | "CAUTIOUS" | "WEAKENING";

export interface Thesis {
  direction: ThesisDirection;
  confidence: number; // 0..1
  summary: string;
  keyDrivers: string[];
  risks: string[];
  catalysts: string[];
}

export interface ReasonResult {
  thesis: Thesis;
  mode: "LIVE" | "SIMULATED";
  engine: string; // opaque label shown to users ("EQUENCY Reasoning Engine")
}

/** Compact, source-tagged evidence packet · the ONLY ground truth the model may use. */
function evidencePacket(ci: CompanyIntelligence, score: ScoreResult): string {
  const f = ci.filings.slice(0, 12).map((x) => `${x.filedAt} ${x.form}`).join("; ");
  const m = ci.market;
  const mkt =
    m.mode === "LIVE"
      ? `price $${m.value.price} (${m.value.changePct?.toFixed(2)}% 1d), source Finnhub`
      : "no live market data";
  const dims = score.dimensions
    .map((d) => `${d.label}=${d.value ?? "n/a"} (${d.basis})`)
    .join("; ");
  return [
    `Company: ${ci.identity.name} (${ci.identity.ticker}, ${ci.identity.exchange})`,
    `Sector: ${ci.identity.sicDescription ?? "unknown"}`,
    `Days public: ${ci.ipo.daysPublic ?? "unknown"} (bucket ${ci.ipo.ageBucket ?? "?"})`,
    `Market: ${mkt}`,
    `Deterministic signals: ${dims}`,
    `Recent SEC filings: ${f}`,
  ].join("\n");
}

const SYSTEM = `You are the EQUENCY Reasoning Engine analysing a newly-public US company.
Rules:
- Use ONLY the evidence provided. Do not invent numbers, filings, or events.
- Be evidence-first: every driver/risk/catalyst must trace to a provided fact.
- Tone: technical, institutional, concise. No hype, no disclaimers, no chain-of-thought.
- If evidence is thin, say so and lower confidence.
Return the thesis strictly as JSON matching the schema.`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    direction: { type: "string", enum: ["STRENGTHENING", "NEUTRAL", "CAUTIOUS", "WEAKENING"] },
    confidence: { type: "number" },
    summary: { type: "string" },
    keyDrivers: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    catalysts: { type: "array", items: { type: "string" } },
  },
  required: ["direction", "confidence", "summary", "keyDrivers", "risks", "catalysts"],
} as const;

// Cached per request → multiple Suspense boundaries that each await reason(ci, score) share a
// single Gemini call instead of firing it several times.
export const reason = cache(async (
  ci: CompanyIntelligence,
  score: ScoreResult,
): Promise<ReasonResult> => {
  const packet = evidencePacket(ci, score);

  if (!has.gemini()) {
    return { thesis: fallbackThesis(ci, score), mode: "SIMULATED", engine: "EQUENCY Reasoning Engine" };
  }

  const parsed = await callGemini(packet);
  if (parsed) return { thesis: parsed, mode: "LIVE", engine: "EQUENCY Reasoning Engine" };
  // Honest degradation: never fail the page, fall back clearly labelled.
  return { thesis: fallbackThesis(ci, score), mode: "SIMULATED", engine: "EQUENCY Reasoning Engine" };
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Extract the JSON text part, skipping any "thinking" parts a model may prepend. */
function extractJson<T>(data: unknown): T | null {
  const parts =
    (data as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> })
      ?.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    if (!p.text) continue;
    try {
      return JSON.parse(p.text) as T;
    } catch {
      /* not the JSON part */
    }
  }
  return null;
}

async function callGemini(packet: string): Promise<Thesis | null> {
  const parsed = await generateStructured<Thesis>(SYSTEM, `EVIDENCE:\n${packet}`, RESPONSE_SCHEMA);
  if (!parsed) return null;
  parsed.confidence = Math.max(0, Math.min(1, Number(parsed.confidence) || 0));
  return parsed;
}

/** Generic structured generation: configured model → lighter fallback; retry 503/429. */
async function generateStructured<T>(system: string, user: string, schema: object): Promise<T | null> {
  const models = [GEMINI_MODEL, "gemini-flash-lite-latest"].filter((m, i, a) => a.indexOf(m) === i);
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: user }] }],
    generationConfig: { responseMimeType: "application/json", responseSchema: schema, temperature: 0.3 },
  });
  for (const model of models) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body, cache: "no-store" },
        );
        if (res.status === 503 || res.status === 429) { await sleep(400 * (attempt + 1)); continue; }
        if (!res.ok) break;
        const parsed = extractJson<T>(await res.json());
        if (parsed) return parsed;
        break;
      } catch {
        await sleep(300);
      }
    }
  }
  return null;
}

// ---- Strategy recommendation reasoning (Phase 2) ----

export interface RecoReasoning {
  summary: string;
  whySelected: string[];
  risks: string[];
  fitRationale: string;
}

const RECO_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    whySelected: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    fitRationale: { type: "string" },
  },
  required: ["summary", "whySelected", "risks", "fitRationale"],
} as const;

const RECO_SYSTEM = `You are the EQUENCY Reasoning Engine explaining why a newly-public company
was ranked for a specific investment strategy. Rules:
- Use ONLY the provided evidence (company signals + deterministic strategy-fit). Invent nothing.
- The strategy FIT and score are deterministic inputs · explain them, don't recompute or override.
- Tie every point to the strategy's focus. Technical, institutional, concise. No hype, no chain-of-thought.
Return strictly as JSON matching the schema.`;

export async function reasonRecommendation(
  evidence: string,
): Promise<{ reasoning: RecoReasoning; mode: "LIVE" | "SIMULATED"; engine: string }> {
  if (!has.gemini()) {
    return { reasoning: recoFallback(), mode: "SIMULATED", engine: "EQUENCY Reasoning Engine" };
  }
  const out = await generateStructured<RecoReasoning>(RECO_SYSTEM, `EVIDENCE:\n${evidence}`, RECO_SCHEMA);
  if (out) return { reasoning: out, mode: "LIVE", engine: "EQUENCY Reasoning Engine" };
  return { reasoning: recoFallback(), mode: "SIMULATED", engine: "EQUENCY Reasoning Engine" };
}

function recoFallback(): RecoReasoning {
  return {
    summary: "Ranking derived from deterministic strategy-fit over the Intelligence Core; narrative pending model synthesis.",
    whySelected: ["Deterministic fit score computed from available intelligence dimensions"],
    risks: ["Newly public · limited public-market history"],
    fitRationale: "See the fit breakdown for the per-dimension contributions.",
  };
}

/** Deterministic, fully explainable thesis used when the model is unavailable. */
function fallbackThesis(ci: CompanyIntelligence, score: ScoreResult): Thesis {
  const s = score.overall ?? 50;
  const mom = score.dimensions.find((d) => d.key === "momentum")?.value ?? null;
  const direction: ThesisDirection =
    s >= 70 ? "STRENGTHENING" : s >= 55 ? "NEUTRAL" : s >= 45 ? "CAUTIOUS" : "WEAKENING";
  const drivers: string[] = [];
  const n13 = ci.filings.filter((f) => f.form.toUpperCase().startsWith("SCHEDULE 13")).length;
  if (n13 > 0) drivers.push(`${n13} >5% ownership disclosure(s) on file (SEC)`);
  if (mom != null && mom > 55) drivers.push("positive near-term price momentum (Finnhub)");
  if (!drivers.length) drivers.push("limited post-IPO signal so far");
  return {
    direction,
    confidence: ci.market.mode === "LIVE" ? 0.5 : 0.35,
    summary: `${ci.identity.name} is ${ci.ipo.daysPublic ?? "?"} days public; thesis derived from deterministic signals pending model synthesis.`,
    keyDrivers: drivers,
    risks: score.dimensions.find((d) => d.key === "risk")?.basis.split(", ").filter(Boolean) ?? ["newly public"],
    catalysts: ["first earnings as a public company", "lock-up expiry", "new SEC filings"],
  };
}
