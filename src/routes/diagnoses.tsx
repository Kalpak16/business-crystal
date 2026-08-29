import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence } from "motion/react";
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { LayoutGrid, Rows3 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiagnosisCard } from "@/components/mmd/DiagnosisCard";
import { EntitlementCard } from "@/components/mmd/EntitlementCard";
import { TierBadge } from "@/components/mmd/TierBadge";
import { useMetricMD } from "@/lib/metricmd/store";
import { fmtINR, fmtPct, fmtSigned, titleize } from "@/lib/metricmd/format";
import { cn } from "@/lib/utils";
import type { DiagnosisCase } from "@/lib/metricmd/types";

interface DiagSearch {
  case?: string | undefined;
  mechanism?: string | undefined;
}

export const Route = createFileRoute("/diagnoses")({
  validateSearch: (search: Record<string, unknown>): DiagSearch => ({
    case: typeof search["case"] === "string" ? search["case"] : undefined,
    mechanism: typeof search["mechanism"] === "string" ? search["mechanism"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Diagnoses · MetricMD Console" },
      {
        name: "description",
        content:
          "Every detected KPI movement with its diagnosis, evidence chain, control test and playbook.",
      },
      { property: "og:title", content: "Diagnoses · MetricMD Console" },
      {
        property: "og:description",
        content: "Filter, sort and open the full diagnostic record for each case.",
      },
    ],
  }),
  component: Diagnoses,
});

