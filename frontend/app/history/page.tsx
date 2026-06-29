"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import api from "@/lib/api";
import AppHeader from "../_components/AppHeader";
import SkillTrends from "../_components/SkillTrends";
import { scoreBand } from "../_components/scoreBand";
import { useRequireAuth } from "../_components/useRequireAuth";

// Exact shape returned by GET /api/match/history (per the API contract).
type Entry = { match_id: string; job_title: string; company: string; score: number; matched_at: string };

// Mock data, shown until the backend is live
const MOCK_HISTORY: Entry[] = [
  { match_id: "match-001", job_title: "Data Scientist", company: "Canva",     score: 78, matched_at: "20 Jun 2026" },
  { match_id: "match-002", job_title: "Data Analyst",   company: "Atlassian", score: 84, matched_at: "18 Jun 2026" },
  { match_id: "match-003", job_title: "ML Engineer",    company: "Airwallex", score: 61, matched_at: "12 Jun 2026" },
];

export default function HistoryPage() {
  const authed = useRequireAuth();
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await api.get("/api/match/history");
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
                <tr><th>Role</th><th>Company</th><th>Score</th><th>Date</th></tr>
              </thead>
              <tbody>
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td><span className="skeleton sk-cell" style={{ width: 150 }} /></td>
                    <td><span className="skeleton sk-cell" style={{ width: 90 }} /></td>
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
                  <th>Role</th><th>Company</th><th className="num">Score</th><th className="num">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const b = scoreBand(r.score);
                  return (
                    <motion.tr
                      key={r.match_id}
                      initial={reduce ? false : { opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <td className="role">{r.job_title}</td>
                      <td className="muted">{r.company}</td>
                      <td className="num">
                        <span className="score-cell">
                          <span className="score-bar">
                            <span className="score-bar-fill" style={{ width: `${r.score}%`, background: b.color }} />
                          </span>
                          <span className="score-val mono" style={{ color: b.color }}>{r.score}</span>
                        </span>
                      </td>
                      <td className="num muted mono">{r.matched_at}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Week 5: skill demand trend (mock until a trends endpoint exists) */}
        <div className="trends-block">
          <SkillTrends />
        </div>
      </main>

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
        .history .num { text-align: right; font-variant-numeric: tabular-nums; }
        .role { font-weight: 600; }
        .score-cell { display: inline-flex; align-items: center; gap: 10px; justify-content: flex-end; }
        .score-bar { width: 54px; height: 6px; border-radius: var(--r-pill); background: rgba(0,0,0,.07); overflow: hidden; }
        .score-bar-fill { display: block; height: 100%; border-radius: var(--r-pill); }
        .score-val { font-weight: 700; min-width: 24px; text-align: right; }
        .state { padding: 40px 0; }
        .sk-cell { display: inline-block; height: 14px; max-width: 100%; }
        .trends-block { margin-top: 28px; }
      `}</style>
    </>
  );
}
