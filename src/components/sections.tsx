import { Panel, DataModeBadge } from "@/components/primitives";
import { fmtCompactUsd } from "@/lib/util/format";
import { ago, fmtDate } from "@/lib/util/dates";
import type { NewsItem } from "@/lib/providers/types";
import type { Fundamentals } from "@/lib/providers/xbrl";

export function FundamentalsPanel({ f }: { f: Fundamentals }) {
  return (
    <Panel title="Fundamentals" badge={<DataModeBadge mode={f.available ? "LIVE" : "SIMULATED"} />}>
      {f.available ? (
        <div className="flex flex-col">
          {f.items.map((it) => (
            <div key={it.key} className="flex items-baseline justify-between border-b hairline py-1.5 text-xs last:border-0">
              <span style={{ color: "var(--color-ink-dim)" }}>{it.label}</span>
              <span className="mono" style={{ color: it.value < 0 ? "var(--color-danger)" : "var(--color-ink)" }}>
                {fmtCompactUsd(it.value)}
              </span>
            </div>
          ))}
          <div className="label mt-2 normal-case" style={{ letterSpacing: 0 }}>
            Latest reported · SEC XBRL (VERIFIED tier-1)
          </div>
        </div>
      ) : (
        <div className="text-xs" style={{ color: "var(--color-ink-faint)" }}>
          No XBRL fundamentals yet · this issuer has not filed a 10-Q/10-K. Populates automatically on first periodic report. Not fabricated.
        </div>
      )}
    </Panel>
  );
}

export function NewsPanel({ items }: { items: NewsItem[] | null }) {
  return (
    <Panel title="News" badge={<DataModeBadge mode={items ? "LIVE" : "SIMULATED"} />}>
      {items && items.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {items.slice(0, 6).map((n, i) => (
            <a
              key={i}
              href={n.url}
              target="_blank"
              rel="noreferrer"
              className="group block border-b hairline pb-2 last:border-0"
            >
              <div className="text-xs leading-snug transition-colors group-hover:text-[color:var(--color-accent)]" style={{ color: "var(--color-ink)" }}>
                {n.headline}
              </div>
              <div className="label mt-1 flex items-center gap-2 normal-case" style={{ letterSpacing: 0 }}>
                <span>{n.source}</span>
                <span>·</span>
                <span>{ago(n.publishedAt)}</span>
                <span className="opacity-60">· tier-3, cross-check</span>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="text-xs" style={{ color: "var(--color-ink-faint)" }}>
          {items ? "No recent company news in window." : "News feed not configured (add FINNHUB_API_KEY)."}
        </div>
      )}
    </Panel>
  );
}

export function ThesisHistory({ direction, since }: { direction: string; since?: string }) {
  return (
    <Panel title="Thesis History">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <span className="mono mt-0.5" style={{ color: "var(--color-ink-faint)", fontSize: 11 }}>{fmtDate(since)}</span>
          <div>
            <div className="text-xs" style={{ color: "var(--color-ink)" }}>{direction}</div>
            <div className="label normal-case" style={{ letterSpacing: 0 }}>Initial thesis</div>
          </div>
        </div>
        <div className="label normal-case leading-relaxed" style={{ letterSpacing: 0, color: "var(--color-ink-faint)" }}>
          History accrues as the Intelligence Core re-runs on new filings and market events · only real
          thesis changes are recorded here, never back-dated.
        </div>
      </div>
    </Panel>
  );
}
