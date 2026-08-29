import { motion } from "motion/react";
import { Lock } from "lucide-react";
import type { DiagnosisCase } from "@/lib/metricmd/types";

export function EntitlementCard({ kase, index = 0 }: { kase: DiagnosisCase; index?: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-start justify-center gap-3 rounded-xl border border-unknown/60 bg-unknown/5 p-6"
    >
      <span className="inline-flex items-center gap-2 rounded-md border border-unknown/50 bg-unknown/10 px-2 py-1 text-[11px] font-semibold tracking-wider text-unknown">
        <Lock className="size-3.5" /> ENTITLEMENT
      </span>
      <p className="text-sm font-semibold">Withheld by contract.</p>
      <p className="text-xs text-muted-foreground">This access attempt is audit logged.</p>
      <p className="font-mono text-[11px] text-muted-foreground">
        {kase.case_id} · {kase.region} / {kase.category}
      </p>
    </motion.article>
  );
}
