"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { UploadSimple, Check, X } from "@phosphor-icons/react";
import api from "@/lib/api";
import AppHeader from "../_components/AppHeader";
import ConfettiBurst from "../_components/ConfettiBurst";
import ScoreArc from "../_components/ScoreArc";
import StatMeter from "../_components/StatMeter";
import { scoreBand } from "../_components/scoreBand";
import { useToast } from "../_components/ToastProvider";
import { useRequireAuth } from "../_components/useRequireAuth";

const shake = { initial: { x: 0 }, animate: { x: [0, -6, 6, -5, 5, 0] }, transition: { duration: 0.4 } };

const ACCENT = "#7f77dd";

/* ════════════════════════════════════════════════════════════════
   CONTRACT SHAPES — exactly what the FastAPI backend returns.
   ════════════════════════════════════════════════════════════════ */

// POST /api/match  ->  { score, matched_skills, missing_skills, shap_scores }
// (the backend does not return an `explanation` — kept optional for the mock).
type MatchResponse = {
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  explanation?: string;
  shap_scores: Record<string, number>; // { "Python": 0.32, "Docker": -0.15 }
};

// GET /api/market-demand  ->  { role, location, skills: DemandSkill[] }
type DemandSkill = { name: string; demand: number };

/* ── Mock data: shown when the backend is offline so the UI is previewable.
   Only what the live /api/match flow can actually produce — score, skills,
   and shap_scores. (Best-fit and JD-highlight need the parsed resume text,
   which the backend doesn't hand back, so they're not part of this flow.) ── */
const MOCK_MATCH: MatchResponse = {
  score: 74,
  matched_skills: ["SQL", "Excel", "Python"],
  missing_skills: ["Power BI", "Tableau"],
  explanation: "Strong analytics match. Missing a couple of BI tools.",
  shap_scores: { SQL: 0.30, Excel: 0.22, "Power BI": -0.18 },
};
const MOCK_DEMAND: DemandSkill[] = [
  { name: "Reporting", demand: 83 },
  { name: "Excel", demand: 64 },
  { name: "SQL", demand: 62 },
  { name: "Power BI", demand: 60 },
];

