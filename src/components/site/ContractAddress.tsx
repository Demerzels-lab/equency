"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import clsx from "clsx";
import { TOKEN_CA } from "@/lib/site";

/**
 * Project contract address (CA) pill. Reads NEXT_PUBLIC_TOKEN_CA at build time:
 * empty → "announcing soon" placeholder; set → full address with copy-to-clipboard.
 */
export function ContractAddress({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  if (!TOKEN_CA) {
    return (
      <span className={clsx("inline-flex items-center gap-2.5 rounded-full border border-dashed border-core/40 bg-paper/85 px-4 py-1.5 backdrop-blur", className)}>
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-core">CA</span>
        <span className="h-3 w-px bg-line-2" />
        <span className="font-mono text-xs text-ink-2">Announcing soon</span>
      </span>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(TOKEN_CA);
    } catch {
      // Fallback for browsers/contexts without the async clipboard permission.
      const ta = document.createElement("textarea");
      ta.value = TOKEN_CA;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      if (!ok) return; // address stays selectable (select-all) as a last resort
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Copy contract address"
      className={clsx(
        "group inline-flex max-w-full items-center gap-2.5 rounded-full border border-core/40 bg-paper/85 px-4 py-1.5 backdrop-blur transition-colors hover:border-core/60",
        className,
      )}
    >
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-core">CA</span>
      <span className="h-3 w-px bg-line-2" />
      <span className="truncate font-mono text-xs text-ink select-all">
        <span className="sm:hidden">{TOKEN_CA.slice(0, 8)}…{TOKEN_CA.slice(-6)}</span>
        <span className="hidden sm:inline">{TOKEN_CA}</span>
      </span>
      <span className={clsx("shrink-0 transition-colors", copied ? "text-mint" : "text-ink-3 group-hover:text-ink")} aria-live="polite">
        {copied ? <Check size={14} aria-label="Copied" /> : <Copy size={14} aria-label="Copy" />}
      </span>
    </button>
  );
}
