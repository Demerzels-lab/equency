"use client";

import { useState } from "react";
import { Camera, ExternalLink, Globe, MonitorPlay, RefreshCw, ShieldCheck } from "lucide-react";

interface WebsitePreviewProps {
  url?: string;
  name: string;
  ticker: string;
  /** Server-checked: false when the site forbids framing (X-Frame-Options / CSP) or blocks bots. */
  embeddable?: boolean;
  /** Why it can't be framed, shown as a small note in snapshot mode. */
  reason?: string;
  /** Where the domain came from (e.g. "SEC 10-K"). */
  source?: string;
  /** Site blocks simple bots (Cloudflare etc.) · use the headless-browser screenshot first. */
  botWall?: boolean;
}

/** Screenshot providers (free, no key), tried in order; on error the next one is used.
 *  thum.io is fast but gets bot-walled; microlink (real headless Chrome, limited free quota)
 *  goes first only for bot-walled sites. */
const snapshotSources = (url: string, botWall: boolean) => {
  const thum = `https://image.thum.io/get/width/1280/crop/800/noanimate/${url}`;
  const microlink = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url`;
  return botWall ? [microlink, thum] : [thum, microlink];
};

export function CompanyWebsitePreview({ url, name, ticker, embeddable = true, reason, source, botWall = false }: WebsitePreviewProps) {
  const formattedUrl = url ? (url.startsWith("http") ? url : `https://${url}`) : null;
  const hostname = formattedUrl ? new URL(formattedUrl).hostname.replace(/^www\./, "") : `${ticker.toLowerCase()}.com`;

  // Live iframe only when the site allows it; otherwise a real screenshot of the site.
  const [mode, setMode] = useState<"live" | "snapshot">(embeddable ? "live" : "snapshot");
  const [reloadKey, setReloadKey] = useState(0);
  const [snapIdx, setSnapIdx] = useState(0);
  const [snapLoaded, setSnapLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const snaps = formattedUrl ? snapshotSources(formattedUrl, botWall) : [];
  const snapFailed = snapIdx >= snaps.length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setReloadKey((k) => k + 1);
    setSnapIdx(0);
    setSnapLoaded(false);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const switchMode = (m: "live" | "snapshot") => {
    setMode(m);
    setSnapLoaded(false);
  };

  return (
    <div className="relative overflow-hidden rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-panel)] transition-all duration-300 shadow-sm hover:shadow-md">
      {/* Browser chrome header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--color-line)] bg-[color:var(--color-panel-2)]/80 px-3.5 py-2.5 backdrop-blur-md">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="flex items-center gap-1.5 pr-2 border-r border-[color:var(--color-line)]">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 rounded border border-[color:var(--color-line)] bg-[color:var(--color-bg)] px-3 py-1 text-xs font-mono text-[color:var(--color-ink)] shadow-inner max-w-sm sm:max-w-md w-full truncate">
            <Globe className="h-3.5 w-3.5 text-[color:var(--color-accent)] shrink-0" />
            <span className="text-[color:var(--color-ink-dim)] select-none text-[11px]">https://</span>
            <span className="font-medium truncate text-[11px]">{hostname}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {formattedUrl && (
            <div className="flex items-center rounded border border-[color:var(--color-line)] p-0.5 font-mono text-[10px]" role="group" aria-label="Preview mode">
              <button
                type="button"
                onClick={() => switchMode("live")}
                disabled={!embeddable}
                title={embeddable ? "Live, sandboxed view" : `Live view blocked by the site (${reason ?? "framing not allowed"})`}
                className={`flex items-center gap-1 rounded-sm px-2 py-0.5 uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${mode === "live" ? "bg-[color:var(--color-accent)] text-white" : "text-[color:var(--color-ink-dim)] hover:text-[color:var(--color-ink)]"}`}
              >
                <MonitorPlay className="h-3 w-3" /> Live
              </button>
              <button
                type="button"
                onClick={() => switchMode("snapshot")}
                title="Static screenshot of the site"
                className={`flex items-center gap-1 rounded-sm px-2 py-0.5 uppercase tracking-wider transition-colors ${mode === "snapshot" ? "bg-[color:var(--color-accent)] text-white" : "text-[color:var(--color-ink-dim)] hover:text-[color:var(--color-ink)]"}`}
              >
                <Camera className="h-3 w-3" /> Snapshot
              </button>
            </div>
          )}

          <div className="hidden items-center gap-1.5 rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-panel)] px-2.5 py-0.5 text-[10px] font-mono font-medium text-[color:var(--color-ink-dim)] shadow-xs sm:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-[color:var(--color-pos)]" />
            <span className="uppercase tracking-wider font-semibold text-[color:var(--color-pos)]">VIEW-ONLY</span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            title="Reload preview"
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

      {/* Viewport */}
      <div className="relative w-full h-[380px] bg-[color:var(--color-bg)] overflow-hidden">
        {!formattedUrl ? (
          <Empty
            title="No official website on record"
            body="Neither the issuer's SEC filings nor Finnhub list a website for this company yet. It will appear automatically once one is disclosed."
          />
        ) : mode === "live" ? (
          <iframe
            key={reloadKey}
            src={formattedUrl}
            title={`${name} official website`}
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full border-0 bg-white"
            loading="lazy"
          />
        ) : snapFailed ? (
          <Empty title="Snapshot unavailable" body={`Couldn't capture ${hostname} right now. Open it directly with "Visit".`} />
        ) : (
          <a href={formattedUrl} target="_blank" rel="noopener noreferrer" className="group block h-full w-full" title={`Open ${hostname}`}>
            {!snapLoaded && (
              <div className="absolute inset-0 grid place-items-center">
                <div className="flex items-center gap-2 font-mono text-[11px] text-[color:var(--color-ink-faint)]">
                  <Camera className="h-3.5 w-3.5 animate-pulse text-[color:var(--color-accent)]" /> Capturing {hostname}…
                </div>
              </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- third-party screenshot URL, not optimisable */}
            <img
              key={`${reloadKey}-${snapIdx}`}
              src={snaps[snapIdx]}
              alt={`Screenshot of ${name}'s official website`}
              // The SSR'd <img> can finish (or fail) before hydration attaches onLoad/onError,
              // so also settle the state from the element itself when it mounts.
              ref={(el) => {
                if (!el?.complete) return;
                if (el.naturalWidth > 0) setSnapLoaded(true);
                else setSnapIdx((i) => i + 1);
              }}
              onLoad={() => setSnapLoaded(true)}
              onError={() => setSnapIdx((i) => i + 1)}
              className={`h-full w-full object-cover object-top transition-[opacity,transform] duration-500 group-hover:scale-[1.01] ${snapLoaded ? "opacity-100" : "opacity-0"}`}
            />
          </a>
        )}

        {formattedUrl && (
          <div className="absolute bottom-3 right-3 flex max-w-[90%] items-center gap-2 rounded border border-[color:var(--color-line)]/80 bg-[color:var(--color-panel)]/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-[color:var(--color-ink-dim)] shadow-md pointer-events-none">
            {mode === "live" ? <MonitorPlay className="h-3 w-3 text-[color:var(--color-accent)]" /> : <Camera className="h-3 w-3 text-[color:var(--color-accent)]" />}
            <span className="truncate">
              {mode === "live" ? "LIVE · SANDBOXED" : embeddable ? "SNAPSHOT" : `SNAPSHOT · live view blocked by site (${reason ?? "framing not allowed"})`}
              {source ? ` · source: ${source}` : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--color-line)] bg-[color:var(--color-panel-2)] mb-3">
        <Globe className="h-6 w-6 text-[color:var(--color-accent)]" />
      </div>
      <h4 className="text-sm font-semibold text-[color:var(--color-ink)]">{title}</h4>
      <p className="mt-1 max-w-md text-xs text-[color:var(--color-ink-dim)] leading-relaxed">{body}</p>
    </div>
  );
}
