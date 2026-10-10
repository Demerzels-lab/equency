import type { Metadata } from "next";
import { TokenCoreLab } from "@/components/lab/TokenCoreLab";

// PHASE 01 · public preview, linked from /roadmap: the Roadmap's "Newly Tokenized Stocks" phase,
// reading real SEC EDGAR + Robinhood Chain data. Still in development.
export const metadata: Metadata = {
  title: "Token Core · Phase 01 preview · EQUENCY",
  description: "Every newly tokenized stock gets its own Intelligence Core: the company underneath and its token on Robinhood Chain, read as one asset.",
};

export default function TokenCoreLabPage() {
  return (
    <main className="page-main">
      <TokenCoreLab />
    </main>
  );
}