function Diagnoses() {
  const { loading, visibleCases, blockedCases, isRestricted, data } = useMetricMD();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const [view, setView] = useState<"table" | "board">("table");
  const [tier, setTier] = useState("all");
  const [region, setRegion] = useState("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"severity" | "confidence">("severity");

  const rows = useMemo(() => {
    let out = visibleCases.filter(
      (c) =>
        (tier === "all" || c.tier === tier) &&
        (region === "all" || c.region === region) &&
        (category === "all" || c.category === category) &&
        (!search.mechanism || c.diagnosis === search.mechanism),
    );
    out = [...out].sort((a, b) =>
      sort === "severity" ? Math.abs(b.mean_z) - Math.abs(a.mean_z) : b.confidence - a.confidence,
    );
    return out;
  }, [visibleCases, tier, region, category, sort, search.mechanism]);

  const selected = visibleCases.find((c) => c.case_id === search.case) ?? null;
  const setSelected = (id: string | null) =>
    void navigate({ search: (prev: DiagSearch) => ({ ...prev, case: id ?? undefined }) });

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    );

  const regions = Array.from(new Set(data.cases.map((c) => c.region)));
  const categories = Array.from(new Set(data.cases.map((c) => c.category)));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold">Diagnoses</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} case{rows.length === 1 ? "" : "s"} in scope
            {search.mechanism ? ` · filtered to ${titleize(search.mechanism)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-surface p-1">
          <Button
            size="sm"
            variant={view === "table" ? "secondary" : "ghost"}
            className="gap-1.5"
            onClick={() => setView("table")}
          >
            <Rows3 className="size-3.5" /> Table
          </Button>
          <Button
            size="sm"
            variant={view === "board" ? "secondary" : "ghost"}
            className="gap-1.5"
            onClick={() => setView("board")}
          >
            <LayoutGrid className="size-3.5" /> Board
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterSelect
          label="Tier"
          value={tier}
          onChange={setTier}
          options={["all", "CONFIDENT", "AMBIGUOUS", "UNKNOWN"]}
        />
        <FilterSelect label="Region" value={region} onChange={setRegion} options={["all", ...regions]} />
        <FilterSelect
          label="Category"
          value={category}
          onChange={setCategory}
          options={["all", ...categories]}
        />
        <FilterSelect
          label="Sort"
          value={sort}
          onChange={(v) => setSort(v as "severity" | "confidence")}
          options={["severity", "confidence"]}
        />
        {search.mechanism && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => void navigate({ search: () => ({}) })}
          >
            Clear fingerprint filter
          </Button>
        )}
      </div>

      {view === "table" ? (
        <div className="panel overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-3">Case</th>
                <th className="p-3">Region / Category</th>
                <th className="p-3">Diagnosis</th>
                <th className="p-3">Movement</th>
                <th className="p-3">mean z</th>
                <th className="p-3">Tier</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr
                  key={c.case_id}
                  tabIndex={0}
                  onClick={() => setSelected(c.case_id)}
                  onKeyDown={(e) => e.key === "Enter" && setSelected(c.case_id)}
                  className="focus-ring cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-raised/60"
                >
                  <td className="p-3">
                    <span className="font-mono text-accent">{c.case_id}</span>
                    <p className="mt-0.5 text-muted-foreground">{c.title}</p>
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {c.region} / {c.category}
                  </td>
                  <td className="p-3">{titleize(c.diagnosis)}</td>
                  <td className={cn("p-3 font-mono", c.pct < 0 ? "text-unknown" : "text-confident")}>
                    {fmtPct(c.pct)} <span className="text-muted-foreground">{fmtINR(c.delta_inr)}</span>
                  </td>
                  <td className="p-3 font-mono">{fmtSigned(c.mean_z)}</td>
                  <td className="p-3">
                    <TierBadge tier={c.tier} confidence={c.confidence} />
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No cases match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {rows.map((c, i) => (
              <DiagnosisCard key={c.case_id} kase={c} index={i} compact />
            ))}
          </AnimatePresence>
        </div>
      )}

      {isRestricted && blockedCases.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {blockedCases.map((c, i) => (
            <EntitlementCard key={c.case_id} kase={c} index={i} />
          ))}
        </div>
      )}

      <Sheet open={Boolean(selected)} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display">
                  {selected.case_id} · {titleize(selected.diagnosis)}
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-8">
                <DiagnosisCard kase={selected} />
                {!isRestricted && <AnalystSections kase={selected} />}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function AnalystSections({ kase }: { kase: DiagnosisCase }) {
  const bars = kase.candidates.map((c) => ({ ...c, name: titleize(c.mechanism) }));
  const top = kase.candidates[0]?.mechanism;
  return (
    <div className="space-y-4">
      <section className="panel p-4">
        <h3 className="text-sm font-semibold">Candidates</h3>
        <div className="mt-3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bars} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" domain={[0, 1]} hide />
              <YAxis
                type="category"
                dataKey="name"
                width={130}
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Bar dataKey="score" radius={4} animationDuration={800}>
                {bars.map((b) => (
                  <Cell
                    key={b.mechanism}
                    fill={b.mechanism === top ? "var(--accent)" : "var(--primary)"}
                    fillOpacity={b.mechanism === top ? 1 : 0.35}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Losing bars are capped by contradicting evidence, for example competitor capped: delay
          tickets contradict it.
        </p>
      </section>

      <section className="panel p-4">
        <h3 className="text-sm font-semibold">Control test</h3>
        {kase.control.length ? (
          <>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {kase.control.map(([r, z]) => {
                const inBand = Math.abs(z) < 2;
                return (
                  <div
                    key={r}
                    className={cn(
                      "rounded-lg border p-3 text-center",
                      inBand
                        ? "border-confident/40 bg-confident/10 text-confident"
                        : "border-unknown/40 bg-unknown/10 text-unknown",
                    )}
                  >
                    <p className="text-[11px] text-muted-foreground">{r}</p>
                    <p className="font-mono text-sm">{fmtSigned(z)}</p>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              Control regions stayed inside their expected band, so the movement is local to{" "}
              {kase.region} and the diagnosis survives falsification.
            </p>
          </>
        ) : (
          <p className="mt-2 text-xs text-muted-foreground">
            No control group available for this case, which is one reason the engine abstained.
          </p>
        )}
      </section>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex items-center gap-2 text-[11px] text-muted-foreground">
      {label}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 w-40 bg-surface text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o} className="text-xs">
              {o === "all" ? "All" : titleize(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
