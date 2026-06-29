"use client";

/* Phase 4 — reusable confetti burst (used on the match score reveal).
   Absolutely positioned; place inside a position:relative parent at the
   point you want the burst centered. Plays once on mount. */

import { useMemo } from "react";
import type { CSSProperties } from "react";

export default function ConfettiBurst({ count = 28 }: { count?: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = Math.random() * Math.PI * 2;
        const d = 55 + Math.random() * 80;
        return {
          id: i,
          x: Math.cos(a) * d,
          y: Math.sin(a) * d,
          c: ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#60a5fa"][i % 5],
          delay: Math.random() * 0.1,
        };
      }),
    [count]
  );

  return (
    <span className="confetti-burst" aria-hidden>
      {parts.map((p) => (
        <span
          key={p.id}
          style={{ "--x": `${p.x}px`, "--y": `${p.y}px`, background: p.c, animationDelay: `${p.delay}s` } as CSSProperties}
        />
      ))}
      <style>{`
        .confetti-burst { position: absolute; top: 50%; left: 50%; width: 0; height: 0; pointer-events: none; }
        .confetti-burst span { position: absolute; width: 8px; height: 8px; border-radius: 2px; opacity: 0; animation: cburst 0.9s ease-out forwards; }
        @keyframes cburst {
          0%   { opacity: 1; transform: translate(0,0) scale(1) rotate(0deg); }
          100% { opacity: 0; transform: translate(var(--x), var(--y)) scale(0.3) rotate(220deg); }
        }
      `}</style>
    </span>
  );
}
