"use client";

/* NODE NETWORK — the landing hero's signature canvas.
   The field keeps drifting forever. Two seconds in, a chosen few peel off
   and fly — comet trails behind them — to their places on the coastline
   of Australia (the job pool is Australian, Seek/Jora). The map then holds
   for good: it breathes, a current of light circulates the coast, Sydney
   glows with a label, and the rest of the field keeps floating around it,
   faintly linked to the shape. Mouse attraction stays live everywhere.
   No cursor dot is drawn (deliberate).
   Reduced motion: one static frame — map formed, field scattered. */

import { useEffect, useRef } from "react";

const ACCENT = "127,119,221";   // #7f77dd
const BRIGHT = "175,169,236";   // #afa9ec
const LINK_FREE = 120;          // free ↔ free
const LINK_MAP = 58;            // map ↔ map (coastline stroke)
const LINK_CROSS = 70;          // free ↔ map (faint web into the shape)
const MOUSE_DIST = 180;
const MAX_NODES = 170;

const T_ASSEMBLE = 2;           // the chosen few start leaving
const ASSEMBLE_DUR = 3.4;       // each node's gentle flight time
const STAGGER = 1.8;            // departures spread over this window (soft, not a snap)
const T_LABEL = T_ASSEMBLE + ASSEMBLE_DUR + STAGGER + 0.4;  // Sydney label fades in
const RUNNER_PERIOD = 7;        // seconds per lap of the coastline current

/* Australia, simplified: [lon, lat] clockwise from Cape York. */
const MAINLAND: [number, number][] = [
  [142.5, -10.7], [145.3, -14.9], [146.3, -18.9], [149.2, -21.1],
  [153.0, -25.3], [153.6, -28.2], [151.2, -33.9], [150.0, -37.5],
  [146.4, -38.9], [144.0, -38.5], [140.5, -38.0], [138.1, -35.6],
  [135.6, -34.9], [131.0, -31.6], [125.0, -32.3], [121.9, -33.9],
  [117.9, -35.0], [115.1, -34.4], [115.7, -32.0], [114.6, -28.8],
  [113.4, -25.5], [114.1, -21.9], [118.6, -20.3], [122.2, -18.0],
  [125.0, -16.4], [129.6, -14.9], [130.8, -12.4], [132.6, -12.1],
  [136.7, -12.2], [137.0, -16.0], [140.9, -17.6], [141.6, -15.0],
  [142.0, -12.5],
];
const TASMANIA: [number, number][] = [
  [146.5, -41.2], [148.0, -42.0], [147.5, -43.5], [146.0, -43.4], [145.2, -42.2],
];
const SYDNEY: [number, number] = [151.2, -33.87];

const LON = { min: 112, max: 155 };
const LAT = { min: -44, max: -10 };
function norm([lon, lat]: [number, number]): [number, number] {
  return [(lon - LON.min) / (LON.max - LON.min), (LAT.max - lat) / (LAT.max - LAT.min)];
}

