"use client";

/* ════════════════════════════════════════════════════════════════
   TILT CARD — 3D mouse-tracking tilt (spec §3.1 / §6.2) + scroll-in
   entrance (spec §6.4) + hover lift (spec §1.2). Pure transform/opacity
   (GPU). Disabled cleanly under prefers-reduced-motion via Framer.
   ════════════════════════════════════════════════════════════════ */

import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

export default function TiltCard({
  children,
  className = "",
  index = 0,
  max = 7,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
  max?: number;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
}) {
  const reduce = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 250, damping: 22 });
  const rotateY = useSpring(ry, { stiffness: 250, damping: 22 });

  function onMove(e: React.MouseEvent<HTMLElement>) {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * max * 2);
    ry.set(((e.clientX - r.left) / r.width - 0.5) * max * 2);
  }
  function onLeave() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.article
      className={className}
      onClick={onClick}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduce ? undefined : { y: -6, scale: 1.02 }}
      style={{ rotateX, rotateY, transformPerspective: 900, transformStyle: "preserve-3d", willChange: "transform" }}
    >
      {children}
    </motion.article>
  );
}
