import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Check, Flag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMetricMD } from "@/lib/metricmd/store";
import { titleize } from "@/lib/metricmd/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback · MetricMD Console" },
      {
        name: "description",
        content:
          "Accept and Flag events with persona attribution, mechanism priors and the draft fingerprint queue.",
      },
      { property: "og:title", content: "Feedback · MetricMD Console" },
      {
        property: "og:description",
        content: "Every Accept or Flag trains the library.",
      },
    ],
  }),
  component: Feedback,
});

function Feedback() {
  const { loading, feedback, priors, drafts } = useMetricMD();

  if (loading)
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-64 rounded-xl" />
        ))}
      </div>
    );

  const priorRows = Object.entries(priors);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold">Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every Accept or Flag trains the library.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold">Timeline</h2>
          {feedback.length ? (
            <ol className="mt-3 space-y-3">
              {feedback.map((f, i) => (
                <motion.li
                  key={f.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 rounded-lg border border-border bg-raised/40 p-3"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border",
                      f.verdict === "accept"
                        ? "border-confident/40 bg-confident/10 text-confident"
                        : "border-unknown/40 bg-unknown/10 text-unknown",
                    )}
                  >
                    {f.verdict === "accept" ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Flag className="size-3.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs">
                      <span className="font-mono text-accent">{f.case_id}</span>{" "}
                      {f.verdict === "accept" ? "accepted" : "flagged"} by {f.personaName}
                    </p>
                    {f.note && <p className="mt-1 text-xs text-muted-foreground">{f.note}</p>}
                    <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                      {f.priorKey} {f.priorDelta >= 0 ? "+" : "\u2212"}
                      {Math.abs(f.priorDelta).toFixed(2)} · {new Date(f.at).toLocaleString("en-GB")}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              No feedback yet. Every Accept or Flag trains the library.
            </p>
          )}
        </section>

        <div className="space-y-4">
          <section className="panel p-4">
            <h2 className="text-sm font-semibold">Mechanism priors</h2>
            {priorRows.length ? (
              <ul className="mt-3 space-y-2">
                {priorRows.map(([key, val]) => (
                  <li key={key} className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">{key}</span>
                    <span
                      className={cn(
                        "font-mono",
                        val >= 0 ? "text-confident" : "text-unknown",
                      )}
                    >
                      {val >= 0 ? "+" : "\u2212"}
                      {Math.abs(val).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                No priors adjusted yet.
              </p>
            )}
          </section>

          <section className="panel p-4">
            <h2 className="text-sm font-semibold">Draft fingerprints</h2>
            {drafts.length ? (
              <ul className="mt-3 space-y-2">
                {drafts.map((d) => (
                  <li key={d.id} className="rounded-lg border border-dashed border-accent/40 p-2">
                    <p className="text-xs font-semibold text-accent">{d.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {titleize(d.source_case)}
                      {d.note ? `: ${d.note}` : ""}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{d.status}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">
                No drafts queued yet.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