// Evenly sample `count` points along a closed polygon's perimeter (in order).
function samplePolygon(poly: [number, number][], count: number): [number, number][] {
  const pts = poly.map(norm);
  const segs: { a: [number, number]; b: [number, number]; len: number }[] = [];
  let perim = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segs.push({ a, b, len });
    perim += len;
  }
  const out: [number, number][] = [];
  const step = perim / count;
  for (let k = 0; k < count; k++) {
    let remain = k * step, si = 0;
    while (remain > segs[si].len) { remain -= segs[si].len; si = (si + 1) % segs.length; }
    const t = remain / segs[si].len;
    const { a, b } = segs[si];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

type Node = {
  x: number; y: number; vx: number; vy: number; r: number; pulse: number;
  kind: "free" | "map";
  tx: number; ty: number;       // map nodes: coastline seat
  order: number;                // map nodes: position along the mainland lap (-1 for Tasmania)
  twinkle: number;              // free nodes: brief sparkle 1 → 0
  delay: number;                // map nodes: staggered departure offset (s)
};

/* A "resume" spark: a bright mote that leaves the free field and flies to a
   seat on the map — a match happening. Lands as a radar ping. */
type Spark = { x0: number; y0: number; x1: number; y1: number; p: number; v: number };
type Ping = { x: number; y: number; r: number; a: number };

export default function NodeNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    let nodes: Node[] = [];
    let mapNodes: Node[] = [];
    let mainCount = 0;            // mainland seats (the runner laps these, in order)
    let sydneyIdx = -1;
    let raf = 0;
    const start = performance.now();
    const mouse = { x: -1e4, y: -1e4, inside: false };

    // creative layer: resume sparks, landing pings, map parallax
    const sparks: Spark[] = [];
    const pings: Ping[] = [];
    let nextSpark = T_ASSEMBLE + ASSEMBLE_DUR + STAGGER + 1.5;  // first one shortly after the map settles
    const par = { x: 0, y: 0 };                        // smoothed parallax offset

    // Map sits centre-right of the hero copy; centred on narrow screens.
    let mapX = 0, mapY = 0, mapW = 0, mapH = 0;
    function layoutMap() {
      const aspect = 1.15;
      mapW = Math.min(W * (W < 760 ? 0.8 : 0.44), H * 0.66 * aspect);
      mapH = mapW / aspect;
      mapX = (W < 760 ? W * 0.5 : W * 0.68) - mapW / 2;
      mapY = H * 0.5 - mapH / 2;
    }
    const px = (p: [number, number]): [number, number] => [mapX + p[0] * mapW, mapY + p[1] * mapH];

    function seed() {
      const count = Math.min(MAX_NODES, Math.round((W * H) / 6000));
      // Just enough seats to read the coastline; everyone else stays free.
      mainCount = Math.min(64, Math.max(40, Math.round(count * 0.4)));
      const tasCount = 6;
      const seats = [
        ...samplePolygon(MAINLAND, mainCount),
        ...samplePolygon(TASMANIA, tasCount),
      ].map(px);

      nodes = [];
      for (let i = 0; i < count; i++) {
        const isMap = i < seats.length;
        nodes.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 1 + Math.random() * 1.5,
          pulse: Math.random() * Math.PI * 2,
          kind: isMap ? "map" : "free",
          tx: isMap ? seats[i][0] : 0,
          ty: isMap ? seats[i][1] : 0,
          order: isMap && i < mainCount ? i : -1,
          twinkle: 0,
          delay: isMap ? Math.random() * STAGGER : 0,
        });
      }
      mapNodes = nodes.filter((n) => n.kind === "map");
      // NOTE: map nodes start scattered across the whole canvas (no nearest-seat
      // swap). Departures are spread evenly, so the free field keeps a uniform
      // density — the area around the finished map stays as alive as anywhere.

      const [sx, sy] = px(norm(SYDNEY));
      let sd = Infinity;
      sydneyIdx = 0;
      mapNodes.forEach((n, i) => {
        const d = (n.tx - sx) ** 2 + (n.ty - sy) ** 2;
        if (d < sd) { sd = d; sydneyIdx = i; }
      });
    }

    function resize() {
      const rect = canvas!.parentElement!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // layout not ready (e.g. background tab) — retry once it can paint
        raf = requestAnimationFrame(resize);
        return;
      }
      W = rect.width; H = rect.height;
      canvas!.width = W * dpr; canvas!.height = H * dpr;
      canvas!.style.width = `${W}px`; canvas!.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      layoutMap();
      seed();
      if (reduced) {
        for (const n of mapNodes) { n.x = n.tx; n.y = n.ty; }
        drawFrame(1e9); // static: map formed, label on, no trails
      }
    }

    type Trail = { x0: number; y0: number; x1: number; y1: number; a: number };

    function drawFrame(t: number, trails: Trail[] = []) {
      ctx!.clearRect(0, 0, W, H);

      // comet trails behind the nodes flying to their seats
      for (const tr of trails) {
        ctx!.strokeStyle = `rgba(${BRIGHT},${tr.a})`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(tr.x0, tr.y0);
        ctx!.lineTo(tr.x1, tr.y1);
        ctx!.stroke();
      }

      const formed = Math.max(0, Math.min(1, (t - T_ASSEMBLE) / (ASSEMBLE_DUR + STAGGER)));
      const labelA = Math.max(0, Math.min(1, (t - T_LABEL) / 0.9));

      // coastline current: which mainland seat the light is passing
      const runner = formed >= 1 ? ((t / RUNNER_PERIOD) % 1) * mainCount : -99;

      // links
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          const bothMap = a.kind === "map" && b.kind === "map";
          const cross = a.kind !== b.kind;
          const maxD = bothMap ? LINK_MAP : cross ? LINK_CROSS : LINK_FREE;
          if (dist >= maxD) continue;
          const base = bothMap ? 0.30 + 0.35 * formed : cross ? 0.16 : 0.38;
          ctx!.strokeStyle = `rgba(${ACCENT},${(1 - dist / maxD) * base})`;
          ctx!.lineWidth = bothMap ? 1.1 : 1;
          ctx!.beginPath();
          ctx!.moveTo(a.x, a.y);
          ctx!.lineTo(b.x, b.y);
          ctx!.stroke();
        }
      }

      // nodes (+ mouse attraction lines; the cursor itself gets no dot)
      for (const n of nodes) {
        const isMap = n.kind === "map";
        const r = n.r * (1 + 0.3 * Math.sin(n.pulse));
        let near = false;
        if (mouse.inside) {
          const dist = Math.hypot(n.x - mouse.x, n.y - mouse.y);
          if (dist < MOUSE_DIST) {
            near = true;
            const pull = 1 - dist / MOUSE_DIST;
            ctx!.strokeStyle = `rgba(${BRIGHT},${pull * 0.5})`;
            ctx!.lineWidth = 0.8;
            ctx!.beginPath();
            ctx!.moveTo(n.x, n.y);
            ctx!.lineTo(mouse.x, mouse.y);
            ctx!.stroke();
          }
        }

        // the coastline current brightens seats as it sweeps past
        let glow = 0;
        if (isMap && n.order >= 0 && runner >= -1) {
          let gap = Math.abs(n.order - runner);
          gap = Math.min(gap, mainCount - gap);      // wrap around the lap
          if (gap < 3) glow = 1 - gap / 3;
        }

        const tw = n.kind === "free" ? n.twinkle : 0;
        const alpha = isMap ? 0.65 + 0.3 * formed : 0.6 + 0.4 * tw;
        ctx!.fillStyle = near || glow > 0.55 || tw > 0.6
          ? `rgb(${BRIGHT})`
          : `rgba(${isMap ? BRIGHT : ACCENT},${alpha})`;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, (near ? r * 1.8 : r) + glow * 1.6 + tw * 1.4, 0, Math.PI * 2);
        ctx!.fill();
        if (glow > 0) {
          ctx!.fillStyle = `rgba(${BRIGHT},${glow * 0.28})`;
          ctx!.beginPath();
          ctx!.arc(n.x, n.y, r + 5 * glow, 0, Math.PI * 2);
          ctx!.fill();
        }
      }

      // radar pings where a resume-spark landed
      for (const g of pings) {
        ctx!.strokeStyle = `rgba(${BRIGHT},${g.a})`;
        ctx!.lineWidth = 1.2;
        ctx!.beginPath();
        ctx!.arc(g.x, g.y, g.r, 0, Math.PI * 2);
        ctx!.stroke();
      }

      // resume sparks in flight: bright mote + short fading tail
      for (const s of sparks) {
        const e = 1 - Math.pow(1 - s.p, 3);                 // ease-out flight
        const x = s.x0 + (s.x1 - s.x0) * e;
        const y = s.y0 + (s.y1 - s.y0) * e;
        const tail = 0.06;                                   // trail length in progress-space
        const e2 = 1 - Math.pow(1 - Math.max(0, s.p - tail), 3);
        ctx!.strokeStyle = `rgba(${BRIGHT},0.5)`;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.moveTo(s.x0 + (s.x1 - s.x0) * e2, s.y0 + (s.y1 - s.y0) * e2);
        ctx!.lineTo(x, y);
        ctx!.stroke();
        ctx!.fillStyle = `rgb(${BRIGHT})`;
        ctx!.beginPath();
        ctx!.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Sydney: pulsing beacon + mono label
      if (labelA > 0.01 && sydneyIdx >= 0) {
        const s = mapNodes[sydneyIdx];
        const beat = 1 + 0.25 * Math.sin(s.pulse * 2);
        ctx!.save();
        ctx!.shadowColor = `rgba(${BRIGHT},${labelA})`;
        ctx!.shadowBlur = 14;
        ctx!.fillStyle = `rgba(${BRIGHT},${labelA})`;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, 3.4 * beat, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
        ctx!.fillStyle = `rgba(${BRIGHT},${labelA * 0.95})`;
        ctx!.font = '11px ui-monospace, "Cascadia Mono", Consolas, monospace';
        ctx!.fillText("Sydney", s.x + 9, s.y + 4);
      }
    }

    function loop(now: number) {
      const t = (now - start) / 1000;
      const trails: { x0: number; y0: number; x1: number; y1: number; a: number }[] = [];

      // parallax: the map layer leans gently away from the cursor (depth)
      const parTX = mouse.inside ? ((mouse.x / W) - 0.5) * -14 : 0;
      const parTY = mouse.inside ? ((mouse.y / H) - 0.5) * -10 : 0;
      par.x += (parTX - par.x) * 0.04;
      par.y += (parTY - par.y) * 0.04;

      for (const n of nodes) {
        // each map node departs on its own beat and glides in softly
        const p = n.kind === "map"
          ? Math.max(0, Math.min(1, (t - T_ASSEMBLE - n.delay) / ASSEMBLE_DUR))
          : 0;
        if (n.kind === "map" && p > 0) {
          const ease = 1 - Math.pow(1 - p, 5);              // ease-out-quint: long soft landing
          const k = 0.012 + 0.055 * ease;
          const ox = n.x, oy = n.y;
          // settle onto the seat (parallax-shifted), then breathe around it
          n.x += (n.tx + par.x + Math.sin(n.pulse) * 1.2 - n.x) * k;
          n.y += (n.ty + par.y + Math.cos(n.pulse * 0.8) * 1.2 - n.y) * k;
          // faint comet trail while in flight (drawn after the clear, in drawFrame)
          if (p < 1) {
            const speed = Math.hypot(n.x - ox, n.y - oy);
            if (speed > 0.9) {
              trails.push({
                x0: ox - (n.x - ox) * 2, y0: oy - (n.y - oy) * 2,
                x1: n.x, y1: n.y,
                a: Math.min(0.32, speed * 0.045),
              });
            }
          }
        } else {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > W) n.vx *= -1;
          if (n.y < 0 || n.y > H) n.vy *= -1;
          // occasional starlight twinkle in the free field
          if (n.twinkle > 0) n.twinkle *= 0.94;
          else if (Math.random() < 0.0012) n.twinkle = 1;
        }
        n.pulse += 0.025;
      }

      // resume sparks: spawn one every few seconds once the map is standing
      if (t >= nextSpark && mapNodes.length > 0) {
        nextSpark = t + 3.5 + Math.random() * 3;
        const free = nodes.filter((n) => n.kind === "free");
        const from = free[Math.floor(Math.random() * free.length)];
        const seat = mapNodes[Math.floor(Math.random() * mapNodes.length)];
        if (from && seat) {
          const dist = Math.hypot(seat.tx - from.x, seat.ty - from.y);
          sparks.push({
            x0: from.x, y0: from.y,
            x1: seat.tx + par.x, y1: seat.ty + par.y,
            p: 0,
            v: 1 / Math.max(0.7, dist / 420),   // farther → a touch longer flight
          });
        }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.p += 0.016 * s.v;
        if (s.p >= 1) {
          pings.push({ x: s.x1, y: s.y1, r: 2, a: 0.55 });
          sparks.splice(i, 1);
        }
      }
      for (let i = pings.length - 1; i >= 0; i--) {
        const g = pings[i];
        g.r += 1.1;
        g.a *= 0.94;
        if (g.a < 0.02) pings.splice(i, 1);
      }

      drawFrame(t, trails);
      raf = requestAnimationFrame(loop);
    }

    function onMove(e: MouseEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.inside = mouse.x >= 0 && mouse.x <= W && mouse.y >= 0 && mouse.y <= H;
    }
    function onLeave() { mouse.inside = false; }

    resize();
    window.addEventListener("resize", resize);
    if (!reduced) {
      window.addEventListener("mousemove", onMove);
      document.documentElement.addEventListener("mouseleave", onLeave);
      raf = requestAnimationFrame(loop);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="node-net" aria-hidden />;
}
