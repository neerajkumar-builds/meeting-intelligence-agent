"use client";

import { getScoreBand } from "@/lib/constants";

interface CircularGaugeProps {
  score: number | null;
  label: string;
  subtitle?: string;
  size?: number;
}

const BAND_COLORS = {
  emerald: { stroke: "#10b981", bg: "#10b98120" },
  yellow: { stroke: "#f59e0b", bg: "#f59e0b20" },
  red: { stroke: "#ef4444", bg: "#ef444420" },
};

export function CircularGauge({
  score,
  label,
  subtitle,
  size = 120,
}: CircularGaugeProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const band = score !== null ? getScoreBand(score) : null;
  const colors = band
    ? BAND_COLORS[band.color]
    : { stroke: "#94a3b8", bg: "#94a3b820" };
  const progress = score !== null ? score / 10 : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/30"
          />
          {/* Progress ring */}
          {score !== null && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="transition-all duration-700 ease-out"
            />
          )}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-2xl font-semibold tabular-nums"
            style={{ color: score !== null ? colors.stroke : undefined }}
          >
            {score !== null ? score.toFixed(1) : "--"}
          </span>
          <span className="text-[10px] text-muted-foreground">/10</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium">{label}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
