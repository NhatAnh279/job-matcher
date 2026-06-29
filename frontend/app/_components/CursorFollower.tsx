"use client";

/* Phase 6 — cursor follower dot with trailing lag + glow over interactive
   elements. Desktop / fine-pointer only; hidden on touch and reduced-motion. */

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

export default function CursorFollower() {
  const reduce = useReducedMotion();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 500, damping: 30, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 500, damping: 30, mass: 0.4 });
  const [active, setActive] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (reduce || window.matchMedia("(pointer: coarse)").matches) return;
    setEnabled(true);
    function move(e: MouseEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      setHidden(false);
      const t = e.target as HTMLElement;
      setActive(!!t.closest('a, button, .job-card, .ring, input, label.drop, .navlink, .app-link'));
    }
    function leave() { setHidden(true); }
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
    };
  }, [reduce, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className={`cursor-dot ${active ? "active" : ""} ${hidden ? "hidden" : ""}`}
      style={{ x: sx, y: sy }}
    >
      <style>{`
        .cursor-dot {
          position: fixed; top: 0; left: 0; z-index: 9999; pointer-events: none;
          width: 12px; height: 12px; margin: -6px 0 0 -6px; border-radius: 50%;
          background: rgba(37, 99, 235, 0.55);
          transition: width .18s, height .18s, margin .18s, background .18s, box-shadow .18s, opacity .25s;
        }
        .cursor-dot.active {
          width: 26px; height: 26px; margin: -13px 0 0 -13px;
          background: rgba(37, 99, 235, 0.18);
          box-shadow: 0 0 14px rgba(37, 99, 235, 0.5);
        }
        .cursor-dot.hidden { opacity: 0; }
      `}</style>
    </motion.div>
  );
}
