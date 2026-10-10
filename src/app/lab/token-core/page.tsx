import type { Metadata } from "next";
import { TokenCoreLab } from "@/components/lab/TokenCoreLab";

// PHASE 01 · R&D preview. Not in the nav, not indexed: an internal build of the Roadmap's
// "Newly Tokenized Stocks" phase, reading real SEC EDGAR + Robinhood Chain data.
export const metadata: Metadata = {
  title: "Token Core · Lab · EQUENCY",
  robots: { index: false, follow: false },
};

export default function TokenCoreLabPage() {
  return (
    <main className="page-main">
      <TokenCoreLab />
    </main>
  );
}
