"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/** Copyable contract/chain field (Zupiter header pattern). */
export function CopyField({ label, value, display, className }: { label: string; value: string; display?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }
  return (
    <div className={cn("flex items-center gap-2 border px-2.5 py-1.5", className)} style={{ borderColor: "var(--color-line)", background: "var(--color-panel)" }}>
      <span style={{ width: 5, height: 5, borderRadius: 9999, background: "var(--color-accent)" }} />
      <span className="label" style={{ letterSpacing: 0.5 }}>{label}</span>
      <span className="mono text-xs" style={{ color: "var(--color-ink-dim)" }}>{display ?? value}</span>
      <button onClick={copy} className="label ml-1 px-1.5 py-0.5 transition-colors hover:text-[color:var(--color-accent)]" style={{ border: "1px solid var(--color-line)" }}>
        {copied ? "copied" : "copy"}
      </button>
    </div>
  );
}
