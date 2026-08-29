import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DiagnosisCase } from "@/lib/metricmd/types";
import { fmtDate } from "@/lib/metricmd/format";

function ChartTooltip({
  active,
  payload,
  label,
  baseline,
  winStart,
  winEnd,
  kpi,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  baseline: number;
  winStart: string;
  winEnd: string;
  kpi: string;
}) {
  if (!active || !payload?.length || label == null) return null;
  const value = payload[0]?.value ?? 0;
  const delta = value - baseline;
  const deltaPct = baseline !== 0 ? (delta / Math.abs(baseline)) * 100 : 0;
  const inWindow = label >= winStart && label <= winEnd;
  const down = delta < 0;

  return (
    <div className="min-w-44 rounded-lg border border-accent/30 bg-raised/95 px-3 py-2 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.7),0_0_12px_-4px_var(--accent)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] font-medium text-foreground">
          {fmtDate(label)}
        </span>
        {inWindow && (
          <span className="rounded border border-accent/40 bg-accent/15 px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider text-accent">
            window
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {kpi}
        </span>
        <span className="font-mono text-sm font-semibold text-foreground">
          {`${Math.round(value).toLocaleString("en-IN")} INR`}
        </span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-border/60 pt-1">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          vs baseline
        </span>
        <span
          className="font-mono text-[11px] font-medium"
          style={{ color: down ? "var(--unknown)" : "var(--confident)" }}
        >
          {down ? "\u2212" : "+"}
          {Math.abs(deltaPct).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}

export function CaseChart({
  kase,
  height = 160,
  pulse = false,
  highlighted = false,
}: {
  kase: DiagnosisCase;
  height?: number;
  pulse?: boolean;
  highlighted?: boolean;
}) {
  const baseline = useMemo(() => {
    const pre = kase.series.slice(0, kase.window_start_index);
    if (!pre.length) return 0;
    return pre.reduce((a, b) => a + b.value, 0) / pre.length;
  }, [kase]);

  const winStart = kase.series[kase.window_start_index]?.day ?? kase.window[0];
  const winEnd = kase.series[kase.series.length - 1]?.day ?? kase.window[1];
  const gid = `mmd-fill-${kase.case_id}`;
  const active = highlighted || pulse;

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={kase.series} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--hairline)" strokeOpacity={0.5} vertical={false} />
          <XAxis
            dataKey="day"
            tickFormatter={fmtDate}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={{ stroke: "var(--hairline)" }}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            hide={height < 200}
            width={54}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            cursor={{
              stroke: "var(--accent)",
              strokeWidth: 1,
              strokeDasharray: "3 3",
              strokeOpacity: 0.7,
            }}
            content={
              <ChartTooltip
                baseline={baseline}
                winStart={winStart}
                winEnd={winEnd}
                kpi={kase.kpi}
              />
            }
          />
          <ReferenceArea
            x1={winStart}
            x2={winEnd}
            fill="var(--accent)"
            fillOpacity={active ? 0.22 : 0.1}
            stroke="var(--accent)"
            strokeOpacity={active ? 0.65 : 0.25}
            strokeWidth={active ? 1.5 : 1}
            className={pulse ? "shade-pulse" : ""}
            style={{ transition: "fill-opacity 200ms ease, stroke-opacity 200ms ease" }}
          />
          {active && (
            <>
              <ReferenceLine
                x={winStart}
                stroke="var(--accent)"
                strokeOpacity={0.9}
                strokeWidth={1.5}
              />
              <ReferenceLine
                x={winEnd}
                stroke="var(--accent)"
                strokeOpacity={0.9}
                strokeWidth={1.5}
              />
            </>
          )}
          <ReferenceLine
            y={baseline}
            stroke="var(--muted-foreground)"
            strokeDasharray="4 4"
            strokeOpacity={0.7}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--accent)"
            strokeWidth={2}
            fill={`url(#${gid})`}
            dot={false}
            activeDot={{
              r: 4,
              fill: "var(--accent)",
              stroke: "var(--background)",
              strokeWidth: 2,
            }}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
