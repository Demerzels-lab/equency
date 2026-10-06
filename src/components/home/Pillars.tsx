import Link from "next/link";
import { Display } from "@/components/brand";

type Pillar = {
  name: string;
  tag: string;
  orb: string;
  desc: string;
  open: { label: string; href: string };
  learn: { label: string; href: string };
};

const PILLARS: Pillar[] = [
  {
    name: "Intelligence Core",
    tag: "Research",
    orb: "var(--color-accent)",
    desc: "Continuous research on every newly public company — SEC, market, ownership and news, scored and tagged live or simulated.",
    open: { label: "Open a core", href: "/company/ADRX" },
    learn: { label: "How it works", href: "/#faq" },
  },
  {
    name: "Strategy Engine",
    tag: "Strategy",
    orb: "var(--color-accent-2)",
    desc: "Rank the newly-public universe by deterministic fit. You pick the strategy and control the constraints — the model only narrates.",
    open: { label: "Choose a strategy", href: "/strategies" },
    learn: { label: "See the ranking", href: "/strategies/growth" },
  },
  {
    name: "Strategy Vault",
    tag: "Capital",
    orb: "var(--color-pos)",
    desc: "Turn intelligence into capital on Robinhood Chain. Non-custodial, with every limit enforced on-chain — never by the frontend.",
    open: { label: "Open the vault", href: "/vault" },
    learn: { label: "Contracts", href: "/vault#contracts" },
  },
];

export function Pillars() {
  return (
    <section className="mx-auto max-w-350 px-6 py-20">
      <div className="mb-12 text-center">
        <div className="label text-[color:var(--color-accent-2)]">Three layers, one loop</div>
        <Display as="h2" className="mt-3 text-[clamp(1.8rem,4vw,3rem)]">
          Intelligence becomes capital.
        </Display>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PILLARS.map((p) => (
          <div
            key={p.name}
            className="group relative flex min-w-0 flex-col items-center rounded-lg border border-border bg-card/50 px-6 py-9 text-center transition-colors hover:border-[color:var(--hb)]"
            style={{ ["--hb" as string]: p.orb }}
          >
            <div className="relative h-32 w-32">
              <div className="orb-glow h-32 w-32" style={{ ["--orb" as string]: p.orb }} />
              <span
                className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
                style={{ boxShadow: "0 0 18px 4px rgba(255,255,255,0.55)" }}
              />
            </div>

            <div className="mt-7 flex items-center justify-center gap-2.5">
              <h3 className="text-xl font-semibold tracking-tight">{p.name}</h3>
              <span className="label rounded-sm border border-border px-1.5 py-0.5" style={{ color: p.orb }}>{p.tag}</span>
            </div>
            <p className="mx-auto mt-3 max-w-xs text-pretty text-sm leading-relaxed text-muted-foreground">{p.desc}</p>

            <div className="mt-6 flex items-center gap-5 text-sm">
              <Link href={p.open.href} className="group/o inline-flex items-center gap-1.5 font-medium" style={{ color: p.orb }}>
                {p.open.label}
                <span className="transition-transform group-hover/o:translate-x-0.5">→</span>
              </Link>
              <Link href={p.learn.href} className="text-muted-foreground transition-colors hover:text-foreground">{p.learn.label}</Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
