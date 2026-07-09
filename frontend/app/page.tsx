"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, X } from "@phosphor-icons/react";
import ScoreArc from "./_components/ScoreArc";
import BestFitCards from "./_components/BestFitCards";
import BrandMark from "./_components/BrandMark";
import { scoreBand } from "./_components/scoreBand";

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
          style={{
            width,
            background: color,
            boxShadow: `0 0 12px ${hexToRgba(color, 0.45)}`,
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   4. THE SIX PANELS
   ════════════════════════════════════════════════════════════════ */

// Floating "data particles" near the hero copy: a few skill labels in faint
// mono type, hinting that the product reads skills — no explanation needed.
// They fade out as the deck slides away from the hero.
const HERO_TAGS = [
  { label: "Python",   color: "#2563EB", top: "-4%",  left: "80%", dur: 7.5, delay: 0 },
  { label: "SQL",      color: "#0E9F6E", top: "34%",  left: "94%", dur: 8.5, delay: 1.1 },
  { label: "Docker",   color: "#E11D48", top: "92%",  left: "82%", dur: 9.5, delay: 2.0 },
  { label: "Power BI", color: "#D97706", top: "-14%", left: "44%", dur: 8,   delay: 0.6 },
];

function HeroPanel({ active, accent, reduced, goTo }: PanelProps & { goTo: (i: number) => void }) {
  return (
    <div className="panel-inner" style={{ maxWidth: 760 }}>
      <div className="hero-tags" aria-hidden>
        {HERO_TAGS.map((t) => (
          <motion.span
            key={t.label}
            className="hero-tag mono"
            style={{ top: t.top, left: t.left }}
            animate={active && !reduced ? { opacity: 0.55, y: [0, -7, 0] } : { opacity: reduced && active ? 0.4 : 0 }}
            transition={{
              opacity: { duration: 0.6, delay: active ? 0.4 + t.delay * 0.25 : 0 },
              y: { duration: t.dur, repeat: Infinity, ease: "easeInOut", delay: t.delay },
            }}
          >
            <span className="hero-tag-dot" style={{ background: t.color }} />
            {t.label}
          </motion.span>
        ))}
      </div>
      <Reveal show={active}>
        <p className="eyebrow">Resume → job, scored</p>
      </Reveal>
      <Reveal show={active} delay={80}>
        <h1 className="h-display h-hero" style={{ marginTop: 14 }}>
          Find the job you <span className="grad-text accent-home">actually fit.</span>
        </h1>
      </Reveal>
      <Reveal show={active} delay={160}>
        <p className="lead" style={{ marginTop: 18, fontSize: 18, maxWidth: 540 }}>
          Upload your resume and get a match score for any live role, with the exact
          skills you already have and the ones you&apos;re missing.
        </p>
      </Reveal>
      <Reveal show={active} delay={240}>
        <div style={{ display: "flex", gap: 14, marginTop: 28, flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/match" className="btn btn-primary btn-cta">Match my resume</Link>
          <Link href="/jobs" className="btn btn-ghost">Browse jobs</Link>
          <span className="cta-note mono">Free · no card needed</span>
        </div>
      </Reveal>
      {/* proof: honest product stats before the fold (Trust & Authority pattern) */}
      <Reveal show={active} delay={310}>
        <div className="hero-stats">
          <div className="stat"><b>2,000+</b><span>live roles synced daily</span></div>
          <div className="stat"><b>~10s</b><span>from resume to score</span></div>
          <div className="stat"><b>100%</b><span>free while in beta</span></div>
        </div>
      </Reveal>
      <Reveal show={active} delay={370}>
        <p className="trust-strip mono">
          Live listings from Seek &amp; Jora — roles at Canva · Atlassian · Airwallex · Telstra · REA Group
        </p>
      </Reveal>
      <Reveal show={active} delay={430}>
        <p className="hint" style={{ marginTop: 34 }}>
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
        <p className="eyebrow">2,000+ roles · refreshed daily</p>
      </Reveal>
      <Reveal show={active} delay={60}>
        <h2 className="h-display h-sec grad-text accent-jobs" style={{ marginTop: 12 }}>Live roles from Seek &amp; Jora.</h2>
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

function MatchPanel({ active }: PanelProps) {
  const have = ["Python", "SQL", "Pandas"];
  const missing = ["Docker", "Power BI"];
  const score = 78;
  const band = scoreBand(score);
  return (
    <div className="panel-inner match-panel dotted-grid accent-match">
      <Reveal show={active}>
        <p className="eyebrow">Resume → job, scored</p>
      </Reveal>
      <div className="match-hero">
        {/* Left: score ring */}
        <Reveal show={active} delay={120} className="mh-ring">
          <ScoreArc
            value={active ? score : 0}
            size={188}
            thickness={14}
            accentColor={band.color}
            ticks
            ariaLabel={`Match score ${score} out of 100`}
          />
          <span className="band-tag mono" style={{ color: band.color, background: `rgba(${band.rgb}, 0.12)` }}>
            Strong match
          </span>
        </Reveal>

        {/* Middle: skill cards */}
        <Reveal show={active} delay={200} className="mh-skills">
          <div className="skill-card">
            <p className="card-label">You have · {have.length}</p>
            {have.map((s) => (
              <div key={s} className="srow have"><span className="badge ok"><Check size={12} weight="bold" /></span> {s}</div>
            ))}
          </div>
          <div className="skill-card">
            <p className="card-label">Missing · {missing.length}</p>
            {missing.map((s) => (
              <div key={s} className="srow miss"><span className="badge no"><X size={12} weight="bold" /></span> {s}</div>
            ))}
          </div>
        </Reveal>

        {/* Right: verdict */}
        <Reveal show={active} delay={280} className="verdict-card">
          <p className="card-label">Verdict</p>
          <p className="verdict-text">Strong backend match. Missing DevOps and BI tools.</p>
          <p className="verdict-take">You&apos;re a strong fit. Worth applying.</p>
          <div className="verdict-actions">
            <Link href="/match" className="btn btn-primary">See what moved the score →</Link>
            <Link href="/jobs" className="btn btn-ghost">Back to jobs</Link>
          </div>
          <div className="verdict-stats mono">
            <span><b>{have.length}</b> matched</span>
            <span className="dot-sep">·</span>
            <span><b>{missing.length}</b> missing</span>
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
        <h2 className="h-display h-sec grad-text accent-insights" style={{ marginBottom: 32 }}>What moved the needle.</h2>
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

function BestFitPanel({ active }: PanelProps) {
  // Same card family as the Match page: shared BestFitCards component,
  // band-coloured numbers, and the click-to-expand layoutId morph.
  const ROLES = [
    { title: "Data Analyst",     fit: 82, note: "Your skills cluster here" },
    { title: "Business Analyst", fit: 64, note: "Close second" },
    { title: "Data Scientist",   fit: 47, note: "Needs more ML skills" },
  ];
  return (
    <div className="panel-inner accent-bestfit">
      <Reveal show={active}>
        <h2 className="h-display h-sec grad-text" style={{ marginBottom: 32 }}>Where your skills cluster.</h2>
      </Reveal>
      <Reveal show={active} delay={120}>
        <BestFitCards roles={ROLES} />
      </Reveal>
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
        <h2 className="h-display h-sec grad-text accent-history" style={{ marginBottom: 28 }}>Every match you&apos;ve run.</h2>
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
                {/* scores wear their band colour (green/amber/red) — same token as the Match ring */}
                <td className="mono" style={{ color: scoreBand(r.score).color, fontWeight: 700 }}>{r.score}</td>
                <td className="muted mono">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Reveal>
      {/* closing conversion block — CTA repeated after the product tour */}
      <Reveal show={active} delay={240}>
        <div className="closing-cta">
          <div className="closing-copy">
            <p className="closing-quote">&ldquo;Job Fit showed me the two skills that were costing me interviews.&rdquo;</p>
            <p className="closing-attrib mono">— Minh T., Data Analyst candidate · beta user</p>
          </div>
          <div className="closing-actions">
            <Link href="/register" className="btn btn-primary btn-cta">Sign up free</Link>
            <span className="cta-note mono">Takes 30 seconds</span>
          </div>
        </div>
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
            {/* soul-dot wears the active section's accent; cheers on the Match panel (78 = green band) */}
            <BrandMark size={28} accent={accent} mood={index === 2 ? "happy" : "idle"} />
          </span>
          <span className="brand-name">Job Fit</span>
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
          <Link href="/register" className="cta-pill">Sign up free</Link>
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
          background: transparent; color: #16181D; /* aurora backdrop shows through */
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
        .panel-inner { position: relative; width: 100%; max-width: 1100px; margin: 0 auto; padding: 0 48px; }

        /* ── hero skill tags — faint floating "data particles" ── */
        .hero-tags { position: absolute; inset: 0; pointer-events: none; }
        .hero-tag { position: absolute; display: inline-flex; align-items: center; gap: 6px; font-size: 11px; letter-spacing: .05em; color: #6B7280; opacity: 0; white-space: nowrap; }
        .hero-tag-dot { width: 7px; height: 7px; border-radius: 50%; flex: 0 0 auto; }
        @media (max-width: 860px) { .hero-tag { display: none; } }

        /* ── type ── */
        .h-hero { font-size: clamp(40px, 7vw, 76px); }
        .h-sec { font-size: clamp(28px, 4.5vw, 44px); }
        .lead { color: #6B7280; line-height: 1.6; }

        /* ── buttons / hint ── */
        .hint { font-family: var(--font-mono), monospace; font-size: 13px; color: #9CA3AF; }

        /* ── commercial layer: CTA emphasis + proof ── */
        .btn-cta {
          background: linear-gradient(100deg, #16181D 0%, #1D4ED8 130%);
          box-shadow: 0 10px 26px -8px rgba(37, 99, 235, .55), inset 0 1px 0 rgba(255, 255, 255, .15);
        }
        .cta-note { font-size: 12px; color: #6B7280; }
        .hero-stats { display: flex; gap: 32px; margin-top: 30px; flex-wrap: wrap; }
        .stat b { font-family: var(--font-grotesk), sans-serif; font-size: 22px; font-weight: 700; display: block; line-height: 1.2; }
        .stat span { font-size: 12.5px; color: #6B7280; }
        .trust-strip { font-size: 11.5px; color: #9CA3AF; margin-top: 24px; letter-spacing: .04em; }
        .closing-cta {
          display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap;
          margin-top: 26px; padding: 20px 22px;
          background: var(--glass); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur);
          border: 1px solid var(--glass-border); border-radius: var(--r-lg);
          box-shadow: var(--glass-edge), var(--shadow-sm);
        }
        .closing-quote { font-size: 15px; line-height: 1.5; color: #374151; max-width: 46ch; }
        .closing-attrib { font-size: 11px; color: #9CA3AF; margin-top: 6px; }
        .closing-actions { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .nudge { display: inline-block; animation: nudge 1.6s ease-in-out infinite; }
        @keyframes nudge { 0%,100% { transform: translateX(0); } 50% { transform: translateX(6px); } }

        /* ── cards / grids ── */
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .card-title { font-family: var(--font-grotesk), sans-serif; font-weight: 600; font-size: 19px; letter-spacing: -.01em; }
        .card-meta { font-size: 12px; color: #6B7280; margin-top: 4px; }
        .pill-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        /* best-fit cards moved to the shared BestFitCards component */

        /* ── match panel (3 columns: ring · skills · verdict; card/verdict styles in globals) ── */
        .match-panel { width: 100%; }
        .match-hero { display: grid; grid-template-columns: auto 1fr 1fr; gap: 18px; align-items: stretch; margin-top: 22px; }
        .mh-ring { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 24px; background: var(--glass); backdrop-filter: blur(14px) saturate(1.35); border: 1px solid var(--glass-border); border-radius: var(--r-xl); box-shadow: var(--glass-edge), var(--shadow-md); }
        .mh-skills { display: flex; flex-direction: column; gap: 14px; }
        .skill-label { font-family: var(--font-mono), monospace; font-size: 13px; color: #6B7280; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .06em; }

        /* ── bars — segmented "energy cell" meters ── */
        .bar-group { flex: 1; }
        .bar-row { margin-bottom: 18px; }
        .bar-head { display: flex; justify-content: space-between; font-family: var(--font-mono), monospace; font-size: 13px; margin-bottom: 6px; }
        .bar-track { position: relative; height: 12px; border-radius: 6px; background: rgba(0,0,0,.05); border: 1px solid rgba(0,0,0,.06); overflow: hidden; }
        .bar-fill { position: relative; height: 100%; width: 0; border-radius: 5px; transition: width .9s cubic-bezier(.22,1,.36,1); }
        .bar-fill::after {
          content: ""; position: absolute; inset: 0; border-radius: inherit;
          background: linear-gradient(90deg, transparent 30%, rgba(255,255,255,.5) 50%, transparent 70%);
          background-size: 250% 100%;
          background-position: 200% 0;
          animation: barSheen 2.8s ease-in-out infinite;
        }
        @keyframes barSheen { to { background-position: -50% 0; } }
        /* segment slits over track + fill = instrument-panel cell look */
        .bar-track::after {
          content: ""; position: absolute; inset: 0; pointer-events: none;
          background: repeating-linear-gradient(90deg, transparent 0 14px, rgba(250,250,251,.9) 14px 16px);
        }

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
          .match-hero { grid-template-columns: 1fr; }
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
