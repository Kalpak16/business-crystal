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

export function CaseChart({
  kase,
  height = 160,
  pulse = false,
}: {
  kase: DiagnosisCase;
  height?: number;
  pulse?: boolean;
}) {
  const baseline = useMemo(() => {
    const pre = kase.series.slice(0, kase.window_start_index);
    if (!pre.length) return 0;
    return pre.reduce((a, b) => a + b.value, 0) / pre.length;
  }, [kase]);

  const winStart = kase.series[kase.window_start_index]?.day ?? kase.window[0];
  const winEnd = kase.series[kase.series.length - 1]?.day ?? kase.window[1];
  const gid = `mmd-fill-${kase.case_id}`;

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
            cursor={{ stroke: "var(--accent)", strokeWidth: 1 }}
            contentStyle={{
              background: "var(--raised)",
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              color: "var(--foreground)",
              fontSize: 12,
            }}
            labelFormatter={(l: string) => l}
            formatter={(v: number) => [`${Math.round(v).toLocaleString("en-IN")} INR`, kase.kpi]}
          />
          <ReferenceArea
            x1={winStart}
            x2={winEnd}
            fill="var(--accent)"
            fillOpacity={0.1}
            stroke="var(--accent)"
            strokeOpacity={0.25}
            className={pulse ? "shade-pulse" : ""}
          />
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
            activeDot={{ r: 3, fill: "var(--accent)" }}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
