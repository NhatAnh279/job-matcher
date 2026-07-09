"use client";

/* ════════════════════════════════════════════════════════════════
   BRAND MARK — the little ant mascot in the nav. A side-view ant in
   ink, with one "soul-dot" eye that wears the active page's accent.
   The mood prop lets the eye + posture react: happy bounces and the
   eye brightens, sad droops. Falls still under prefers-reduced-motion.
   Rendered next to the "Job Fit" wordmark, so it's aria-hidden.
   ════════════════════════════════════════════════════════════════ */

import { motion, useReducedMotion } from "framer-motion";

export type Mood = "idle" | "happy" | "sad";

export default function BrandMark({
  size = 28,
  accent = "#16181D",
  mood = "idle",
}: {
  size?: number;
  accent?: string;
  mood?: Mood;
}) {
  const reduce = useReducedMotion();

  // Whole-body motion per mood: a gentle idle bob, a happy hop, a sad slump.
  const bodyAnim = reduce
    ? {}
    : mood === "happy"
      ? { y: [0, -2.5, 0], rotate: [0, -3, 0] }
      : mood === "sad"
        ? { y: [0, 1.5, 0], rotate: [0, 2.5, 0] }
        : { y: [0, -1, 0] };
  const bodyDur = mood === "happy" ? 0.7 : mood === "sad" ? 2.4 : 3;

  // The eye pulses brighter when happy, half-closes when sad.
  const eyeAnim = reduce
    ? {}
    : mood === "happy"
      ? { scale: [1, 1.25, 1], opacity: 1 }
      : mood === "sad"
        ? { scaleY: 0.55, opacity: 0.8 }
        : { scale: [1, 1.08, 1] };

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden
      style={{ display: "block", transformOrigin: "50% 70%" }}
      animate={bodyAnim}
      transition={{ duration: bodyDur, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* legs — three per side, drawn under the body */}
      <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.9" style={{ color: "#16181D" }}>
        <path d="M13 20 L8 25" />
        <path d="M14 21 L11 27" />
        <path d="M15 21 L16 27" />
        <path d="M13 19 L7 20" />
      </g>

      {/* body segments: abdomen · thorax · head */}
      <ellipse cx="22.5" cy="18" rx="6.5" ry="5.2" fill="#16181D" />
      <ellipse cx="15" cy="17" rx="3.4" ry="3.2" fill="#16181D" />
      <circle cx="9.5" cy="15.5" r="4.2" fill="#16181D" />

      {/* antennae */}
      <g stroke="#16181D" strokeWidth="1.4" strokeLinecap="round">
        <path d="M7 13 Q4 9 6 6" fill="none" />
        <path d="M9 12 Q8 7 11 5" fill="none" />
      </g>

      {/* soul-dot eye — the one spot of accent colour */}
      <motion.circle
        cx="8.5"
        cy="15"
        r="1.9"
        fill={accent}
        style={{ transformorigin: "8.5px 15px" } as React.CSSProperties}
        animate={eyeAnim}
        transition={{ duration: mood === "happy" ? 0.7 : 2.6, repeat: mood === "sad" ? 0 : Infinity, ease: "easeInOut" }}
      />
      <circle cx="7.9" cy="14.4" r="0.6" fill="#fff" opacity="0.9" />
    </motion.svg>
  );
}
