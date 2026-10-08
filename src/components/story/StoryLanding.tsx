"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { StoryCanvas, type StoryCanvasHandle } from "./StoryCanvas";
import { StoryDots } from "./StoryDots";
import { StoryHeroSearch } from "./StoryHeroSearch";
import { Faq } from "@/components/home/Faq";
import { AbstractRibbon, GeometricRadarBadge, AbstractMetricCard } from "./AbstractElements";

interface Uni {
  ticker: string;
  name: string;
}

const CHAPTER_IDS = ["top", "observe", "strategies", "vault", "honesty", "build"];

export function StoryLanding({ seed }: { seed?: Uni[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTicker, setActiveTicker] = useState("EQUENCY");
  const canvasHandleRef = useRef<StoryCanvasHandle | null>(null);

  const handleCanvasReady = useCallback(
    (handle: StoryCanvasHandle) => {
      canvasHandleRef.current = handle;
      if (seed && seed[0]?.ticker) {
        handle.setName(seed[0].ticker);
      }
    },
    [seed]
  );

  // Exact RobinID Continuous Scroll Progress Listener with Zero-Reflow Cache
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
        {/* CHAPTER 01 · Start (is-left) */}
        <section id="top" className="chapter is-left relative overflow-hidden">
          <div className="chapter-body relative z-10">
            <div className="flex items-center justify-between mb-1">
              <GeometricRadarBadge label="Robinhood Chain" />
            </div>
            <h1 className="hero-title">
              A core that <span className="accent">points home.</span>
            </h1>
            <p className="lead">
              Every newly public company receives an autonomous Intelligence Core: scored deterministically from real
              SEC filings, and verified on Robinhood Chain. Readable by people, verifiable by the chain.
            </p>

            <StoryHeroSearch
              seed={seed}
              onTickerChange={handleTickerChange}
            />
            
            <AbstractRibbon className="absolute -bottom-10 -right-20 w-80" />
          </div>
        </section>

        {/* CHAPTER 02 · Observe (is-right) */}
        <section id="observe" className="chapter is-right relative">
          <div className="chapter-body relative z-10">
            <div className="flex items-center gap-2">
              <span className="eyebrow">02 · The Continuous Loop</span>
            </div>
            <h2>
              Observe. Score. <span className="accent">Narrate.</span>
            </h2>
            <p className="lead">
              Not a one-shot report · an always-on cycle that re-computes every score the moment new filings
              and price movements land on EDGAR and market feeds.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
              <AbstractMetricCard title="Ingest" value="0.2s" sub="EDGAR real-time hook" badge="SEC" />
              <AbstractMetricCard title="Compute" value="100%" sub="Deterministic math" badge="ZERO HALLU" />
              <AbstractMetricCard title="Audit" value="46630" sub="Robinhood Chain ID" badge="ONCHAIN" />
            </div>

            <div className="pt-2">
              <Link href="/explore" className="btn btn-ember inline-flex items-center gap-2">
                <span>Explore All Filings</span>
                <span>→</span>
              </Link>
            </div>
            <AbstractRibbon className="absolute -top-12 -left-16 w-72 rotate-180" />
          </div>
        </section>

        {/* CHAPTER 03 · Strategies (is-left) */}
        <section id="strategies" className="chapter is-left relative">
          <div className="chapter-body relative z-10">
            <span className="eyebrow">03 · Quantitative Strategies</span>
            <h2>
              Rank the universe by <span className="accent">deterministic fit.</span>
            </h2>
            <p className="lead">
              Three quantitative strategies (Growth, Momentum, Defensive) rank every newly public company
              over its Intelligence Core. You choose the constraints; the engine proves the score.
            </p>

            <ul className="chips">
              <li>Growth Engine</li>
              <li>Price Momentum</li>
              <li>Defensive Buffer</li>
              <li>SEC 424B4 Prospectus</li>
              <li>EDGAR Real-Time</li>
              <li>XBRL Validation</li>
              <li>Lockup Expiry</li>
            </ul>

            <div className="pt-2">
              <Link
                href="/strategies"
                className="btn btn-ghost"
              >
                Choose a strategy →
              </Link>
            </div>
          </div>
        </section>

        {/* CHAPTER 04 · Vault (is-right) */}
        <section id="vault" className="chapter is-right relative">
          <div className="chapter-body relative z-10">
            <span className="eyebrow">04 · On-Chain Execution</span>
            <h2>
              Where intelligence <span className="accent">becomes capital.</span>
            </h2>
            <p className="lead">
              A non-custodial Strategy Vault that holds USDG on Robinhood Chain and executes within limits
              the smart contract enforces. The AI never signs a transaction.
            </p>

            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 mb-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-2">
                <span>VAULT SAFETY SPECS</span>
                <span className="text-emerald-600 font-semibold">14/14 PASS</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-700">
                <div>• Non-custodial ERC-4626</div>
                <div>• Native USDG Asset</div>
                <div>• Chainlink Oracle Sync</div>
                <div>• Timelock Governance</div>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/vault" className="btn btn-ghost">
                Open Strategy Vault →
              </Link>
            </div>
            <AbstractRibbon className="absolute -bottom-8 -right-12 w-64" />
          </div>
        </section>

        {/* CHAPTER 05 · Honesty (is-left) */}
        <section id="honesty" className="chapter is-left">
          <div className="chapter-body">
            <span className="eyebrow">05 · Truth & Proof</span>
            <h2>
              Hallucinations <span className="accent">never pass.</span>
            </h2>
            <p className="lead">
              The model narrates; it never sets the score. Nothing here is fabricated. Every metric is either
              live or explicitly marked simulated. Expired or unverified signals are never guessed.
            </p>

            <div className="pt-2">
              <Link href="/#faq" className="btn btn-ghost">
                How scoring works →
              </Link>
            </div>
          </div>
        </section>

        {/* CHAPTER 06 · Build (is-right) */}
        <section id="build" className="chapter is-right">
          <div className="chapter-body">
            <span className="eyebrow">06 · Build & Integrate</span>
            <h2>
              Signals in. <span className="accent">Alpha out.</span>
            </h2>
            <p className="lead">
              Explicit, chain-aware intelligence resolution for autonomous agents, automated workflows, and quantitative pipelines.
            </p>

            <pre className="story-code">
              <code>{`const equency = createEquencyClient(client, deployment);
const core = await equency.resolveCore('RDDT');
if (!core) throw new Error('Unresolved');`}</code>
            </pre>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link href="/strategies" className="btn btn-ember">
                Read the docs
              </Link>
              <Link href="/explore" className="btn btn-ghost">
                Find a company
              </Link>
            </div>

            <footer className="story-foot">
              <p>
                EQUENCY · independent research protocol on Robinhood Chain · Non-custodial ERC-4626 · Testnet 46630.
                Scoring derived from public SEC EDGAR filings and verifiable market feeds.
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
