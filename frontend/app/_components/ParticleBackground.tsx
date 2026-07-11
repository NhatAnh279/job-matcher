"use client";

/* Phase 5 — ambient particle system + floating blurred orbs.
   Fixed behind all content, pointer-events none, very subtle. */

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

export default function ParticleBackground() {
  const reduce = useReducedMotion();
  // render only after mount — random positions differ between SSR and client
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dots = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 4 + Math.random() * 7,
        dur: 9 + Math.random() * 12,
        dx: (Math.random() - 0.5) * 40,
        dy: -20 - Math.random() * 40,
      })),
    []
  );

  if (reduce || !mounted) return null;

  return (
    <div aria-hidden className="particles">
      <span className="orb orb-1" />
      <span className="orb orb-2" />
      <span className="orb orb-3" />
      {dots.map((d) => (
        <motion.span
          key={d.id}
          className="particle"
          style={{ left: `${d.left}%`, top: `${d.top}%`, width: d.size, height: d.size }}
          animate={{ x: [0, d.dx, 0], y: [0, d.dy, 0], opacity: [0.1, 0.22, 0.1] }}
          transition={{ duration: d.dur, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <style>{`
        .particles { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
        .particle { position: absolute; border-radius: 50%; background: #7f77dd; opacity: 0.18; will-change: transform; }
        .orb { position: absolute; border-radius: 50%; filter: blur(64px); opacity: 0.14; will-change: transform; }
        .orb-1 { width: 360px; height: 360px; background: #7f77dd; top: -90px; left: -70px; animation: orbA 17s ease-in-out infinite; }
        .orb-2 { width: 320px; height: 320px; background: #afa9ec; bottom: -100px; right: -60px; animation: orbB 21s ease-in-out infinite; }
        .orb-3 { width: 280px; height: 280px; background: #6c63c9; top: 42%; right: 10%; animation: orbA 24s ease-in-out infinite; }
        @keyframes orbA { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(34px,22px) scale(1.1); } }
        @keyframes orbB { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-34px,-22px) scale(1.08); } }
      `}</style>
    </div>
  );
}
