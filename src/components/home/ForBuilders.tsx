"use client";

import Link from "next/link";
import { useState } from "react";
import { Display } from "@/components/brand";

const SNIPPET = `// Every recommendation is structured and evidence-first — never free-form prose.
type Thesis = {
  direction: "STRENGTHENING" | "NEUTRAL" | "CAUTIOUS" | "WEAKENING"
  confidence: number            // 0..1
  summary:   string
  keyDrivers: string[]
  risks:      string[]
  catalysts:  string[]
}

// Deployment is proven from chain state, not a deploy log.
const { reachable, factoryHasCode, vaultCount } =
  await readVaultLiveness()      // viem eth_call → Robinhood Chain`;

export function ForBuilders() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(SNIPPET); setCopied(true); setTimeout(() => setCopied(false), 1400); } catch { /* ignore */ }
  };
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="max-w-md">
          <Display as="h2" className="text-[clamp(1.7rem,3.6vw,2.6rem)]">Built on real structure.</Display>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Structured outputs, deterministic scoring, and on-chain state you can verify yourself.
            Honest by construction.
          </p>
          <div className="mt-6 flex flex-wrap gap-5 text-sm">
            <Link href="/explore" className="font-medium text-[color:var(--color-accent)] transition-opacity hover:opacity-80">Explore the universe →</Link>
            <a href="https://www.sec.gov/edgar" target="_blank" rel="noreferrer" className="text-muted-foreground transition-colors hover:text-foreground">SEC EDGAR ↗</a>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-lg border border-border bg-[color:var(--color-panel)]">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="label normal-case tracking-normal text-muted-foreground">intelligence.ts</span>
            <button onClick={copy} className="label transition-colors hover:text-foreground">{copied ? "copied" : "copy"}</button>
          </div>
          <pre className="mono overflow-x-auto px-4 py-4 text-xs leading-relaxed text-foreground/85"><code>{SNIPPET}</code></pre>
        </div>
      </div>
    </section>
  );
}
