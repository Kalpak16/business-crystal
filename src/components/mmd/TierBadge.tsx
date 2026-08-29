import { Handshake, ShieldCheck, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tier } from "@/lib/metricmd/types";

export function TierBadge({
  tier,
  confidence,
  className,
}: {
  tier: Tier | string;
  confidence?: number;
  className?: string;
}) {
  const map: Record<string, { label: string; cls: string; Icon: typeof ShieldCheck }> = {
    CONFIDENT: {
      label: "CONFIDENT",
      cls: "text-confident border-confident/40 bg-confident/10",
      Icon: ShieldCheck,
    },
    AMBIGUOUS: {
      label: "AMBIGUOUS",
      cls: "text-ambiguous border-ambiguous/40 bg-ambiguous/10",
      Icon: Scale,
    },
    UNKNOWN: {
      label: "HONEST UNKNOWN",
      cls: "text-unknown border-unknown/40 bg-unknown/10",
      Icon: Handshake,
    },
    QUIET: {
      label: "QUIET",
      cls: "text-muted-foreground border-border bg-raised/60",
      Icon: Scale,
    },
  };
  const conf = map[tier] ?? map["QUIET"]!;
  const { label, cls, Icon } = conf;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold tracking-wide",
        cls,
        className,
      )}
    >
      <Icon className="size-3.5" />
      {label}
      {typeof confidence === "number" && (
        <span className="font-mono opacity-80">{confidence.toFixed(2)}</span>
      )}
    </span>
  );
}
