"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import AppHeader from "../_components/AppHeader";
import SkillTrends from "../_components/SkillTrends";
import { useRequireAuth } from "../_components/useRequireAuth";

const ACCENT = "#E11D48";

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
      <main className="wrap page-enter">
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
                <tr><th>Role</th><th>Company</th><th>Score</th><th>Date</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.match_id}>
                    <td className="role">{r.job_title}</td>
                    <td className="muted">{r.company}</td>
                    <td className="mono" style={{ color: ACCENT, fontWeight: 700 }}>{r.score}</td>
                    <td className="muted mono">{r.matched_at}</td>
                  </tr>
                ))}
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
        .history { width: 100%; border-collapse: collapse; font-size: 16px; }
        .history th { text-align: left; font-family: var(--font-mono), monospace; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #9CA3AF; padding: 16px 0; }
        .history td { padding: 16px 0; border-top: 1px solid rgba(0,0,0,.08); }
        .role { font-weight: 500; }
        .state { padding: 40px 0; }
        .sk-cell { display: inline-block; height: 14px; max-width: 100%; }
        .trends-block { margin-top: 28px; }
      `}</style>
    </>
  );
}
