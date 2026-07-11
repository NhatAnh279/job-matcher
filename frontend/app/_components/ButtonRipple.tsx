"use client";

/* Phase 4 — Material-style click ripple on every .btn. One global listener
   spawns a ripple at the click point inside the nearest .btn. */

import { useEffect } from "react";

export default function ButtonRipple() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const btn = target.closest(".btn") as HTMLElement | null;
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      const size = Math.max(r.width, r.height);
      const span = document.createElement("span");
      span.className = "ripple";
      span.style.width = span.style.height = `${size}px`;
      span.style.left = `${e.clientX - r.left - size / 2}px`;
      span.style.top = `${e.clientY - r.top - size / 2}px`;
      // dark UI: primary (purple) gets a bright white ripple, ghost/other
      // buttons sit on the dark surface so they get a soft purple ripple.
      span.style.background = btn.classList.contains("btn-primary")
        ? "rgba(255,255,255,0.45)"
        : "rgba(127,119,221,0.30)";
      btn.appendChild(span);
      window.setTimeout(() => span.remove(), 600);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
