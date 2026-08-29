import { cn } from "@/lib/utils";

/** Brand motif: a thin looping purple ECG line. */
export function Heartbeat({ className }: { className?: string }) {
  const pts = [
    [0, 12], [14, 12], [20, 12], [24, 4], [28, 20], [32, 12], [38, 12], [44, 9], [48, 12], [70, 12],
  ] as const;
  const build = (offset: number) =>
    pts.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x + offset} ${y}`).join(" ");
  const path = `${build(0)} ${build(70)}`;

  return (
    <div className={cn("relative h-6 overflow-hidden", className)} aria-hidden="true">
      <svg viewBox="0 0 140 24" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="mmd-ecg" x1="0" x2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.1" />
            <stop offset="50%" stopColor="var(--accent)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill="none"
          stroke="url(#mmd-ecg)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="70 70"
          style={{ animation: "mmd-dash 3.2s linear infinite" }}
        />
      </svg>
    </div>
  );
}
