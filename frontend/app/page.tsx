"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Check, X } from "@phosphor-icons/react";
import ScoreArc from "./_components/ScoreArc";
import StatMeter from "./_components/StatMeter";
import NodeNetwork from "./_components/NodeNetwork";
import { scoreBand } from "./_components/scoreBand";
import { useCountUp } from "./_components/useCountUp";

/* ════════════════════════════════════════════════════════════════
   1. CONFIG — dark identity, one purple accent across the deck
   ════════════════════════════════════════════════════════════════ */
const PURPLE = "#7f77dd";
const PURPLE_BRIGHT = "#afa9ec";

const SECTIONS = [
  { key: "hero",     label: "Home"     }, // 0 (no nav link)
  { key: "jobs",     label: "Jobs"     }, // 1
  { key: "match",    label: "Match"    }, // 2
  { key: "insights", label: "Insights" }, // 3
  { key: "bestfit",  label: "Best fit" }, // 4
  { key: "history",  label: "History"  }, // 5
] as const;

const SLIDE_MS = 800; // keep in sync with the CSS transition on .deck

// Hero skill tags — the pool's real top-demand skills (see /api/market-demand),
// so the hero previews the same vocabulary the app actually surfaces.
const HERO_TAGS = ["SQL", "Excel", "Power BI"];

/* ════════════════════════════════════════════════════════════════
   2. SMALL HELPERS
   ════════════════════════════════════════════════════════════════ */

// Turn "#7f77dd" + 0.12 into "rgba(127, 119, 221, 0.12)" for soft pills/glows
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type PanelProps = { active: boolean; reduced: boolean };

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

// Magnetic wrapper — the child leans toward the cursor, springs back on leave
function Magnetic({ reduced, children }: { reduced: boolean; children: React.ReactNode }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 320, damping: 22, mass: 0.5 });
  const y = useSpring(my, { stiffness: 320, damping: 22, mass: 0.5 });

  function onMove(e: React.MouseEvent<HTMLSpanElement>) {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - (r.left + r.width / 2)) * 0.22);
    my.set((e.clientY - (r.top + r.height / 2)) * 0.32);
  }
  function onLeave() { mx.set(0); my.set(0); }

  return (
    <motion.span
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ x, y, display: "inline-block" }}
    >
      {children}
    </motion.span>
  );
}

/* ════════════════════════════════════════════════════════════════
   4. THE SIX PANELS
   ════════════════════════════════════════════════════════════════ */

function HeroPanel({ active, reduced }: PanelProps) {
  return (
    <div className="panel-inner hero-inner">
      <div className="hero-col">
        <Reveal show={active}>
          <p className="hero-eyebrow mono">RESUME → JOB, SCORED</p>
        </Reveal>
        <Reveal show={active} delay={80}>
          <h1 className="hero-title">
            Find the job you actually <span className="hero-fit">match.</span>
          </h1>
        </Reveal>
        <Reveal show={active} delay={150}>
          <div className="hero-tags">
            {HERO_TAGS.map((t) => <span key={t} className="hero-tag mono">{t}</span>)}
            <span className="hero-tag mono">+ 12 skills</span>
          </div>
        </Reveal>
        <Reveal show={active} delay={220}>
          <p className="hero-sub">
            Upload your resume and get a match score for any live role — with the
            exact skills you have and the ones you&apos;re missing.
          </p>
        </Reveal>
        <Reveal show={active} delay={300}>
          <div className="hero-ctas">
            <Magnetic reduced={reduced}>
              <Link href="/match" className="btn btn-primary">Match my resume</Link>
            </Magnetic>
            <Magnetic reduced={reduced}>
              <Link href="/jobs" className="btn btn-ghost">Browse jobs</Link>
            </Magnetic>
          </div>
        </Reveal>
      </div>
      <Reveal show={active} delay={420} className="hero-hint-wrap">
        <p className="hero-hint mono">
          scroll to move <span className="nudge">→</span>
        </p>
      </Reveal>
    </div>
  );
}

