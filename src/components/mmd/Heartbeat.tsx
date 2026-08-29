import { cn } from "@/lib/utils";

/** Brand motif: a thin looping purple ECG line. */
export function Heartbeat({ className }: { className?: string }) {
  const seg = "0 12 L 14 12 L 20 12 L 24 4 L 28 20 L 32 12 L 38 12 L 44 9 L 48 12 L 70 12";
  const path = `M ${seg} M 70 12 L ${seg
    .split("L")
    .map((p) => p.trim())
    .map((p, i) => {
      if (i === 0) return "";
      const [x, y] = p.split(" ");
      return `L ${Number(x) + 70} ${y}`;
    })
    .join(" ")
    .replace(/^\s*/, "")}`;

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
