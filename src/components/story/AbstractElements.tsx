import React from "react";

/**
 * Abstract vector accents inspired by high-end financial & crypto institutional design (Pendle / Linear style).
 * Pure SVG, light theme optimized with fine hairlines, gradients, and subtle mathematical curves.
 */
export function AbstractRibbon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none select-none opacity-40 mix-blend-multiply transition-opacity duration-500 ${className}`}
    >
      <defs>
        <linearGradient id="ribbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
          <stop offset="50%" stopColor="#4f46e5" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#059669" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="ribbonGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M -20,120 C 80,40 180,180 320,60 C 380,10 420,80 440,110"
        stroke="url(#ribbonGrad1)"
        strokeWidth="1.5"
        strokeDasharray="4 2"
      />
      <path
        d="M -10,135 C 90,55 190,195 330,75 C 390,25 430,95 450,125"
        stroke="url(#ribbonGrad2)"
        strokeWidth="2"
      />
      <path
        d="M 20,150 C 110,80 205,210 345,95"
        stroke="#0284c7"
        strokeOpacity="0.15"
        strokeWidth="1"
      />
      <circle cx="320" cy="60" r="3" fill="#0284c7" />
      <circle cx="320" cy="60" r="8" stroke="#0284c7" strokeOpacity="0.3" strokeWidth="1" />
    </svg>
  );
}

export function GeometricRadarBadge({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-slate-200/80 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06)] text-[11px] font-mono font-medium text-slate-700">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-600"></span>
      </span>
      <span className="tracking-wider uppercase text-slate-500 font-semibold">{label}</span>
      <span className="text-slate-300 font-sans">|</span>
      <span className="text-sky-600 font-mono text-[10px]">46630 · VERIFIED</span>
    </div>
  );
}

export function AbstractMetricCard({
  title,
  value,
  sub,
  badge,
}: {
  title: string;
  value: string;
  sub: string;
  badge?: string;
}) {
  return (
    <div className="relative overflow-hidden group p-5 rounded-2xl bg-white/90 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_36px_-6px_rgba(2,132,199,0.12)] hover:border-sky-300 transition-all duration-300">
      <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-sky-100/50 via-indigo-50/20 to-transparent rounded-bl-full pointer-events-none" />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono tracking-wider uppercase text-slate-500">{title}</span>
        {badge && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-semibold">
            {badge}
          </span>
        )}
      </div>
      <div className="text-2xl font-black tracking-tight text-slate-900 mb-1 group-hover:text-sky-600 transition-colors">
        {value}
      </div>
      <p className="text-xs text-slate-500 leading-relaxed">{sub}</p>
    </div>
  );
}