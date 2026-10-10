"use client";

// Roadmap visuals: thin lines, nodes, slow motion. No particles, no fake data (brief §9–§10).
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import clsx from "clsx";
import { LIFECYCLE, PHASES, type Phase } from "@/lib/roadmap";

const EASE = [0.16, 1, 0.3, 1] as const;
const VIEW = { once: true, margin: "0px 0px -12% 0px" } as const;

/** A line that draws itself when scrolled into view. */
function Draw({ d, delay = 0, dashed, className, stroke = "var(--color-line-2)" }: { d: string; delay?: number; dashed?: boolean; className?: string; stroke?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.path
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={1.2}
      strokeDasharray={dashed ? "4 6" : undefined}
      className={className}
      initial={reduce ? false : { pathLength: 0, opacity: 0 }}
      whileInView={{ pathLength: 1, opacity: 1 }}
      viewport={VIEW}
      transition={{ duration: 1.2, delay, ease: EASE }}
    />
  );
}

/** A node that appears with a slight scale; optional live pulse. */
function Node({ x, y, r = 6, color, delay = 0, live }: { x: number; y: number; r?: number; color: string; delay?: number; live?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.g initial={reduce ? false : { opacity: 0, scale: 0.4 }} whileInView={{ opacity: 1, scale: 1 }} viewport={VIEW} transition={{ duration: 0.6, delay, ease: EASE }} style={{ transformOrigin: `${x}px ${y}px` }}>
      {live && (
        <circle cx={x} cy={y} r={r * 2.4} fill={color} opacity={0.18}>
          <animate attributeName="r" values={`${r * 1.6};${r * 3};${r * 1.6}`} dur="2.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.25;0;0.25" dur="2.8s" repeatCount="indefinite" />
        </circle>
      )}
      <circle cx={x} cy={y} r={r + 4} fill="var(--color-paper)" stroke={color} strokeOpacity={0.5} />
      <circle cx={x} cy={y} r={r} fill={live ? color : "var(--color-paper)"} stroke={color} strokeWidth={1.4} />
    </motion.g>
  );
}

