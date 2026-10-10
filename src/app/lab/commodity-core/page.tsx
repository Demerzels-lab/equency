import type { Metadata } from "next";
import { CommodityCoreLab } from "@/components/lab/CommodityCoreLab";

// PHASE 04 · R&D (Roadmap · conditional). Not in the nav, not indexed: an internal build of the
// Roadmap's "Newly Tokenized Commodities" phase, reading real futures + onchain data.
export const metadata: Metadata = {
  title: "Commodity Core · Lab · EQUENCY",
  robots: { index: false, follow: false },
};

export default function CommodityCoreLabPage() {
  return (
    <main className="page-main">
      <CommodityCoreLab />
    </main>
  );
}