// Read a query param at call time (set by the "Match my resume" link on /jobs).
function queryParam(name: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

export default function MatchPage() {
  const authed = useRequireAuth();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [demand, setDemand] = useState<DemandSkill[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const toast = useToast();

  // Accept a dropped file (drag-and-drop alternative to the file picker).
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Only PDF resumes are supported.");
      toast("That file is not a PDF", "error");
      return;
    }
    setError("");
    setFile(f);
  }

  // Market demand for the matched role — the one secondary endpoint the match
  // flow can actually call (it only needs ?role=, no resume text). Best-effort:
  // it must never block or break the core score, so it's wrapped on its own.
  async function loadDemand(role: string) {
    try {
      const q = role ? `?role=${encodeURIComponent(role)}` : "";
      const res = await api.get(`/api/market-demand${q}`);
      setDemand(res.data.skills ?? []);
    } catch { /* leave market demand empty if unavailable */ }
  }

  async function handleMatch() {
    setError("");
    if (!file) { setError("Choose a PDF resume first."); return; }

    const jobUrl = queryParam("job_url");
    if (!jobUrl) {
      setError("Pick a job from the Jobs page first, then click “Match my resume” on it.");
      return;
    }
    const token = localStorage.getItem("token") ?? "";

    setLoading(true);
    setDemand([]);
    try {
      // Backend /api/match expects form fields: resume (file), job_url, token.
      const form = new FormData();
      form.append("resume", file);
      form.append("job_url", jobUrl);
      form.append("token", token);
      const res = await api.post("/api/match", form);
      setResult(res.data);
      toast(`Scored ${res.data.score} / 100`);
      loadDemand(queryParam("role"));
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 413) { setError("That file is too large. Max 5MB."); toast("File too large (max 5MB)", "error"); }
      else if (status === 422) { setError("Uploaded file must be a PDF."); toast("File must be a PDF", "error"); }
      else if (status === 404) { setError("That job no longer exists. Pick another from Jobs."); toast("That job no longer exists", "error"); }
      else if (status === 408) { setError("Upload timed out. Check your connection and try again."); toast("Upload timed out", "error"); }
      else {
        setError("Backend offline. Showing a sample result so you can preview.");
        setResult(MOCK_MATCH);
        setDemand(MOCK_DEMAND);
      }
    } finally {
      setLoading(false);
    }
  }

  // shap_scores (object) -> sorted bars; scaled against the largest magnitude.
  const impact = result ? Object.entries(result.shap_scores).map(([label, v]) => ({ label, v })) : [];
  const maxImpact = Math.max(...impact.map((d) => Math.abs(d.v)), 0.0001);
  const band = result ? scoreBand(result.score) : null;
  const bandLabel = result ? (result.score >= 70 ? "Strong match" : result.score >= 50 ? "Partial match" : "Weak match") : "";
  const takeaway = result
    ? result.score >= 70
      ? "You're a strong fit. Worth applying."
      : result.score >= 50
        ? "A partial fit. Closing a couple of gaps would lift this."
        : "A stretch for now. Focus on the missing skills first."
    : "";

  if (!authed) return null; // redirecting to /login

  return (
    <>
      <AppHeader active="/match" />
      <main className="wrap page-enter accent-match">
        <p className="eyebrow">Resume → job, scored</p>
        <h1 className="h-display page-title">Match my resume</h1>

        {/* Upload control */}
        <div className="card upload">
          <label
            className={`drop ${dragActive ? "drag" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
          >
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              hidden
            />
            <UploadSimple className="drop-icon" size={28} style={{ color: ACCENT }} />
            <span className="drop-text">
              {file ? file.name : dragActive ? "Drop your PDF here" : "Drag & drop or choose a PDF resume"}
            </span>
            <span className="muted drop-hint">PDF · up to 5MB</span>
          </label>
          <button className="btn btn-primary" onClick={handleMatch} disabled={loading}>
            {loading ? <><span className="spinner" /> Scoring…</> : "Get my match score"}
          </button>
        </div>
        {error && <motion.p className="note muted" key={error} {...shake}>{error}</motion.p>}

        {/* Processing: circular progress while we score */}
        {loading && (
          <div className="results">
            <section className="card block">
              <div className="score-row">
                <div className="progress-ring">
                  <svg viewBox="0 0 100 100" className="progress-svg">
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="44" fill="none" stroke={ACCENT} strokeWidth="8" strokeLinecap="round" strokeDasharray="80 200" />
                  </svg>
                  <span className="progress-cap mono">Analyzing…</span>
                </div>
                <div className="sk-skills">
                  <span className="skeleton" style={{ width: 90, height: 13 }} />
                  <span className="skeleton" style={{ width: 130, height: 18 }} />
                  <span className="skeleton" style={{ width: 110, height: 18 }} />
                  <span className="skeleton" style={{ width: 120, height: 18 }} />
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Results */}
        {!loading && result && (
          <div className="results">
            {/* Match result — 3 columns: ring · skill cards · verdict */}
            <section className="result-hero">
              <span className="rh-aura aura" aria-hidden />

              {/* Left: score ring (hero) */}
              <motion.div
                className="rh-ring"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="rh-ring-inner">
                  <ConfettiBurst />
                  <ScoreArc
                    value={result.score}
                    size={196}
                    thickness={14}
                    accentColor={band!.color}
                    ticks
                    ariaLabel={`Match score ${result.score} out of 100`}
                  />
                </div>
                <span
                  className="band-tag mono"
                  style={{ color: band!.color, background: `rgba(${band!.rgb}, 0.12)` }}
                >
                  {bandLabel}
                </span>
              </motion.div>

              {/* Middle: skill cards */}
              <motion.div
                className="rh-skills"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="skill-card">
                  <p className="card-label">You have · {result.matched_skills.length}</p>
                  {result.matched_skills.map((s) => (
                    <div key={s} className="srow have">
                      <span className="badge ok"><Check size={12} weight="bold" /></span> {s}
                    </div>
                  ))}
                </div>
                <div className="skill-card">
                  <p className="card-label">Missing · {result.missing_skills.length}</p>
                  {result.missing_skills.map((s) => (
                    <div key={s} className="srow miss">
                      <span className="badge no"><X size={12} weight="bold" /></span> {s}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Right: verdict / explanation (fills the space) */}
              <motion.div
                className="verdict-card"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="card-label">Verdict</p>
                {result.explanation && <p className="verdict-text">{result.explanation}</p>}
                <p className="verdict-take">{takeaway}</p>
                <div className="verdict-actions">
                  <a href="#insights" className="btn btn-primary">See what moved the score →</a>
                  <Link href="/jobs" className="btn btn-ghost">Back to jobs</Link>
                </div>
                <div className="verdict-stats mono">
                  <span><b>{result.matched_skills.length}</b> matched</span>
                  <span className="dot-sep">·</span>
                  <span><b>{result.missing_skills.length}</b> missing</span>
                </div>
              </motion.div>
            </section>

            {/* Insights — skill impact (from this match) + market demand (separate endpoint) */}
            <section className="card block" id="insights">
              <h2 className="h-display block-title">What moved the needle</h2>
              <div className="bars-2col">
                <div>
                  <p className="skill-label">Skill impact</p>
                  {impact.map((d, i) => (
                    <StatMeter
                      key={d.label}
                      label={d.label}
                      value={Math.round(Math.abs(d.v) * 100)}
                      format={(n) => `${d.v < 0 ? "−" : "+"}${(n / 100).toFixed(2)}`}
                      pct={(Math.abs(d.v) / maxImpact) * 100}
                      negative={d.v < 0}
                      baseline
                      delay={i * 80}
                    />
                  ))}
                </div>
                {demand.length > 0 && (
                  <div>
                    <p className="skill-label">Market demand</p>
                    {demand.map((d, i) => (
                      <StatMeter key={d.name} label={d.name} value={d.demand} format={(n) => `${n}%`} pct={d.demand} delay={i * 80} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </main>

      <style>{`
        .wrap { max-width: 1040px; margin: 0 auto; padding: 40px 24px 80px; }
        .page-title { font-size: clamp(30px, 5vw, 44px); margin: 6px 0 28px; }
        .upload { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .drop { flex: 1; min-width: 240px; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 26px; border: 2px dashed var(--hairline); border-radius: 14px; cursor: pointer; transition: border-color .2s, background .2s; }
        .drop:hover { border-color: var(--accent); }
        .drop.drag { border-color: var(--accent); background: rgba(127,119,221,.10); animation: dropPulse 1s ease-in-out infinite; }
        @keyframes dropPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.012); } }
        .sk-skills { display: flex; flex-direction: column; gap: 12px; }
        .progress-ring { position: relative; width: 168px; height: 168px; flex: 0 0 auto; display: grid; place-items: center; }
        .progress-svg { width: 100%; height: 100%; animation: spin 1.1s linear infinite; }
        .progress-cap { position: absolute; font-size: 13px; color: var(--muted); }
        .drop-icon { font-size: 24px; font-weight: 700; }
        .drop-text { font-weight: 600; font-size: 15px; color: var(--ink); }
        .drop-hint { font-size: 12px; }
        .note { font-size: 14px; margin-top: 14px; }
        .results { display: flex; flex-direction: column; gap: 20px; margin-top: 28px; }
        .block { padding: 28px; }
        .block-title { font-size: 22px; margin-bottom: 22px; }
        .skill-label { font-family: var(--font-mono), monospace; font-size: 12px; color: var(--muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: .08em; }

        /* ── result hero: 3 columns (ring · skills · verdict); shared card/verdict styles live in globals.css ── */
        .result-hero { position: relative; overflow: hidden; display: grid; grid-template-columns: auto 1fr 1.05fr; gap: 18px; align-items: stretch; }
        .rh-aura { width: 320px; height: 320px; top: -150px; right: -90px; }
        .rh-ring { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 26px; background: var(--surface); border: 1px solid var(--hairline); border-radius: var(--r-xl); box-shadow: var(--shadow-md); }
        .rh-ring-inner { position: relative; display: grid; place-items: center; }
        .rh-skills { display: flex; flex-direction: column; gap: 14px; }
        @media (max-width: 860px) { .result-hero { grid-template-columns: 1fr; } }
        .bars-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        @media (max-width: 680px) {
          .bars-2col { grid-template-columns: 1fr; }
          .score-row { gap: 28px; }
        }
      `}</style>
    </>
  );
}
