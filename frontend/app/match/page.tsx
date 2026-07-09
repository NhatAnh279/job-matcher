"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { UploadSimple, Check, X } from "@phosphor-icons/react";
import api from "@/lib/api";
import AppHeader from "../_components/AppHeader";
import BestFitCards from "../_components/BestFitCards";
import ConfettiBurst from "../_components/ConfettiBurst";
import ScoreArc from "../_components/ScoreArc";
import AccentMeter from "../_components/AccentMeter";
import { scoreBand } from "../_components/scoreBand";
import { useToast } from "../_components/ToastProvider";
import { useRequireAuth } from "../_components/useRequireAuth";

const shake = { initial: { x: 0 }, animate: { x: [0, -6, 6, -5, 5, 0] }, transition: { duration: 0.4 } };

const ACCENT = "#0E9F6E";

/* ════════════════════════════════════════════════════════════════
   CONTRACT SHAPES — exactly what the API returns (see API Contract v3)
   ════════════════════════════════════════════════════════════════ */

// POST /api/match
type MatchResponse = {
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  explanation: string;
  shap_scores: Record<string, number>; // { "Python": 0.32, "Docker": -0.15 }
};

// GET /api/best-fit  ->  { roles: BestFitRole[] }
type BestFitRole = { title: string; fit: number; note: string };

// GET /api/market-demand  ->  { role, location, skills: DemandSkill[] }
type DemandSkill = { name: string; demand: number };

// GET /api/jd-highlight  ->  { working_type, responsibilities, segments }
// Each segment is a run of the job-description text, tagged matched / missing / plain.
type JdSegment = { text: string; highlight: "matched" | "missing" | null };
type JdHighlight = { working_type: string; responsibilities: string[]; segments: JdSegment[] };

/* ── Mock data: shown when the backend is offline so the UI is previewable ── */
const MOCK_MATCH: MatchResponse = {
  score: 78,
  matched_skills: ["Python", "SQL", "Pandas"],
  missing_skills: ["Docker", "Power BI"],
  explanation: "Strong backend match. Missing DevOps and BI tools.",
  shap_scores: { Python: 0.30, SQL: 0.22, Docker: -0.18 },
};
const MOCK_BESTFIT: BestFitRole[] = [
  { title: "Data Analyst", fit: 82, note: "Your skills cluster here" },
  { title: "Business Analyst", fit: 64, note: "Close second" },
  { title: "Data Scientist", fit: 47, note: "Needs more ML skills" },
];
const MOCK_DEMAND: DemandSkill[] = [
  { name: "SQL", demand: 92 },
  { name: "Python", demand: 64 },
  { name: "Power BI", demand: 58 },
];
const MOCK_JD: JdHighlight = {
  working_type: "hybrid",
  responsibilities: [
    "Build and maintain data pipelines",
    "Present insights to stakeholders",
    "Partner with product on experiments",
  ],
  segments: [
    { text: "We're after strong ", highlight: null },
    { text: "SQL", highlight: "matched" },
    { text: " and ", highlight: null },
    { text: "Python", highlight: "matched" },
    { text: " skills to build ", highlight: null },
    { text: "Power BI", highlight: "missing" },
    { text: " dashboards and ship models with ", highlight: null },
    { text: "Docker", highlight: "missing" },
    { text: ".", highlight: null },
  ],
};

// Read a query param at call time (set by the "Match my resume" link on /jobs).
function queryParam(name: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(name) ?? "";
}

