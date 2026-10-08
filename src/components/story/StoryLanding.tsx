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
  const [scrollY, setScrollY] = useState(0);
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

  // Continuous Scroll Progress Listener with Zero-Reflow Cache
  useEffect(() => {
    let scheduled = 0;
    let cachedCenters: number[] = [];

    const measureCenters = () => {
      const currentScrollY = window.scrollY;
      cachedCenters = CHAPTER_IDS.map((id) => {
        const el = document.getElementById(id);
        if (!el) return 0;
        const rect = el.getBoundingClientRect();
        return rect.top + currentScrollY + rect.height * 0.5;
      });
    };

    const updateScroll = () => {
      scheduled = 0;
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);

      if (cachedCenters.length < CHAPTER_IDS.length || cachedCenters[0] === 0) {
        measureCenters();
      }
      if (cachedCenters.length < CHAPTER_IDS.length) return;

      const vh = window.innerHeight;
      const mid = currentScrollY + vh * 0.5;

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

  // Kinetic Hero Word Definitions with directional offsets (EigenLayer style)
  const HERO_WORDS = [
    { word: "Verifiable", dx: -70, dy: -40 },
    { word: "intelligence", dx: 60, dy: -50 },
    { word: "for", dx: -40, dy: 30 },
    { word: "the", dx: 30, dy: -25 },
    { word: "Newly", dx: -50, dy: 45 },
    { word: "Public", dx: 70, dy: 50 },
  ];

  // Calculate kinetic offset: words disperse as user scrolls past hero
  const heroDispersal = Math.min(Math.max((scrollY - 40) / 400, 0), 1);

  return (
    <div className="story bg-[#f8fafc] text-slate-900">
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

      <main className="relative z-20">
        {/* ── 1. EIGENLAYER HERO (section-hero) with Kinetic Word Convergence ── */}
        <section id="top" className="section-hero">
          <div className="section-hero-inner">
            {/* Top Micro-Telemetry Tag */}
            <div className="mb-6 flex items-center justify-center gap-2">
              <span className="font-mono text-xs text-[#0284c7] font-semibold uppercase tracking-widest px-3.5 py-1.5 rounded-full bg-sky-50 border border-sky-200/80 shadow-xs">
                ● ROBINHOOD TESTNET #46630 // AGENTIC VERIFIABILITY
              </span>
            </div>

            {/* Kinetic Typography Title */}
            <h1 className="section-hero-title">
              <span className="inline-flex flex-wrap justify-center gap-x-4 gap-y-1">
                {HERO_WORDS.map((item, idx) => {
                  const tx = item.dx * heroDispersal;
                  const ty = item.dy * heroDispersal;
                  const op = 1 - heroDispersal * 0.75;
                  return (
                    <span
                      key={idx}
                      className="section-hero-word text-slate-900"
                      style={{
                        transform: `translate3d(${tx}px, ${ty}px, 0)`,
                        opacity: op,
                      }}
                    >
                      {item.word}
                    </span>
                  );
                })}
              </span>
            </h1>

            {/* Hero Subtitle */}
            <p className="section-hero-body text-slate-600">
              Build apps, strategies, and agents your users can trust. Backed by deterministic math on SEC filings and verified on Robinhood Chain.
            </p>

            {/* CTA Group */}
            <div className="flex flex-wrap items-center justify-center gap-4 mb-10">
              <Link href="/explore" className="eigen-btn-cta">
                Start building now
              </Link>
              <Link href="/strategies" className="eigen-link font-mono text-sm text-[#0284c7] hover:text-[#0369a1] font-semibold">
                Explore strategies
              </Link>
            </div>

            {/* Integrated Ticker Search & Live Dossier */}
            <div className="w-full max-w-2xl text-left">
              <StoryHeroSearch
                seed={seed}
                onTickerChange={handleTickerChange}
              />
            </div>
          </div>
        </section>

        {/* ── 2. CENTRAL STATEMENT CARD (section-text-card) ── */}
        <section className="section-text-card border-t border-slate-200 bg-gradient-to-b from-transparent via-sky-50/50 to-transparent">
          <div className="section-text-card-inner">
            <h2 className="section-text-card-heading">
              AI can&apos;t scale if newly public intelligence can&apos;t be verified
            </h2>
            <p className="section-text-card-text text-slate-600">
              As autonomous agents and quantitative models take on higher stakes execution, user trust and protocol accountability become critical. With Equency, you can build autonomous models that perform exactly as proven on-chain.
            </p>
            <div className="pt-2">
              <Link href="/explore" className="eigen-btn-cta">
                Explore the universe
              </Link>
            </div>
          </div>
        </section>

        {/* ── 3. PRIMITIVES SIDE CARDS (section-text-card-side is-left / is-right) ── */}
        <div className="relative z-20 space-y-4">
          {/* Primitive 1: EquencyObserve (is-left) */}
          <section id="observe" className="section-text-card-side is-left">
            <div className="section-text-card-side-inner bg-white/95 p-8 rounded-2xl border border-slate-200 hover:border-sky-300 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-xl">
              <div className="font-mono text-xs uppercase tracking-widest text-[#0284c7] font-semibold">
                01 // PRIMITIVE
              </div>
              <h2 className="section-text-card-side-heading">
                EquencyObserve
              </h2>
              <p className="section-text-card-side-text text-slate-600">
                Add cryptographic trust to SEC disclosures with zero latency. Real-time ingestion of 424B4 prospectuses, 10-Q disclosures, and insider 8-K filings the second they land on EDGAR feeds.
              </p>
              <div className="pt-3">
                <Link href="/explore" className="eigen-link font-mono text-xs text-[#0284c7] hover:text-[#0369a1] font-semibold">
                  Explore EquencyObserve
                </Link>
              </div>
            </div>
          </section>

          {/* Primitive 2: EquencyScore (is-right) */}
          <section id="strategies" className="section-text-card-side is-right">
            <div className="section-text-card-side-inner bg-white/95 p-8 rounded-2xl border border-slate-200 hover:border-sky-300 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-xl">
              <div className="font-mono text-xs uppercase tracking-widest text-[#0284c7] font-semibold">
                02 // PRIMITIVE
              </div>
              <h2 className="section-text-card-side-heading">
                EquencyScore
              </h2>
              <p className="section-text-card-side-text text-slate-600">
                Financial intelligence you can prove. Deterministic scoring matrices computed purely from disclosure evidence. Zero stochastic hallucination, 100% reproducible across independent nodes.
              </p>
              <div className="pt-3">
                <Link href="/strategies" className="eigen-link font-mono text-xs text-[#0284c7] hover:text-[#0369a1] font-semibold">
                  Explore EquencyScore
                </Link>
              </div>
            </div>
          </section>

          {/* Primitive 3: EquencyVault (is-left) */}
          <section id="vault" className="section-text-card-side is-left">
            <div className="section-text-card-side-inner bg-white/95 p-8 rounded-2xl border border-slate-200 hover:border-sky-300 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-xl">
              <div className="font-mono text-xs uppercase tracking-widest text-[#0284c7] font-semibold">
                03 // PRIMITIVE
              </div>
              <h2 className="section-text-card-side-heading">
                EquencyVault
              </h2>
              <p className="section-text-card-side-text text-slate-600">
                Where intelligence becomes capital. Sovereign ERC-4626 non-custodial strategy vault holding USDG on Robinhood Chain (#46630). Limits enforced on-chain; the AI never touches private keys.
              </p>
              <div className="pt-3">
                <Link href="/vault" className="eigen-link font-mono text-xs text-[#0284c7] hover:text-[#0369a1] font-semibold">
                  Explore EquencyVault
                </Link>
              </div>
            </div>
          </section>

          {/* Primitive 4: EquencyAlpha (is-right) */}
          <section id="honesty" className="section-text-card-side is-right">
            <div className="section-text-card-side-inner bg-white/95 p-8 rounded-2xl border border-slate-200 hover:border-sky-300 transition-all duration-300 shadow-sm hover:shadow-md backdrop-blur-xl">
              <div className="font-mono text-xs uppercase tracking-widest text-[#0284c7] font-semibold">
                04 // PRIMITIVE
              </div>
              <h2 className="section-text-card-side-heading">
                EquencyAlpha
              </h2>
              <p className="section-text-card-side-text text-slate-600">
                The compute foundation for agentic finance. High-throughput JSON endpoints and Viem/Python interfaces for quants and autonomous execution bots. Drop-in Coinbase AgentKit compatibility.
              </p>
              <div className="pt-3">
                <Link href="#build" className="eigen-link font-mono text-xs text-[#0284c7] hover:text-[#0369a1] font-semibold">
                  Explore EquencyAlpha
                </Link>
              </div>
            </div>
          </section>
        </div>

        {/* ── 4. NUMBERED LOGO & USE-CASE CARDS (section-logoCards 01-04) ── */}
        <section className="section-logoCards border-t border-slate-200 bg-[#f8fafc] relative z-20">
          <div className="section-logoCards-header">
            <h2 className="section-text-card-heading">
              Support for any newly public use case
            </h2>
            <p className="section-text-card-text text-slate-600">
              Whether it&apos;s real-time IPO discovery, autonomous agents, or algorithmic vaults, Equency gives you verifiable primitives for newly public equities.
            </p>
          </div>

          <div className="section-logoCards-cards">
            {/* Card 01 */}
            <div className="section-logoCards-card">
              <div className="section-logoCards-card-index">01</div>
              <h3 className="section-logoCards-card-heading">Insured IPO Discovery</h3>
              <p className="section-logoCards-card-text">
                Protocol-level guarantees linking raw SEC 424B4 prospectus filings to price momentum. Verified provenance with zero manual intervention.
              </p>
              <div className="mt-auto">
                <Link href="/explore" className="eigen-link font-mono text-xs text-[#0284c7] hover:text-[#0369a1] font-semibold">
                  Case Study
                </Link>
              </div>
            </div>

            {/* Card 02 */}
            <div className="section-logoCards-card">
              <div className="section-logoCards-card-index">02</div>
              <h3 className="section-logoCards-card-heading">Sovereign Agents</h3>
              <p className="section-logoCards-card-text">
                AI agents that can verify disclosures, calculate scores, and trigger rebalancing on-chain. Powering Coinbase AgentKit workflows.
              </p>
              <div className="mt-auto">
                <Link href="/strategies" className="eigen-link font-mono text-xs text-[#0284c7] hover:text-[#0369a1] font-semibold">
                  Case Study
                </Link>
              </div>
            </div>

            {/* Card 03 */}
            <div className="section-logoCards-card">
              <div className="section-logoCards-card-index">03</div>
              <h3 className="section-logoCards-card-heading">Quantitative Allocation</h3>
              <p className="section-logoCards-card-text">
                Deterministic algorithmic ranking across Growth Alpha, Momentum Beta, and Defensive Delta parameters with reproducible proofs.
              </p>
              <div className="mt-auto">
                <Link href="/strategies" className="eigen-link font-mono text-xs text-[#0284c7] hover:text-[#0369a1] font-semibold">
                  Case Study
                </Link>
              </div>
            </div>

            {/* Card 04 */}
            <div className="section-logoCards-card">
              <div className="section-logoCards-card-index">04</div>
              <h3 className="section-logoCards-card-heading">Provably Fair Capital</h3>
              <p className="section-logoCards-card-text">
                Non-custodial smart contract perimeter verified on Robinhood Chain (#46630) with 14/14 Foundry tests passed on real-USDG fork.
              </p>
              <div className="mt-auto">
                <Link href="/vault" className="eigen-link font-mono text-xs text-[#0284c7] hover:text-[#0369a1] font-semibold">
                  Case Study
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. DEVELOPER CODE TERMINAL (section-imgCards) ── */}
        <section id="build" className="relative z-20 py-24 px-6 border-t border-slate-200 bg-[#f8fafc]">
          <div className="max-w-[1100px] mx-auto space-y-8">
            <div className="text-center space-y-3">
              <div className="font-mono text-xs uppercase tracking-widest text-[#0284c7] font-semibold">
                DEVELOPER TOOLKIT // SOVEREIGN SDK
              </div>
              <h2 className="section-text-card-heading">
                Build with verifiable intelligence
              </h2>
              <p className="section-text-card-text mx-auto text-slate-600">
                Get started with a world-class developer experience to resolve newly public cores in minutes.
              </p>
            </div>

            {/* Multi-Tab Hacker Terminal */}
            <div className="rounded-2xl border border-slate-200 bg-[#0f172a] overflow-hidden shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 bg-[#1e293b] border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-xs text-slate-300 ml-2 font-medium">equency-core-client</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {(["ts", "python", "solidity", "curl"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setCodeLang(lang);
                        setShowSimResult(false);
                      }}
                      className={`font-mono text-xs px-2.5 py-1 rounded uppercase transition-colors ${
                        codeLang === lang
                          ? "bg-[#0284c7] text-white font-bold"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="ml-2 text-slate-300 hover:text-white p-1"
                    title="Copy Code"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <pre className="p-5 font-mono text-[13px] leading-relaxed text-slate-100 overflow-x-auto m-0 bg-[#0f172a]">
                <code>{CODE_EXAMPLES[codeLang]}</code>
              </pre>

              <div className="p-3.5 bg-[#1e293b] border-t border-slate-700/60 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleRunSimulation}
                  disabled={simulating}
                  className="font-mono text-xs text-sky-400 hover:text-sky-300 font-semibold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5" />
                  {simulating ? "Executing on Chain 46630…" : "Run Simulation Query"}
                </button>
                <span className="font-mono text-[11px] text-slate-400">
                  RPC Response Verified
                </span>
              </div>

              {showSimResult && (
                <div className="p-3 bg-sky-950/80 border-t border-sky-500/40 font-mono text-xs text-sky-300">
                  {`✓ [RESOLVED] RDDT · Overall Score: 84/100 · 424B4 Hash: 0x8a91...c31b · Status: DETERMINISTIC`}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link href="/strategies" className="eigen-btn-cta">
                Explore the docs
              </Link>
              <a
                href="https://explorer.testnet.chain.robinhood.com"
                target="_blank"
                rel="noopener noreferrer"
                className="eigen-link font-mono text-xs text-[#0284c7] hover:text-[#0369a1] font-semibold"
              >
                Inspect smart contracts
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* FAQ Section */}
      <div className="relative z-20 border-t border-slate-200 bg-[#f8fafc]">
        <div className="max-w-[940px] mx-auto">
          <Faq />
        </div>
      </div>
    </div>
  );
}
