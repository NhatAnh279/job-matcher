"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MagnifyingGlass, MapPin, CaretDown, Star, X, Check, Funnel, Stack, Brain, ChartBar, ChartPieSlice, Code } from "@phosphor-icons/react";
import api from "@/lib/api";
import AppHeader from "../_components/AppHeader";
import { useToast } from "../_components/ToastProvider";
import { useRequireAuth } from "../_components/useRequireAuth";

/* ════════════════════════════════════════════════════════════════
   1. CONFIG + MOCK DATA
   ════════════════════════════════════════════════════════════════ */
const ACCENT = "#16181D"; // black & white theme, no blue
const SLOGAN = "Find the job you actually fit…";

const ROLE_SUGGESTIONS = ["Data Scientist", "Data Analyst", "ML Engineer", "BI Analyst", "Python", "SQL", "Power BI"];
const LOC_SUGGESTIONS = ["Sydney NSW", "Melbourne VIC", "Brisbane QLD", "Remote"];

// What the cards render. Fields the API contract guarantees are required; the
// rest are optional "enrichments" (present in mock data, absent from the real
// GET /api/jobs response) so the UI degrades gracefully against live data.
type Job = {
  id: string;
  role: string;
  company: string;
  location: string;
  type: string;            // working arrangement: Remote / Hybrid / On-site
  source: string;          // Seek / Jora
  posted: string;          // e.g. "2 days ago"
  skills: string[];
  url?: string;
  employmentType?: string; // not in the API contract
  classification?: string; // not in the API contract
  salary?: string;         // not in the API contract
  salaryMin?: number;
  postedDays?: number;
  highlights?: string[];
};

// Exact shape returned by GET /api/jobs (per the API contract).
type ApiJob = {
  job_id: string;
  title: string;
  company: string;
  location: string;
  source: string;
  skills: string[];
  url: string;
  working_type: string;    // remote | hybrid | on-site
  posted_at: string;
};

// "hybrid" -> "Hybrid", "on-site" -> "On-site", "seek" -> "Seek"
function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

// Map a contract job onto the shape the cards render.
function fromApi(j: ApiJob): Job {
  return {
    id: j.job_id,
    role: j.title,
    company: j.company,
    location: j.location,
    type: titleCase(j.working_type),
    source: titleCase(j.source),
    posted: j.posted_at,
    url: j.url,
    skills: j.skills ?? [],
  };
}

const MOCK_JOBS: Job[] = [
  {
    id: "1", role: "Data Scientist", company: "Canva", location: "Sydney NSW", type: "Hybrid",
    employmentType: "Full-time", classification: "Data & Analytics", source: "Seek",
    salary: "$120k - $145k", salaryMin: 120, postedDays: 0, posted: "New",
    highlights: ["Work on recommendation models", "Flexible hybrid setup", "Equity + learning budget"],
    skills: ["Python", "SQL", "ML"],
  },
  {
    id: "2", role: "Data Analyst", company: "Atlassian", location: "Remote", type: "Remote",
    employmentType: "Full-time", classification: "Data & Analytics", source: "Jora",
    salary: "$95k - $110k", salaryMin: 95, postedDays: 2, posted: "2d ago",
    highlights: ["Fully remote across AU", "Own the analytics stack", "Great onboarding"],
    skills: ["SQL", "Tableau", "Excel"],
  },
  {
    id: "3", role: "ML Engineer", company: "Airwallex", location: "Melbourne VIC", type: "On-site",
    employmentType: "Full-time", classification: "Engineering", source: "Seek",
    salary: "$140k - $170k", salaryMin: 140, postedDays: 3, posted: "3d ago",
    highlights: ["Ship models to production", "Fast-growing fintech", "Strong eng culture"],
    skills: ["Python", "Docker", "AWS"],
  },
  {
    id: "4", role: "BI Analyst", company: "Telstra", location: "Sydney NSW", type: "Hybrid",
    employmentType: "Contract", classification: "Data & Analytics", source: "Jora",
    salary: "$100k - $120k", salaryMin: 100, postedDays: 5, posted: "5d ago",
    highlights: ["Build exec dashboards", "Cross-team projects", "Hybrid 3 days office"],
    skills: ["Power BI", "SQL", "DAX"],
  },
];

