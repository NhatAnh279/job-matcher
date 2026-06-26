"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, X } from "@phosphor-icons/react";
import Ant from "./_components/Ant";

/* ════════════════════════════════════════════════════════════════
   1. CONFIG — each section owns its accent color (left → right)
   ════════════════════════════════════════════════════════════════ */
const SECTIONS = [
  { key: "hero",     label: "Home",     accent: "#16181D" }, // 0 (no nav link)
  { key: "jobs",     label: "Jobs",     accent: "#2563EB" }, // 1
  { key: "match",    label: "Match",    accent: "#0E9F6E" }, // 2
  { key: "insights", label: "Insights", accent: "#D97706" }, // 3
  { key: "bestfit",  label: "Best fit", accent: "#7C3AED" }, // 4
  { key: "history",  label: "History",  accent: "#E11D48" }, // 5
] as const;

const SLIDE_MS = 800; // keep in sync with the CSS transition on .deck

/* ════════════════════════════════════════════════════════════════
   2. SMALL HELPERS
   ════════════════════════════════════════════════════════════════ */

// Turn "#2563EB" + 0.12 into "rgba(37, 99, 235, 0.12)" for soft pills/glows
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Animate a number 0 → target whenever a panel becomes active
function useCountUp(target: number, active: boolean, reduced: boolean, duration = 1100): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) { setValue(0); return; }           // reset when leaving
    if (reduced) { setValue(target); return; }      // no animation if user prefers

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);          // easeOutCubic
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, reduced, duration]);

  return value;
}

type PanelProps = { active: boolean; accent: string; reduced: boolean };

/* ════════════════════════════════════════════════════════════════
   3. REUSABLE UI PIECES
   ════════════════════════════════════════════════════════════════ */

