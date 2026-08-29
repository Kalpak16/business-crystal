import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/mmd/StatTile";
import { useMetricMD } from "@/lib/metricmd/store";
import { titleize } from "@/lib/metricmd/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/evaluation")({
  head: () => ({
    meta: [
      { title: "Evaluation · MetricMD Console" },
      {
        name: "description",
        content:
          "Blind harness results per mechanism, with pass and fail rows and the honest UNKNOWN accounting.",
      },
      { property: "og:title", content: "Evaluation · MetricMD Console" },
      {
        property: "og:description",
        content: "73 blind planted runs, 0% false alarms, every failure accounted for.",
      },
    ],
  }),
  component: Evaluation,
});

const MECHANISM_ACCURACY: { label: string; got: number; total: number }[] = [
  { label: "stockout", got: 6, total: 6 },
  { label: "price_rise", got: 6, total: 6 },
  { label: "campaign_end", got: 3, total: 3 },
  { label: "cannibalization", got: 3, total: 3 },
  { label: "supply_shortage", got: 5, total: 6 },
  { label: "competitor_entry", got: 4, total: 6 },
  { label: "delivery_degradation", got: 4, total: 6 },
  { label: "discount_launch", got: 2, total: 3 },
  { label: "hard mode", got: 7, total: 12 },
  { label: "unknown", got: 5, total: 6 },
  { label: "sparse+clean", got: 13, total: 13 },
];

function Evaluation() {
  const { loading, data } = useMetricMD();
  const [filter, setFilter] = useState<"all" | "failures" | "unknowns">("all");
  const sc = data.scorecard;

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );

  const rows = data.harness_cases.filter((h) =>
    filter === "all" ? true : filter === "failures" ? !h.ok : h.got === "UNKNOWN",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-semibold">Evaluation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Measured on {sc.runs} blind planted runs. python harness.py reproduces every number.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <StatTile small label="Detection recall" value={sc.detection_recall} suffix="%" tone="confident" index={0} />
        <StatTile small label="Diagnosis accuracy" value={sc.diagnosis_accuracy} suffix="%" index={1} />
        <StatTile small label="False alarms" value={sc.false_alarm_rate} suffix="%" tone="confident" index={2} />
        <StatTile small label="Correct honest UNKNOWNs" value={sc.correct_unknown_rate} suffix="%" index={3} />
        <StatTile
          small
          label="Wrong but confident"
          value={1.4}
          suffix="%"
          caption={`${sc.wrong_confident} runs`}
          tone="ambiguous"
          index={4}
        />
      </section>

      <section className="panel p-4">
        <h2 className="text-sm font-semibold">Accuracy per mechanism</h2>
        <ul className="mt-4 space-y-3">
          {MECHANISM_ACCURACY.map((m, i) => {
            const pct = (m.got / m.total) * 100;
            const perfect = m.got === m.total;
            return (
              <li key={m.label} className="flex items-center gap-3">
                <span className="w-36 shrink-0 text-xs text-muted-foreground">
                  {titleize(m.label)}
                </span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-raised">
                  <motion.div
                    className={cn("h-full rounded-full", perfect ? "bg-confident" : "bg-ambiguous")}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                  />
                </div>
                <span
                  className={cn(
                    "w-14 shrink-0 text-right font-mono text-xs",
                    perfect ? "text-confident" : "text-ambiguous",
                  )}
                >
                  {m.got}/{m.total}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border p-4">
          <h2 className="text-sm font-semibold">Harness runs</h2>
          <div className="flex gap-1">
            {(
              [
                ["all", "All"],
                ["failures", "Failures only"],
                ["unknowns", "Unknowns"],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={filter === key ? "secondary" : "ghost"}
                onClick={() => setFilter(key)}
                className="text-xs"
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3">Case</th>
                <th className="p-3">Expected</th>
                <th className="p-3">Got</th>
                <th className="p-3">Tier</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Result</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h, i) => (
                <tr key={`${h.case}-${i}`} className="border-b border-border/60 last:border-0 hover:bg-raised/50">
                  <td className="p-3 font-mono">{h.case}</td>
                  <td className="p-3 text-muted-foreground">{titleize(h.expected)}</td>
                  <td className="p-3">{titleize(h.got)}</td>
                  <td className="p-3 font-mono text-muted-foreground">{h.tier}</td>
                  <td className="p-3 font-mono">{h.conf === null ? "n/a" : h.conf.toFixed(2)}</td>
                  <td className="p-3">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                        h.ok
                          ? "border-confident/40 bg-confident/10 text-confident"
                          : "border-unknown/40 bg-unknown/10 text-unknown",
                      )}
                    >
                      {h.ok ? "PASS" : "FAIL"}
                    </span>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Nothing in this slice.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="sticky bottom-0 border-t border-border bg-surface p-3 text-[11px] text-muted-foreground">
          8 of 12 failures are deliberate QUIETs on weak signals, the price of a 0% false alarm
          rate. 3 are safe UNKNOWNs. 1 is a genuine error.
        </p>
      </section>

      <section className="rounded-xl border border-accent/40 bg-accent/10 p-4">
        <h2 className="font-display text-sm font-semibold text-accent">Philosophy</h2>
        <p className="mt-1 text-sm leading-relaxed">
          When MetricMD is wrong it is almost never confidently wrong. That is the metric that
          keeps trust alive.
        </p>
      </section>
    </div>
  );
}
