"use client";

import { useState } from "react";
import { ExternalLink, ShieldCheck, Globe, RefreshCw, Eye } from "lucide-react";

interface WebsitePreviewProps {
  url?: string;
  name: string;
  ticker: string;
}

export function CompanyWebsitePreview({ url, name, ticker }: WebsitePreviewProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  // Ensure protocol is present for safety
  const formattedUrl = url
    ? url.startsWith("http")
      ? url
      : `https://${url}`
    : null;

  const hostname = formattedUrl
    ? new URL(formattedUrl).hostname.replace(/^www\./, "")
    : `${ticker.toLowerCase()}.com`;

  return (
    <div className="relative overflow-hidden rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-panel)] transition-all duration-300 shadow-sm hover:shadow-md">
      {/* Browser Chrome Header (Pendle / Institutional view-only terminal aesthetic) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-line)] bg-[color:var(--color-panel-2)]/80 px-3.5 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {/* macOS subtle window dots */}
          <div className="flex items-center gap-1.5 pr-2 border-r border-[color:var(--color-line)]">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>

          {/* Address Bar */}
          <div className="flex items-center gap-2 rounded border border-[color:var(--color-line)] bg-[color:var(--color-bg)] px-3 py-1 text-xs font-mono text-[color:var(--color-ink)] shadow-inner max-w-sm sm:max-w-md w-full truncate">
            <Globe className="h-3.5 w-3.5 text-[color:var(--color-accent)] shrink-0" />
            <span className="text-[color:var(--color-ink-dim)] select-none text-[11px]">https://</span>
            <span className="font-medium truncate text-[11px]">{hostname}</span>
          </div>
        </div>

        {/* Right HUD Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-2.5 py-0.5 text-[10px] font-mono font-medium text-[color:var(--color-ink-dim)] shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--color-pos)]" />
            <span className="uppercase tracking-wider font-semibold text-[color:var(--color-pos)]">
              VIEW-ONLY
            </span>
            <span className="text-[color:var(--color-ink-faint)] select-none">·</span>
            <span>SANDBOXED</span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            title="Reload view-only buffer"
            className="p-1 rounded text-[color:var(--color-ink-dim)] hover:text-[color:var(--color-ink)] hover:bg-[color:var(--color-panel)] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[color:var(--color-accent)]" : ""}`} />
          </button>

          {formattedUrl && (
            <a
              href={formattedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-2 py-1 text-[11px] font-mono text-[color:var(--color-ink-dim)] hover:text-[color:var(--color-accent)] hover:border-[color:var(--color-accent)]/50 transition-colors shadow-xs"
            >
              <span>Visit</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>

      {/* Viewport Frame with live public website iframe sandbox */}
      <div className="relative w-full h-[380px] bg-[color:var(--color-bg)] overflow-hidden">
        {formattedUrl ? (
          <>
            <iframe
              src={formattedUrl}
              title={`${name} Official Website View`}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border-0 pointer-events-auto filter saturate-[0.95] contrast-[1.02]"
              loading="lazy"
            />
            {/* Floating watermark / security banner */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2 rounded border border-[color:var(--color-line)]/80 bg-[color:var(--color-panel)]/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-[color:var(--color-ink-dim)] shadow-md pointer-events-none">
              <Eye className="h-3 w-3 text-[color:var(--color-accent)]" />
              <span>EQUENCY AIR-GAPPED IR BROWSER</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-panel-2)] text-[color:var(--color-ink-dim)] mb-3">
              <Globe className="h-6 w-6 text-[color:var(--color-accent)]" />
            </div>
            <h4 className="text-sm font-semibold text-[color:var(--color-ink)]">
              Official Website Pending SEC EDGAR Indexing
            </h4>
            <p className="mt-1 max-w-md text-xs text-[color:var(--color-ink-dim)] leading-relaxed">
              The Intelligence Core is querying Finnhub & SEC 424B disclosures for verified company domains.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