// Fades + slides its children up when `show` flips true (staggered via delay)
function Reveal({
  show, delay = 0, children, className = "",
}: { show: boolean; delay?: number; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`reveal ${show ? "show" : ""} ${className}`}
      style={{ transitionDelay: show ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

// One horizontal bar that grows from 0 → pct when active
function Bar({
  label, valueText, pct, color, active, reduced, delay = 0,
}: {
  label: string; valueText: string; pct: number; color: string;
  active: boolean; reduced: boolean; delay?: number;
}) {
  const width = active || reduced ? `${pct}%` : "0%";
  return (
    <div className="bar-row">
      <div className="bar-head">
        <span>{label}</span>
        <span style={{ color }}>{valueText}</span>
      </div>
      <div className="bar-track">
        <div
          className="bar-fill"
          style={{ width, background: color, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  );
}

// Circular score ring; the number counts up and the ring fills together
function ScoreRing({ target, accent, active, reduced }: { target: number } & PanelProps) {
  const score = useCountUp(target, active, reduced);
  return (
    <div
      className="ring"
      style={{ background: `conic-gradient(${accent} ${score * 3.6}deg, rgba(0,0,0,.06) 0deg)` }}
      role="img"
      aria-label={`Match score ${target} out of 100`}
    >
      <div className="ring-inner">
        <span className="ring-num">{score}</span>
        <span className="ring-cap mono">/ 100</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   4. THE SIX PANELS
   ════════════════════════════════════════════════════════════════ */

function HeroPanel({ active, accent, goTo }: PanelProps & { goTo: (i: number) => void }) {
  return (
    <div className="panel-inner" style={{ maxWidth: 760 }}>
      <Reveal show={active}>
        <p className="eyebrow">Resume → job, scored</p>
      </Reveal>
      <Reveal show={active} delay={80}>
        <h1 className="h-display h-hero" style={{ marginTop: 14 }}>Find the job you actually fit.</h1>
      </Reveal>
      <Reveal show={active} delay={160}>
        <p className="lead" style={{ marginTop: 18, fontSize: 18, maxWidth: 540 }}>
          Upload your resume and get a match score for any live role — with the exact
          skills you already have and the ones you&apos;re missing.
        </p>
      </Reveal>
      <Reveal show={active} delay={240}>
        <div style={{ display: "flex", gap: 14, marginTop: 28, flexWrap: "wrap" }}>
          <Link href="/match" className="btn btn-primary">Match my resume</Link>
          <Link href="/jobs" className="btn btn-ghost">Browse jobs</Link>
        </div>
      </Reveal>
      <Reveal show={active} delay={340}>
        <p className="hint" style={{ marginTop: 56 }}>
          scroll to move <span className="nudge" style={{ color: accent }}>→</span>
        </p>
      </Reveal>
    </div>
  );
}

function JobsPanel({ active, accent }: PanelProps) {
  const JOBS = [
    { role: "Data Scientist", company: "Canva",     meta: "Sydney · Hybrid", skills: ["Python", "SQL", "ML"] },
    { role: "Data Analyst",   company: "Atlassian", meta: "Remote",          skills: ["SQL", "Tableau", "Excel"] },
    { role: "ML Engineer",    company: "Airwallex", meta: "On-site",         skills: ["Python", "Docker", "AWS"] },
  ];
  return (
    <div className="panel-inner">
      <Reveal show={active}>
        <h2 className="h-display h-sec">Live roles from Seek &amp; Jora.</h2>
      </Reveal>
      <div className="grid-3" style={{ marginTop: 32 }}>
        {JOBS.map((job, i) => (
          <Reveal key={job.role} show={active} delay={120 + i * 120}>
            <div className="card">
              <h3 className="card-title">{job.role}</h3>
              <p className="card-meta mono">{job.company} · {job.meta}</p>
              <div className="pill-row">
                {job.skills.map((s) => (
                  <span key={s} className="pill" style={{ background: hexToRgba(accent, 0.12), color: accent }}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function MatchPanel({ active, accent, reduced }: PanelProps) {
  const have = ["Python", "SQL"];
  const missing = ["Docker", "Power BI"];
  return (
    <div className="panel-inner">
      <Reveal show={active}>
        <h2 className="h-display h-sec" style={{ marginBottom: 32 }}>Strong backend match.</h2>
      </Reveal>
      <div className="split">
        <Reveal show={active} delay={120}>
          <ScoreRing target={78} accent={accent} active={active} reduced={reduced} />
        </Reveal>
        <Reveal show={active} delay={220} className="skill-cols">
          <div>
            <p className="skill-label">You have</p>
            {have.map((s) => (
              <p key={s} className="skill-item"><span className="mark ok"><Check size={12} weight="bold" /></span> {s}</p>
            ))}
          </div>
          <div>
            <p className="skill-label">You&apos;re missing</p>
            {missing.map((s) => (
              <p key={s} className="skill-item"><span className="mark no"><X size={12} weight="bold" /></span> {s}</p>
            ))}
          </div>
        </Reveal>
      </div>
    </div>
  );
}

function InsightsPanel({ active, accent, reduced }: PanelProps) {
  const ROSE = "#E11D48";
  // Skill impact: scaled against max |value| = 0.30
  const impact = [
    { label: "Python", v: 0.30 },
    { label: "SQL",    v: 0.22 },
    { label: "Docker", v: -0.18 },
  ];
  const demand = [
    { label: "SQL",      v: 92 },
    { label: "Python",   v: 64 },
    { label: "Power BI", v: 58 },
  ];
  return (
    <div className="panel-inner">
      <Reveal show={active}>
        <h2 className="h-display h-sec" style={{ marginBottom: 32 }}>What moved the needle.</h2>
      </Reveal>
      <div className="split split-top">
        <Reveal show={active} delay={120} className="bar-group">
          <p className="skill-label">Skill impact</p>
          {impact.map((d, i) => (
            <Bar
              key={d.label}
              label={d.label}
              valueText={`${d.v > 0 ? "+" : "−"}${Math.abs(d.v).toFixed(2)}`}
              pct={(Math.abs(d.v) / 0.30) * 100}
              color={d.v < 0 ? ROSE : accent}
              active={active} reduced={reduced} delay={i * 120}
            />
          ))}
        </Reveal>
        <Reveal show={active} delay={220} className="bar-group">
          <p className="skill-label">Market demand</p>
          {demand.map((d, i) => (
            <Bar
              key={d.label}
              label={d.label}
              valueText={`${d.v}`}
              pct={d.v}
              color={accent}
              active={active} reduced={reduced} delay={i * 120}
            />
          ))}
        </Reveal>
      </div>
    </div>
  );
}

function BestFitPanel({ active, accent }: PanelProps) {
  const ROLES = [
    { role: "Data Analyst",     score: 82, lead: true },
    { role: "Business Analyst", score: 64, lead: false },
    { role: "Data Scientist",   score: 47, lead: false },
  ];
  return (
    <div className="panel-inner">
      <Reveal show={active}>
        <h2 className="h-display h-sec" style={{ marginBottom: 32 }}>Where your skills cluster.</h2>
      </Reveal>
      <div className="grid-3">
        {ROLES.map((r, i) => (
          <Reveal key={r.role} show={active} delay={120 + i * 120}>
            <div
              className="card fit-card"
              style={r.lead
                ? { background: hexToRgba(accent, 0.12), borderColor: hexToRgba(accent, 0.4) }
                : undefined}
            >
              <p className="card-meta mono">{r.lead ? "Best fit" : `Rank ${i + 1}`}</p>
              <h3 className="card-title" style={{ marginTop: 6 }}>{r.role}</h3>
              <p className="fit-score mono" style={{ color: accent }}>{r.score}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({ active, accent }: PanelProps) {
  const ROWS = [
    { role: "Data Scientist", company: "Canva",     score: 78, date: "20 Jun 2026" },
    { role: "Data Analyst",   company: "Atlassian", score: 84, date: "18 Jun 2026" },
    { role: "ML Engineer",    company: "Airwallex", score: 61, date: "12 Jun 2026" },
  ];
  return (
    <div className="panel-inner">
      <Reveal show={active}>
        <h2 className="h-display h-sec" style={{ marginBottom: 28 }}>Every match you&apos;ve run.</h2>
      </Reveal>
      <Reveal show={active} delay={120}>
        <table className="history">
          <thead>
            <tr><th>Role</th><th>Company</th><th>Score</th><th>Date</th></tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.role}>
                <td>{r.role}</td>
                <td className="muted">{r.company}</td>
                <td className="mono" style={{ color: accent, fontWeight: 700 }}>{r.score}</td>
                <td className="muted mono">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   5. MAIN COMPONENT — nav bar + sliding deck + input handling
   ════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  // Refs let the wheel/key listeners read fresh values without re-binding
  const indexRef = useRef(0);
  const lockRef = useRef(false);     // input lock during a transition
  const touchX = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);

  const accent = SECTIONS[index].accent;

  // Behavior 1+2: move to a slide, then lock input until the transition ends
  const goTo = useCallback((target: number) => {
    const clamped = Math.max(0, Math.min(SECTIONS.length - 1, target));
    if (lockRef.current || clamped === indexRef.current) return;
    lockRef.current = true;
    indexRef.current = clamped;
    setIndex(clamped);
    if (reduced) lockRef.current = false;
    else setTimeout(() => { lockRef.current = false; }, SLIDE_MS);
  }, [reduced]);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Behavior 1: wheel → horizontal, one gesture = one slide
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();                 // stop the page from scrolling
      if (lockRef.current) return;
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta > 0) goTo(indexRef.current + 1);
      else if (delta < 0) goTo(indexRef.current - 1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [goTo]);

  // Behavior 1: arrow keys + spacebar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); goTo(indexRef.current + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(indexRef.current - 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo]);

  return (
    <div className="stage">
      {/* ── NAV BAR ── */}
      <nav className="nav">
        {/* Behavior 4: logo resets to the first panel */}
        <button className="brand" onClick={() => goTo(0)} aria-label="Back to start">
          <span className="brand-mark" aria-hidden>
            <Ant size={32} walk />
          </span>
          <span className="brand-name">Job Matcher</span>
        </button>

        {/* Behavior 3+5: nav links (Jobs…History), active one pops in its accent */}
        <div className="nav-center">
          {SECTIONS.slice(1).map((s, i) => {
            const sectionIndex = i + 1;
            const isActive = index === sectionIndex;
            return (
              <button
                key={s.key}
                className="navlink"
                onClick={() => goTo(sectionIndex)}
                style={isActive ? { color: s.accent, background: hexToRgba(s.accent, 0.12) } : undefined}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="nav-right">
          <span className="divider" />
          <Link href="/login" className="login-link">Log in</Link>
          <Link href="/register" className="cta-pill">Sign up</Link>
        </div>
      </nav>

      {/* ── SLIDING DECK ── */}
      <div
        className="viewport"
        ref={viewportRef}
        onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 50) goTo(indexRef.current + (dx < 0 ? 1 : -1));
        }}
      >
        <div
          className="deck"
          style={{ width: `${SECTIONS.length * 100}vw`, transform: `translateX(-${index * 100}vw)` }}
        >
          {SECTIONS.map((s, i) => {
            const active = index === i;
            const props = { active, accent: s.accent, reduced };
            return (
              <section
                key={s.key}
                className="panel"
                aria-hidden={!active}
                style={{ background: `radial-gradient(55% 60% at 88% 12%, ${hexToRgba(s.accent, 0.10)}, transparent 70%)` }}
              >
                {s.key === "hero"     && <HeroPanel {...props} goTo={goTo} />}
                {s.key === "jobs"     && <JobsPanel {...props} />}
                {s.key === "match"    && <MatchPanel {...props} />}
                {s.key === "insights" && <InsightsPanel {...props} />}
                {s.key === "bestfit"  && <BestFitPanel {...props} />}
                {s.key === "history"  && <HistoryPanel {...props} />}
              </section>
            );
          })}
        </div>

        {/* Behavior 3: progress bar in the active accent */}
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${((index + 1) / SECTIONS.length) * 100}%`, background: accent }}
          />
        </div>
      </div>

      {/* ════════════════ 6. STYLES (landing only) ════════════════ */}
      <style>{`
        .stage {
          position: fixed; inset: 0;
          display: flex; flex-direction: column;
          height: 100vh; height: 100dvh; overflow: hidden;
          background: #FAFAFB; color: #16181D;
        }

        /* ── nav ── */
        .nav {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px; padding: 0 24px; flex: 0 0 64px;
          background: rgba(255,255,255,.8); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0,0,0,.08);
        }
        .brand { display: flex; align-items: center; gap: 10px; padding: 6px; background: none; border: none; cursor: pointer; }
        .brand-mark { display: grid; place-items: center; transition: transform .25s ease; }
        .brand:hover .brand-mark { transform: rotate(-6deg) scale(1.06); }
        .brand-name { font-family: var(--font-grotesk), sans-serif; font-weight: 700; font-size: 16px; letter-spacing: -.01em; }
        .nav-center { display: flex; align-items: center; gap: 4px; }
        .navlink {
          font-size: 14px; font-weight: 500; color: #6B7280;
          background: none; border: none; cursor: pointer;
          padding: 7px 14px; border-radius: 9999px;
          transition: color .25s, background .25s;
        }
        .navlink:hover { color: #16181D; }
        .nav-right { display: flex; align-items: center; gap: 14px; }
        .divider { width: 1px; height: 20px; background: rgba(0,0,0,.12); }
        .login-link { font-size: 14px; color: #6B7280; }
        .login-link:hover { color: #16181D; }
        .cta-pill {
          font-size: 14px; font-weight: 600; color: #fff; background: #16181D;
          padding: 9px 18px; border-radius: 9999px;
          transition: transform .2s, box-shadow .2s;
        }
        .cta-pill:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(0,0,0,.18); }

        /* ── deck ── */
        .viewport { position: relative; flex: 1; overflow: hidden; }
        .deck { display: flex; height: 100%; transition: transform .8s cubic-bezier(.76,0,.24,1); }
        .panel { position: relative; flex: 0 0 100vw; width: 100vw; height: 100%; display: flex; align-items: center; }
        .panel-inner { width: 100%; max-width: 1100px; margin: 0 auto; padding: 0 48px; }

        /* ── type ── */
        .h-hero { font-size: clamp(40px, 7vw, 76px); }
        .h-sec { font-size: clamp(28px, 4.5vw, 44px); }
        .lead { color: #6B7280; line-height: 1.6; }

        /* ── buttons / hint ── */
        .hint { font-family: var(--font-mono), monospace; font-size: 13px; color: #9CA3AF; }
        .nudge { display: inline-block; animation: nudge 1.6s ease-in-out infinite; }
        @keyframes nudge { 0%,100% { transform: translateX(0); } 50% { transform: translateX(6px); } }

        /* ── cards / grids ── */
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .card-title { font-family: var(--font-grotesk), sans-serif; font-weight: 600; font-size: 19px; letter-spacing: -.01em; }
        .card-meta { font-size: 12px; color: #6B7280; margin-top: 4px; }
        .pill-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .fit-card { border: 1px solid rgba(0,0,0,.08); }
        .fit-score { font-size: 40px; font-weight: 700; margin-top: 14px; }

        /* ── match panel ── */
        .split { display: flex; align-items: center; gap: 56px; }
        .split-top { align-items: flex-start; }
        .ring { width: 200px; height: 200px; border-radius: 50%; display: grid; place-items: center; flex: 0 0 auto; }
        .ring-inner { width: calc(100% - 26px); height: calc(100% - 26px); background: #fff; border-radius: 50%; display: grid; place-items: center; box-shadow: 0 8px 24px rgba(0,0,0,.06); }
        .ring-num { font-family: var(--font-mono), monospace; font-weight: 700; font-size: 46px; }
        .ring-cap { font-size: 12px; color: #9CA3AF; margin-top: -4px; }
        .skill-cols { display: flex; gap: 56px; }
        .skill-label { font-family: var(--font-mono), monospace; font-size: 13px; color: #6B7280; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .06em; }
        .skill-item { font-size: 17px; margin: 8px 0; display: flex; align-items: center; gap: 10px; }
        .mark { width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; color: #fff; }
        .mark.ok { background: #0E9F6E; }
        .mark.no { background: #E11D48; }

        /* ── bars ── */
        .bar-group { flex: 1; }
        .bar-row { margin-bottom: 18px; }
        .bar-head { display: flex; justify-content: space-between; font-family: var(--font-mono), monospace; font-size: 13px; margin-bottom: 6px; }
        .bar-track { height: 10px; border-radius: 9999px; background: rgba(0,0,0,.06); overflow: hidden; }
        .bar-fill { height: 100%; width: 0; border-radius: 9999px; transition: width .9s cubic-bezier(.22,1,.36,1); }

        /* ── history table ── */
        .history { width: 100%; border-collapse: collapse; font-size: 16px; }
        .history th { text-align: left; font-family: var(--font-mono), monospace; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #9CA3AF; padding: 0 0 14px; }
        .history td { padding: 16px 0; border-top: 1px solid rgba(0,0,0,.08); }

        /* ── reveal + progress ── */
        .reveal { opacity: 0; transform: translateY(16px); transition: opacity .55s ease, transform .55s ease; }
        .reveal.show { opacity: 1; transform: none; }
        .progress-track { position: absolute; left: 0; bottom: 0; width: 100%; height: 3px; background: rgba(0,0,0,.06); }
        .progress-fill { height: 100%; transition: width .8s cubic-bezier(.76,0,.24,1), background .4s; }

        /* ── responsive ── */
        @media (max-width: 760px) {
          .nav-center { display: none; }
          .panel-inner { padding: 0 24px; }
          .grid-3 { grid-template-columns: 1fr; }
          .split, .skill-cols { flex-direction: column; align-items: flex-start; gap: 28px; }
          .ring { width: 150px; height: 150px; }
          .ring-num { font-size: 34px; }
        }

        /* ── reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .deck, .progress-fill, .bar-fill, .reveal { transition: none !important; }
          .reveal { opacity: 1; transform: none; }
          .nudge { animation: none; }
        }
      `}</style>
    </div>
  );
}
