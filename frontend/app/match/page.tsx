"use client";

import { useState, type CSSProperties } from "react";
import { UploadSimple, Check, X } from "@phosphor-icons/react";
import api from "@/lib/api";
import AppHeader from "../_components/AppHeader";
import Ant from "../_components/Ant";
import { useToast } from "../_components/ToastProvider";
import { useRequireAuth } from "../_components/useRequireAuth";

const ACCENT = "#0E9F6E";
const ROSE = "#E11D48";

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
      setError("Pick a job from the Jobs page first, then click “Match my resume” on it.");
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

  if (!authed) return null; // redirecting to /login

  return (
    <>
      <AppHeader active="/match" />
      <main className="wrap page-enter">
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
            {loading ? "Scoring…" : "Get my match score"}
          </button>
        </div>
        {error && <p className="note muted">{error}</p>}

        {/* Scoring skeleton — ant frantically searches while we score */}
        {loading && (
          <div className="results">
            <section className="card block">
              <div className="ant-work">
                <span className="ant-work-track"><Ant size={30} color={ACCENT} className="ant-search" /></span>
                <span className="muted ant-work-cap">Scouting your match…</span>
              </div>
              <div className="score-row" style={{ marginTop: 24 }}>
                <span className="skeleton" style={{ width: 168, height: 168, borderRadius: "50%", flex: "0 0 auto" }} />
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
            {/* Score + skills */}
            <section className="card block">
              <h2 className="h-display block-title">
                {result.score >= 70 ? "Strong match." : result.score >= 50 ? "Partial match." : "Weak match."}
              </h2>
              {result.explanation && <p className="muted explain">{result.explanation}</p>}
              <div className="score-row">
                <div
                  className="ring"
                  style={{ background: `conic-gradient(${ACCENT} ${result.score * 3.6}deg, rgba(0,0,0,.06) 0deg)` }}
                  role="img"
                  aria-label={`Match score ${result.score} out of 100`}
                >
                  <span className="confetti" aria-hidden>
                    {Array.from({ length: 10 }).map((_, i) => {
                      const a = (i / 10) * Math.PI * 2;
                      const dist = 24 + (i % 3) * 9;
                      const palette = [ACCENT, "#2563EB", "#D97706", "#E11D48"];
                      return (
                        <span
                          key={i}
                          style={{
                            "--cx": `${Math.cos(a) * dist}px`,
                            "--cy": `${Math.sin(a) * dist}px`,
                            background: palette[i % palette.length],
                            animationDelay: `${i * 0.015}s`,
                          } as CSSProperties}
                        />
                      );
                    })}
                  </span>
                  <span className="ring-ant"><Ant size={26} color={ACCENT} flag /></span>
                  <div className="ring-inner">
                    <span className="ring-num">{result.score}</span>
                    <span className="ring-cap mono">/ 100</span>
                  </div>
                </div>
                <div className="skill-cols">
                  <div>
                    <p className="skill-label">You have</p>
                    {result.matched_skills.map((s) => (
                      <p key={s} className="skill-item"><span className="mark ok"><Check size={12} weight="bold" /></span> {s}</p>
                    ))}
                  </div>
                  <div>
                    <p className="skill-label">You&apos;re missing</p>
                    {result.missing_skills.map((s) => (
                      <p key={s} className="skill-item"><span className="mark no"><X size={12} weight="bold" /></span> {s}</p>
                    ))}
                  </div>
                </div>
              </div>
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
            <section className="card block">
              <h2 className="h-display block-title">What moved the needle</h2>
              <div className="bars-2col">
                <div>
                  <p className="skill-label">Skill impact</p>
                  {impact.map((d) => (
                    <BarRow
                      key={d.label}
                      label={d.label}
                      valueText={`${d.v >= 0 ? "+" : "-"}${Math.abs(d.v).toFixed(2)}`}
                      pct={(Math.abs(d.v) / maxImpact) * 100}
                      color={d.v < 0 ? ROSE : ACCENT}
                    />
                  ))}
                </div>
                {demand.length > 0 && (
                  <div>
                    <p className="skill-label">Market demand</p>
                    {demand.map((d) => (
                      <BarRow key={d.name} label={d.name} valueText={`${d.demand}`} pct={d.demand} color={ACCENT} />
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Best fit — separate endpoint; only shown when available */}
            {bestFit.length > 0 && (
              <section className="card block">
                <h2 className="h-display block-title">Where your skills cluster</h2>
                <div className="fit-grid">
                  {bestFit.map((r, i) => (
                    <div
                      key={r.title}
                      className="fit-card"
                      style={i === 0 ? { background: `${ACCENT}1f`, borderColor: `${ACCENT}66` } : undefined}
                    >
                      <p className="card-meta mono">{i === 0 ? "Best fit" : `Rank ${i + 1}`}</p>
                      <h3 className="fit-role">{r.title}</h3>
                      <p className="fit-score mono" style={{ color: ACCENT }}>{r.fit}</p>
                      {r.note && <p className="muted fit-note">{r.note}</p>}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <style>{`
        .wrap { max-width: 900px; margin: 0 auto; padding: 40px 24px 80px; }
        .page-title { font-size: clamp(30px, 5vw, 44px); margin: 6px 0 28px; }
        .upload { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
        .drop { flex: 1; min-width: 240px; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 26px; border: 2px dashed rgba(0,0,0,.15); border-radius: 14px; cursor: pointer; transition: border-color .2s, background .2s; }
        .drop:hover { border-color: #16181D; }
        .drop.drag { border-color: #0E9F6E; background: rgba(14,159,110,.06); }
        .sk-skills { display: flex; flex-direction: column; gap: 12px; }
        .ant-work { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 2px 0 8px; }
        .ant-work-track { display: block; height: 22px; }
        .ant-work-cap { font-size: 13px; }
        .drop-icon { font-size: 24px; font-weight: 700; }
        .drop-text { font-weight: 600; font-size: 15px; }
        .drop-hint { font-size: 12px; }
        .note { font-size: 14px; margin-top: 14px; }
        .results { display: flex; flex-direction: column; gap: 20px; margin-top: 28px; }
        .block { padding: 28px; }
        .block-title { font-size: 22px; margin-bottom: 22px; }
        .explain { font-size: 15px; line-height: 1.55; margin: -14px 0 22px; max-width: 60ch; }
        .score-row { display: flex; align-items: center; gap: 44px; flex-wrap: wrap; }
        .ring { position: relative; width: 168px; height: 168px; border-radius: 50%; display: grid; place-items: center; flex: 0 0 auto; box-shadow: 0 16px 32px -10px rgba(0,0,0,.22), 0 2px 0 rgba(0,0,0,.05); }
        .ring-inner { width: calc(100% - 24px); height: calc(100% - 24px); background: #fff; border-radius: 50%; display: grid; place-items: center; box-shadow: 0 8px 24px rgba(0,0,0,.06); }
        .ring-num { font-family: var(--font-mono), monospace; font-weight: 700; font-size: 40px; }
        .ring-cap { font-size: 12px; color: #9CA3AF; margin-top: -2px; }
        .skill-cols { display: flex; gap: 48px; flex-wrap: wrap; }
        .skill-label { font-family: var(--font-mono), monospace; font-size: 13px; color: #6B7280; margin-bottom: 12px; text-transform: uppercase; letter-spacing: .06em; }
        .skill-item { font-size: 16px; margin: 8px 0; display: flex; align-items: center; gap: 10px; }
        .mark { width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; color: #fff; }
        .mark.ok { background: #0E9F6E; }
        .mark.no { background: #E11D48; }
        .bars-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        .fit-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .fit-card { border: 1px solid rgba(0,0,0,.08); border-radius: 14px; padding: 20px; }
        .card-meta { font-size: 12px; color: #6B7280; }
        .fit-role { font-family: var(--font-grotesk), sans-serif; font-weight: 600; font-size: 18px; margin-top: 6px; }
        .fit-score { font-size: 36px; font-weight: 700; margin-top: 10px; }
        .fit-note { font-size: 13px; margin-top: 6px; line-height: 1.45; }
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
          .bars-2col, .fit-grid { grid-template-columns: 1fr; }
          .score-row { gap: 28px; }
        }
      `}</style>
    </>
  );
}

// One static bar (this page shows results on demand, so no entry animation needed)
function BarRow({ label, valueText, pct, color }: { label: string; valueText: string; pct: number; color: string }) {
  return (
    <div className="bar-row">
      <div className="bar-head">
        <span>{label}</span>
        <span style={{ color }}>{valueText}</span>
      </div>
      <div className="bar-track"><div className="bar-fill" style={{ width: `${pct}%`, background: color }} /></div>
      <style>{`
        .bar-row { margin-bottom: 16px; }
        .bar-head { display: flex; justify-content: space-between; font-family: var(--font-mono), monospace; font-size: 13px; margin-bottom: 6px; }
        .bar-track { height: 10px; border-radius: 9999px; background: rgba(0,0,0,.06); overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 9999px; transition: width .8s cubic-bezier(.22,1,.36,1); }
      `}</style>
    </div>
  );
}
