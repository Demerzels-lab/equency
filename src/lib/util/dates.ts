import type { IpoInfo } from "@/lib/providers/types";

/** Whole days between an ISO date and now (UTC). */
export function daysSince(iso: string | undefined): number | undefined {
  if (!iso) return undefined;
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return undefined;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

/** Age bucket per brief §4. */
export function ageBucket(daysPublic: number | undefined): IpoInfo["ageBucket"] {
  if (daysPublic == null) return undefined;
  if (daysPublic <= 7) return "NEW";
  if (daysPublic <= 30) return "RECENT";
  if (daysPublic <= 90) return "EARLY PUBLIC";
  if (daysPublic <= 180) return "EMERGING";
  return "SEASONED";
}

export function fmtDate(iso: string | undefined): string {
  if (!iso) return "·";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "·";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** "2m ago", "3h ago", "4d ago" · relative freshness label (brief §58). */
export function ago(iso: string | undefined): string {
  if (!iso) return "·";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "·";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
