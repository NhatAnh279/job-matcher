"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import api from "@/lib/api";
import AppHeader from "../_components/AppHeader";
import MatchLetter, { type MatchEntry } from "../_components/MatchLetter";
import { scoreBand } from "../_components/scoreBand";
import { useRequireAuth } from "../_components/useRequireAuth";

// Shape returned by GET /api/match/history — rows from the Supabase
// match_history table: the columns the backend inserts, plus Supabase's
// default id / created_at (names read defensively since they may vary).
type Entry = {
  id?: string | number;
  match_id?: string;
  job_title: string;
  company: string;
  score: number;
  matched_skills?: string;   // stored as a stringified list: "['Python', 'SQL']"
  missing_skills?: string;
  created_at?: string;
  matched_at?: string;
};

// The backend stores skill lists via Python's str(list) — e.g. "['Python', 'SQL']".
// Parse that back into a string array; tolerate plain arrays and bad input.
function parseSkills(raw?: string | string[]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    return JSON.parse(raw.replace(/'/g, '"'));
  } catch {
    return [];
  }
}

// Mock data, shown until the backend is live
const MOCK_HISTORY: Entry[] = [
  { match_id: "match-001", job_title: "Data Scientist", company: "Canva",     score: 78, matched_at: "20 Jun 2026", matched_skills: "['Python', 'SQL']", missing_skills: "['Docker']" },
  { match_id: "match-002", job_title: "Data Analyst",   company: "Atlassian", score: 84, matched_at: "18 Jun 2026", matched_skills: "['SQL', 'Excel']", missing_skills: "['Tableau']" },
  { match_id: "match-003", job_title: "ML Engineer",    company: "Airwallex", score: 61, matched_at: "12 Jun 2026", matched_skills: "['Python']", missing_skills: "['AWS', 'Docker']" },
];

export default function HistoryPage() {
  const authed = useRequireAuth();
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [openEntry, setOpenEntry] = useState<MatchEntry | null>(null); // row shown in the letter

  // Build the letter payload from a stored row — everything match_history keeps.
  function openRow(r: Entry) {
    setOpenEntry({
      role: r.job_title,
      company: r.company,
      score: r.score,
      matched: parseSkills(r.matched_skills),
      missing: parseSkills(r.missing_skills),
      date: r.created_at ? new Date(r.created_at).toLocaleDateString() : (r.matched_at ?? "—"),
    });
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Backend reads the token from the `token` query param (not a header).
        const token = localStorage.getItem("token") ?? "";
        const res = await api.get(`/api/match/history?token=${encodeURIComponent(token)}`);
        if (!cancelled) setRows(res.data.history ?? []);
      } catch {
        if (!cancelled) setRows(MOCK_HISTORY); // backend offline → mock
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (!authed) return null; // redirecting to /login

  return (
    <>
      <AppHeader active="/history" />
      <main className="wrap page-enter accent-history">
        <p className="eyebrow">Your activity</p>
        <h1 className="h-display page-title">Match history</h1>

        {loading ? (
          <div className="card table-wrap">
            <table className="history">
              <thead>
                <tr><th>Role</th><th>Company</th><th>Skills</th><th>Score</th><th>Date</th></tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td><span className="skeleton sk-cell" style={{ width: 150 }} /></td>
                    <td><span className="skeleton sk-cell" style={{ width: 90 }} /></td>
                    <td><span className="skeleton sk-cell" style={{ width: 120 }} /></td>
                    <td><span className="skeleton sk-cell" style={{ width: 32 }} /></td>
                    <td><span className="skeleton sk-cell" style={{ width: 80 }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : rows.length === 0 ? (
          <p className="muted state">No matches yet. Score your resume to see it here.</p>
        ) : (
          <div className="card table-wrap">
            <table className="history">
              <thead>
                <tr>
                  <th>Role</th><th>Company</th><th>Skills</th><th className="num">Score</th><th className="num">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const b = scoreBand(r.score);
                  const matched = parseSkills(r.matched_skills);
                  const missing = parseSkills(r.missing_skills);
                  return (
                    <motion.tr
                      key={r.id ?? r.match_id ?? i}
                      className="row-open"
                      tabIndex={0}
                      role="button"
                      aria-haspopup="dialog"
                      aria-label={`View details: ${r.job_title} at ${r.company}, scored ${r.score}`}
                      onClick={() => openRow(r)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openRow(r); } }}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <td className="role">{r.job_title}</td>
                      <td className="muted">{r.company}</td>
                      <td>
                        <span className="skill-cell">
                          {matched.slice(0, 3).map((s) => (
                            <span key={`m-${s}`} className="skill-pill have mono">{s}</span>
                          ))}
                          {missing.slice(0, 2).map((s) => (
                            <span key={`x-${s}`} className="skill-pill miss mono">{s}</span>
                          ))}
                          {matched.length + missing.length > 5 && (
                            <span className="skill-more mono">+{matched.length + missing.length - 5}</span>
                          )}
                        </span>
                      </td>
                      <td className="num">
                        <span className="score-cell">
                          <span className="score-bar">
                            <span
                              className="score-bar-fill"
                              style={{
                                width: `${r.score}%`,
                                background: `linear-gradient(90deg, rgba(${b.rgb}, .35), ${b.color})`,
                                boxShadow: `0 0 8px rgba(${b.rgb}, .55)`,
                              }}
                            />
                          </span>
                          <span className="score-val mono" style={{ color: b.color }}>{r.score}</span>
                        </span>
                      </td>
                      <td className="num muted mono">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : (r.matched_at ?? "—")}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <MatchLetter entry={openEntry} onClose={() => setOpenEntry(null)} />

      <style>{`
        .wrap { max-width: 820px; margin: 0 auto; padding: 40px 24px 80px; }
        .page-title { font-size: clamp(30px, 5vw, 44px); margin: 6px 0 28px; }
        .table-wrap { padding: 8px 24px; }
        .history { width: 100%; border-collapse: collapse; font-size: 15px; }
        .history th { font-family: var(--font-mono), monospace; font-size: 11px; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); padding: 14px 10px; text-align: left; }
        .history td { padding: 15px 10px; border-top: 1px solid var(--hairline); }
        .history th:first-child, .history td:first-child { padding-left: 0; }
        .history th:last-child, .history td:last-child { padding-right: 0; }
        .history tbody tr { transition: background .15s; }
        .history tbody tr:hover { background: var(--accent-soft); }
        .row-open { cursor: pointer; }
        .row-open:focus-visible { outline: 2px solid var(--accent-bright); outline-offset: -2px; border-radius: 8px; }
        .row-open .role { transition: color .15s; }
        .row-open:hover .role { color: var(--accent-bright); }
        .history .num { text-align: right; font-variant-numeric: tabular-nums; }
        .role { font-weight: 600; }
        .score-cell { display: inline-flex; align-items: center; gap: 10px; justify-content: flex-end; }
        .score-bar {
          width: 58px; height: 8px; border-radius: 2px; overflow: hidden;
          background: rgba(255,255,255,.06);
          -webkit-mask: repeating-linear-gradient(90deg, #000 0 7px, transparent 7px 9px);
          mask: repeating-linear-gradient(90deg, #000 0 7px, transparent 7px 9px);
        }
        .score-bar-fill {
          display: block; height: 100%; position: relative;
          transition: width .9s cubic-bezier(.22,1,.36,1);
        }
        /* glow scales with the row's score colour, set inline via --sc */
        .row-open:hover .score-bar-fill { filter: brightness(1.2); }
        .score-val { font-weight: 700; min-width: 24px; text-align: right; font-variant-numeric: tabular-nums; }
        .state { padding: 40px 0; }
        .sk-cell { display: inline-block; height: 14px; max-width: 100%; }
        .skill-cell { display: inline-flex; flex-wrap: wrap; gap: 5px; max-width: 260px; }
        .skill-pill { font-size: 11px; padding: 2px 8px; border-radius: var(--r-pill); white-space: nowrap; }
        .skill-pill.have { color: #34d399; background: rgba(52,211,153,.14); }
        .skill-pill.miss { color: #fb7185; background: rgba(251,113,133,.12); text-decoration: line-through; }
        .skill-more { font-size: 11px; color: var(--muted); align-self: center; }
      `}</style>
    </>
  );
}
