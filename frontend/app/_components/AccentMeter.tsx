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
  const glow = negative ? "rgba(var(--band-low-rgb), 0.4)" : "rgba(var(--accent-rgb), 0.4)";
  const grad = negative
    ? `linear-gradient(270deg, ${soft}, ${color})`
    : `linear-gradient(90deg, ${soft}, ${color})`;

  const fill = (
    <motion.div
      className="meter-fill"
      style={{ background: grad, boxShadow: `0 0 12px ${glow}`, ...(baseline ? (negative ? { right: "50%" } : { left: "50%" }) : {}) }}
      initial={{ width: reduce ? `${baseline ? w / 2 : w}%` : 0 }}
      whileInView={{ width: `${baseline ? w / 2 : w}%` }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: reduce ? 0 : delay }}
    >
      <span className={`meter-tip ${baseline && negative ? "left" : ""}`} style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
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
        <span className="meter-seg" aria-hidden />
      </div>
      <style>{`
        .meter { margin-bottom: 16px; }
        .meter-head { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }
        .meter-val { font-variant-numeric: tabular-nums; }
        .meter-track { position: relative; height: 12px; border-radius: 6px; background: rgba(0,0,0,.05); border: 1px solid rgba(0,0,0,.06); overflow: hidden; }
        .meter-track.baseline { overflow: visible; }
        .meter-mid { position: absolute; left: 50%; top: -3px; bottom: -3px; width: 1px; background: rgba(0,0,0,.22); z-index: 2; }
        .meter-fill { position: relative; height: 100%; border-radius: 5px; min-width: 6px; }
        /* moving sheen — the bar reads as "live" (background-position keeps it inside the fill) */
        .meter-fill::after {
          content: ""; position: absolute; inset: 0; border-radius: inherit;
          background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,.5) 50%, transparent 70%);
          background-size: 250% 100%;
          background-position: 200% 0;
          animation: meterSheen 2.8s ease-in-out infinite;
        }
        @keyframes meterSheen { to { background-position: -50% 0; } }
        /* segment slits over track + fill = instrument-panel cells */
        .meter-seg {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background: repeating-linear-gradient(90deg, transparent 0 14px, rgba(250,250,251,.9) 14px 16px);
        }
        .meter-track.baseline .meter-seg { display: none; } /* keep ± direction readable */
        .meter-tip { position: absolute; right: 0; top: 50%; transform: translate(40%, -50%); width: 8px; height: 8px; border-radius: 50%; z-index: 3; }
        .meter-tip.left { right: auto; left: 0; transform: translate(-40%, -50%); }
      `}</style>
    </div>
  );
}
