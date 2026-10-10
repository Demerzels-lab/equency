import type { Metadata } from "next";
import { PairCoreLab } from "@/components/lab/PairCoreLab";

// PHASE 02 · R&D preview. Not in the nav, not indexed: an internal build of the Roadmap's
// "Newly Launched Stock-Paired Tokens" phase, reading real Robinhood Chain data.
export const metadata: Metadata = {
  title: "Pair Core · Lab · EQUENCY",
  robots: { index: false, follow: false },
};

export default function PairCoreLabPage() {
  return (
    <main className="page-main">
      <PairCoreLab />
    </main>
  );
}
