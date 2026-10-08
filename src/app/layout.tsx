import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Outfit, Syncopate } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { SmoothScroll } from "@/components/site/SmoothScroll";
import { CommandPalette } from "@/components/CommandPalette";
import { TopProgress } from "@/components/TopProgress";
import { CompareBar } from "@/components/CompareBar";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { cn } from "@/lib/utils";

const outfit = Outfit({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-outfit", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const syncopate = Syncopate({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-syncopate", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-jbmono", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "EQUENCY · Intelligence for the newly public",
    template: "%s",
  },
  description:
    "Every newly public company gets an Intelligence Core that continuously researches its market, business and signals.",
};

export const viewport: Viewport = { themeColor: "#f6f6f2" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn(outfit.variable, inter.variable, syncopate.variable, mono.variable)}>
      <body className="min-h-screen font-sans text-foreground antialiased">
        <div className="page-bg" aria-hidden />
        <SmoothScroll />
        <WalletProvider>
          <Header />
          <div className="relative isolate">{children}</div>
          <Footer />
        </WalletProvider>
        <TopProgress />
        <CompareBar />
        <CommandPalette />
      </body>
    </html>
  );
}