function JobsPanel({ active }: PanelProps) {
  // Real roles from the live pool (see backend/app/data/jobs.json). Same fields
  // the /jobs cards show — role, company, type · location, source — and nothing
  // the backend doesn't carry (no per-job skill list, no salary).
  const JOBS = [
    { role: "Senior Data Analyst", company: "Jomablue",                      meta: "Full time · Sydney CBD NSW",  source: "Jora" },
    { role: "Reporting Analyst",   company: "Credit Corp Group",             meta: "Full time · Sydney CBD NSW",  source: "Jora" },
    { role: "Data Analyst",        company: "Australian Catholic University", meta: "Full time · North Sydney NSW", source: "Jora" },
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
              <span className="src-tag mono">{job.source}</span>
              <h3 className="card-title">{job.role}</h3>
              <p className="card-meta mono">{job.company}</p>
              <p className="card-loc">{job.meta}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function MatchPanel({ active }: PanelProps) {
  // Skills drawn from the pool's real vocabulary (analyst-heavy). Illustrative
  // numbers; the live score comes from /api/match.
  const have = ["SQL", "Excel", "Python"];
  const missing = ["Power BI", "Tableau"];
  const score = 74;
  const band = scoreBand(score);
  return (
    <div className="panel-inner match-panel">
      <Reveal show={active}>
        <p className="hero-eyebrow mono">RESUME → JOB, SCORED</p>
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
          <span className="band-tag mono" style={{ color: band.color, background: `rgba(${band.rgb}, 0.14)` }}>
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
          <p className="verdict-text">Strong analytics match. Missing a couple of BI tools.</p>
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

function InsightsPanel({ active, reduced }: PanelProps) {
  // Real /api/market-demand output for the current pool — share of the live
  // postings that ask for each skill. Same numbers the Insights page shows.
  // (Per-resume "skill impact" needs an uploaded resume, so it lives on Match,
  // not here — this section is market-level only.)
  const demand = [
    { label: "Reporting",     v: 83 },
    { label: "Communication", v: 70 },
    { label: "Excel",         v: 64 },
    { label: "SQL",           v: 62 },
    { label: "Power BI",      v: 60 },
    { label: "Python",        v: 28 },
  ];
  return (
    <div className="panel-inner">
      <Reveal show={active}>
        <h2 className="h-display h-sec" style={{ marginBottom: 32 }}>What the market is asking for.</h2>
      </Reveal>
      <div className="split split-top">
        <Reveal show={active} delay={120} className="bar-group insights-bars">
          <div className="hud">
            <p className="skill-label">Skill demand <span className="hud-live" /></p>
            {demand.map((d, i) => (
              <StatMeter
                key={d.label}
                label={d.label}
                value={d.v}
                format={(n) => `${n}%`}
                pct={d.v}
                active={active}
                delay={i * 90}
              />
            ))}
          </div>
        </Reveal>
        <Reveal show={active} delay={260} className="insights-read">
          <p className="read-body">
            Pulled live from <b>47 open roles</b> across Seek and Jora. Reporting and
            communication top the list; SQL and Excel stay table stakes for analyst work.
          </p>
          <Link href="/insights" className="btn btn-ghost">Explore all skills →</Link>
        </Reveal>
      </div>
    </div>
  );
}

// One best-fit card: score counts up + a thin glowing gauge underneath
function FitCard({
  role, score, lead, rank, active, reduced,
}: {
  role: string; score: number; lead: boolean; rank: number;
  active: boolean; reduced: boolean;
}) {
  const n = useCountUp(active || reduced ? score : 0, reduced);
  return (
    <div
      className="card fit-card"
      style={lead
        ? { background: hexToRgba(PURPLE, 0.14), borderColor: hexToRgba(PURPLE, 0.4) }
        : undefined}
    >
      <p className="card-meta mono">{lead ? "Best fit" : `Rank ${rank}`}</p>
      <h3 className="card-title" style={{ marginTop: 6 }}>{role}</h3>
      <p className="fit-score mono">{n}</p>
      <div className="fit-gauge">
        <div
          className="fit-gauge-fill"
          style={{
            width: active || reduced ? `${score}%` : "0%",
            background: PURPLE,
            boxShadow: `0 0 8px ${hexToRgba(PURPLE, 0.55)}`,
          }}
        />
      </div>
    </div>
  );
}

function BestFitPanel({ active, reduced }: PanelProps) {
  // Role clusters the pool actually produces (KMeans over live JDs, see
  // best_fit.py). Illustrative fit scores; the live ranking comes from the model.
  const ROLES = [
    { role: "Data Analyst",      score: 82, lead: true },
    { role: "Reporting Analyst", score: 68, lead: false },
    { role: "BI Analyst",        score: 54, lead: false },
  ];
  return (
    <div className="panel-inner">
      <Reveal show={active}>
        <h2 className="h-display h-sec" style={{ marginBottom: 32 }}>Where your skills cluster.</h2>
      </Reveal>
      <div className="grid-3">
        {ROLES.map((r, i) => (
          <Reveal key={r.role} show={active} delay={120 + i * 120}>
            <FitCard {...r} rank={i + 1} active={active} reduced={reduced} />
          </Reveal>
        ))}
      </div>
    </div>
  );
}

function HistoryPanel({ active }: PanelProps) {
  const ROWS = [
    { role: "Senior Data Analyst", company: "Jomablue",                      score: 74, date: "20 Jun 2026" },
    { role: "Reporting Analyst",   company: "Credit Corp Group",             score: 84, date: "18 Jun 2026" },
    { role: "Data Analyst",        company: "Australian Catholic University", score: 61, date: "12 Jun 2026" },
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
                <td className="muted-dark">{r.company}</td>
                <td>
                  <span className="score-cell">
                    <span className="mono" style={{ color: PURPLE_BRIGHT, fontWeight: 700 }}>{r.score}</span>
                    <span className="mini-track">
                      <span
                        className="mini-fill"
                        style={{
                          width: active ? `${r.score}%` : "0%",
                          background: PURPLE,
                          boxShadow: `0 0 6px ${hexToRgba(PURPLE, 0.5)}`,
                        }}
                      />
                    </span>
                  </span>
                </td>
                <td className="muted-dark mono">{r.date}</td>
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
  // Auth-aware nav: the cover is public, but if the visitor already has a
  // session we must not greet them with "Log in / Sign up" — that reads as an
  // accidental logout. `null` = unknown (pre-mount), so we render neither until
  // we've checked, avoiding a flash of the wrong buttons.
  const [authed, setAuthed] = useState<boolean | null>(null);

  // Refs let the wheel/key listeners read fresh values without re-binding
  const indexRef = useRef(0);
  const lockRef = useRef(false);     // input lock during a transition
  const touchX = useRef(0);
  const viewportRef = useRef<HTMLDivElement>(null);

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

  // Read the saved session once on mount (localStorage is client-only).
  useEffect(() => {
    setAuthed(!!localStorage.getItem("token"));
  }, []);

  function logout() {
    localStorage.removeItem("token");
    setAuthed(false);
  }

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
      {/* ── NODE NETWORK — animated canvas behind everything ── */}
      <div className="net-wrap" aria-hidden>
        <NodeNetwork />
      </div>

      {/* ── NAV BAR ── */}
      <nav className="nav">
        {/* Behavior 4: logo resets to the first panel */}
        <button className="brand" onClick={() => goTo(0)} aria-label="Back to start">
          <span className="brand-mark" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="8" fill={PURPLE} />
              <path d="M7.4 14.3 L11.2 18 L16 8.8" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="19.6" cy="9" r="1.9" fill="#FFFFFF" />
            </svg>
          </span>
          <span className="brand-name">Job Match</span>
        </button>

        {/* Behavior 3+5: nav links (Jobs…History) */}
        <div className="nav-center">
          {SECTIONS.slice(1).map((s, i) => {
            const sectionIndex = i + 1;
            const isActive = index === sectionIndex;
            return (
              <button
                key={s.key}
                className={`navlink ${isActive ? "navlink-on" : ""}`}
                onClick={() => goTo(sectionIndex)}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="nav-right">
          {authed === null ? null : authed ? (
            <>
              <button className="login-link" onClick={logout}>Log out</button>
              <Link href="/jobs" className="cta-pill">Open app</Link>
            </>
          ) : (
            <>
              <Link href="/login" className="login-link">Log in</Link>
              <Link href="/register" className="cta-pill">Sign up</Link>
            </>
          )}
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
            const props = { active, reduced };
            return (
              <section key={s.key} className="panel" aria-hidden={!active}>
                {s.key === "hero"     && <HeroPanel {...props} />}
                {s.key === "jobs"     && <JobsPanel {...props} />}
                {s.key === "match"    && <MatchPanel {...props} />}
                {s.key === "insights" && <InsightsPanel {...props} />}
                {s.key === "bestfit"  && <BestFitPanel {...props} />}
                {s.key === "history"  && <HistoryPanel {...props} />}
              </section>
            );
          })}
        </div>

        {/* Behavior 3: progress bar */}
        <div className="progress-track">
          <div
            className="progress-fill"
            style={{ width: `${((index + 1) / SECTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* ════════════════ 6. STYLES (landing only, dark theme) ════════════════ */}
      <style>{`
        .stage {
          position: fixed; inset: 0;
          display: flex; flex-direction: column;
          height: 100vh; height: 100dvh; overflow: hidden;
          background: #0a0a0f; color: #f5f4ff;
          /* dark values for the shared design tokens the panels consume */
          --surface: #14131c;
          --ink: #f5f4ff;
          --muted: #a8a6c0;
          --hairline: rgba(127, 119, 221, 0.16);
          --accent: ${PURPLE};
          --accent-rgb: 127, 119, 221;
          --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
          --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.45);
        }

        /* canvas layer */
        .net-wrap { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
        .net-wrap canvas { display: block; }

        /* visible keyboard focus on the dark surface */
        .stage button:focus-visible, .stage a:focus-visible {
          outline: 2px solid ${PURPLE_BRIGHT}; outline-offset: 3px;
        }

        /* ── nav ── */
        .nav {
          position: relative; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          height: 64px; padding: 0 24px; flex: 0 0 64px;
          background: rgba(10, 10, 15, 0.72); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(127, 119, 221, 0.14);
        }
        .brand { display: flex; align-items: center; gap: 10px; padding: 6px; background: none; border: none; cursor: pointer; }
        .brand-mark { display: grid; place-items: center; transition: transform .25s ease; }
        .brand:hover .brand-mark { transform: rotate(-6deg) scale(1.06); }
        .brand-name { font-family: var(--font-grotesk), sans-serif; font-weight: 700; font-size: 16px; letter-spacing: -.01em; color: #f5f4ff; }
        .nav-center { display: flex; align-items: center; gap: 4px; }
        .navlink {
          font-size: 14px; font-weight: 500; color: #a8a6c0;
          background: none; border: none; cursor: pointer;
          padding: 7px 14px; border-radius: 9999px;
          transition: color .25s, background .25s;
        }
        .navlink:hover { color: #f5f4ff; }
        .navlink-on { color: ${PURPLE_BRIGHT}; background: rgba(127, 119, 221, 0.14); }
        .nav-right { display: flex; align-items: center; gap: 14px; }
        .login-link { font-size: 14px; color: #a8a6c0; background: none; border: none; cursor: pointer; font-family: inherit; transition: color .2s; }
        .login-link:hover { color: #f5f4ff; }
        .cta-pill {
          font-size: 14px; font-weight: 600; color: #fff; background: ${PURPLE};
          padding: 9px 18px; border-radius: 9999px;
          transition: background .2s, transform .2s, box-shadow .2s;
        }
        .cta-pill:hover { background: #938ce4; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(127, 119, 221, 0.35); }

        /* ── deck ── */
        .viewport { position: relative; z-index: 1; flex: 1; overflow: hidden; }
        .deck { display: flex; height: 100%; transition: transform .8s cubic-bezier(.76,0,.24,1); }
        .panel { position: relative; flex: 0 0 100vw; width: 100vw; height: 100%; display: flex; align-items: center; }
        .panel-inner { width: 100%; max-width: 1100px; margin: 0 auto; padding: 0 48px; }

        /* ── HERO (per spec) ── */
        .hero-inner { position: relative; height: 100%; display: flex; align-items: center; }
        .hero-col { max-width: 560px; }
        .hero-eyebrow {
          font-size: 11px; letter-spacing: 3px; color: ${PURPLE};
          text-transform: uppercase;
        }
        .hero-title {
          font-family: var(--font-grotesk), sans-serif;
          font-weight: 500;
          font-size: clamp(38px, 6vw, 52px);
          letter-spacing: -0.038em; /* −2px at 52px */
          line-height: 1.1;
          color: #f5f4ff;
          margin-top: 16px;
          text-wrap: balance;
        }
        .hero-fit { color: ${PURPLE}; }
        .hero-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
        .hero-tag {
          font-size: 11px; padding: 4px 12px; border-radius: 9999px;
          background: rgba(127, 119, 221, 0.15);
          border: 1px solid rgba(127, 119, 221, 0.25);
          color: ${PURPLE_BRIGHT};
        }
        .hero-sub { font-size: 15px; color: #a8a6c0; line-height: 1.6; max-width: 380px; margin-top: 18px; }
        .hero-ctas { display: flex; gap: 14px; margin-top: 28px; flex-wrap: wrap; }
        .hero-hint-wrap { position: absolute; left: 48px; bottom: 28px; }
        .hero-hint { font-size: 11px; color: #8b84de; }
        .nudge { display: inline-block; animation: nudge 1.6s ease-in-out infinite; }
        @keyframes nudge { 0%,100% { transform: translateX(0); } 50% { transform: translateX(6px); } }

        /* ── buttons (dark overrides of the shared .btn variants) ── */
        .stage .btn-primary {
          background: ${PURPLE}; color: #fff;
          box-shadow: 0 6px 18px rgba(127, 119, 221, 0.3), inset 0 1px 0 rgba(255,255,255,.14);
        }
        .stage .btn-primary:hover {
          background: #938ce4;
          box-shadow: 0 12px 28px rgba(127, 119, 221, 0.42), inset 0 1px 0 rgba(255,255,255,.14);
        }
        .stage .btn-ghost {
          background: transparent; color: #a8a6c0;
          border-color: rgba(127, 119, 221, 0.35);
        }
        .stage .btn-ghost:hover {
          background: rgba(127, 119, 221, 0.08);
          border-color: rgba(127, 119, 221, 0.7);
          color: #f5f4ff;
        }

        /* ── type ── */
        .h-sec { font-size: clamp(28px, 4.5vw, 44px); color: #f5f4ff; }

        /* ── cards / grids (dark) ── */
        .stage .card { background: var(--surface); border: 1px solid var(--hairline); }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .grid-3 .card {
          transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s, border-color .25s;
        }
        .grid-3 .card:hover {
          transform: translateY(-6px);
          border-color: rgba(127, 119, 221, .45);
          box-shadow: 0 18px 40px rgba(127, 119, 221, .14);
        }
        .card-title { font-family: var(--font-grotesk), sans-serif; font-weight: 600; font-size: 19px; letter-spacing: -.01em; color: #f5f4ff; }
        .card-meta { font-size: 13px; color: #d5d3ea; margin-top: 6px; }
        .card-loc { font-size: 12px; color: #a8a6c0; margin-top: 4px; }
        .src-tag {
          display: inline-block; font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
          padding: 3px 9px; border-radius: 9999px; margin-bottom: 12px;
          background: rgba(127, 119, 221, 0.15); border: 1px solid rgba(127, 119, 221, 0.28); color: ${PURPLE_BRIGHT};
        }
        .pill-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
        .fit-card { border: 1px solid var(--hairline); }
        .fit-score { font-size: 40px; font-weight: 700; margin-top: 14px; font-variant-numeric: tabular-nums; color: ${PURPLE_BRIGHT}; }
        .fit-gauge { height: 4px; margin-top: 14px; border-radius: 2px; background: rgba(255,255,255,.08); overflow: hidden; }
        .fit-gauge-fill { height: 100%; border-radius: 2px; transition: width .9s cubic-bezier(.22,1,.36,1) .2s; }

        /* ── match panel ── */
        .match-panel { width: 100%; }
        .match-hero { display: grid; grid-template-columns: auto 1fr 1fr; gap: 18px; align-items: stretch; margin-top: 22px; }
        .mh-ring { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; padding: 24px; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-xl); box-shadow: var(--shadow-md); }
        .mh-skills { display: flex; flex-direction: column; gap: 14px; }
        .skill-label { font-family: var(--font-mono), monospace; font-size: 13px; color: #a8a6c0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .06em; }
        .stage .dot-sep { color: rgba(255,255,255,.25); }

        /* ── HUD stat meters (Insights) ── */
        .split { display: flex; gap: 32px; align-items: stretch; }
        .bar-group { flex: 1; }
        .insights-bars { flex: 1.4; }
        .insights-read { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 20px; align-items: flex-start; }
        .read-body { font-size: 16px; line-height: 1.7; color: #c9c7de; max-width: 34ch; }
        .read-body b { color: #f5f4ff; font-weight: 600; }

        .hud {
          position: relative;
          padding: 20px 22px 16px;
          border: 1px solid var(--hairline);
          border-radius: 6px;
          background: rgba(20, 19, 28, 0.6);
        }
        .hud::before, .hud::after {
          content: ""; position: absolute; width: 14px; height: 14px;
          border: 0 solid ${PURPLE}; opacity: .8;
        }
        .hud::before { top: -1px; left: -1px; border-top-width: 2px; border-left-width: 2px; }
        .hud::after { bottom: -1px; right: -1px; border-bottom-width: 2px; border-right-width: 2px; }
        .hud-live {
          display: inline-block; width: 6px; height: 6px; border-radius: 50%;
          margin-left: 8px; vertical-align: 1px; background: ${PURPLE};
          animation: hudPulse 2s ease-in-out infinite;
        }
        @keyframes hudPulse { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }

        /* ── history table (dark) ── */
        .history { width: 100%; border-collapse: collapse; font-size: 16px; color: #f5f4ff; }
        .history th { text-align: left; font-family: var(--font-mono), monospace; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #8b84de; padding: 0 0 14px; }
        .history td { padding: 16px 0; border-top: 1px solid var(--hairline); }
        .muted-dark { color: #a8a6c0; }
        .score-cell { display: inline-flex; align-items: center; gap: 12px; }
        .mini-track { width: 64px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.08); overflow: hidden; }
        .mini-fill { display: block; height: 100%; border-radius: 3px; transition: width .9s cubic-bezier(.22,1,.36,1) .25s; }

        /* ── reveal + progress ── */
        .reveal { opacity: 0; transform: translateY(16px); transition: opacity .55s ease, transform .55s ease; }
        .reveal.show { opacity: 1; transform: none; }
        .progress-track { position: absolute; left: 0; bottom: 0; width: 100%; height: 3px; background: rgba(255,255,255,.07); }
        .progress-fill { height: 100%; background: ${PURPLE}; transition: width .8s cubic-bezier(.76,0,.24,1); }

        /* ── responsive ── */
        @media (max-width: 760px) {
          .nav-center { display: none; }
          .panel-inner { padding: 0 24px; }
          .hero-hint-wrap { left: 24px; }
          .grid-3 { grid-template-columns: 1fr; }
          .match-hero { grid-template-columns: 1fr; }
          .split { flex-direction: column; }
        }

        /* ── reduced motion ── */
        @media (prefers-reduced-motion: reduce) {
          .deck, .progress-fill, .fit-gauge-fill, .mini-fill, .reveal { transition: none !important; }
          .reveal { opacity: 1; transform: none; }
          .nudge, .hud-live { animation: none; }
        }
      `}</style>
    </div>
  );
}
