"use client";

/* ════════════════════════════════════════════════════════════════
   INSIGHTS — market skill demand across the live job pool.
   Backed by GET /api/market-demand?role=&location=, which extracts skills
   from every matching job description and returns each skill's share of
   those postings (0–100%). Real data; no mock beyond an offline fallback.
   ════════════════════════════════════════════════════════════════ */

import { useCallback, useEffect, useState } from "react";
import { MagnifyingGlass, MapPin, TrendUp } from "@phosphor-icons/react";
import api from "@/lib/api";
import AppHeader from "../_components/AppHeader";
import StatMeter from "../_components/StatMeter";
import { useRequireAuth } from "../_components/useRequireAuth";

// GET /api/market-demand -> { role, location, skills: [{ name, demand }] }
type DemandSkill = { name: string; demand: number };

// Quick-pick roles the job pool actually contains (feeds the ?role= filter).
const ROLE_CHIPS = ["Analyst", "Data", "Engineer", "Manager", "Scientist"];

// Offline fallback only — mirrors the real endpoint's shape.
const MOCK_DEMAND: DemandSkill[] = [
  { name: "Reporting", demand: 83 },
  { name: "Communication", demand: 70 },
  { name: "Excel", demand: 64 },
  { name: "SQL", demand: 62 },
  { name: "Power BI", demand: 60 },
  { name: "Python", demand: 28 },
];

export default function InsightsPage() {
  const authed = useRequireAuth();
  const [skills, setSkills] = useState<DemandSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  // active filters (what the results currently reflect)
  const [role, setRole] = useState("");
  const [location, setLocation] = useState("");
  // draft inputs (typed but not yet submitted)
  const [roleInput, setRoleInput] = useState("");
  const [locInput, setLocInput] = useState("");

  const load = useCallback(async (r: string, loc: string) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (r) p.set("role", r);
      if (loc) p.set("location", loc);
      const qs = p.toString() ? `?${p.toString()}` : "";
      const res = await api.get(`/api/market-demand${qs}`);
      setSkills(res.data.skills ?? []);
      setOffline(false);
    } catch {
      setSkills(MOCK_DEMAND);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load("", ""); }, [load]);

  function runSearch() {
    setRole(roleInput);
    setLocation(locInput);
    load(roleInput, locInput);
  }

  function pickChip(chip: string) {
    setRoleInput(chip);
    setRole(chip);
    load(chip, location);
  }

  const top = skills[0]?.demand ?? 100; // scale bars against the most-demanded skill
  const scope = [role && `“${role}” roles`, location].filter(Boolean).join(" · ") || "all live roles";

  if (!authed) return null; // redirecting to /login

  return (
    <>
      <AppHeader active="/insights" />
      <main className="wrap page-enter accent-insights">
        <p className="eyebrow">Market signal</p>
        <h1 className="h-display page-title">Skills in demand</h1>
        <p className="lede muted">
          Share of {scope} that ask for each skill, pulled live from the current job pool.
        </p>

        {/* filter bar — role + location, both real ?role= / ?location= params */}
        <div className="filter-bar">
          <div className="field">
            <MagnifyingGlass className="ic" size={18} />
            <input
              className="inp"
              placeholder="Filter by role (e.g. Analyst)"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
            />
          </div>
          <div className="field">
            <MapPin className="ic" size={18} />
            <input
              className="inp"
              placeholder="Location (e.g. Sydney)"
              value={locInput}
              onChange={(e) => setLocInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
            />
          </div>
          <button className="search-btn" onClick={runSearch}>Update</button>
        </div>

        <div className="chips">
          {ROLE_CHIPS.map((c) => (
            <button
              key={c}
              className={`chip ${role === c ? "chip-on" : ""}`}
              onClick={() => pickChip(role === c ? "" : c)}
            >
              {c}
            </button>
          ))}
        </div>

        {offline && (
          <p className="offline mono">Backend offline — showing a sample.</p>
        )}

        <section className="card panel">
          <div className="panel-head">
            <span className="panel-title"><TrendUp size={17} weight="bold" /> Skill demand</span>
            <span className="panel-sub mono">{loading ? "…" : `${skills.length} skills`}</span>
          </div>

          {loading ? (
            <div className="meters">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="sk-row">
                  <span className="skeleton" style={{ width: 90, height: 13 }} />
                  <span className="skeleton" style={{ width: `${70 - i * 6}%`, height: 10, borderRadius: 9999 }} />
                </div>
              ))}
            </div>
          ) : skills.length === 0 ? (
            <p className="muted empty">No skills found for this filter. Try a broader role.</p>
          ) : (
            <div className="meters">
              {skills.map((s, i) => (
                <StatMeter
                  key={s.name}
                  label={s.name}
                  value={Math.round(s.demand)}
                  format={(n) => `${n}%`}
                  pct={(s.demand / top) * 100}
                  delay={i * 45}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <style>{`
        .wrap { max-width: 780px; margin: 0 auto; padding: 40px 24px 80px; }
        .page-title { font-size: clamp(30px, 5vw, 44px); margin: 6px 0 10px; color: var(--ink); }
        .lede { font-size: 15px; line-height: 1.55; max-width: 60ch; margin-bottom: 26px; }

        .filter-bar { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 16px; }
        .field { position: relative; flex: 1; min-width: 200px; display: flex; align-items: center; gap: 8px; padding: 0 14px; border: 1px solid var(--hairline); border-radius: 10px; background: var(--surface); transition: border-color .2s, box-shadow .2s; }
        .field:focus-within { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(127,119,221,.18); }
        .ic { color: var(--muted); }
        .inp { flex: 1; border: none; outline: none; font-family: var(--font-sans), sans-serif; font-size: 15px; padding: 12px 0; background: transparent; color: var(--ink); }
        .inp::placeholder { color: var(--muted); }
        .search-btn { background: var(--accent); color: #fff; font-weight: 600; font-size: 15px; border: none; border-radius: 10px; padding: 0 24px; transition: transform .15s, background .2s, box-shadow .2s; }
        .search-btn:hover { transform: translateY(-1px) scale(1.02); background: #938ce4; box-shadow: 0 6px 18px rgba(127,119,221,.4); }

        .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
        .chip { font-size: 13px; color: var(--muted); background: var(--surface); border: 1px solid var(--hairline); padding: 7px 14px; border-radius: 9999px; transition: color .2s, border-color .2s, background .2s; }
        .chip:hover { color: var(--ink); border-color: var(--accent); }
        .chip-on { color: var(--accent-bright); border-color: var(--accent); background: rgba(127,119,221,.14); }

        .offline { font-size: 12px; color: var(--muted); margin-bottom: 14px; }

        .panel { padding: 26px 28px; }
        .panel-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
        .panel-title { display: inline-flex; align-items: center; gap: 8px; font-family: var(--font-grotesk), sans-serif; font-weight: 600; font-size: 17px; color: var(--ink); }
        .panel-sub { font-size: 12px; color: var(--muted); }
        .meters { display: flex; flex-direction: column; }
        .sk-row { display: flex; align-items: center; gap: 16px; margin-bottom: 18px; }
        .sk-row .skeleton:last-child { flex: 1; }
        .empty { padding: 20px 0; font-size: 14px; }
      `}</style>
    </>
  );
}
