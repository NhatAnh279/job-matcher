"use client";

/* Phase 5 — ambient particle drift, fixed behind all content.
   The blurred colour wash now lives in globals.css (aurora backdrop);
   this layer only adds the floating dots on top of it.
   Dots are generated AFTER mount so the server renders nothing and
   hydration stays clean (Math.random() differs per render).
   The whole layer also parallaxes gently AGAINST the mouse for depth. */

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";

type Dot = { id: number; left: number; top: number; size: number; dur: number; dx: number; dy: number };

export default function ParticleBackground() {
  const reduce = useReducedMotion();
  const [dots, setDots] = useState<Dot[]>([]);

  // mouse position -1..1 -> small opposite-direction drift (depth cue)
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(useTransform(mx, (v) => v * -14), { stiffness: 50, damping: 20 });
  const py = useSpring(useTransform(my, (v) => v * -10), { stiffness: 50, damping: 20 });

  useEffect(() => {
    setDots(
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 4 + Math.random() * 7,
        dur: 9 + Math.random() * 12,
        dx: (Math.random() - 0.5) * 40,
        dy: -20 - Math.random() * 40,
      }))
    );
  }, []);

  useEffect(() => {
    function onMove(e: PointerEvent) {
      mx.set((e.clientX / window.innerWidth) * 2 - 1);
      my.set((e.clientY / window.innerHeight) * 2 - 1);
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  if (reduce || dots.length === 0) return null;

  return (
    <motion.div aria-hidden className="particles" style={{ x: px, y: py }}>
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
        .particles { position: fixed; inset: -20px; z-index: 0; pointer-events: none; overflow: hidden; will-change: transform; }
        .particle { position: absolute; border-radius: 50%; background: #2563eb; opacity: 0.15; will-change: transform; }
      `}</style>
    </motion.div>
  );
}
