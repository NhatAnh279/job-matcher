"use client";

/* ════════════════════════════════════════════════════════════════
   SCORE ARC — THE signature motif. A gradient-stroked arc that draws
   from 0 with a soft glowing dot at its tip, and a count-up number.
   Reused for the Match score and Best-fit numbers so every score in
   the app reads as one family. Colour comes from --accent.
   ════════════════════════════════════════════════════════════════ */

import { motion, useReducedMotion } from "framer-motion";
import { useId } from "react";
import { useCountUp } from "./useCountUp";

export default function ScoreArc({
  value,
  size = 180,
  thickness = 12,
  suffix = "/ 100",
  label,
  ariaLabel,
  accentColor,
  ticks = false,
}: {
  value: number;
  size?: number;
  thickness?: number;
  suffix?: string;
  label?: string;
  ariaLabel?: string;
  accentColor?: string;
  ticks?: boolean;
}) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const r = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const dash = C * pct;
  const ang = (-90 + pct * 360) * (Math.PI / 180);
  const tx = cx + r * Math.cos(ang);
  const ty = cy + r * Math.sin(ang);
  const count = useCountUp(value, reduce);

  // gauge tick marks just inside the track
  const tickEls = [];
  if (ticks) {
    const n = 48;
    const rOut = r - thickness / 2 - 6;
    for (let i = 0; i < n; i++) {
      const major = i % 12 === 0;
      const rIn = rOut - (major ? 8 : 4);
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      tickEls.push(
        <line
          key={i}
          x1={cx + rOut * Math.cos(a)} y1={cy + rOut * Math.sin(a)}
          x2={cx + rIn * Math.cos(a)} y2={cy + rIn * Math.sin(a)}
          stroke={major ? "rgba(0,0,0,.22)" : "rgba(0,0,0,.1)"}
          strokeWidth={major ? 1.5 : 1}
        />
      );
    }
  }

  return (
    <div
      className="scorearc"
      style={{ width: size, height: size, ...(accentColor ? ({ "--accent": accentColor } as React.CSSProperties) : {}) }}
      role="img"
      aria-label={ariaLabel ?? `${value} out of 100`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {ticks && <g>{tickEls}</g>}
        <defs>
          <linearGradient id={`grad-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="1" />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,.06)" strokeWidth={thickness} />
        <motion.circle
          cx={cx} cy={cy} r={r} fill="none" stroke={`url(#grad-${uid})`} strokeWidth={thickness} strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeDasharray={C}
          initial={{ strokeDashoffset: reduce ? C - dash : C }}
          animate={{ strokeDashoffset: C - dash }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        {pct > 0.015 && (
          <motion.circle
            cx={tx} cy={ty} r={thickness * 0.42} fill="var(--accent)" filter={`url(#glow-${uid})`}
            initial={{ opacity: reduce ? 1 : 0, scale: reduce ? 1 : 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduce ? 0 : 1.0, duration: 0.35, ease: "backOut" }}
            style={{ transformOrigin: `${tx}px ${ty}px` }}
          />
        )}
      </svg>
      <div className="scorearc-center">
        <span className="scorearc-num">{count}</span>
        {suffix && <span className="scorearc-suffix mono">{suffix}</span>}
        {label && <span className="scorearc-label mono">{label}</span>}
      </div>

      <style>{`
        .scorearc { position: relative; display: grid; place-items: center; flex: 0 0 auto; }
        .scorearc svg { transform: translateZ(0); }
        .scorearc-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none; }
        .scorearc-num { font-family: var(--font-mono), monospace; font-weight: 700; font-size: ${Math.round(size * 0.26)}px; line-height: 1; color: var(--ink); }
        .scorearc-suffix { font-size: 12px; color: var(--muted); margin-top: 4px; }
        .scorearc-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--muted); margin-top: 4px; }
      `}</style>
    </div>
  );
}
