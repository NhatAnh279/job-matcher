"use client";

/* ════════════════════════════════════════════════════════════════
   STAT METER — the one meter used for every horizontal stat in the app
   (skill demand, skill impact, market demand…). A HUD-style segmented
   track with a glowing gradient fill, a scanning sheen, a count-up mono
   readout, and a live tip node. Hovering a meter focuses it: the fill
   brightens, the tip pulses, and a guide line rises at the value.
     • standard  — fill grows from the left (0..100%)
     • baseline  — fill grows out from the centre, + accent / − rose,
                   so the direction of an impact score is legible.
   Fills in when scrolled into view, with a timeout fallback so it never
   ships empty on a hidden tab / headless renderer.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useCountUp } from "./useCountUp";

export default function StatMeter({
  label,
  value,
  format,
  pct,
  negative = false,
  baseline = false,
  delay = 0,
  active,
}: {
  label: string;
  value: number;                     // integer to count up to (scale decimals before passing)
  format: (n: number) => string;     // counted int -> display string
  pct: number;                       // magnitude 0..100
  negative?: boolean;
  baseline?: boolean;
  delay?: number;
  active?: boolean;                  // parent-controlled visibility (e.g. a slide deck)
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  // When the parent controls visibility (`active`), follow it. Otherwise reveal
  // on scroll-into-view, with a hard fallback so it never ships empty.
  useEffect(() => {
    if (active !== undefined) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.4 },
    );
    io.observe(el);
    const t = setTimeout(() => setShown(true), 1400);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [active]);

  const on = (active !== undefined ? active : shown) || reduce;
  const n = useCountUp(on ? value : 0, reduce, 1100 + delay);
  const w = Math.max(0, Math.min(100, pct));
  const fillW = on ? (baseline ? w / 2 : w) : 0;
  const color = negative ? "var(--band-low)" : "var(--accent)";
  const rgb = negative ? "var(--band-low-rgb)" : "var(--accent-rgb)";

  return (
    <div className={`stat ${baseline ? "is-baseline" : ""} ${negative ? "is-neg" : ""}`} ref={ref}>
      <div className="stat-head">
        <span className="stat-label">{label}</span>
        <span className="stat-val mono" style={{ color }}>{format(n)}</span>
      </div>
      <div className="stat-track">
        {baseline && <span className="stat-mid" />}
        <div
          className="stat-fill"
          style={{
            width: `${fillW}%`,
            transitionDelay: `${delay}ms`,
            background: `linear-gradient(${negative ? 270 : 90}deg, rgba(${rgb}, 0.30), ${color})`,
            boxShadow: `0 0 12px rgba(${rgb}, 0.55)`,
          }}
        >
          <span className="stat-tip" style={{ background: color, boxShadow: `0 0 10px 2px rgba(${rgb}, 0.7)` }} />
          <span className="stat-guide" style={{ background: `rgba(${rgb}, 0.8)` }} />
        </div>
      </div>
    </div>
  );
}