/* ── Occupation fields: the category cards (top row) + occupation checkboxes
   (left column) both filter on this dimension. Each job is bucketed by role. ── */
const FIELDS = [
  { key: "Data Science & ML",     icon: Brain },
  { key: "Data & Analytics",      icon: ChartBar },
  { key: "Business Intelligence", icon: ChartPieSlice },
  { key: "Engineering",           icon: Code },
] as const;

function fieldOf(job: Job): string {
  const r = job.role.toLowerCase();
  if (r.includes("scientist") || r.includes("machine") || r.includes("ml ") || r.startsWith("ml")) return "Data Science & ML";
  if (r.includes("bi ") || r.includes("business intelligence") || r.includes("power bi")) return "Business Intelligence";
  if (r.includes("analyst")) return "Data & Analytics";
  if (r.includes("engineer") || r.includes("developer")) return "Engineering";
  return "Data & Analytics";
}

/* ════════════════════════════════════════════════════════════════
   2. REUSABLE DROPDOWN FILTER
   ════════════════════════════════════════════════════════════════ */
function Dropdown({
  label, options, value, onChange,
}: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = value !== options[0]; // first option = the "any / clear" choice

  // Close when clicking outside
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="dd" ref={ref}>
      <button
        className="dd-btn"
        onClick={() => setOpen((o) => !o)}
        style={active ? { borderColor: ACCENT, color: ACCENT, fontWeight: 600 } : undefined}
      >
        {active ? value : label}
        <CaretDown className="dd-caret" size={13} weight="bold" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className="dd-menu">
          {options.map((o) => (
            <button
              key={o}
              className="dd-opt"
              onClick={() => { onChange(o); setOpen(false); }}
              style={o === value ? { background: "rgba(0,0,0,.06)", fontWeight: 600 } : undefined}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   3. PAGE
   ════════════════════════════════════════════════════════════════ */
export default function JobsPage() {
  const authed = useRequireAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // search inputs
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [focus, setFocus] = useState<"" | "kw" | "loc">("");

  // dropdown filters (index 0 of each = "any")
  const [pay, setPay] = useState("Any pay");
  const [empType, setEmpType] = useState("Any type");
  const [remote, setRemote] = useState("Anywhere");
  const [classification, setClassification] = useState("All fields");
  const [listing, setListing] = useState("Any time");

  // occupation-field filter (top category cards + left checkbox column)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  // per-job actions
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  // typewriter slogan
  const [typed, setTyped] = useState("");
  const [reduced, setReduced] = useState(false);

  const toast = useToast();

  // GET /api/jobs -> map the contract response onto the card shape.
  // Falls back to mock data if the backend is offline.
  const loadJobs = useCallback(async (qs: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/api/jobs${qs}`);
      const list: ApiJob[] = res.data.jobs ?? [];
      setJobs(list.map(fromApi));
    } catch {
      setJobs(MOCK_JOBS); // backend offline -> mock
    } finally {
      setLoading(false);
    }
  }, []);

  // Build the querystring from the filters the API contract supports.
  function buildQuery(): string {
    const p = new URLSearchParams();
    if (keyword) p.set("q", keyword);
    if (location) p.set("location", location);
    if (remote !== "Anywhere") p.set("working_type", remote.toLowerCase()); // remote | hybrid | on-site
    p.set("limit", "20");
    return `?${p.toString()}`;
  }

  // Re-query the backend with the current search terms.
  function runSearch() {
    setFocus("");
    loadJobs(buildQuery());
  }

  // Initial load (no filters yet)
  useEffect(() => { loadJobs(""); }, [loadJobs]);

  // Detect reduced motion
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Typewriter: slogan appears left to right in the keyword field
  useEffect(() => {
    if (keyword) return;               // stop once the user types
    if (reduced) { setTyped(SLOGAN); return; }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setTyped(SLOGAN.slice(0, i));
      if (i >= SLOGAN.length) clearInterval(id);
    }, 55);
    return () => clearInterval(id);
  }, [keyword, reduced]);

  // Helpers to turn filter labels into numbers
  const payMin = { "Any pay": 0, "$80k+": 80, "$100k+": 100, "$130k+": 130 }[pay] ?? 0;
  const listingMax = { "Any time": 999, "Today": 0, "Last 3 days": 3, "Last 7 days": 7 }[listing] ?? 999;

  // Apply every filter. Filters on optional fields (pay, employment type,
  // classification, listing time) pass through when the field is absent, so
  // real API jobs (which don't carry those fields) are never wrongly excluded.
  // Everything except the occupation-field filter, so the field counts below
  // reflect the current search but not the field selection itself.
  const baseFiltered = jobs.filter((j) => {
    if (hidden.has(j.id)) return false;
    const inKw = `${j.role} ${j.company} ${j.skills.join(" ")}`.toLowerCase().includes(keyword.toLowerCase());
    const inLoc = j.location.toLowerCase().includes(location.toLowerCase());
    const inPay = payMin === 0 || j.salaryMin == null || j.salaryMin >= payMin;
    const inEmp = empType === "Any type" || j.employmentType == null || j.employmentType === empType;
    const inRemote = remote === "Anywhere" || j.type === remote;
    const inClass = classification === "All fields" || j.classification == null || j.classification === classification;
    const inListing = listingMax === 999 || j.postedDays == null || j.postedDays <= listingMax;
    return inKw && inLoc && inPay && inEmp && inRemote && inClass && inListing;
  });

  // Live count per occupation field (shown next to each checkbox).
  const fieldCounts: Record<string, number> = {};
  for (const j of baseFiltered) {
    const f = fieldOf(j);
    fieldCounts[f] = (fieldCounts[f] ?? 0) + 1;
  }

  const filtered = selectedFields.size === 0
    ? baseFiltered
    : baseFiltered.filter((j) => selectedFields.has(fieldOf(j)));

  // Top category cards: clicking one selects just that field; "All roles" clears.
  function pickField(key: string | null) {
    setSelectedFields(key ? new Set([key]) : new Set());
  }
  // Left checkboxes: toggle a field in/out of the multi-select.
  function toggleField(key: string) {
    const next = new Set(selectedFields);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSelectedFields(next);
  }

  const kwSuggestions = ROLE_SUGGESTIONS.filter(
    (s) => s.toLowerCase().includes(keyword.toLowerCase()) && s.toLowerCase() !== keyword.toLowerCase()
  );
  const locSuggestions = LOC_SUGGESTIONS.filter(
    (s) => s.toLowerCase().includes(location.toLowerCase()) && s.toLowerCase() !== location.toLowerCase()
  );

  function toggle(set: Set<string>, id: string, update: (s: Set<string>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    update(next);
  }

  if (!authed) return null; // redirecting to /login

  return (
    <>
      <AppHeader active="/jobs" />

      {/* ── search band ── */}
      <div className="band page-enter">
        <div className="band-inner">
          {/* keyword field + suggestions */}
          <div className="field">
            <MagnifyingGlass className="ic" size={18} />
            <input
              className="inp"
              autoComplete="off"
              placeholder={typed}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onFocus={() => setFocus("kw")}
              onBlur={() => setTimeout(() => setFocus(""), 120)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
            />
            {focus === "kw" && kwSuggestions.length > 0 && (
              <div className="sugg">
                {kwSuggestions.map((s) => (
                  <button key={s} className="sugg-opt" onMouseDown={(e) => { e.preventDefault(); setKeyword(s); }}>
                    <MagnifyingGlass className="ic-sm" size={14} /> {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* location field + suggestions */}
          <div className="field">
            <MapPin className="ic" size={18} />
            <input
              className="inp"
              autoComplete="off"
              placeholder="Suburb, city, or region"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onFocus={() => setFocus("loc")}
              onBlur={() => setTimeout(() => setFocus(""), 120)}
              onKeyDown={(e) => { if (e.key === "Enter") runSearch(); }}
            />
            {focus === "loc" && locSuggestions.length > 0 && (
              <div className="sugg">
                {locSuggestions.map((s) => (
                  <button key={s} className="sugg-opt" onMouseDown={(e) => { e.preventDefault(); setLocation(s); }}>
                    <MapPin className="ic-sm" size={14} /> {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="search-btn" onClick={runSearch}>Search</button>
        </div>
      </div>

      <main className="wrap page-enter">
        {/* ── first row: profession / field quick-pick cards ── */}
        <div className="cat-row">
          <button
            className={`cat ${selectedFields.size === 0 ? "cat-on" : ""}`}
            onClick={() => pickField(null)}
          >
            <span className="cat-ic"><Stack size={22} /></span>
            <span className="cat-label">All roles</span>
          </button>
          {FIELDS.map((f) => {
            const Icon = f.icon;
            const on = selectedFields.size === 1 && selectedFields.has(f.key);
            return (
              <button
                key={f.key}
                className={`cat ${on ? "cat-on" : ""}`}
                onClick={() => pickField(f.key)}
              >
                <span className="cat-ic"><Icon size={22} /></span>
                <span className="cat-label">{f.key}</span>
              </button>
            );
          })}
        </div>

        {/* ── dropdown filters ── */}
        <div className="filters">
          <Dropdown label="Pay" value={pay} onChange={setPay} options={["Any pay", "$80k+", "$100k+", "$130k+"]} />
          <Dropdown label="Type" value={empType} onChange={setEmpType} options={["Any type", "Full-time", "Part-time", "Casual", "Contract"]} />
          <Dropdown label="Remote" value={remote} onChange={setRemote} options={["Anywhere", "Remote", "Hybrid", "On-site"]} />
          <Dropdown label="Classification" value={classification} onChange={setClassification} options={["All fields", "Data & Analytics", "Engineering"]} />
          <Dropdown label="Listing time" value={listing} onChange={setListing} options={["Any time", "Today", "Last 3 days", "Last 7 days"]} />
        </div>

        {/* hidden notice */}
        {hidden.size > 0 && (
          <p className="hidden-note">
            {hidden.size} hidden · <button className="link-btn" onClick={() => setHidden(new Set())}>Show all</button>
          </p>
        )}

        <div className="layout">
          {/* ── first column: filter by occupation field (checkboxes + counts) ── */}
          <aside className="occ-col">
            <div className="occ-head"><Funnel size={16} weight="fill" /> Filter by field</div>
            <ul className="occ-list">
              {FIELDS.map((f) => {
                const checked = selectedFields.has(f.key);
                return (
                  <li key={f.key}>
                    <label className="occ-item">
                      <input type="checkbox" checked={checked} onChange={() => toggleField(f.key)} />
                      <span className="occ-box" aria-hidden>{checked && <Check size={11} weight="bold" />}</span>
                      <span className="occ-label">{f.key}</span>
                      <span className="occ-count">{fieldCounts[f.key] ?? 0}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            {selectedFields.size > 0 && (
              <button className="occ-clear" onClick={() => pickField(null)}>Clear fields</button>
            )}
          </aside>

          <section>
            {loading ? (
              <div className="results">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card sk-card">
                    <div className="sk-head">
                      <div className="sk-stack">
                        <span className="skeleton" style={{ width: 180, height: 20 }} />
                        <span className="skeleton" style={{ width: 110, height: 14 }} />
                      </div>
                      <span className="skeleton sk-logo" />
                    </div>
                    <span className="skeleton" style={{ width: 240, height: 13, marginTop: 16 }} />
                    <div className="sk-pills">
                      <span className="skeleton" style={{ width: 64, height: 22 }} />
                      <span className="skeleton" style={{ width: 52, height: 22 }} />
                      <span className="skeleton" style={{ width: 70, height: 22 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <>
            {filtered.length === 0 && (
              <p className="muted state">No jobs match. Try clearing the filters.</p>
            )}

            <div className="results">
              {filtered.map((job, i) => {
                const isSaved = saved.has(job.id);
                return (
                  <article
                    key={job.id}
                    className="card job-card"
                    style={{ animationDelay: reduced ? "0ms" : `${i * 70}ms` }}
                  >
                    <div className="job-head">
                      <div>
                        <h3 className="job-role">{job.role}</h3>
                        <p className="job-company">{job.company}</p>
                      </div>
                      <span className="logo">{job.company[0]}</span>
                    </div>

                    <div className="tag-row">
                      {job.posted === "New" && <span className="tag-new">New</span>}
                      <span className="muted mono job-meta">
                        {job.type} · {job.location}{job.salary ? ` · ${job.salary}` : ""}
                      </span>
                    </div>

                    {job.highlights && job.highlights.length > 0 && (
                      <ul className="highlights">
                        {job.highlights.map((h) => <li key={h}>{h}</li>)}
                      </ul>
                    )}

                    <div className="pill-row">
                      {job.skills.map((s) => <span key={s} className="pill">{s}</span>)}
                    </div>

                    <div className="job-foot">
                      <span className="muted mono posted">{job.source} · {job.posted}</span>
                      <div className="actions">
                        <button
                          className="act"
                          data-on={isSaved}
                          onClick={() => {
                            toggle(saved, job.id, setSaved);
                            toast(isSaved ? "Removed from saved" : "Saved to your list");
                          }}
                        >
                          <Star size={14} weight={isSaved ? "fill" : "regular"} />
                          {isSaved ? "Saved" : "Save"}
                        </button>
                        <button
                          className="act"
                          onClick={() => {
                            toggle(hidden, job.id, setHidden);
                            toast(`${job.role} hidden`);
                          }}
                        >
                          <X size={14} /> Hide
                        </button>
                        <Link
                          href={`/match?job_id=${encodeURIComponent(job.id)}&role=${encodeURIComponent(job.role)}`}
                          className="act act-cta"
                        >
                          Match my resume →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            </>
            )}
          </section>

          {/* ── sidebar ── */}
          <aside className="sidebar">
            <div className="card side-card cv-card">
              <h4 className="side-title">Score these against your CV</h4>
              <p className="muted side-text">Upload your resume to see a fit score and your missing skills for any role.</p>
              <Link href="/match" className="btn btn-primary side-btn">Match my resume</Link>
            </div>
            <div className="card side-card">
              <h4 className="side-title">Saved jobs ({saved.size})</h4>
              {saved.size === 0 ? (
                <p className="muted side-text">Tap Save on a role to keep it here.</p>
              ) : (
                <ul className="saved-list">
                  {jobs.filter((j) => saved.has(j.id)).map((j) => (
                    <li key={j.id} className="saved-item">{j.role} · <span className="muted">{j.company}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
        </div>
      </main>

      <style>{`
        /* fonts: explicit Inter / Space Grotesk so nothing falls back to ui-sans-serif */
        .band, .wrap { font-family: var(--font-sans), sans-serif; }

        /* ── search band ── */
        .band { background: #fff; border-bottom: 1px solid rgba(0,0,0,.08); }
        .band-inner { max-width: 1100px; margin: 0 auto; padding: 20px 24px; display: flex; gap: 12px; flex-wrap: wrap; }
        .field { position: relative; flex: 1; min-width: 200px; display: flex; align-items: center; gap: 8px; padding: 0 14px; border: 1px solid rgba(0,0,0,.16); border-radius: 10px; background: #fff; transition: border-color .2s, box-shadow .2s; }
        .field:focus-within { border-color: #16181D; box-shadow: 0 0 0 3px rgba(0,0,0,.06); }
        .ic { color: #9CA3AF; font-size: 18px; }
        .ic-sm { color: #9CA3AF; font-size: 14px; margin-right: 8px; }
        .inp { flex: 1; border: none; outline: none; font-family: var(--font-sans), sans-serif; font-size: 15px; padding: 12px 0; background: transparent; }
        .search-btn { background: #16181D; color: #fff; font-family: var(--font-sans), sans-serif; font-weight: 600; font-size: 15px; border: none; border-radius: 10px; padding: 0 28px; transition: transform .15s, box-shadow .2s; }
        .search-btn:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 6px 16px rgba(0,0,0,.2); }

        /* suggestions */
        .sugg { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: #fff; border: 1px solid rgba(0,0,0,.1); border-radius: 12px; box-shadow: 0 12px 30px rgba(0,0,0,.1); padding: 6px; z-index: 30; animation: pop .14s ease; }
        .sugg-opt { display: flex; align-items: center; width: 100%; text-align: left; font-size: 14px; padding: 9px 10px; border: none; background: none; border-radius: 8px; transition: background .15s; }
        .sugg-opt:hover { background: rgba(0,0,0,.05); }
        @keyframes pop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

        /* ── layout ── */
        .wrap { max-width: 1100px; margin: 0 auto; padding: 24px 24px 80px; }
        .filters { display: flex; gap: 10px; margin-bottom: 22px; flex-wrap: wrap; }
        .dd { position: relative; }
        .dd-btn { display: flex; align-items: center; gap: 8px; font-size: 14px; color: #374151; background: #fff; border: 1px solid rgba(0,0,0,.16); padding: 9px 16px; border-radius: 9999px; transition: transform .15s, border-color .2s, background .2s; }
        .dd-btn:hover { transform: translateY(-1px); border-color: #16181D; background: rgba(0,0,0,.02); }
        .dd-caret { font-size: 11px; transition: transform .2s; }
        .dd-menu { position: absolute; top: calc(100% + 8px); left: 0; min-width: 180px; background: #fff; border: 1px solid rgba(0,0,0,.1); border-radius: 12px; box-shadow: 0 12px 30px rgba(0,0,0,.12); padding: 6px; z-index: 30; animation: pop .14s ease; }
        .dd-opt { display: block; width: 100%; text-align: left; font-size: 14px; padding: 9px 12px; border: none; background: none; border-radius: 8px; transition: background .15s; }
        .dd-opt:hover { background: rgba(0,0,0,.05); }

        .hidden-note { font-size: 13px; color: #6B7280; margin-bottom: 16px; }
        .link-btn { background: none; border: none; color: #16181D; font-weight: 600; font-size: 13px; text-decoration: underline; }

        .layout { display: grid; grid-template-columns: 200px 1fr 280px; gap: 22px; align-items: start; }
        .state { padding: 30px 0; }

        /* ── first row: category cards ── */
        .cat-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 22px; scrollbar-width: thin; }
        .cat { flex: 0 0 auto; width: 108px; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px 10px; background: #fff; border: 1px solid rgba(0,0,0,.1); border-radius: 14px; cursor: pointer; transition: transform .15s, border-color .2s, background .2s; }
        .cat:hover { transform: translateY(-2px); border-color: #16181D; }
        .cat-on { border-color: #16181D; background: rgba(0,0,0,.04); }
        .cat-ic { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; background: rgba(0,0,0,.05); color: #16181D; transition: background .2s, color .2s; }
        .cat-on .cat-ic { background: #16181D; color: #fff; }
        .cat-label { font-size: 12px; font-weight: 600; text-align: center; line-height: 1.3; color: #374151; }

        /* ── first column: occupation checkboxes ── */
        .occ-col { position: sticky; top: 88px; }
        .occ-head { display: flex; align-items: center; gap: 8px; font-family: var(--font-grotesk), sans-serif; font-weight: 600; font-size: 15px; margin-bottom: 12px; }
        .occ-list { list-style: none; display: flex; flex-direction: column; gap: 2px; }
        .occ-item { position: relative; display: flex; align-items: center; gap: 10px; padding: 9px 8px; border-radius: 8px; cursor: pointer; transition: background .15s; }
        .occ-item:hover { background: rgba(0,0,0,.04); }
        .occ-item input { position: absolute; opacity: 0; width: 0; height: 0; }
        .occ-box { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid rgba(0,0,0,.25); display: grid; place-items: center; color: #fff; flex: 0 0 auto; transition: background .15s, border-color .15s; }
        .occ-item input:checked + .occ-box { background: #16181D; border-color: #16181D; }
        .occ-item input:focus-visible + .occ-box { outline: 2px solid #16181D; outline-offset: 2px; }
        .occ-label { flex: 1; font-size: 14px; color: #374151; }
        .occ-count { font-family: var(--font-mono), monospace; font-size: 12px; color: #9CA3AF; }
        .occ-clear { margin-top: 10px; background: none; border: none; color: #16181D; font-weight: 600; font-size: 13px; text-decoration: underline; padding: 4px 8px; }

        /* ── skeleton job cards ── */
        .sk-card { padding: 22px; }
        .sk-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .sk-stack { display: flex; flex-direction: column; gap: 8px; }
        .sk-logo { width: 44px; height: 44px; border-radius: 12px; flex: 0 0 auto; }
        .sk-pills { display: flex; gap: 8px; margin-top: 18px; }
        .skeleton { display: inline-block; }

        /* ── job card + entrance animation ── */
        .results { display: flex; flex-direction: column; gap: 16px; }
        .job-card { animation: cardIn .5s cubic-bezier(.22,1,.36,1) both; transition: transform .18s, box-shadow .2s, border-color .2s; }
        .job-card:hover { transform: translateY(-3px) scale(1.005); box-shadow: 0 10px 28px rgba(0,0,0,.07); border-color: rgba(0,0,0,.2); }
        @keyframes cardIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
        .job-head { display: flex; justify-content: space-between; align-items: start; gap: 12px; }
        .job-role { font-family: var(--font-grotesk), sans-serif; font-weight: 600; font-size: 20px; letter-spacing: -.01em; }
        .job-company { color: #6B7280; font-size: 15px; margin-top: 2px; }
        .logo { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-family: var(--font-grotesk), sans-serif; font-weight: 700; font-size: 20px; flex: 0 0 auto; color: #16181D; background: rgba(0,0,0,.06); transition: transform .2s; }
        .job-card:hover .logo { transform: rotate(-4deg) scale(1.05); }
        .tag-row { display: flex; align-items: center; gap: 10px; margin: 12px 0; flex-wrap: wrap; }
        .tag-new { font-size: 12px; font-weight: 600; color: #16181D; background: rgba(0,0,0,.08); padding: 2px 10px; border-radius: 9999px; }
        .job-meta { font-size: 13px; }
        .highlights { list-style: none; display: flex; flex-direction: column; gap: 5px; margin: 4px 0 14px; }
        .highlights li { font-size: 14px; color: #374151; padding-left: 18px; position: relative; }
        .highlights li::before { content: "·"; position: absolute; left: 6px; color: #9CA3AF; }
        .pill-row { display: flex; flex-wrap: wrap; gap: 8px; }
        .pill { font-family: var(--font-mono), monospace; font-size: 12px; padding: 4px 10px; border-radius: 9999px; background: rgba(0,0,0,.06); color: #16181D; transition: transform .15s, background .15s; }
        .pill:hover { transform: scale(1.07); background: rgba(0,0,0,.1); }

        .job-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(0,0,0,.08); flex-wrap: wrap; }
        .posted { font-size: 12px; }
        .actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .act { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #6B7280; background: none; border: 1px solid rgba(0,0,0,.14); padding: 6px 12px; border-radius: 9999px; transition: transform .15s, color .2s, border-color .2s, background .2s; }
        .act:hover { transform: translateY(-1px); color: #16181D; border-color: #16181D; }
        .act[data-on="true"] { color: #16181D; border-color: #16181D; background: rgba(0,0,0,.06); }
        .act-cta { color: #16181D; border-color: #16181D; }
        .act-cta:hover { background: #16181D; color: #fff; }

        /* ── sidebar ── */
        .sidebar { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 88px; }
        .side-card { padding: 22px; transition: transform .18s, box-shadow .2s; }
        .side-card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(0,0,0,.06); }
        .cv-card { border-color: rgba(0,0,0,.2); background: rgba(0,0,0,.03); }
        .side-title { font-family: var(--font-grotesk), sans-serif; font-weight: 600; font-size: 17px; }
        .side-text { font-size: 14px; line-height: 1.55; margin-top: 8px; }
        .side-btn { display: inline-block; margin-top: 16px; text-align: center; }
        .saved-list { list-style: none; margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
        .saved-item { font-size: 14px; font-weight: 500; }

        @media (max-width: 1080px) {
          .layout { grid-template-columns: 1fr 260px; }
          .occ-col { display: none; } /* top category row still filters by field */
        }
        @media (max-width: 860px) {
          .layout { grid-template-columns: 1fr; }
          .sidebar { position: static; }
        }
      `}</style>
    </>
  );
}
