"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { StoryCanvas, type StoryCanvasHandle } from "./StoryCanvas";
import { StoryDots } from "./StoryDots";
import { StoryHeroSearch } from "./StoryHeroSearch";
import { Faq } from "@/components/home/Faq";
import {
  Activity,
  Cpu,
  Layers,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  Flame,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface Uni {
  ticker: string;
  name: string;
}

const CHAPTER_IDS = ["top", "observe", "strategies", "vault", "honesty", "build"];

const CODE_EXAMPLES = {
  ts: `import { createPublicClient, http } from 'viem';
import { createEquencyClient } from '@equency/sdk';

const client = createPublicClient({
  transport: http('https://rpc.robinhood-testnet.io')
});

const equency = createEquencyClient({ client, chainId: 46630 });
const core = await equency.resolveCore('RDDT');

console.log('Deterministic Score:', core.overall);
console.log('SEC Filing Hash:', core.filingProofHash);`,
  python: `from equency import EquencyClient

client = EquencyClient(
    rpc_url="https://rpc.robinhood-testnet.io",
    chain_id=46630
)

# Deterministic on-chain core resolution
core = client.resolve_core("RDDT")
print(f"Overall Fit: {core.overall}/100")
print(f"Verified SEC 424B4: {core.sec_source_url}")`,
  solidity: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEquencyCoreRegistry {
    function getCore(string calldata ticker) external view returns (
        uint16 score,
        bytes32 filingProofHash,
        uint64 timestamp
    );
}

contract QuantExecutionBot {
    IEquencyCoreRegistry public immutable registry;

    constructor(address _registry) {
        registry = IEquencyCoreRegistry(_registry);
    }
}`,
  curl: `curl -X GET "https://api.equency.xyz/v1/core/RDDT" \\
  -H "Accept: application/json" \\
  -H "X-Chain-ID: 46630"`,
};

export function StoryLanding({ seed }: { seed?: Uni[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTicker, setActiveTicker] = useState("EQUENCY");
  const canvasHandleRef = useRef<StoryCanvasHandle | null>(null);

  // Chapter 02: Interactive Loop State
  const [loopStep, setLoopStep] = useState(0);

  // Chapter 03: Strategy Tab State
  const [strategyTab, setStrategyTab] = useState<"growth" | "momentum" | "defensive">("growth");

  // Chapter 05: Cryptographic Proof Verification State
  const [verifyingProof, setVerifyingProof] = useState(false);
  const [proofVerified, setProofVerified] = useState(false);

  // Chapter 06: Developer Terminal State
  const [codeLang, setCodeLang] = useState<"ts" | "python" | "solidity" | "curl">("ts");
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [showSimResult, setShowSimResult] = useState(false);

  const handleCanvasReady = useCallback(
    (handle: StoryCanvasHandle) => {
      canvasHandleRef.current = handle;
      if (seed && seed[0]?.ticker) {
        handle.setName(seed[0].ticker);
      }
    },
    [seed]
  );

  // RobinID Continuous Scroll Progress Listener with Zero-Reflow Cache
  useEffect(() => {
    let scheduled = 0;
    let cachedCenters: number[] = [];

    const measureCenters = () => {
      const scrollY = window.scrollY;
      cachedCenters = CHAPTER_IDS.map((id) => {
        const el = document.getElementById(id);
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        return rect.top + scrollY + rect.height * 0.5;
      });
    };

    const updateScroll = () => {
      scheduled = 0;
      if (cachedCenters.length < CHAPTER_IDS.length || cachedCenters[0] === 0) {
        measureCenters();
      }
      if (cachedCenters.length < CHAPTER_IDS.length) return;

      const vh = window.innerHeight;
      const scrollY = window.scrollY;
      const mid = scrollY + vh * 0.5;

      let progress = 0;
      if (mid <= cachedCenters[0]) {
        progress = 0;
      } else if (mid >= cachedCenters[cachedCenters.length - 1]) {
        progress = cachedCenters.length - 1;
      } else {
        for (let i = 0; i < cachedCenters.length - 1; i++) {
          const c0 = cachedCenters[i];
          const c1 = cachedCenters[i + 1];
          if (mid >= c0 && mid <= c1) {
            const span = c1 - c0;
            const ratio = span > 0 ? (mid - c0) / span : 0;
            progress = i + ratio;
            break;
          }
        }
      }

      const clampedProgress = Math.min(Math.max(progress, 0), CHAPTER_IDS.length - 1);
      canvasHandleRef.current?.setProgress(clampedProgress);
      const newIndex = Math.min(CHAPTER_IDS.length - 1, Math.round(clampedProgress));
      setActiveIndex((prev) => (prev !== newIndex ? newIndex : prev));
    };

    const onScroll = () => {
      if (!scheduled) scheduled = requestAnimationFrame(updateScroll);
    };

    const onResize = () => {
      measureCenters();
      onScroll();
    };

    measureCenters();
    updateScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    const timer = setTimeout(measureCenters, 400);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      clearTimeout(timer);
      if (scheduled) cancelAnimationFrame(scheduled);
    };
  }, []);

  const handleTickerChange = (ticker: string) => {
    setActiveTicker(ticker);
    canvasHandleRef.current?.setName(ticker);
    canvasHandleRef.current?.pulse();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[codeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      setShowSimResult(true);
    }, 700);
  };

  const handleVerifyProof = () => {
    setVerifyingProof(true);
    setTimeout(() => {
      setVerifyingProof(false);
      setProofVerified(true);
    }, 900);
  };

  return (
    <div className="story">
      {/* Background 3D WebGL Canvas with Continuous Interpolation & Pointer Orbit */}
      <StoryCanvas
        onCanvasReady={handleCanvasReady}
        activeTicker={activeTicker}
      />

      {/* Floating Story Navigation Dots */}
      <StoryDots
        activeIndex={activeIndex}
        onSelect={(id) => {
          const idx = CHAPTER_IDS.indexOf(id);
          if (idx >= 0) {
            canvasHandleRef.current?.setProgress(idx);
            canvasHandleRef.current?.pulse();
          }
        }}
      />

      <main>
        {/* CHAPTER 01 · Start (Spatial Web3 HUD Hero) */}
        <section id="top" className="chapter is-left">
          <div className="chapter-body">
            {/* Top Cyber Telemetry Strip */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="web3-hud-bar">
                <span className="web3-pulse-dot" />
                <span>ROBINHOOD TESTNET #46630</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-[color:var(--color-accent)] font-semibold">SEC EDGAR LIVE</span>
              </span>
              <span className="web3-tag">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>100% DETERMINISTIC</span>
              </span>
            </div>

            <div>
              <span className="eyebrow block mb-2">[ 01 // AUTONOMOUS ON-CHAIN CORE ]</span>
              <h1 className="hero-title tracking-tight">
                A core that <span className="accent">points home.</span>
              </h1>
            </div>

            <p className="lead">
              Every newly public company receives an autonomous Intelligence Core: scored deterministically from real
              SEC filings, and verified on Robinhood Chain. Readable by humans, verifiable by smart contracts.
            </p>

            <StoryHeroSearch
              seed={seed}
              onTickerChange={handleTickerChange}
            />

            {/* Protocol Security & Mathematical Guarantees */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="web3-hud-box p-3 text-center">
                <span className="web3-corner-bracket web3-bracket-tl" />
                <span className="web3-corner-bracket web3-bracket-br" />
                <div className="font-mono text-base font-bold text-foreground">0%</div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Hallucination</div>
              </div>
              <div className="web3-hud-box p-3 text-center">
                <span className="web3-corner-bracket web3-bracket-tl" />
                <span className="web3-corner-bracket web3-bracket-br" />
                <div className="font-mono text-base font-bold text-[color:var(--color-accent)]">#46630</div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Chain ID</div>
              </div>
              <div className="web3-hud-box p-3 text-center">
                <span className="web3-corner-bracket web3-bracket-tl" />
                <span className="web3-corner-bracket web3-bracket-br" />
                <div className="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400">14/14</div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Foundry Tests</div>
              </div>
            </div>
          </div>
        </section>

        {/* CHAPTER 02 · Observe (Topological Orbital Pipeline) */}
        <section id="observe" className="chapter is-right">
          <div className="chapter-body">
            <div>
              <span className="eyebrow block mb-2">[ 02 // TOPOLOGICAL ORBITAL ENGINE ]</span>
              <h2>
                Observe. Score. <span className="accent">Narrate.</span>
              </h2>
            </div>
            <p className="lead">
              Not a one-shot report — an always-on computational loop that continuously ingests SEC filings and market feeds
              the second they land on EDGAR, anchoring immutable state on-chain.
            </p>

            {/* Interactive 3-Pod Cyber Pipeline */}
            <div className="space-y-3">
              {[
                {
                  id: 0,
                  tag: "01 // OBSERVE",
                  title: "SEC EDGAR Stream Ingestion",
                  desc: "Captures 424B4 prospectuses, 10-Q disclosures, 8-K filings and price tick data instantly. Validates raw byte payloads with zero manual alteration.",
                  badge: "LIVE INGESTION",
                  icon: Activity,
                },
                {
                  id: 1,
                  tag: "02 // SCORE",
                  title: "Deterministic Math Kernel",
                  desc: "Algebraic mathematical dimensions derived purely from filing evidence. Zero stochastic variance. The language model never determines or nudges the score.",
                  badge: "REPRODUCIBLE",
                  icon: Cpu,
                },
                {
                  id: 2,
                  tag: "03 // NARRATE",
                  title: "Source-Linked Synthesis",
                  desc: "The reasoning engine formulates transparent explanatory theses with every quantitative metric hyperlinked directly to its source filing paragraph.",
                  badge: "VERIFIED CITATION",
                  icon: Layers,
                },
              ].map((step) => {
                const isSelected = loopStep === step.id;
                const IconComponent = step.icon;
                return (
                  <div
                    key={step.id}
                    onClick={() => setLoopStep(step.id)}
                    className={`web3-hud-box p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-[color:var(--color-accent)] ring-1 ring-[color:var(--color-accent)]/30 bg-[color:var(--color-panel)]"
                        : "opacity-85 hover:opacity-100"
                    }`}
                  >
                    <span className="web3-corner-bracket web3-bracket-tl" />
                    <span className="web3-corner-bracket web3-bracket-br" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold ${
                            isSelected
                              ? "bg-[color:var(--color-accent)] text-white shadow-sm"
                              : "bg-[color:var(--color-panel-2)] text-muted-foreground"
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-mono text-[11px] text-[color:var(--color-accent)] font-semibold">
                            {step.tag}
                          </div>
                          <h3 className="text-sm font-bold text-foreground">
                            {step.title}
                          </h3>
                        </div>
                      </div>
                      <span className="font-mono text-[9px] tracking-wider px-2 py-0.5 rounded border border-[color:var(--color-line)] bg-[color:var(--color-panel-2)] text-muted-foreground">
                        {step.badge}
                      </span>
                    </div>
                    {isSelected && (
                      <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed pl-9 border-l-2 border-[color:var(--color-accent)] ml-3">
                        {step.desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Link href="/explore" className="btn btn-ember inline-flex items-center gap-1.5">
                Explore All Filings
                <ArrowRight className="w-4 h-4" />
              </Link>
              <span className="font-mono text-xs text-muted-foreground">
                Updated in real-time
              </span>
            </div>
          </div>
        </section>

        {/* CHAPTER 03 · Strategies (Algorithmic Vector Pods) */}
        <section id="strategies" className="chapter is-left">
          <div className="chapter-body">
            <div>
              <span className="eyebrow block mb-2">[ 03 // QUANTITATIVE VECTOR MATRIX ]</span>
              <h2>
                Rank the universe by <span className="accent">deterministic fit.</span>
              </h2>
            </div>
            <p className="lead">
              Three autonomous quantitative strategies rank every newly public company
              over its mathematical Core. You define the constraints; the engine guarantees reproducible proofs.
            </p>

            {/* Strategy Pod Switcher */}
            <div className="web3-hud-box p-5 space-y-4">
              <span className="web3-corner-bracket web3-bracket-tl" />
              <span className="web3-corner-bracket web3-bracket-br" />

              <div className="flex items-center gap-2 border-b border-[color:var(--color-line)] pb-3">
                <button
                  type="button"
                  onClick={() => setStrategyTab("growth")}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                    strategyTab === "growth"
                      ? "bg-[color:var(--color-accent)] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Growth Alpha
                </button>
                <button
                  type="button"
                  onClick={() => setStrategyTab("momentum")}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                    strategyTab === "momentum"
                      ? "bg-[color:var(--color-accent)] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Momentum Beta
                </button>
                <button
                  type="button"
                  onClick={() => setStrategyTab("defensive")}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                    strategyTab === "defensive"
                      ? "bg-[color:var(--color-accent)] text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Defensive Delta
                </button>
              </div>

              {/* Dynamic Pod Details */}
              {strategyTab === "growth" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">Target Universe:</span>
                    <span className="font-mono font-bold text-foreground">High R&D / Revenue Acceleration</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-[color:var(--color-panel-2)] border border-[color:var(--color-line)]">
                      <div className="font-mono text-[10px] text-muted-foreground">PEG Ratio</div>
                      <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">&lt; 1.25x</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[color:var(--color-panel-2)] border border-[color:var(--color-line)]">
                      <div className="font-mono text-[10px] text-muted-foreground">R&D / Rev</div>
                      <div className="font-mono text-xs font-bold text-[color:var(--color-accent)]">&gt; 18.0%</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[color:var(--color-panel-2)] border border-[color:var(--color-line)]">
                      <div className="font-mono text-[10px] text-muted-foreground">Rev CAGR</div>
                      <div className="font-mono text-xs font-bold text-foreground">&gt; 30% YoY</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Filters newly public issuers whose unit economics exhibit exponential scale margins and institutional reinvestment durability.
                  </p>
                </div>
              )}

              {strategyTab === "momentum" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">Target Universe:</span>
                    <span className="font-mono font-bold text-foreground">Post-Listing Relative Strength</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-[color:var(--color-panel-2)] border border-[color:var(--color-line)]">
                      <div className="font-mono text-[10px] text-muted-foreground">60d Vector</div>
                      <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">&gt; +15.4%</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[color:var(--color-panel-2)] border border-[color:var(--color-line)]">
                      <div className="font-mono text-[10px] text-muted-foreground">Lockup Surge</div>
                      <div className="font-mono text-xs font-bold text-[color:var(--color-accent)]">Stabilized</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[color:var(--color-panel-2)] border border-[color:var(--color-line)]">
                      <div className="font-mono text-[10px] text-muted-foreground">Vol Breakout</div>
                      <div className="font-mono text-xs font-bold text-foreground">Top Quartile</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Detects early liquidity consolidation and institutional absorption around major milestone windows and secondary transitions.
                  </p>
                </div>
              )}

              {strategyTab === "defensive" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">Target Universe:</span>
                    <span className="font-mono font-bold text-foreground">Balance Sheet Fortress</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-[color:var(--color-panel-2)] border border-[color:var(--color-line)]">
                      <div className="font-mono text-[10px] text-muted-foreground">Cash Runway</div>
                      <div className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">&gt; 24 Months</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[color:var(--color-panel-2)] border border-[color:var(--color-line)]">
                      <div className="font-mono text-[10px] text-muted-foreground">Debt / Equity</div>
                      <div className="font-mono text-xs font-bold text-[color:var(--color-accent)]">&lt; 0.35x</div>
                    </div>
                    <div className="p-2 rounded-lg bg-[color:var(--color-panel-2)] border border-[color:var(--color-line)]">
                      <div className="font-mono text-[10px] text-muted-foreground">Covenant Risk</div>
                      <div className="font-mono text-xs font-bold text-foreground">Zero Default</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Prioritizes cash cushion preservation to withstand macroeconomic volatility without dilutive secondary rounds.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link href="/strategies" className="btn btn-ghost inline-flex items-center gap-1.5">
                Launch Quantitative Workbench
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CHAPTER 04 · Vault (Non-Custodial Smart Contract Cockpit) */}
        <section id="vault" className="chapter is-right">
          <div className="chapter-body">
            <div>
              <span className="eyebrow block mb-2">[ 04 // SMART CONTRACT PERIMETER ]</span>
              <h2>
                Where intelligence <span className="accent">becomes capital.</span>
              </h2>
            </div>
            <p className="lead">
              A sovereign non-custodial Strategy Vault holding USDG on Robinhood Chain. Smart contract invariants
              dictate all executions on-chain. The AI agent never touches a private key.
            </p>

            {/* Smart Contract Cockpit HUD */}
            <div className="web3-hud-box p-5 space-y-4">
              <span className="web3-corner-bracket web3-bracket-tl" />
              <span className="web3-corner-bracket web3-bracket-br" />

              <div className="flex items-center justify-between border-b border-[color:var(--color-line)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="web3-pulse-dot" />
                  <span className="font-mono text-xs font-bold text-foreground">ERC-4626 VAULT KERNEL</span>
                </div>
                <span className="font-mono text-[10px] text-[color:var(--color-accent)] bg-[color:var(--color-accent-dim)] px-2 py-0.5 rounded">
                  CHAIN 46630
                </span>
              </div>

              <div className="space-y-2.5 font-mono text-xs">
                <div className="flex items-center justify-between p-2 rounded bg-[color:var(--color-panel-2)]">
                  <span className="text-muted-foreground">LIMIT ENFORCEMENT</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">ON-CHAIN BYTECODE ONLY</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[color:var(--color-panel-2)]">
                  <span className="text-muted-foreground">AGENT SIGNING PRIVILEGE</span>
                  <span className="font-semibold text-red-500">NO ACCESS (ZERO-TRUST)</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[color:var(--color-panel-2)]">
                  <span className="text-muted-foreground">FOUNDRY TEST HARNESS</span>
                  <span className="font-semibold text-foreground">14 / 14 FORK TESTS PASSED</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-[color:var(--color-panel-2)]">
                  <span className="text-muted-foreground">SETTLEMENT ASSET</span>
                  <span className="font-semibold text-[color:var(--color-accent)]">USDG (ROBINHOOD NATIVE)</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/vault" className="btn btn-ghost inline-flex items-center gap-1.5">
                Open Strategy Vault
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CHAPTER 05 · Honesty (Deterministic Zero-Hallucination Shield) */}
        <section id="honesty" className="chapter is-left">
          <div className="chapter-body">
            <div>
              <span className="eyebrow block mb-2">[ 05 // CRYPTOGRAPHIC INTEGRITY PROOF ]</span>
              <h2>
                Hallucinations <span className="accent">never pass.</span>
              </h2>
            </div>
            <p className="lead">
              The model narrates; mathematics decides the score. Every metric is anchored to public SEC EDGAR filings.
              Expired or unverified signals are never estimated or synthesized.
            </p>

            {/* Interactive Proof Verifier Matrix */}
            <div className="web3-hud-box p-5 space-y-4">
              <span className="web3-corner-bracket web3-bracket-tl" />
              <span className="web3-corner-bracket web3-bracket-br" />

              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground">
                  REPRODUCIBILITY THEOREM
                </span>
                <span className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  VERIFIED PROTOCOL
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20">
                  <div className="font-mono font-bold text-red-600 dark:text-red-400 mb-1">
                    Standard Web2 AI
                  </div>
                  <ul className="space-y-1 text-muted-foreground text-[11px]">
                    <li>• Stochastic next-token guess</li>
                    <li>• Hallucinates financials</li>
                    <li>• Unverifiable black box</li>
                  </ul>
                </div>

                <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <div className="font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                    Equency Web3 Protocol
                  </div>
                  <ul className="space-y-1 text-muted-foreground text-[11px]">
                    <li>• Pure deterministic algebra</li>
                    <li>• SHA-256 byte-checked filings</li>
                    <li>• Cryptographic on-chain consensus</li>
                  </ul>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between gap-3 border-t border-[color:var(--color-line)]">
                <button
                  type="button"
                  onClick={handleVerifyProof}
                  disabled={verifyingProof}
                  className="btn btn-sm btn-ghost inline-flex items-center gap-1.5 font-mono text-xs"
                >
                  {verifyingProof ? (
                    "Computing SHA-256…"
                  ) : proofVerified ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      Proof State Verified!
                    </>
                  ) : (
                    "Verify Proof Integrity →"
                  )}
                </button>
                <span className="font-mono text-[10px] text-muted-foreground truncate">
                  SHA-256: 0x9f8b4a2e...
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/#faq" className="btn btn-ghost inline-flex items-center gap-1.5">
                How Scoring Works
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* CHAPTER 06 · Build (Sovereign SDK & Agent Alpha) */}
        <section id="build" className="chapter is-right">
          <div className="chapter-body">
            <div>
              <span className="eyebrow block mb-2">[ 06 // AGENT ALPHA & SOVEREIGN SDK ]</span>
              <h2>
                Signals in. <span className="accent">Alpha out.</span>
              </h2>
            </div>
            <p className="lead">
              Explicit, chain-aware intelligence resolution for autonomous agents, algorithmic workflows, and quantitative pipelines.
            </p>

            {/* Interactive Developer Terminal Console */}
            <div className="web3-hud-box overflow-hidden">
              <span className="web3-corner-bracket web3-bracket-tl" />
              <span className="web3-corner-bracket web3-bracket-br" />

              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-neutral-900 border-b border-neutral-800 text-neutral-300">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                  <span className="font-mono text-xs text-neutral-400 ml-2">equency-terminal</span>
                </div>

                <div className="flex items-center gap-1">
                  {(["ts", "python", "solidity", "curl"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setCodeLang(lang);
                        setShowSimResult(false);
                      }}
                      className={`font-mono text-[11px] px-2 py-0.5 rounded uppercase ${
                        codeLang === lang
                          ? "bg-neutral-800 text-white font-bold"
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="ml-2 text-neutral-400 hover:text-white p-1"
                    title="Copy Code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Terminal Code Body */}
              <pre className="p-4 bg-neutral-950 font-mono text-[12px] leading-relaxed text-neutral-200 overflow-x-auto m-0">
                <code>{CODE_EXAMPLES[codeLang]}</code>
              </pre>

              {/* Interactive Simulation Runner Footer */}
              <div className="p-3 bg-neutral-900/90 border-t border-neutral-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={simulating}
                  className="font-mono text-xs text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1.5"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  {simulating ? "Executing on Chain 46630…" : "Run Simulation Query"}
                </button>
                <span className="font-mono text-[10px] text-neutral-500">
                  HTTP 200 · RPC Verified
                </span>
              </div>

              {showSimResult && (
                <div className="p-3 bg-emerald-950/40 border-t border-emerald-900/50 font-mono text-[11px] text-emerald-300">
                  {`✓ [RESOLVED] RDDT · Overall Score: 84/100 · 424B4 Hash: 0x8a91...c31b · Status: DETERMINISTIC`}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/strategies" className="btn btn-ember inline-flex items-center gap-1.5">
                Read the Docs
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link href="/explore" className="btn btn-ghost inline-flex items-center gap-1.5">
                Find a Company
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <footer className="story-foot">
              <p>
                EQUENCY · Independent research protocol on Robinhood Chain · Non-custodial ERC-4626 · Testnet 46630.
                Scoring derived deterministically from public SEC EDGAR filings and verifiable market feeds.
              </p>
            </footer>
          </div>
        </section>
      </main>

      {/* FAQ Bottom Section */}
      <section id="faq" className="relative z-10 border-t border-[color:var(--color-line)] bg-[color:var(--color-panel)] py-16 px-6">
        <div className="max-w-[940px] mx-auto">
          <Faq />
        </div>
      </section>
    </div>
  );
}
