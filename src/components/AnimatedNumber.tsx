"use client";

import { useEffect, useRef, useState } from "react";
import { pkr } from "@/lib/format";

/**
 * Counts up from 0 to `value` on mount (eased). Respects prefers-reduced-motion
 * by jumping straight to the value. `format` is a serializable string key (not a
 * function) so this can be rendered from Server Components. Pair with the
 * `font-data` class for the mono/tabular treatment.
 */
type FormatKey = "int" | "pkr" | "decimal1";

function fmt(n: number, key: FormatKey): string {
  switch (key) {
    case "pkr":
      return pkr(Math.round(n));
    case "decimal1":
      return n.toFixed(1);
    default:
      return Math.round(n).toLocaleString("en-US");
  }
}

export default function AnimatedNumber({
  value,
  format = "int",
  durationMs = 900,
  className,
}: {
  value: number;
  format?: FormatKey;
  durationMs?: number;
  className?: string;
}) {
  const [n, setN] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(value);
      return;
    }
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(value * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else setN(value);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value, durationMs]);

  return <span className={className}>{fmt(n, format)}</span>;
}
