import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

const SHAPES: Record<string, string> = {
  cliff_rebound: "M 4 26 L 34 26 L 38 54 L 66 54 L 70 24 L 116 24",
  step_down_persistent: "M 4 22 L 44 22 L 48 48 L 116 48",
  slow_slide: "M 4 20 C 30 22, 58 32, 78 42 S 104 56, 116 60",
  spike_return: "M 4 44 L 28 44 L 34 16 L 70 16 L 76 44 L 116 44",
  lift: "M 4 46 L 44 46 L 48 20 L 116 20",
  drift_down: "M 4 22 C 36 26, 72 34, 116 44",
  noise: "M 4 34 L 18 26 L 30 42 L 44 28 L 58 40 L 72 26 L 86 42 L 100 30 L 116 36",
};

export function FingerprintShape({ shape }: { shape: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setInView(true);
      },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const d = SHAPES[shape] ?? SHAPES["noise"]!;

  return (
    <div ref={ref} className="rounded-lg border border-border bg-background/60 p-2">
      <svg viewBox="0 0 120 72" className="h-20 w-full">
        <line x1="4" y1="66" x2="116" y2="66" stroke="var(--hairline)" strokeWidth="1" />
        <motion.path
          d={d}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0.2 }}
          animate={inView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0.2 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
}
