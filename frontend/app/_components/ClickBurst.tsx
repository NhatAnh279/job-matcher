"use client";

/* Click burst — every pointerdown radiates an expanding ring + spark rays
   from the click point, coloured by the nearest --accent. One shared canvas,
   rAF runs only while bursts are alive. Skipped under prefers-reduced-motion.
   Complements ButtonRipple (which stays scoped to .btn fills). */

import { useEffect, useRef } from "react";

type Spark = { a: number; speed: number; size: number; drift: number };
type Burst = { x: number; y: number; t0: number; rgb: [number, number, number]; sparks: Spark[] };

const DURATION = 620; // ms
const INK: [number, number, number] = [22, 24, 29];

function parseColor(raw: string): [number, number, number] | null {
  const s = raw.trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) {
    return [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  }
  const m = s.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
}

// easeOutExpo — decisive radiate, no bounce
const easeOut = (t: number) => 1 - Math.pow(2, -10 * t);

export default function ClickBurst() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let raf = 0;
    const bursts: Burst[] = [];

    function resize() {
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function loop(now: number) {
      ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i];
        const t = (now - b.t0) / DURATION;
        if (t >= 1) { bursts.splice(i, 1); continue; }
        const e = easeOut(t);
        const [r, g, bl] = b.rgb;

        // expanding ring
        ctx!.beginPath();
        ctx!.arc(b.x, b.y, 6 + e * 74, 0, Math.PI * 2);
        ctx!.strokeStyle = `rgba(${r},${g},${bl},${(1 - t) * 0.45})`;
        ctx!.lineWidth = 2.2 * (1 - t) + 0.4;
        ctx!.stroke();

        // spark rays flying outward, decelerating
        for (const s of b.sparks) {
          const d = 10 + e * s.speed;
          const x = b.x + Math.cos(s.a + s.drift * e) * d;
          const y = b.y + Math.sin(s.a + s.drift * e) * d;
          ctx!.beginPath();
          ctx!.arc(x, y, s.size * (1 - t * 0.7), 0, Math.PI * 2);
          ctx!.fillStyle = `rgba(${r},${g},${bl},${(1 - t) * 0.85})`;
          ctx!.fill();
        }
      }
      if (bursts.length) raf = requestAnimationFrame(loop);
      else { raf = 0; ctx!.clearRect(0, 0, window.innerWidth, window.innerHeight); }
    }

    function onDown(e: PointerEvent) {
      if (canvas!.width === 0) resize(); // window had no size when we mounted
      const el = e.target instanceof HTMLElement ? e.target : document.body;
      const rgb = parseColor(getComputedStyle(el).getPropertyValue("--accent")) ?? INK;
      const sparks: Spark[] = Array.from({ length: 14 }, (_, i) => ({
        a: (i / 14) * Math.PI * 2 + Math.random() * 0.45,
        speed: 44 + Math.random() * 42,
        size: 1.3 + Math.random() * 1.7,
        drift: (Math.random() - 0.5) * 0.5,
      }));
      bursts.push({ x: e.clientX, y: e.clientY, t0: performance.now(), rgb, sparks });
      if (!raf) raf = requestAnimationFrame(loop);
    }

    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", zIndex: 9998, pointerEvents: "none" }}
    />
  );
}
