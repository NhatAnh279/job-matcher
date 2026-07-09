"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CaretDown } from "@phosphor-icons/react";
import api from "@/lib/api";
import AppHeader from "../_components/AppHeader";
import SkillTrends from "../_components/SkillTrends";
import ScoreArc from "../_components/ScoreArc";
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
  const [expanded, setExpanded] = useState<string | null>(null);
  // transient press feedback: the clicked row shakes + flashes its accent
  const [pulse, setPulse] = useState<string | null>(null);

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
        <h1 className="h-display page-title grad-text">Match history</h1>

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
                  const isOpen = expanded === r.match_id;
                  return (
                    <Fragment key={r.match_id}>
                      <motion.tr
                        className={`hist-row ${isOpen ? "open" : ""}`}
                        onClick={() => {
                          setExpanded(isOpen ? null : r.match_id);
                          if (!reduce) {
                            setPulse(r.match_id);
                            window.setTimeout(() => setPulse((p) => (p === r.match_id ? null : p)), 500);
                          }
                        }}
                        initial={reduce ? false : { opacity: 0, y: 8 }}
                        animate={pulse === r.match_id
                          ? {
                              opacity: 1, y: 0,
                              x: [0, -3, 3, -1, 0],
                              backgroundColor: ["rgba(225,29,72,0)", "rgba(225,29,72,0.09)", "rgba(225,29,72,0)"],
                            }
                          : { opacity: 1, y: 0, x: 0 }}
                        transition={pulse === r.match_id
                          ? { duration: 0.45, ease: "easeOut" }
                          : { duration: 0.35, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <td className="role">{r.job_title}</td>
                        <td className="muted">{r.company}</td>
                        <td className="num">
                          <span className="score-cell">
                            <span className="score-bar">
                              <span className="score-bar-fill" style={{ width: `${r.score}%`, background: b.color, boxShadow: `0 0 8px ${b.color}66` }} />
                            </span>
                            <span className="score-val mono" style={{ color: b.color }}>{r.score}</span>
                          </span>
                        </td>
                        <td className="num muted mono">
                          <span className="date-cell">{r.matched_at}<CaretDown className={`hist-caret ${isOpen ? "up" : ""}`} size={12} weight="bold" /></span>
                        </td>
                      </motion.tr>
                      {isOpen && (
                        <tr className="hd-row">
                          <td colSpan={4} className="hd-cell">
                            <motion.div
                              className="hist-detail"
                              initial={reduce ? false : { height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            >
                              <div className="hd-inner">
                                <ScoreArc value={r.score} size={96} thickness={9} suffix="" accentColor={b.color} ariaLabel={`Score ${r.score}`} />
                                <div className="hd-body">
                                  <p className="card-label">{r.job_title} · {r.company}</p>
                                  <p className="hd-meta mono">Scored {r.matched_at} · <span style={{ color: b.color, fontWeight: 700 }}>{b.key === "high" ? "Strong" : b.key === "mid" ? "Partial" : "Weak"} match</span></p>
                                  <Link href="/match" className="btn btn-primary hd-btn">See full breakdown →</Link>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
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
        /* expandable rows */
        .hist-row { cursor: pointer; }
        .date-cell { display: inline-flex; align-items: center; gap: 6px; justify-content: flex-end; }
        .hist-caret { color: var(--muted); transition: transform .2s; }
        .hist-caret.up { transform: rotate(180deg); }
        .history .hd-row td { padding: 0; border-top: none; }
        .hist-detail { overflow: hidden; }
        .hd-inner { display: flex; align-items: center; gap: 22px; padding: 6px 0 22px; }
        .hd-body { display: flex; flex-direction: column; }
        .hd-meta { font-size: 12px; color: var(--muted); margin: 6px 0 14px; }
        .hd-btn { align-self: flex-start; }
      `}</style>
    </>
  );
}