export default function MatchPage() {
  const authed = useRequireAuth();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<MatchResponse | null>(null);
  const [bestFit, setBestFit] = useState<BestFitRole[]>([]);
  const [demand, setDemand] = useState<DemandSkill[]>([]);
  const [jd, setJd] = useState<JdHighlight | null>(null);
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

  // Best-effort secondary insights. These live on separate endpoints and must
  // never block or break the core score, so each is wrapped on its own.
  async function loadInsights({ role, jobId, resumeId }: { role: string; jobId: string; resumeId: string }) {
    try {
      const res = await api.get("/api/best-fit");
      setBestFit(res.data.roles ?? []);
    } catch { /* leave best-fit empty if unavailable */ }

    try {
      const q = role ? `?role=${encodeURIComponent(role)}` : "";
      const res = await api.get(`/api/market-demand${q}`);
      setDemand(res.data.skills ?? []);
    } catch { /* leave market demand empty if unavailable */ }

    // jd-highlight needs job_id + resume_id. The contract's /api/match response
    // does not (yet) return a resume_id, so we pass it only if the backend
    // happens to include one; otherwise this call is skipped/hidden gracefully.
    // TODO(Tommy): confirm where resume_id comes from for /api/jd-highlight.
    try {
      const p = new URLSearchParams();
      if (jobId) p.set("job_id", jobId);
      if (resumeId) p.set("resume_id", resumeId);
      const res = await api.get(`/api/jd-highlight?${p.toString()}`);
      setJd(res.data);
    } catch { /* leave JD highlight hidden if unavailable */ }
  }

  async function handleMatch() {
    setError("");
    if (!file) { setError("Choose a PDF resume first."); return; }

    const jobId = queryParam("job_id");
    if (!jobId) {
      // SAMPLE MODE — no job picked (opened /match directly). Run a short
      // "analyzing" pass, then show the sample result so the flow is
      // previewable end-to-end. A real score still needs a job from /jobs.
      setLoading(true);
      setBestFit([]);
      setDemand([]);
      setJd(null);
      window.setTimeout(() => {
        setResult(MOCK_MATCH);
        setBestFit(MOCK_BESTFIT);
        setDemand(MOCK_DEMAND);
        setJd(MOCK_JD);
        setLoading(false);
        setError("Sample result. Pick a job from the Jobs page to score against a real role.");
        toast(`Sample score ${MOCK_MATCH.score} / 100`);
      }, 1400);
      return;
    }

    setLoading(true);
    setBestFit([]);
    setDemand([]);
    setJd(null);
    try {
      // Resume is a file + the job to score against -> multipart form-data
      const form = new FormData();
      form.append("resume", file);
      form.append("job_id", jobId);
      const res = await api.post("/api/match", form);
      setResult(res.data);
      toast(`Scored ${res.data.score} / 100`);
      // resume_id is read defensively (not guaranteed by the contract yet).
      loadInsights({ role: queryParam("role"), jobId, resumeId: res.data.resume_id ?? "" });
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 413) { setError("That file is too large. Max 5MB."); toast("File too large (max 5MB)", "error"); }
      else if (status === 422) { setError("Uploaded file must be a PDF."); toast("File must be a PDF", "error"); }
      else if (status === 404) { setError("That job no longer exists. Pick another from Jobs."); toast("That job no longer exists", "error"); }
      else if (status === 408) { setError("Upload timed out. Check your connection and try again."); toast("Upload timed out", "error"); }
      else {
        setError("Backend offline. Showing a sample result so you can preview.");
        setResult(MOCK_MATCH);
        setBestFit(MOCK_BESTFIT);
        setDemand(MOCK_DEMAND);
        setJd(MOCK_JD);
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
      {/* the logo's soul-dot reacts to the score band: green = happy bounce, red = consoling droop */}
      <AppHeader
        active="/match"
        mood={result && band ? (band.key === "high" ? "happy" : band.key === "low" ? "sad" : "idle") : "idle"}
      />
      <main className="wrap page-enter accent-match">
        <p className="eyebrow">Resume → job, scored</p>
        <h1 className="h-display page-title grad-text">Match my resume</h1>

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
                    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(0,0,0,.07)" strokeWidth="8" />
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

            {/* Job description, with your matched / missing skills highlighted in place */}
            {jd && (
              <section className="card block">
                <h2 className="h-display block-title">In the job description</h2>
                {jd.working_type && <p className="jd-arrangement mono">{jd.working_type} role</p>}
                <p className="jd-text">
                  {jd.segments.map((seg, i) => (
                    <span key={i} className={seg.highlight ? `seg seg-${seg.highlight}` : undefined}>
                      {seg.text}
                    </span>
                  ))}
                </p>
                <div className="jd-legend">
                  <span className="legend-item"><span className="dot dot-matched" /> matched</span>
                  <span className="legend-item"><span className="dot dot-missing" /> missing</span>
                </div>
                {jd.responsibilities.length > 0 && (
                  <>
                    <p className="skill-label jd-resp-label">Key responsibilities</p>
                    <ul className="jd-resp">
                      {jd.responsibilities.map((r) => <li key={r}>{r}</li>)}
                    </ul>
                  </>
                )}
              </section>
            )}

            {/* Insights — skill impact (from this match) + market demand (separate endpoint) */}
            <section className="card block" id="insights">
              <h2 className="h-display block-title">What moved the needle</h2>
              <div className="bars-2col">
                <div>
                  <p className="skill-label">Skill impact</p>
                  {impact.map((d, i) => (
                    <AccentMeter
                      key={d.label}
                      label={d.label}
                      valueText={`${d.v >= 0 ? "+" : "-"}${Math.abs(d.v).toFixed(2)}`}
                      pct={(Math.abs(d.v) / maxImpact) * 100}
                      negative={d.v < 0}
                      baseline
                      delay={i * 0.08}
                    />
                  ))}
                </div>
                {demand.length > 0 && (
                  <div>
                    <p className="skill-label">Market demand</p>
                    {demand.map((d, i) => (
                      <AccentMeter key={d.name} label={d.name} valueText={`${d.demand}`} pct={d.demand} delay={i * 0.08} />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Best fit — separate endpoint; only shown when available.
                Cards expand in place with a shared layoutId morph (see BestFitCards). */}
            {bestFit.length > 0 && (
              <section className="card block">
                <h2 className="h-display block-title">Where your skills cluster</h2>
                <BestFitCards roles={bestFit} />
              </section>
            )}
          </div>
        )}
      </main>

      <style>{`
        .wrap { max-width: 1040px; margin: 0 auto; padding: 40px 24px 80px; }
        .page-title { font-size: clamp(30px, 5vw, 44px); margin: 6px 0 28px; }
        .upload { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .drop { flex: 1; min-width: 240px; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 26px; border: 2px dashed rgba(0,0,0,.15); border-radius: 14px; cursor: pointer; transition: border-color .2s, background .2s; }
        .drop:hover { border-color: #16181D; }
        .drop.drag { border-color: #0E9F6E; background: rgba(14,159,110,.06); animation: dropPulse 1s ease-in-out infinite; }
        @keyframes dropPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.012); } }
        .sk-skills { display: flex; flex-direction: column; gap: 12px; }
        .progress-ring { position: relative; width: 168px; height: 168px; flex: 0 0 auto; display: grid; place-items: center; }
        .progress-svg { width: 100%; height: 100%; animation: spin 1.1s linear infinite; }
        .progress-cap { position: absolute; font-size: 13px; color: #6B7280; }
        .drop-icon { font-size: 24px; font-weight: 700; }
        .drop-text { font-weight: 600; font-size: 15px; }
        .drop-hint { font-size: 12px; }
        .note { font-size: 14px; margin-top: 14px; }
        .results { display: flex; flex-direction: column; gap: 20px; margin-top: 28px; }
        .block { padding: 28px; }
        .block-title { font-size: 22px; margin-bottom: 22px; }
        .skill-label { font-family: var(--font-mono), monospace; font-size: 12px; color: var(--muted); margin-bottom: 12px; text-transform: uppercase; letter-spacing: .08em; }

        /* ── result hero: 3 columns (ring · skills · verdict); shared card/verdict styles live in globals.css ── */
        .result-hero { position: relative; overflow: hidden; display: grid; grid-template-columns: auto 1fr 1.05fr; gap: 18px; align-items: stretch; }
        .rh-aura { width: 320px; height: 320px; top: -150px; right: -90px; }
        .rh-ring { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; padding: 26px; background: var(--glass); backdrop-filter: blur(14px) saturate(1.35); border: 1px solid var(--glass-border); border-radius: var(--r-xl); box-shadow: var(--glass-edge), var(--shadow-md); }
        .rh-ring-inner { position: relative; display: grid; place-items: center; }
        .rh-skills { display: flex; flex-direction: column; gap: 14px; }
        @media (max-width: 860px) { .result-hero { grid-template-columns: 1fr; } }
        .bars-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        /* best-fit card styles now live in the shared BestFitCards component */
        .card-meta { font-family: var(--font-mono), monospace; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
        /* ── JD highlight ── */
        .jd-arrangement { font-size: 12px; color: #9CA3AF; text-transform: capitalize; margin: -14px 0 18px; }
        .jd-text { font-size: 17px; line-height: 1.95; color: #16181D; }
        .seg { padding: 1px 5px; border-radius: 5px; font-weight: 600; }
        .seg-matched { background: rgba(14,159,110,.14); color: #0B7A53; }
        .seg-missing { background: rgba(225,29,72,.12); color: #B4143E; }
        .jd-legend { display: flex; gap: 18px; margin-top: 18px; }
        .legend-item { display: inline-flex; align-items: center; gap: 7px; font-family: var(--font-mono), monospace; font-size: 12px; color: #6B7280; }
        .dot { width: 12px; height: 12px; border-radius: 4px; }
        .dot-matched { background: rgba(14,159,110,.35); }
        .dot-missing { background: rgba(225,29,72,.3); }
        .jd-resp-label { margin-top: 26px; }
        .jd-resp { list-style: none; display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
        .jd-resp li { font-size: 15px; color: #374151; padding-left: 18px; position: relative; }
        .jd-resp li::before { content: ""; position: absolute; left: 4px; top: 9px; width: 5px; height: 5px; border-radius: 50%; background: #9CA3AF; }
        @media (max-width: 680px) {
          .bars-2col { grid-template-columns: 1fr; }
          .score-row { gap: 28px; }
        }
      `}</style>
    </>
  );
}
