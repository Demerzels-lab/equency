import Link from "next/link";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ *
 * EQUENCY design-system primitives. Server-safe (no client state).
 * Editorial-grotesk (Zupiter) × terminal-mono (AGENCY) hybrid.
 * ------------------------------------------------------------------ */

/** Mono micro-kicker: ■ A DIFFERENT WAY THROUGH */
export function Kicker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("label inline-flex items-center gap-2", className)}>
      <span style={{ width: 6, height: 6, background: "var(--color-accent)", display: "inline-block" }} />
      {children}
    </span>
  );
}

/** Editorial display heading. `outline` renders the AGENCY stroked variant. */
export function Display({
  children,
  outline,
  className,
  as: Tag = "h1",
}: {
  children: React.ReactNode;
  outline?: boolean;
  className?: string;
  as?: "h1" | "h2" | "h3" | "div";
}) {
  return <Tag className={cn("display", outline && "outline-text", className)}>{children}</Tag>;
}

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "outline" | "ghost";
  arrow?: boolean;
  plus?: boolean;
  disabled?: boolean;
  className?: string;
  external?: boolean;
};

const VARIANT: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-[color:var(--color-ink)] text-[color:var(--color-bg)] hover:bg-white",
  outline: "border border-[color:var(--color-line-strong)] text-[color:var(--color-ink)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]",
  ghost: "text-[color:var(--color-ink-dim)] hover:text-[color:var(--color-ink)]",
};

export function Button({ children, href, variant = "primary", arrow, plus, disabled, className, external }: ButtonProps) {
  const base = cn(
    "group inline-flex items-center justify-between gap-6 px-6 py-4 text-sm font-medium tracking-tight transition-colors",
    VARIANT[variant],
    disabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-current",
    className,
  );
  const inner = (
    <>
      <span>{children}</span>
      {arrow && <span className="transition-transform group-hover:translate-x-1">→</span>}
      {plus && <span className="text-lg leading-none">+</span>}
    </>
  );
  if (href && !disabled) {
    return external ? (
      <a href={href} target="_blank" rel="noreferrer" className={base}>{inner}</a>
    ) : (
      <Link href={href} className={base}>{inner}</Link>
    );
  }
  return <button disabled={disabled} className={base}>{inner}</button>;
}

/** Monospace ASCII glyph for capability cards (AGENCY register). */
export function AsciiIcon({ art, className }: { art: string; className?: string }) {
  return (
    <pre
      aria-hidden
      className={cn("mono leading-[1.15] select-none", className)}
      style={{ fontSize: 9, color: "var(--color-accent)", whiteSpace: "pre" }}
    >
      {art}
    </pre>
  );
}

/** One big-number stat (AGENCY stat strip). */
export function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="min-w-0">
      <div className="mono text-2xl font-semibold leading-none tracking-tight tabular-nums" style={{ color: "var(--color-ink)" }}>{value}</div>
      <div className="label mt-2">{label}</div>
      {sub && <div className="label mt-0.5 normal-case" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>{sub}</div>}
    </div>
  );
}

/** Numbered section marker · ONLY for genuine sequences (brief product/agent loop). */
export function SectionMark({ n, title, className }: { n: string; title: string; className?: string }) {
  return (
    <div className={cn("flex items-baseline gap-3", className)}>
      <span className="mono text-xs" style={{ color: "var(--color-accent)" }}>{n}</span>
      <span className="label" style={{ color: "var(--color-ink-dim)" }}>{title}</span>
    </div>
  );
}
