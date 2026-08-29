import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { CountUp } from "./CountUp";

export function StatTile({
  label,
  value,
  suffix = "",
  decimals = 1,
  caption,
  tone = "default",
  index = 0,
  small = false,
  staticValue,
}: {
  label: string;
  value?: number;
  suffix?: string;
  decimals?: number;
  caption?: string;
  tone?: "default" | "confident" | "ambiguous" | "unknown";
  index?: number;
  small?: boolean;
  staticValue?: string;
}) {
  const toneCls = {
    default: "text-foreground",
    confident: "text-confident",
    ambiguous: "text-ambiguous",
    unknown: "text-unknown",
  }[tone];

  const borderCls = {
    default: "border-border",
    confident: "border-confident/35",
    ambiguous: "border-ambiguous/40",
    unknown: "border-unknown/40",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className={cn("panel panel-hover p-4", borderCls, small && "p-3")}
    >
      <p
        className={cn(
          "text-[11px] uppercase tracking-wider text-muted-foreground",
          small && "text-[10px]",
        )}
      >
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display font-semibold",
          small ? "text-xl" : "text-3xl",
          toneCls,
        )}
      >
        {staticValue ?? <CountUp value={value ?? 0} decimals={decimals} suffix={suffix} />}
      </p>
      {caption && <p className="mt-1 text-[11px] text-muted-foreground">{caption}</p>}
    </motion.div>
  );
}
