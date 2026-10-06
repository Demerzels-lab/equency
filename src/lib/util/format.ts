export function fmtUsd(n?: number): string {
  if (n == null || Number.isNaN(n)) return "·";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Compact currency with sign: $2.4B, -$18.3M, $412K. */
export function fmtCompactUsd(n?: number): string {
  if (n == null || Number.isNaN(n)) return "·";
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(0)}K`;
  return `${sign}$${a.toFixed(0)}`;
}

export function fmtInt(n?: number): string {
  if (n == null || Number.isNaN(n)) return "·";
  return n.toLocaleString("en-US");
}