/** Slow wireframe globe (meridians + parallels), pure SVG. */
function WireGlobe({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  return (
    <g stroke="var(--color-core)" fill="none" strokeOpacity={0.22}>
      <circle cx={cx} cy={cy} r={r} strokeOpacity={0.35} />
      {[-0.55, 0, 0.55].map((k) => (
        <ellipse key={k} cx={cx} cy={cy + k * r} rx={Math.sqrt(1 - k * k) * r} ry={Math.sqrt(1 - k * k) * r * 0.22} />
      ))}
      <g>
        {[0.25, 0.6, 0.95].map((k, i) => (
          <ellipse key={i} cx={cx} cy={cy} rx={r * k} ry={r}>
            <animate attributeName="rx" values={`${r * k};${r * (1 - k + 0.05)};${r * k}`} dur={`${18 + i * 4}s`} repeatCount="indefinite" />
          </ellipse>
        ))}
      </g>
    </g>
  );
}

/**
 * Hero map: the network today (newly public · live) and the four markets the Core expands to
 * (dashed · roadmap). Evolution, not a pivot.
 */
export function ExpansionMap() {
  const W = 1200, H = 520, cx = 600, cy = 250;
  const today = { x: 600, y: 470, label: "Newly public companies", tag: "LIVE TODAY" };
  const nodes = PHASES.map((p, i) => {
    const a = (-160 + i * (140 / 3)) * (Math.PI / 180);
    return { p, x: cx + Math.cos(a) * 390, y: cy + Math.sin(a) * 200 + 10 };
  });
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="EQUENCY Intelligence Network: live today on newly public companies, expanding to four new markets">
      <defs>
        <radialGradient id="rm-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-core)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--color-core)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={170} fill="url(#rm-glow)" />
      <WireGlobe cx={cx} cy={cy} r={74} />

      {/* today: solid, live */}
      <Draw d={`M ${cx} ${cy + 80} L ${today.x} ${today.y - 14}`} stroke="var(--color-mint)" delay={0.1} />
      <Node x={today.x} y={today.y} color="var(--color-mint)" live delay={0.2} />
      <text x={today.x + 22} y={today.y - 2} className="fill-ink text-[15px]" style={{ fontFamily: "var(--font-outfit)" }}>{today.label}</text>
      <text x={today.x + 22} y={today.y + 16} className="fill-mint text-[10px] tracking-[0.18em]" style={{ fontFamily: "var(--font-jbmono)" }}>● {today.tag}</text>

      {/* roadmap: dashed */}
      {nodes.map(({ p, x, y }, i) => {
        const col = p.accent === "core" ? "var(--color-core)" : "var(--color-strategy)";
        const left = x < cx;
        return (
          <g key={p.n}>
            <Draw d={`M ${cx} ${cy} Q ${(cx + x) / 2} ${Math.min(cy, y) - 40} ${x} ${y}`} dashed delay={0.4 + i * 0.18} stroke={col} />
            <Node x={x} y={y} color={col} delay={0.7 + i * 0.18} />
            <text x={left ? x - 18 : x + 18} y={y - 22} textAnchor={left ? "end" : "start"} className="fill-ink-3 text-[10px] tracking-[0.18em]" style={{ fontFamily: "var(--font-jbmono)" }}>
              PHASE {p.n} · ROADMAP
            </text>
            <text x={left ? x - 18 : x + 18} y={y - 4} textAnchor={left ? "end" : "start"} className="fill-ink text-[15px]" style={{ fontFamily: "var(--font-outfit)" }}>
              {p.short}
            </text>
          </g>
        );
      })}

      {/* center */}
      <Node x={cx} y={cy} r={9} color="var(--color-core)" live />
      <text x={cx} y={cy + 118} textAnchor="middle" className="fill-ink-2 text-[11px] tracking-[0.3em]" style={{ fontFamily: "var(--font-syncopate)" }}>EQUENCY</text>
      <text x={cx} y={cy + 136} textAnchor="middle" className="fill-ink-3 text-[9px] tracking-[0.22em]" style={{ fontFamily: "var(--font-jbmono)" }}>INTELLIGENCE NETWORK</text>
    </svg>
  );
}

/** BORN → OBSERVE → RESEARCH → REMEMBER → UNDERSTAND → EVOLVE */
export function LifecycleRail() {
  const reduce = useReducedMotion();
  return (
    <div className="relative">
      <svg className="pointer-events-none absolute left-0 right-0 top-[19px] hidden h-2 w-full md:block" preserveAspectRatio="none" viewBox="0 0 100 2">
        <motion.line x1="8" y1="1" x2="92" y2="1" stroke="var(--color-line-2)" strokeWidth={0.4} vectorEffect="non-scaling-stroke"
          initial={reduce ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={VIEW} transition={{ duration: 1.6, ease: EASE }} />
      </svg>
      <ol className="relative grid gap-8 md:grid-cols-6 md:gap-4">
        {LIFECYCLE.map((s, i) => (
          <motion.li
            key={s.k}
            initial={reduce ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={VIEW}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.12, ease: EASE }}
            className="flex gap-4 md:flex-col md:items-center md:text-center"
          >
            <span className={clsx("relative grid size-10 shrink-0 place-items-center rounded-full bg-paper font-mono text-[11px] ring-1", i === 0 ? "text-mint ring-mint/60" : "text-core ring-core/45")}>
              {i === 0 && <span className="absolute inset-0 animate-ping rounded-full ring-1 ring-mint/40 [animation-duration:2.6s]" />}
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="font-wide text-sm uppercase tracking-[0.2em] text-ink">{s.k}</div>
              <p className="mt-2 font-body text-sm leading-relaxed text-ink-3">{s.d}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

/** Small per-phase glyph (the shape of what the Core has to understand). */
function PhaseGlyph({ phase }: { phase: Phase }) {
  const col = phase.accent === "core" ? "var(--color-core)" : "var(--color-strategy)";
  return (
    <svg viewBox="0 0 160 160" className="h-full w-full">
      <WireGlobe cx={80} cy={80} r={52} />
      {phase.n === "01" && (
        <>
          <Draw d="M 52 80 L 108 80" stroke={col} />
          <Node x={52} y={80} r={6} color="var(--color-ink-2)" />
          <Node x={108} y={80} r={6} color={col} live />
        </>
      )}
      {phase.n === "02" && (
        <>
          <Draw d="M 80 46 L 80 114" stroke={col} />
          <Node x={80} y={46} r={6} color="var(--color-ink-2)" />
          <Node x={80} y={114} r={6} color={col} live />
          <Node x={80} y={80} r={4} color={col} />
        </>
      )}
      {phase.n === "03" && (
        <>
          <Draw d="M 34 104 Q 60 60 80 76 T 126 50" stroke={col} />
          {[[34, 104], [62, 74], [96, 70], [126, 50]].map(([x, y], i) => (
            <Node key={i} x={x} y={y} r={4} color={i === 3 ? "var(--color-mint)" : col} live={i === 3} />
          ))}
        </>
      )}
      {phase.n === "04" && (
        <>
          <circle cx={80} cy={80} r={30} fill="none" stroke={col} strokeOpacity={0.6} strokeDasharray="3 5" />
          <Node x={80} y={80} r={7} color={col} />
          <Node x={110} y={80} r={4} color="var(--color-ink-2)" />
        </>
      )}
    </svg>
  );
}

/** One roadmap phase as a node on the network spine (not a SaaS feature card). */
export function PhaseNode({ phase, last }: { phase: Phase; last?: boolean }) {
  const reduce = useReducedMotion();
  const accentText = phase.accent === "core" ? "text-core" : "text-strategy";
  const accentRing = phase.accent === "core" ? "ring-core/45" : "ring-strategy/45";
  return (
    <div className="relative grid grid-cols-[40px_1fr] gap-6 md:grid-cols-[72px_1fr] md:gap-10">
      {/* spine */}
      <div className="relative flex justify-center">
        <span className={clsx("relative z-10 mt-1 grid size-10 place-items-center rounded-full bg-paper font-mono text-xs ring-1 md:size-14 md:text-sm", accentText, accentRing)}>
          {phase.n}
        </span>
        {!last && (
          <motion.span
            className="absolute top-12 bottom-[-4rem] w-px origin-top bg-gradient-to-b from-line-2 via-line-2 to-transparent md:top-16"
            initial={reduce ? false : { scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={VIEW}
            transition={{ duration: 1.2, ease: EASE }}
          />
        )}
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={VIEW}
        transition={{ duration: 0.8, ease: EASE }}
        className="grid gap-8 border-t border-line pt-6 lg:grid-cols-[1fr_200px]"
      >
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">Phase {phase.n}</span>
            <span className={clsx("rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ring-1 ring-inset", phase.preview ? "text-mint ring-mint/40" : "text-ink-3 ring-line-2")}>
              {phase.preview ? "Preview · in development" : phase.conditional ? "Roadmap · conditional" : "Roadmap · not live"}
            </span>
          </div>
          <h3 className="mt-3 text-3xl font-light tracking-tight text-ink md:text-4xl">{phase.market}</h3>
          <p className={clsx("mt-3 text-lg md:text-xl", accentText)}>{phase.headline}</p>
          <p className="mt-3 max-w-2xl font-body leading-relaxed text-ink-2">{phase.copy}</p>

          {phase.preview && (
            <Link href={phase.preview.href} className="mt-6 inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-ink ring-1 ring-inset ring-core/60 transition-colors hover:bg-core/15">
              <span className="size-1.5 animate-pulse rounded-full bg-mint" /> {phase.preview.label} →
            </Link>
          )}

          {/* diagram */}
          {phase.flow && phase.n === "02" && (
            <div className="mt-6 inline-flex flex-col items-start gap-1 font-mono text-xs uppercase tracking-[0.14em] text-ink-2">
              <span className="rounded px-3 py-1.5 ring-1 ring-inset ring-line-2">{phase.flow[0]}</span>
              <span className={clsx("pl-6", accentText)}>↕</span>
              <span className="rounded px-3 py-1.5 ring-1 ring-inset ring-strategy/50 text-strategy">{phase.flow[1]}</span>
            </div>
          )}
          {phase.flow && phase.n === "03" && (
            <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.14em]">
              {phase.flow.map((f, i) => (
                <span key={f} className="flex items-center gap-2">
                  <span className={clsx("rounded px-3 py-1.5 ring-1 ring-inset", i === phase.flow!.length - 1 ? "text-mint ring-mint/50" : "text-ink-2 ring-line-2")}>{f}</span>
                  {i < phase.flow!.length - 1 && <span className="text-ink-3">→</span>}
                </span>
              ))}
            </div>
          )}
          {phase.flow && phase.n === "04" && (
            <div className="mt-6 flex flex-wrap items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-ink-3">
              <span className="mr-1">Potential examples</span>
              {phase.flow.map((f) => (
                <span key={f} className="rounded px-3 py-1.5 text-ink-2 border border-dashed border-line-2">{f}</span>
              ))}
            </div>
          )}
          {phase.line && <p className="mt-5 font-wide text-xs uppercase tracking-[0.2em] text-ink">{phase.line}</p>}

          {/* what the Core understands */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {phase.layers.map((l) => (
              <div key={l.title}>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">{l.title}</div>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {l.items.map((it) => (
                    <li key={it} className="rounded-sm bg-card/70 px-2 py-1 font-body text-xs text-ink-2 ring-1 ring-inset ring-line">{it}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className={clsx("mt-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em]", accentText)}>
            <span className="h-px w-8 bg-current opacity-60" />
            {phase.label}
          </div>
        </div>

        <div className="hidden aspect-square lg:block">
          <PhaseGlyph phase={phase} />
        </div>
      </motion.div>
    </div>
  );
}

/** One framework. Many markets: EQUENCY → network → Cores → shared intelligence → strategy → capital. */
export function NetworkTree() {
  const cols = [
    { x: 200, a: "Stock Core", b: "Token Core", col: "var(--color-core)" },
    { x: 500, a: "Private Core", b: "Pre-IPO Core", col: "var(--color-core)" },
    { x: 800, a: "Commodity Core", b: "Tokenized Core", col: "var(--color-strategy)" },
  ];
  const label = (x: number, y: number, t: string, cls = "fill-ink text-[14px]", font = "var(--font-outfit)") => (
    <text x={x} y={y} textAnchor="middle" className={cls} style={{ fontFamily: font }}>{t}</text>
  );
  return (
    <svg viewBox="0 0 1000 560" className="h-auto w-full" role="img" aria-label="One framework, many markets">
      {label(500, 30, "EQUENCY", "fill-ink text-[14px] tracking-[0.3em]", "var(--font-syncopate)")}
      <Draw d="M 500 42 L 500 82" />
      <Node x={500} y={96} r={7} color="var(--color-core)" live />
      <text x={518} y={100} className="fill-ink-3 text-[10px] tracking-[0.22em]" style={{ fontFamily: "var(--font-jbmono)" }}>INTELLIGENCE NETWORK</text>
      {cols.map((c, i) => (
        <g key={c.a}>
          <Draw d={`M 500 104 C 500 160, ${c.x} 150, ${c.x} 196`} delay={0.2 + i * 0.12} stroke={c.col} dashed />
          <Node x={c.x} y={206} r={6} color={c.col} delay={0.5 + i * 0.12} />
          {label(c.x, 240, c.a)}
          <Draw d={`M ${c.x} 252 L ${c.x} 292`} delay={0.6 + i * 0.12} />
          <Node x={c.x} y={302} r={5} color={c.col} delay={0.8 + i * 0.12} />
          {label(c.x, 334, c.b, "fill-ink-2 text-[14px]")}
          <Draw d={`M ${c.x} 346 C ${c.x} 390, 500 380, 500 414`} delay={0.9 + i * 0.12} />
        </g>
      ))}
      <Node x={500} y={424} r={7} color="var(--color-mint)" delay={1.2} />
      <text x={518} y={428} className="fill-ink text-[11px] tracking-[0.22em]" style={{ fontFamily: "var(--font-jbmono)" }}>SHARED INTELLIGENCE</text>
      <Draw d="M 500 432 L 500 502" delay={1.3} />
      <text x={500} y={530} textAnchor="middle" className="text-[13px] tracking-[0.25em]" style={{ fontFamily: "var(--font-syncopate)" }}>
        <tspan className="fill-core">STRATEGY</tspan>
        <tspan className="fill-ink-3"> → </tspan>
        <tspan className="fill-strategy">CAPITAL</tspan>
      </text>
    </svg>
  );
}

/** Phone version of the hero map: a vertical spine (the SVG labels get too small under ~700px). */
export function ExpansionMapMobile() {
  const reduce = useReducedMotion();
  const row = (i: number) => ({
    initial: reduce ? false : { opacity: 0, x: -10 },
    whileInView: { opacity: 1, x: 0 },
    viewport: VIEW,
    transition: { duration: 0.6, delay: 0.1 + i * 0.1, ease: EASE },
  });
  return (
    <div className="relative mx-auto max-w-sm pl-2">
      <span className="absolute bottom-5 left-[27px] top-5 w-px bg-gradient-to-b from-core/60 via-line-2 to-strategy/50" />
      <motion.div {...row(0)} className="relative flex items-center gap-4 py-3">
        <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-paper ring-1 ring-core/60">
          <span className="size-2.5 rounded-full bg-core shadow-[0_0_12px_var(--color-core)]" />
        </span>
        <div>
          <div className="font-wide text-xs tracking-[0.28em] text-ink">EQUENCY</div>
          <div className="font-mono text-[10px] tracking-[0.2em] text-ink-3">INTELLIGENCE NETWORK</div>
        </div>
      </motion.div>
      <motion.div {...row(1)} className="relative flex items-center gap-4 py-3">
        <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full bg-paper font-mono text-[9px] text-mint ring-1 ring-mint/60">
          <span className="absolute inset-0 animate-ping rounded-full ring-1 ring-mint/40 [animation-duration:2.6s]" />
          LIVE
        </span>
        <div>
          <div className="font-mono text-[10px] tracking-[0.18em] text-mint">TODAY</div>
          <div className="text-base text-ink">Newly public companies</div>
        </div>
      </motion.div>
      {PHASES.map((p, i) => (
        <motion.div key={p.n} {...row(i + 2)} className="relative flex items-center gap-4 py-3">
          <span className={clsx("relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-dashed bg-paper font-mono text-xs", p.accent === "core" ? "border-core/60 text-core" : "border-strategy/60 text-strategy")}>{p.n}</span>
          <div className="min-w-0">
            <div className="font-mono text-[10px] tracking-[0.18em] text-ink-3">PHASE {p.n} · {p.preview ? "PREVIEW" : p.conditional ? "CONDITIONAL" : "ROADMAP"}</div>
            <div className="text-base text-ink">{p.market}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/** Phone version of "One framework. Many markets." */
export function NetworkTreeMobile() {
  const cores = [
    ["Stock Core", "Token Core", "core"],
    ["Private Core", "Pre-IPO Core", "core"],
    ["Commodity Core", "Tokenized Core", "strategy"],
  ] as const;
  const step = (t: string, cls = "text-ink-3") => <div className={clsx("font-mono text-[10px] tracking-[0.22em]", cls)}>{t}</div>;
  const arrow = <div className="my-2 h-6 w-px bg-line-2" />;
  return (
    <div className="flex flex-col items-center text-center">
      <div className="font-wide text-sm tracking-[0.3em] text-ink">EQUENCY</div>
      {arrow}
      {step("INTELLIGENCE NETWORK")}
      {arrow}
      <div className="grid w-full max-w-sm grid-cols-3 gap-2">
        {cores.map(([a, b, acc]) => (
          <div key={a} className={clsx("rounded-lg border border-dashed bg-card/50 px-1.5 py-3", acc === "core" ? "border-core/40" : "border-strategy/40")}>
            <div className="text-[13px] leading-tight text-ink">{a}</div>
            <div className="mx-auto my-1.5 h-3 w-px bg-line-2" />
            <div className="text-[13px] leading-tight text-ink-2">{b}</div>
          </div>
        ))}
      </div>
      {arrow}
      {step("SHARED INTELLIGENCE", "text-ink")}
      {arrow}
      <div className="font-wide text-xs tracking-[0.24em]">
        <span className="text-core">STRATEGY</span> <span className="text-ink-3">→</span> <span className="text-strategy">CAPITAL</span>
      </div>
    </div>
  );
}
