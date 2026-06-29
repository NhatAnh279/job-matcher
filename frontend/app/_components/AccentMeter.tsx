"use client";

/* ════════════════════════════════════════════════════════════════
   ACCENT METER — the Score-Arc motif as a horizontal bar: gradient
   fill that animates from 0 with a soft glowing tip, on a faint track.
   - standard mode: left-anchored fill (market demand)
   - baseline mode: grows from a centre line, +accent / -red, so the
     direction of skill impact is obvious.
   ════════════════════════════════════════════════════════════════ */

import { motion, useReducedMotion } from "framer-motion";

export default function AccentMeter({
  label,
  valueText,
  pct,
  negative = false,
  baseline = false,
  delay = 0,
}: {
  label: string;
  valueText: string;
  pct: number;       // magnitude 0..100
  negative?: boolean;
  baseline?: boolean;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const w = Math.max(0, Math.min(100, pct));
  const color = negative ? "var(--band-low)" : "var(--accent)";
  const soft = negative ? "rgba(var(--band-low-rgb), 0.3)" : "rgba(var(--accent-rgb), 0.3)";
  const grad = negative
    ? `linear-gradient(270deg, ${soft}, ${color})`
    : `linear-gradient(90deg, ${soft}, ${color})`;

  const fill = (
    <motion.div
      className="meter-fill"
      style={{ background: grad, ...(baseline ? (negative ? { right: "50%" } : { left: "50%" }) : {}) }}
      initial={{ width: reduce ? `${baseline ? w / 2 : w}%` : 0 }}
      whileInView={{ width: `${baseline ? w / 2 : w}%` }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : delay }}
    >
      <span className={`meter-tip ${baseline && negative ? "left" : ""}`} style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
    </motion.div>
  );

  return (
    <div className="meter">
      <div className="meter-head">
        <span className="mono">{label}</span>
        <span className="mono meter-val" style={{ color }}>{valueText}</span>
      </div>
      <div className={`meter-track ${baseline ? "baseline" : ""}`}>
        {baseline && <span className="meter-mid" />}
        {fill}
      </div>
      <style>{`
        .meter { margin-bottom: 16px; }
        .meter-head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
        .meter-val { font-variant-numeric: tabular-nums; }
        .meter-track { position: relative; height: 10px; border-radius: var(--r-pill); background: rgba(0,0,0,.06); overflow: hidden; }
        .meter-track.baseline { overflow: visible; }
        .meter-mid { position: absolute; left: 50%; top: -2px; bottom: -2px; width: 1px; background: rgba(0,0,0,.18); }
        .meter-fill { position: relative; height: 100%; border-radius: var(--r-pill); min-width: 6px; }
        .meter-tip { position: absolute; right: 0; top: 50%; transform: translate(40%, -50%); width: 8px; height: 8px; border-radius: 50%; }
        .meter-tip.left { right: auto; left: 0; transform: translate(-40%, -50%); }
      `}</style>
    </div>
  );
}
