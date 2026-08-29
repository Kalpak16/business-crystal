import { useEffect, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Fingerprint,
  LayoutDashboard,
  MessageSquareHeart,
  Search,
  Stethoscope,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Heartbeat } from "./Heartbeat";
import { useMetricMD } from "@/lib/metricmd/store";
import { titleize } from "@/lib/metricmd/format";

const NAV = [
  { to: "/", label: "Overview", Icon: LayoutDashboard },
  { to: "/diagnoses", label: "Diagnoses", Icon: Stethoscope },
  { to: "/evaluation", label: "Evaluation", Icon: FlaskConical },
  { to: "/fingerprints", label: "Fingerprint Library", Icon: Fingerprint },
  { to: "/feedback", label: "Feedback", Icon: MessageSquareHeart },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data, persona, setPersona, togglePersona } = useMetricMD();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      const idx = ["1", "2", "3", "4", "5"].indexOf(e.key);
      if (idx >= 0) {
        e.preventDefault();
        void navigate({ to: NAV[idx]!.to });
      }
      if (e.key.toLowerCase() === "p") togglePersona();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, togglePersona]);

  const telemetry = data.telemetry;

  const [sweep, setSweep] = useState(0);
  const [prevPersona, setPrevPersona] = useState(persona);
  if (prevPersona !== persona) {
    setPrevPersona(persona);
    setSweep((s) => s + 1);
  }
  const personaLabel =
    persona === "regional_head" ? "Priya · Regional Head (North)" : "Dev · Central Analyst";

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-300 md:flex",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <Activity className="size-5 shrink-0 text-accent" />
          {!collapsed && (
            <span className="font-display text-lg font-semibold">
              Metric<span className="text-accent">MD</span>
            </span>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {NAV.map(({ to, label, Icon }, i) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "focus-ring group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors active:scale-[0.98]",
                  active
                    ? "bg-raised text-foreground"
                    : "text-muted-foreground hover:bg-raised/60 hover:text-foreground",
                )}
                title={`${label} (${i + 1})`}
              >
                <Icon className={cn("size-4 shrink-0", active && "text-accent")} />
                {!collapsed && <span className="truncate">{label}</span>}
                {!collapsed && (
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {i + 1}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="focus-ring m-2 flex items-center justify-center gap-2 rounded-lg border border-border py-2 text-xs text-muted-foreground transition-colors hover:bg-raised active:scale-95"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          {!collapsed && "Collapse"}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="font-display text-base font-semibold md:hidden">
              Metric<span className="text-accent">MD</span>
            </span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="focus-ring flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 text-left text-xs text-muted-foreground transition-colors hover:border-accent/50 active:scale-[0.99] md:max-w-sm"
            >
              <Search className="size-3.5" />
              <span className="truncate">Search cases, fingerprints, harness rows</span>
              <kbd className="ml-auto hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] sm:block">
                cmd K
              </kbd>
            </button>

            <div className="hidden w-32 lg:block">
              <Heartbeat />
            </div>

            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
              <span className="pulse-dot size-1.5 rounded-full bg-confident" />
              engine {telemetry.total_ms} ms · {telemetry.llm_tokens} tokens · INR{" "}
              {telemetry.cost_inr.toFixed(2)}
            </div>

            <div className="flex items-center rounded-lg border border-border bg-background p-1">
              {(
                [
                  ["regional_head", "Priya · Regional Head (North)", "PM"],
                  ["central_analyst", "Dev · Central Analyst", "DR"],
                ] as const
              ).map(([key, label, initials]) => {
                const active = persona === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setPersona(key)}
                    className={cn(
                      "focus-ring relative flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs transition-colors active:scale-95",
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="persona-pill"
                        className="absolute inset-0 rounded-md border border-accent/40 bg-raised"
                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative flex size-5 items-center justify-center rounded-full bg-primary/40 font-mono text-[9px]">
                      {initials}
                    </span>
                    <span className="relative hidden sm:block">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <main className="relative min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={persona}
              className="p-4 md:p-6"
              initial={{ opacity: 0, y: 28, scale: 0.985, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, scale: 0.99, filter: "blur(8px)" }}
              transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {sweep > 0 && (
            <motion.div
              key={sweep}
              className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
              initial="in"
              animate="out"
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="absolute inset-y-0 w-[140%] bg-gradient-to-r from-transparent via-accent/25 to-transparent"
                variants={{
                  in: { x: "-120%" },
                  out: { x: "120%", transition: { duration: 0.7, ease: [0.7, 0, 0.2, 1] } },
                }}
              />
              <motion.div
                className="absolute inset-0 bg-accent/10"
                variants={{ in: { opacity: 0.55 }, out: { opacity: 0, transition: { duration: 0.6 } } }}
              />
              <motion.div
                className="relative flex items-center gap-3 rounded-xl border border-accent/50 bg-surface/90 px-5 py-3 shadow-[0_0_60px_-10px_color-mix(in_srgb,var(--accent)_60%,transparent)] backdrop-blur"
                variants={{
                  in: { opacity: 0, scale: 0.8, y: 12 },
                  out: {
                    opacity: [0, 1, 1, 0],
                    scale: [0.8, 1.06, 1, 0.96],
                    y: [12, 0, 0, -10],
                    transition: { duration: 0.75, times: [0, 0.25, 0.7, 1] },
                  },
                }}
              >
                <span className="pulse-dot size-2 rounded-full bg-accent" />
                <span className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
                  Switching scope
                </span>
                <span className="font-display text-sm font-semibold">{personaLabel}</span>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="border-t border-border bg-surface px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
          Truth boundary: every number on this page was computed by SQL, statistics, business
          rules or retrieval before any narrative existed. Generated at 0 LLM tokens.
        </footer>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Jump to a case, fingerprint or harness row" />
        <CommandList>
          <CommandEmpty>Nothing matches that query.</CommandEmpty>
          <CommandGroup heading="Cases">
            {data.cases.map((c) => (
              <CommandItem
                key={c.case_id}
                value={`${c.case_id} ${c.title} ${c.region} ${c.category}`}
                onSelect={() => {
                  setOpen(false);
                  void navigate({ to: "/diagnoses", search: { case: c.case_id } });
                }}
              >
                <span className="font-mono text-xs text-accent">{c.case_id}</span>
                <span className="truncate">{c.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Fingerprints">
            {Object.keys(data.fingerprints).map((k) => (
              <CommandItem
                key={k}
                value={k}
                onSelect={() => {
                  setOpen(false);
                  void navigate({ to: "/fingerprints" });
                }}
              >
                {titleize(k)}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Harness rows">
            {data.harness_cases.map((h, i) => (
              <CommandItem
                key={`${h.case}-${i}`}
                value={`${h.case} ${h.expected} ${h.got}`}
                onSelect={() => {
                  setOpen(false);
                  void navigate({ to: "/evaluation" });
                }}
              >
                <span className="font-mono text-xs">{h.case}</span>
                <span className="text-muted-foreground">{h.got}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
