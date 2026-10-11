import type { Metadata } from "next";
import { PairCoreLab } from "@/components/lab/PairCoreLab";

// PHASE 02 · live, linked from /orion: Project ORION's "Stock-Paired Tokens on Pons" phase,
// reading real Robinhood Chain + shrine.trade data.
export const metadata: Metadata = {
  title: "Pair Core · Phase 02 · EQUENCY",
  description: "Every stock-paired token on Pons gets its own Mind: the stock it is priced in, and the token onchain, read as one asset.",
};

export default function PairCoreLabPage() {
  return (
    <main className="page-main">
      <PairCoreLab />
    </main>
  );
}


