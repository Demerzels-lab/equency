import type { Metadata } from "next";
import { TokenCoreLab } from "@/components/lab/TokenCoreLab";

// PHASE 01 · live, linked from /orion: Project ORION's "Newly Tokenized Stocks" phase,
// reading real SEC EDGAR + Robinhood Chain data.
export const metadata: Metadata = {
  title: "Token Core · Phase 01 · EQUENCY",
  description: "Every newly tokenized stock gets its own Intelligence Core: the company underneath and its token on Robinhood Chain, read as one asset.",
};

export default function TokenCoreLabPage() {
  return (
    <main className="page-main">
      <TokenCoreLab />
    </main>
  );
}
