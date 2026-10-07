import type { Metadata } from "next";
import { Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TopBar } from "@/components/TopBar";
import { SiteFooter } from "@/components/SiteFooter";
import { GrainOverlay } from "@/components/GrainOverlay";
import { CommandPalette } from "@/components/CommandPalette";
import { TopProgress } from "@/components/TopProgress";
import { CompareBar } from "@/components/CompareBar";
import { GlobalAmbient } from "@/components/immersive/GlobalAmbient";
import { Intro } from "@/components/immersive/Intro";
import { WalletProvider } from "@/components/wallet/WalletProvider";
import { cn } from "@/lib/utils";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EQUENCY · Intelligence for the newly public",
  description:
    "Every newly public company gets an Intelligence Core that continuously researches its market, business and signals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("dark", archivo.variable, mono.variable)}>
      <body className="font-sans">
        <GlobalAmbient />
        <WalletProvider>
          <TopBar />
          {children}
          <SiteFooter />
        </WalletProvider>
        <TopProgress />
        <CompareBar />
        <GrainOverlay />
        <CommandPalette />
        <Intro />
      </body>
    </html>
  );
}
