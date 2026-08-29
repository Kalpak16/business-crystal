import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Skeleton } from "@/components/ui/skeleton";
import { FingerprintShape } from "@/components/mmd/FingerprintShape";
import { useMetricMD } from "@/lib/metricmd/store";
import { titleize } from "@/lib/metricmd/format";

export const Route = createFileRoute("/fingerprints")({
  head: () => ({
    meta: [
      { title: "Fingerprint Library · MetricMD Console" },
      {
        name: "description",
        content:
          "Eight KPI movement fingerprints with their shape, playbook, owner and recovery window.",
      },
      { property: "og:title", content: "Fingerprint Library · MetricMD Console" },
      {
        property: "og:description",
        content: "The library compounds like a physician's casebook.",
      },
    ],
  }),
  component: Fingerprints,
});

function Fingerprints() {
  const { loading, data, drafts } = useMetricMD();
  const navigate = useNavigate();

  if (loading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    );

  const entries = Object.entries(data.fingerprints);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold">Fingerprint Library</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {entries.length} mechanisms. Click a fingerprint to filter the Diagnoses screen.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {entries.map(([mechanism, fp], i) => (
          <motion.button
            key={mechanism}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.35 }}
            onClick={() => void navigate({ to: "/diagnoses", search: { mechanism } })}
            className="panel panel-hover focus-ring flex flex-col gap-3 p-4 text-left active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold">{titleize(mechanism)}</h2>
              <span className="rounded border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                {fp.shape}
              </span>
            </div>
            <FingerprintShape shape={fp.shape} />
            <p className="text-xs leading-relaxed text-muted-foreground">{fp.playbook}</p>
            <div className="mt-auto flex flex-wrap gap-2 text-[10px]">
              <span className="rounded-full border border-border bg-raised px-2 py-0.5">
                Owner {titleize(fp.owner)}
              </span>
              <span className="rounded-full border border-border bg-raised px-2 py-0.5">
                Recovery {fp.recovery_days} days
              </span>
            </div>
          </motion.button>
        ))}

        <div className="flex flex-col justify-center gap-2 rounded-xl border border-dashed border-accent/50 bg-accent/5 p-4">
          <p className="font-display text-sm font-semibold text-accent">
            {drafts.length ? drafts[drafts.length - 1]!.label : "Fingerprint #9"}, drafting...
          </p>
          {drafts.length ? (
            <ul className="space-y-2">
              {drafts.map((d) => (
                <li key={d.id} className="text-xs text-muted-foreground">
                  <span className="font-mono text-foreground">{d.label}</span> from {d.source_case}
                  {d.note ? `: ${d.note}` : ""}
                  <span className="block text-[10px]">{d.status}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">
              Answer an honest UNKNOWN and the draft appears here. The library compounds like a
              physician's casebook.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
