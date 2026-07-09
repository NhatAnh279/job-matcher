"use client";

/* ════════════════════════════════════════════════════════════════
   SKILL TRENDS — month-over-month demand for key skills (Week 5).
   Hand-rolled responsive SVG line chart, no chart dependency.

   NOTE: the API Contract v3 has no "skill trends over time" endpoint.
   This runs on MOCK data. When Tommy adds one (e.g. GET /api/skill-trends),
   swap SERIES for the response and keep the same { name, color, points } shape.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";

type Series = { name: string; color: string; points: number[] };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const SERIES: Series[] = [
  { name: "SQL",      color: "#2563EB", points: [70, 73, 79, 84, 88, 92] },
  { name: "Python",   color: "#0E9F6E", points: [49, 51, 56, 58, 61, 64] },
  { name: "Power BI", color: "#D97706", points: [38, 45, 46, 51, 55, 58] },
];

// Chart geometry (viewBox units)
const W = 620, H = 260;
const PAD = { top: 18, right: 18, bottom: 30, left: 34 };
const plotW = W - PAD.left - PAD.right;
const plotH = H - PAD.top - PAD.bottom;

const x = (i: number) => PAD.left + (i / (MONTHS.length - 1)) * plotW;
const y = (v: number) => PAD.top + (1 - v / 100) * plotH;

export default function SkillTrends() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const gridLines = [0, 25, 50, 75, 100];

  return (
    <div className="trends">
      <div className="trends-head">
        <div>
          <h2 className="h-display trends-title">Skill demand, month over month</h2>
          <p className="muted trends-sub">How the skills you&apos;re matched on are trending across live listings.</p>
        </div>
        <div className="legend">
          {SERIES.map((s) => (
            <span key={s.name} className="legend-item">
              <span className="legend-dot" style={{ background: s.color }} />
              {s.name}
            </span>
          ))}
        </div>
      </div>

      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Skill demand trends line chart">
        <defs>
          {SERIES.map((s, si) => (
            <linearGradient key={si} id={`trend-area-${si}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.20" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* horizontal gridlines + y labels */}
        {gridLines.map((g) => (
          <g key={g}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(g)} y2={y(g)} className="grid" />
            <text x={PAD.left - 8} y={y(g) + 4} className="axis-label" textAnchor="end">{g}</text>
          </g>
        ))}

        {/* month labels */}
        {MONTHS.map((m, i) => (
          <text key={m} x={x(i)} y={H - 8} className="axis-label" textAnchor="middle">{m}</text>
        ))}

        {/* one area + glow + line + dots per skill */}
        {SERIES.map((s, si) => {
          const d = s.points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p)}`).join(" ");
          const area = `${d} L ${x(s.points.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;
          const last = s.points.length - 1;
          return (
            <g key={s.name}>
              {/* gradient wash under the line */}
              <path
                d={area}
                fill={`url(#trend-area-${si})`}
                style={{
                  opacity: reduced ? 1 : 0,
                  animation: reduced ? "none" : `fadeArea .8s ease forwards ${0.5 + si * 0.18}s`,
                }}
              />
              {/* soft glow underlay */}
              <path
                d={d}
                className="line-glow"
                pathLength={1}
                stroke={s.color}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: reduced ? 0 : 1,
                  animation: reduced ? "none" : `draw 1.1s ease forwards ${si * 0.18}s`,
                }}
              />
              <path
                d={d}
                className="line"
                pathLength={1}
                stroke={s.color}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: reduced ? 0 : 1,
                  animation: reduced ? "none" : `draw 1.1s ease forwards ${si * 0.18}s`,
                }}
              />
              {s.points.map((p, i) => (
                <circle key={i} cx={x(i)} cy={y(p)} r={3.5} fill="#fff" stroke={s.color} strokeWidth={2} />
              ))}
              {/* radar ping on the latest reading — the data reads as live */}
              {!reduced && (
                <circle
                  className="ping"
                  cx={x(last)} cy={y(s.points[last])} r={5}
                  stroke={s.color}
                  style={{ animationDelay: `${1.3 + si * 0.4}s` }}
                />
              )}
            </g>
          );
        })}
      </svg>

      <style>{`
        .trends { background: var(--glass); backdrop-filter: blur(14px) saturate(1.35); border: 1px solid var(--glass-border); border-radius: 16px; padding: 24px; box-shadow: var(--glass-edge), 0 1px 2px rgba(0,0,0,.04); }
        .trends-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-bottom: 12px; }
        .trends-title { font-size: 20px; }
        .trends-sub { font-size: 14px; margin-top: 6px; max-width: 48ch; line-height: 1.5; }
        .legend { display: flex; gap: 16px; flex-wrap: wrap; }
        .legend-item { display: inline-flex; align-items: center; gap: 7px; font-family: var(--font-mono), monospace; font-size: 12px; color: #6B7280; }
        .legend-dot { width: 10px; height: 10px; border-radius: 3px; flex: 0 0 auto; }
        .chart { width: 100%; height: auto; display: block; }
        .grid { stroke: rgba(0,0,0,.08); stroke-width: 1; stroke-dasharray: 3 5; }
        .axis-label { font-family: var(--font-mono), monospace; font-size: 11px; fill: #9CA3AF; }
        .line { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
        .line-glow { fill: none; stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; opacity: .16; }
        .ping {
          fill: none; stroke-width: 2; opacity: 0;
          transform-box: fill-box; transform-origin: center;
          animation: ping 2.6s ease-out infinite;
        }
        @keyframes draw { to { stroke-dashoffset: 0; } }
        @keyframes fadeArea { to { opacity: 1; } }
        @keyframes ping {
          0%   { transform: scale(.5); opacity: .8; }
          70%  { transform: scale(2.6); opacity: 0; }
          100% { transform: scale(2.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
