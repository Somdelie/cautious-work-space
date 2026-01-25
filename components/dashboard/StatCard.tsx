// components/dashboard/StatCard.tsx
"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";

type SubLine = { dotClassName: string; text: string };

export function StatCard({
  label,
  value,
  hint,
  icon,
  iconBg,
  bgColor,
  borderColor,

  percent = 0,
  statusText,
  subLines = [],

  ringColorClass = "text-sky-400",
  trackClass = "text-slate-800/60",

  // 🌊 new
  waveFrom = "from-sky-500/25",
  waveTo = "to-sky-500/5",
}: {
  label: string;
  value: number;
  hint: string;
  icon: React.ReactNode;
  iconBg: string;
  bgColor?: string;
  borderColor?: string;

  percent?: number;
  statusText?: string;
  subLines?: SubLine[];

  ringColorClass?: string;
  trackClass?: string;

  // 🌊 wave color control
  waveFrom?: string;
  waveTo?: string;
}) {
  const pct = Math.max(0, Math.min(100, percent));

  return (
    <div
      className={[
        "relative overflow-hidden rounded-md border",
        "px-4 py-3 min-h-[104px]",
        borderColor ?? "border-slate-800",
        bgColor ?? "bg-slate-900/90",
      ].join(" ")}
    >
      {/* 🌊 WATER BACKGROUND */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14">
        <div
          className={`absolute inset-0 bg-gradient-to-r ${waveFrom} ${waveTo} opacity-60`}
        />

        {/* wave svg */}
        <svg
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 h-full w-[200%] animate-wave"
        >
          <path
            fill="currentColor"
            className="text-white/10"
            d="M0,40 C120,55 240,20 360,30 480,40 600,70 720,65 840,60 960,35 1080,30 1200,25 1320,40 1440,50 L1440,90 L0,90 Z"
          />
        </svg>
      </div>

      {/* CONTENT */}
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-slate-400 text-[11px] font-medium">{label}</p>
            <p className="mt-1 text-2xl font-bold text-slate-100 leading-7">
              {value}
            </p>

            <div className="mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" />
              <span className="text-[11px] text-slate-400 truncate">
                {hint}
              </span>
            </div>
          </div>

          {/* donut */}
          <MiniDonut
            percent={pct}
            label={statusText ?? `${Math.round(pct)}%`}
            ringColorClass={ringColorClass}
            trackClass={trackClass}
          />
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div
            className={`h-9 w-9 ${iconBg} rounded flex items-center justify-center`}
          >
            {icon}
          </div>

          {subLines.length > 0 && (
            <div className="flex flex-col gap-1 text-[11px] text-slate-300 text-right">
              {subLines.slice(0, 2).map((l, i) => (
                <div key={i} className="flex items-center justify-end gap-2">
                  <span>{l.text}</span>
                  <span className={`h-2 w-2 rounded-full ${l.dotClassName}`} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniDonut({
  percent,
  label,
  ringColorClass,
  trackClass,
}: {
  percent: number;
  label: string;
  ringColorClass: string;
  trackClass: string;
}) {
  const size = 44;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (percent / 100) * c;

  return (
    <div className="relative h-[44px] w-[44px] shrink-0">
      <svg width={size} height={size}>
        <circle
          className={trackClass}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          r={r}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={ringColorClass}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="transparent"
          r={r}
          cx={size / 2}
          cy={size / 2}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-semibold text-slate-100">
          {label}
        </span>
      </div>
    </div>
  );
}
