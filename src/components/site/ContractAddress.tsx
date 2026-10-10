"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import clsx from "clsx";
import { TOKEN_CA, TOKEN_EXPLORER } from "@/lib/site";

/**
 * Project contract address (CA) pill: full address with copy-to-clipboard + Blockscout link.
 * TOKEN_CA comes from lib/site (NEXT_PUBLIC_TOKEN_CA override); empty → "Announcing soon".
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
    <span className={clsx("inline-flex max-w-full items-center gap-1.5", className)}>
    <button
      type="button"
      onClick={copy}
      title="Copy contract address"
      className="group inline-flex max-w-full items-center gap-2.5 rounded-full border border-core/40 bg-paper/85 px-4 py-1.5 backdrop-blur transition-colors hover:border-core/60"
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
    {TOKEN_EXPLORER && (
      <a
        href={TOKEN_EXPLORER}
        target="_blank"
        rel="noopener noreferrer"
        title="View $EQUENCY on Blockscout (Robinhood Chain)"
        aria-label="View token on Blockscout"
        className="grid size-8 shrink-0 place-items-center rounded-full border border-core/40 bg-paper/85 text-ink-3 backdrop-blur transition-colors hover:border-core/60 hover:text-ink"
      >
        <ArrowUpRight size={14} />
      </a>
    )}
    </span>
  );
}
