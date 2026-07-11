"use client";

/* Match constellation — the landing background. Skill "nodes" drift slowly,
   link up when close, and reach toward the cursor: matching = connecting.
   The whole field eases toward the active section's accent colour.
   Canvas-based; O(n²) with n ≤ 80 stays cheap. Static frame under
   prefers-reduced-motion; paused while the tab is hidden. */

import { useEffect, useRef } from "react";

type FieldNode = { x: number; y: number; vx: number; vy: number; r: number; bright: boolean };

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const LINK = 130;   // node↔node link distance
const REACH = 190;  // node↔cursor link distance

export default function MatchField({ accent }: { accent: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef<[number, number, number]>(hexToRgb(accent));
  const redrawRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    targetRef.current = hexToRgb(accent);
    redrawRef.current?.(); // static (reduced-motion) mode repaints on accent change
  }, [accent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cur: [number, number, number] = [...targetRef.current];
    const pointer = { x: -9999, y: -9999 };
    let nodes: FieldNode[] = [];
    let W = 0, H = 0, raf = 0;

    function resize() {
      W = canvas!.clientWidth;
      H = canvas!.clientHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.min(80, Math.max(28, Math.round((W * H) / 26000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1.1 + Math.random() * 1.6,
        bright: Math.random() < 0.12,
      }));
      if (reduce) draw();
    }

    function draw() {
      if (reduce) { cur[0] = targetRef.current[0]; cur[1] = targetRef.current[1]; cur[2] = targetRef.current[2]; }
      else for (let k = 0; k < 3; k++) cur[k] += (targetRef.current[k] - cur[k]) * 0.06;
      const r = Math.round(cur[0]), g = Math.round(cur[1]), b = Math.round(cur[2]);
      ctx!.clearRect(0, 0, W, H);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const nb = nodes[j];
          const d = Math.hypot(a.x - nb.x, a.y - nb.y);
          if (d < LINK) {
            ctx!.strokeStyle = `rgba(${r},${g},${b},${(1 - d / LINK) * 0.14})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(nb.x, nb.y);
            ctx!.stroke();
          }
        }
        // reach toward the cursor + gentle pull
        const dp = Math.hypot(a.x - pointer.x, a.y - pointer.y);
        if (dp < REACH) {
          const k = 1 - dp / REACH;
          ctx!.strokeStyle = `rgba(${r},${g},${b},${k * 0.3})`;
          ctx!.lineWidth = 1.2;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(pointer.x, pointer.y);
          ctx!.stroke();
          a.vx += (pointer.x - a.x) * 0.00004 * k;
          a.vy += (pointer.y - a.y) * 0.00004 * k;
        }
      }

      for (const n of nodes) {
        ctx!.fillStyle = `rgba(${r},${g},${b},${n.bright ? 0.5 : 0.28})`;
        if (n.bright) {
          ctx!.shadowColor = `rgba(${r},${g},${b},0.8)`;
          ctx!.shadowBlur = 6;
        }
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.shadowBlur = 0;
      }
    }

    function step() {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -12) n.x = W + 12; else if (n.x > W + 12) n.x = -12;
        if (n.y < -12) n.y = H + 12; else if (n.y > H + 12) n.y = -12;
        const v = Math.hypot(n.vx, n.vy);
        if (v > 0.45) { n.vx *= 0.45 / v; n.vy *= 0.45 / v; }
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    function onMove(e: MouseEvent) { pointer.x = e.clientX; pointer.y = e.clientY; }
    function onLeave() { pointer.x = -9999; pointer.y = -9999; }
    function onVisibility() {
      if (reduce) return;
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; }
      else if (!raf) raf = requestAnimationFrame(step);
    }

    resize();
    redrawRef.current = reduce ? draw : null;
    // ResizeObserver also covers the mount-at-zero-size case window resize misses
    const ro = new ResizeObserver(() => { if (canvas.clientWidth !== W || canvas.clientHeight !== H) resize(); });
    ro.observe(canvas);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduce) {
      window.addEventListener("mousemove", onMove);
      document.addEventListener("mouseleave", onLeave);
      raf = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(raf);
      redrawRef.current = null;
      ro.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}
    />
  );
}
