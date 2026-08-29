import { Fragment, useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Check, Flag, CircleCheckBig, Send, Beaker } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CaseChart } from "./CaseChart";
import { TierBadge } from "./TierBadge";
import { useMetricMD } from "@/lib/metricmd/store";
import { fmtINR, fmtPct, fmtSigned, titleize } from "@/lib/metricmd/format";
import type { DiagnosisCase } from "@/lib/metricmd/types";

export function DiagnosisCard({
  kase,
  index = 0,
  compact = false,
}: {
  kase: DiagnosisCase;
  index?: number;
  compact?: boolean;
}) {
  const {
    visibleEvidence,
    maskedEvidenceCount,
    isRestricted,
    submitFeedback,
    verdictFor,
    addDraft,
    priors,
  } = useMetricMD();
  const [pulse, setPulse] = useState(false);
  const [activeEvidence, setActiveEvidence] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [flagNote, setFlagNote] = useState("");
  const [flagOpen, setFlagOpen] = useState(false);

  const verdict = verdictFor(kase.case_id);
  const priorKey = `${kase.region}:${kase.diagnosis}`;
  const prior = priors[priorKey];
  const evidence = visibleEvidence(kase);
  const masked = maskedEvidenceCount(kase);

  const highlight = (id: string) => {
    setActiveEvidence(id);
    setPulse(false);
    requestAnimationFrame(() => setPulse(true));
    window.setTimeout(() => setPulse(false), 1500);
  };

  const onAccept = () => {
    submitFeedback(kase.case_id, "accept");
    toast.success("Accepted", { description: `prior ${priorKey} +0.05` });
  };

  const onFlag = () => {
    submitFeedback(kase.case_id, "flag", flagNote);
    setFlagOpen(false);
    setFlagNote("");
    toast("prior \u22120.10, draft fingerprint queued", { description: priorKey });
  };

  const onAnswer = () => {
    if (!answer.trim()) return;
    const draft = addDraft(kase.case_id, answer.trim());
    setAnswer("");
    toast.success(`Draft ${draft.label} created, the library just grew.`);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="panel panel-hover flex flex-col overflow-hidden"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-border bg-raised px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
              {kase.case_id}
            </span>
            <span className="text-xs text-muted-foreground">
              {kase.region} / {kase.category}
            </span>
            <span className="text-xs text-muted-foreground">
              {kase.window[0]} to {kase.window[1]}
            </span>
          </div>
          <h3 className="mt-2 truncate text-sm font-semibold">{kase.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-2">
          <TierBadge tier={kase.tier} confidence={kase.confidence} />
          {masked > 0 && (
            <span className="rounded-full border border-ambiguous/40 bg-ambiguous/10 px-2 py-0.5 text-[10px] font-medium text-ambiguous">
              {masked} evidence lines masked
            </span>
          )}
        </div>
      </header>

      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-sm text-muted-foreground">{kase.kpi}</span>
          <span
            className={cn(
              "font-display text-2xl font-semibold",
              kase.pct < 0 ? "text-unknown" : "text-confident",
            )}
          >
            {fmtPct(kase.pct)}
          </span>
          <span className="text-sm text-muted-foreground">({fmtINR(kase.delta_inr)})</span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">
            mean z {fmtSigned(kase.mean_z)}
          </span>
        </div>

        <CaseChart
          kase={kase}
          pulse={pulse}
          highlighted={activeEvidence !== null}
          height={compact ? 140 : 170}
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
            <span>Confidence</span>
            <span className="font-mono">{kase.confidence.toFixed(2)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-raised">
            <motion.div
              className="confidence-fill h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${kase.confidence * 100}%` }}
              transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
            />
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            Evidence
          </p>
          <ul className="space-y-1.5">
            {evidence.map((e, i) => (
              <motion.li
                key={e.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.08, duration: 0.3 }}
              >
                <button
                  type="button"
                  onClick={() => highlight(e.id)}
                  onMouseEnter={() => setActiveEvidence(e.id)}
                  onMouseLeave={() => setActiveEvidence(null)}
                  onFocus={() => setActiveEvidence(e.id)}
                  onBlur={() => setActiveEvidence(null)}
                  className={cn(
                    "focus-ring flex w-full flex-col gap-1 rounded-md border border-transparent px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-raised/60 active:scale-[0.995]",
                    activeEvidence === e.id && "border-accent/50 bg-raised",
                  )}
                >
                  <span className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 rounded border border-border bg-raised px-1.5 py-0.5 font-mono text-[10px] text-accent">
                      {e.id}
                    </span>
                    <span className="min-w-0 flex-1 text-xs leading-relaxed">{e.fact}</span>
                  </span>
                  <span className="ml-7 w-fit rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {e.method} · {e.source}
                  </span>
                </button>
              </motion.li>
            ))}
          </ul>
        </div>

        {kase.tier === "CONFIDENT" && kase.playbook && (
          <div className="space-y-3">
            <div className="rounded-lg border border-ambiguous/35 bg-ambiguous/8 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ambiguous">
                Next step
              </p>
              <p className="mt-1 text-xs leading-relaxed">{kase.playbook.action}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span className="rounded border border-border px-2 py-0.5">
                  Owner {titleize(kase.playbook.owner)}
                </span>
                <span className="rounded border border-border px-2 py-0.5">
                  Recheck in {kase.playbook.recheck_days} days
                </span>
              </div>
            </div>
            {kase.verification && (
              <div className="flex items-start gap-2 rounded-lg border border-confident/40 bg-confident/10 p-3">
                <motion.svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 size-4 shrink-0"
                  fill="none"
                  stroke="var(--confident)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M4 12.5 L9.5 18 L20 6"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                  />
                </motion.svg>
                <p className="text-xs leading-relaxed text-confident">
                  VERIFIED · {kase.verification.verdict}. mean z after{" "}
                  {fmtSigned(kase.verification.mean_z_after)}
                </p>
              </div>
            )}
          </div>
        )}

        {kase.tier === "AMBIGUOUS" && (
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              {kase.candidates.slice(0, 2).map((c, i) => (
                <Fragment key={c.mechanism}>
                  {i === 1 && <span className="font-mono text-xs text-muted-foreground">vs</span>}
                  <div className="rounded-lg border border-border bg-raised/60 p-3 text-center">
                    <p className="text-xs font-semibold">{titleize(c.mechanism)}</p>
                    <p className="font-mono text-lg text-accent">{c.score.toFixed(2)}</p>
                  </div>
                </Fragment>
              ))}
            </div>
            {kase.separating_test && (
              <div className="rounded-lg border border-accent/40 bg-accent/10 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
                  The one test that separates them
                </p>
                <p className="mt-1 text-xs leading-relaxed">{kase.separating_test}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 gap-1.5 text-accent hover:bg-accent/15"
                  onClick={() => toast("Run this check queued", { description: kase.case_id })}
                >
                  <Beaker className="size-3.5" /> Run this check
                </Button>
              </div>
            )}
          </div>
        )}

        {kase.tier === "UNKNOWN" && (
          <div className="space-y-2 rounded-lg border border-unknown/40 bg-unknown/10 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-unknown">
              Human ask
            </p>
            <p className="text-xs leading-relaxed">{kase.human_ask}</p>
            <div className="flex gap-2 pt-1">
              <Input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Answer as the ops lead..."
                className="h-9 bg-background text-xs"
                onKeyDown={(e) => e.key === "Enter" && onAnswer()}
              />
              <Button size="sm" className="h-9 gap-1.5" onClick={onAnswer}>
                <Send className="size-3.5" /> Send
              </Button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-auto flex flex-wrap items-center gap-2 border-t border-border p-3">
        <Button
          size="sm"
          variant={verdict === "accept" ? "default" : "outline"}
          onClick={onAccept}
          className={cn(
            "gap-1.5 transition-transform active:scale-95",
            verdict === "accept" && "bg-confident text-background hover:bg-confident/90",
          )}
        >
          <motion.span
            key={verdict === "accept" ? "on" : "off"}
            initial={verdict === "accept" ? { scale: 0.6 } : false}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 12 }}
            className="flex items-center gap-1.5"
          >
            {verdict === "accept" ? (
              <CircleCheckBig className="size-3.5" />
            ) : (
              <Check className="size-3.5" />
            )}
            Accept
          </motion.span>
        </Button>

        <Popover open={flagOpen} onOpenChange={setFlagOpen}>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className={cn(
                "gap-1.5 transition-transform active:scale-95",
                verdict === "flag" && "border-unknown/50 text-unknown",
              )}
            >
              <Flag className="size-3.5" /> Flag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-2">
            <p className="text-xs font-semibold">What did the engine miss?</p>
            <Textarea
              value={flagNote}
              onChange={(e) => setFlagNote(e.target.value)}
              className="min-h-20 text-xs"
              placeholder="What did the engine miss?"
            />
            <Button size="sm" className="w-full" onClick={onFlag}>
              Submit flag
            </Button>
          </PopoverContent>
        </Popover>

        {typeof prior === "number" && (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "ml-auto rounded-full border px-2 py-0.5 font-mono text-[11px]",
              prior >= 0
                ? "border-confident/40 bg-confident/10 text-confident"
                : "border-unknown/40 bg-unknown/10 text-unknown",
            )}
          >
            prior {prior >= 0 ? "+" : "\u2212"}
            {Math.abs(prior).toFixed(2)}
          </motion.span>
        )}
        {isRestricted && (
          <span className="ml-auto text-[10px] text-muted-foreground">executive view</span>
        )}
      </footer>
    </motion.article>
  );
}
