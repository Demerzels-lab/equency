import Link from "next/link";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ *
 * EQUENCY design-system primitives. Server-safe (no client state).
 * Editorial-grotesk (Zupiter) × terminal-mono (AGENCY) hybrid.
 * ------------------------------------------------------------------ */

/** Editorial display heading: one restrained treatment, single color. */
export function Display({
  children,
  className,
  as: Tag = "h1",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "div";
}) {
  return <Tag className={cn("display", className)}>{children}</Tag>;
}

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "outline" | "ghost" | "indigo";
  arrow?: boolean;
  plus?: boolean;
  disabled?: boolean;
  className?: string;
  external?: boolean;
};

const VARIANT: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-[color:var(--color-ink)] text-[color:var(--color-bg)] hover:bg-white hover:shadow-[0_0_34px_-6px_color-mix(in_oklab,var(--color-accent)_65%,transparent)]",
  outline: "border border-[color:var(--color-line-strong)] text-[color:var(--color-ink)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-accent)]",
  ghost: "text-[color:var(--color-ink-dim)] hover:text-[color:var(--color-ink)]",
  indigo: "border border-[color:var(--color-accent-2)] text-[color:var(--color-accent-2)] hover:bg-[color:var(--color-accent-2)] hover:text-[color:var(--color-bg)] hover:shadow-[0_0_34px_-6px_color-mix(in_oklab,var(--color-accent-2)_70%,transparent)]",
};

export function Button({ children, href, variant = "primary", arrow, plus, disabled, className, external }: ButtonProps) {
  const base = cn(
    "group inline-flex items-center justify-between gap-6 px-6 py-4 text-sm font-medium tracking-tight transition-[color,background-color,border-color,box-shadow] duration-200",
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

