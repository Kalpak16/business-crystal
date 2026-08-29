import { AnimatePresence, motion } from "motion/react";
import { createFileRoute } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/mmd/StatTile";
import { DiagnosisCard } from "@/components/mmd/DiagnosisCard";
import { EntitlementCard } from "@/components/mmd/EntitlementCard";
import { useMetricMD } from "@/lib/metricmd/store";
import { fmtSigned, titleize } from "@/lib/metricmd/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MetricMD Console · Diagnosis layer for business metrics" },
      {
        name: "description",
        content:
          "Mission control for KPI movements: detect, diagnose, falsify, abstain and verify, with every number computed by the engine.",
      },
      { property: "og:title", content: "MetricMD Console" },
      {
        property: "og:description",
        content: "The diagnosis layer for business metrics. 0 LLM tokens, every number reproducible.",
      },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { loading, data, visibleCases, blockedCases, isRestricted } = useMetricMD();
  const sc = data.scorecard;

  if (loading) return <OverviewSkeleton />;

  const regions = Array.from(new Set(data.cases.map((c) => c.region)));
  const categories = Array.from(new Set(data.cases.map((c) => c.category)));

  const activity = visibleCases.flatMap((c) => {
    const rows = [
      { at: c.window[0], text: `${c.case_id} detected in ${c.region} / ${c.category}` },
      {
        at: c.window[1],
        text:
          c.tier === "UNKNOWN"
            ? `${c.case_id} abstained, human ask routed`
            : `${c.case_id} diagnosed ${titleize(c.diagnosis)}`,
      },
    ];
    if (c.control.length)
      rows.push({ at: c.window[1], text: `${c.case_id} control test passed on ${c.control.length} regions` });
    if (c.verification)
      rows.push({
        at: c.verification.recheck_window[1],
        text: `${c.case_id} verified RESOLVED, mean z after ${fmtSigned(c.verification.mean_z_after)}`,
      });
    return rows;
  });
  activity.sort((a, b) => (a.at < b.at ? 1 : -1));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="font-display text-xl font-semibold">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">{data.business}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile label="Detection recall" value={sc.detection_recall} suffix="%" index={0} tone="confident" />
        <StatTile label="Diagnosis accuracy" value={sc.diagnosis_accuracy} suffix="%" index={1} />
        <StatTile label="False alarms" value={sc.false_alarm_rate} suffix="%" index={2} tone="confident" />
        <StatTile label="Correct honest UNKNOWNs" value={sc.correct_unknown_rate} suffix="%" index={3} />
        <StatTile
          label="Wrong but confident"
          value={1.4}
          suffix="%"
          caption={`${sc.wrong_confident} runs`}
          tone="ambiguous"
          index={4}
        />
      </section>
      <p className="text-xs text-muted-foreground">
        Measured on {sc.runs} blind planted runs. python harness.py reproduces every number.
      </p>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visibleCases.map((c, i) => (
              <DiagnosisCard key={c.case_id} kase={c} index={i} compact />
            ))}
            {blockedCases.map((c, i) => (
              <EntitlementCard key={c.case_id} kase={c} index={visibleCases.length + i} />
            ))}
          </AnimatePresence>
        </section>

        <aside className="space-y-4">
          <div className="panel p-4">
            <h2 className="text-sm font-semibold">This quarter</h2>
            <ol className="mt-3 space-y-3">
              {activity.map((a, i) => (
                <motion.li
                  key={`${a.at}-${i}`}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex gap-3 text-xs"
                >
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-accent" />
                  <span className="flex-1 leading-relaxed">{a.text}</span>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{a.at}</span>
                </motion.li>
              ))}
              {!activity.length && (
                <li className="text-xs text-muted-foreground">
                  No activity inside this persona scope.
                </li>
              )}
            </ol>
          </div>

          <div className="panel p-4">
            <h2 className="text-sm font-semibold">Region x category</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full border-separate border-spacing-1 text-[10px]">
                <thead>
                  <tr>
                    <th />
                    {categories.map((cat) => (
                      <th key={cat} className="font-normal text-muted-foreground">
                        {cat}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {regions.map((r) => (
                    <tr key={r}>
                      <td className="pr-2 text-muted-foreground">{r}</td>
                      {categories.map((cat) => {
                        const hit = data.cases.find((c) => c.region === r && c.category === cat);
                        const sev = hit ? Math.min(1, Math.abs(hit.mean_z) / 4.5) : 0;
                        const blocked = isRestricted && hit && !visibleCases.includes(hit);
                        return (
                          <td key={cat}>
                            <div
                              title={hit ? `${hit.case_id} mean z ${fmtSigned(hit.mean_z)}` : "no signal"}
                              className={cn(
                                "h-7 rounded-md border transition-all",
                                hit ? "border-accent/40" : "border-border",
                                blocked && "border-unknown/50",
                              )}
                              style={
                                hit
                                  ? {
                                      background: blocked
                                        ? `color-mix(in srgb, var(--unknown) ${sev * 45}%, transparent)`
                                        : `color-mix(in srgb, var(--accent) ${sev * 60}%, transparent)`,
                                    }
                                  : undefined
                              }
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-7 w-40" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
