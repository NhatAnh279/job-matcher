"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MagnifyingGlass, MapPin, CaretDown, Star, X, Check, Funnel, Stack, Brain, ChartBar, ChartPieSlice, Code, Cloud, PenNib, Megaphone, Wallet, ArrowRight } from "@phosphor-icons/react";
import api from "@/lib/api";
import AppHeader from "../_components/AppHeader";
import TiltCard from "../_components/TiltCard";
import JobLetter from "../_components/JobLetter";
import { useToast } from "../_components/ToastProvider";
import { useRequireAuth } from "../_components/useRequireAuth";

/* ════════════════════════════════════════════════════════════════
   1. CONFIG + MOCK DATA
   ════════════════════════════════════════════════════════════════ */
const ACCENT = "#7f77dd"; // one purple accent, matches the landing
const SLOGAN = "Find the job you actually match…";

const ROLE_SUGGESTIONS = ["Data Scientist", "Data Analyst", "ML Engineer", "BI Analyst", "Python", "SQL", "Power BI"];
const LOC_SUGGESTIONS = ["Sydney NSW", "Melbourne VIC", "Brisbane QLD", "Remote"];

// What the cards render — only fields the backend actually provides.
type Job = {
  id: string;
  role: string;
  company: string;
  location: string;
  type: string;            // employment type from badges: "Full time" / "Contract"...
  arrangement: string;     // work style from badges: "Hybrid" / "Remote" / ""
  salary: string;          // pay from badges, e.g. "$105,212 - $113,823 a year" / ""
  source: string;          // Seek / Jora
  posted: string;          // e.g. "Posted 4d ago"
  description: string;     // full JD text from the backend
  url?: string;
};

// Exact shape returned by GET /api/jobs — raw records from jobs.json.
// The backend does NOT provide job_id, skills, or working_type.
type ApiJob = {
  title: string;
  company: string;
  location: string;
  badges?: string[];       // e.g. ["Full time"] / ["Part time"] — employment type
  posted_at: string;
  url: string;
  description?: string;
  source: string;          // "seek" | "jora"
};

// "jora" -> "Jora", "seek" -> "Seek"
function titleCase(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/* `badges` mixes three unrelated tags — pay, work arrangement, and employment
   type — in no fixed order (e.g. ["$105k - $113k a year", "Full time", "Hybrid"]).
   Split them so each shows correctly and the Type filter isn't fed a salary. */
const SALARY_RE = /\$|\d,\d{3}/;
const ARRANGEMENT_RE = /\b(hybrid|remote|on[-\s]?site|work from home|wfh)\b/i;
const EMP_RE = /\b(full[-\s]?time|part[-\s]?time|casual|contract|permanent|fixed[-\s]?term|temporary|internship|graduate)\b/i;

function parseBadges(badges: string[] = []): { type: string; arrangement: string; salary: string } {
  let type = "", arrangement = "", salary = "";
  for (const b of badges) {
    if (!salary && SALARY_RE.test(b)) salary = b;
    else if (!arrangement && ARRANGEMENT_RE.test(b)) arrangement = b;
    else if (!type && EMP_RE.test(b)) type = b;
  }
  return { type, arrangement, salary };
}

// "$105,212 - $113,823 a year" -> "$105k–114k" for the compact card chip.
function formatSalary(s: string): string {
  const nums = s.match(/\d[\d,]*/g);
  if (!nums) return s;
  const toK = (n: string) => {
    const v = parseInt(n.replace(/,/g, ""), 10);
    return v >= 1000 ? `${Math.round(v / 1000)}k` : `${v}`;
  };
  return nums.length >= 2 ? `$${toK(nums[0])}–${toK(nums[1])}` : `$${toK(nums[0])}`;
}

// Map a backend job onto the shape the cards render.
function fromApi(j: ApiJob): Job {
  const { type, arrangement, salary } = parseBadges(j.badges);
  return {
    id: j.url,                     // no job_id from backend; the URL is the stable key
    role: j.title,
    company: j.company,
    location: j.location,
    type,
    arrangement,
    salary,
    source: titleCase(j.source),
    posted: j.posted_at,
    description: j.description ?? "",
    url: j.url,
  };
}

// Offline fallback only — same shape as the real backend records.
const MOCK_JOBS: Job[] = [
  {
    id: "mock-1", role: "Data Scientist", company: "Canva", location: "Sydney NSW",
    type: "Full time", arrangement: "Hybrid", salary: "$120,000 - $145,000 a year",
    source: "Seek", posted: "Posted 1d ago",
    description: "Work on recommendation models with Python and SQL in a flexible hybrid setup.",
  },
  {
    id: "mock-2", role: "Data Analyst", company: "Atlassian", location: "Remote",
    type: "Full time", arrangement: "Remote", salary: "",
    source: "Jora", posted: "Posted 2d ago",
    description: "Own the analytics stack end to end: SQL, Tableau, and stakeholder reporting.",
  },
  {
    id: "mock-3", role: "ML Engineer", company: "Airwallex", location: "Melbourne VIC",
    type: "Full time", arrangement: "", salary: "",
    source: "Seek", posted: "Posted 3d ago",
    description: "Ship ML models to production with Python, Docker, and AWS at a fast-growing fintech.",
  },
];

/* ── Occupation fields: the category cards (top row) + occupation checkboxes
   (left column) both filter on this dimension. Each job is bucketed by role. ── */
const FIELDS = [
  { key: "Data Science & ML",     icon: Brain },
  { key: "Data & Analytics",      icon: ChartBar },
  { key: "Business Intelligence", icon: ChartPieSlice },
  { key: "Engineering",           icon: Code },
  { key: "Cloud & DevOps",        icon: Cloud },
  { key: "Product & Design",      icon: PenNib },
  { key: "Marketing & Growth",    icon: Megaphone },
  { key: "Finance & Operations",  icon: Wallet },
] as const;

function fieldOf(job: Job): string {
  const r = job.role.toLowerCase();
  if (r.includes("scientist") || r.includes("machine learning") || r.includes("ml ") || r.startsWith("ml") || r.includes("ai ")) return "Data Science & ML";
  if (r.includes("devops") || r.includes("sre") || r.includes("platform") || r.includes("cloud") || r.includes("infrastructure")) return "Cloud & DevOps";
  if (r.includes("bi ") || r.includes("business intelligence") || r.includes("power bi")) return "Business Intelligence";
  if (r.includes("design") || r.includes("ux") || r.includes("ui ") || r.includes("product manager") || r.includes("product owner")) return "Product & Design";
  if (r.includes("market") || r.includes("growth") || r.includes("seo") || r.includes("content")) return "Marketing & Growth";
  if (r.includes("finance") || r.includes("account") || r.includes("operations")) return "Finance & Operations";
  if (r.includes("analyst")) return "Data & Analytics";
  if (r.includes("engineer") || r.includes("developer") || r.includes("programmer")) return "Engineering";
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
              style={o === value ? { background: "rgba(127,119,221,.16)", fontWeight: 600 } : undefined}
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

  // dropdown filters (index 0 of each = "any") — only dimensions the backend
  // data actually carries: employment type (badges) and source (seek/jora).
  const [empType, setEmpType] = useState("Any type");
  const [source, setSource] = useState("All sources");

  // occupation-field filter (top category cards + left checkbox column)
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  // per-job actions
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [openJob, setOpenJob] = useState<Job | null>(null); // job shown in the letter modal

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

  // Build the querystring from the params the backend actually supports: q,
  // location, source. (There is no working_type / limit on the backend.)
  function buildQuery(): string {
    const p = new URLSearchParams();
    if (keyword) p.set("q", keyword);
    if (location) p.set("location", location);
    return p.toString() ? `?${p.toString()}` : "";
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

  // Apply every filter — all on fields the backend really returns. Everything
  // except the occupation-field filter, so the field counts below reflect the
  // current search but not the field selection itself.
  const baseFiltered = jobs.filter((j) => {
    if (hidden.has(j.id)) return false;
    const inKw = `${j.role} ${j.company} ${j.description}`.toLowerCase().includes(keyword.toLowerCase());
    const inLoc = j.location.toLowerCase().includes(location.toLowerCase());
    const inEmp = empType === "Any type" || j.type === empType;
    const inSource = source === "All sources" || j.source === source;
    return inKw && inLoc && inEmp && inSource;
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

  // Suggestions appear only once the user starts typing — a bare click on the
  // field must not pop an extra panel over the page.
  const kwSuggestions = keyword.trim()
    ? ROLE_SUGGESTIONS.filter(
        (s) => s.toLowerCase().includes(keyword.toLowerCase()) && s.toLowerCase() !== keyword.toLowerCase()
      )
    : [];
  const locSuggestions = location.trim()
    ? LOC_SUGGESTIONS.filter(
        (s) => s.toLowerCase().includes(location.toLowerCase()) && s.toLowerCase() !== location.toLowerCase()
      )
    : [];

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
              /* "one-time-code" is a valid token with no stored data, so the
                 browser's own autofill dropdown (which ignores "off" for
                 address-looking fields) never appears over our suggestions. */
              autoComplete="one-time-code"
              autoCorrect="off"
              spellCheck={false}
              role="combobox"
              aria-expanded={focus === "kw" && kwSuggestions.length > 0}
              aria-autocomplete="list"
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
              /* The "Suburb, city, or region" placeholder makes Chrome treat
                 this as an address field and pop its own autofill list even
                 with autocomplete="off" — "one-time-code" suppresses it. */
              autoComplete="one-time-code"
              autoCorrect="off"
              spellCheck={false}
              role="combobox"
              aria-expanded={focus === "loc" && locSuggestions.length > 0}
              aria-autocomplete="list"
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

        {/* ── dropdown filters — employment type (badges) + source, both real ── */}
        <div className="filters">
          <Dropdown label="Type" value={empType} onChange={setEmpType} options={["Any type", "Full time", "Part time", "Contract", "Permanent", "Casual"]} />
          <Dropdown label="Source" value={source} onChange={setSource} options={["All sources", "Seek", "Jora"]} />
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
                  <TiltCard key={job.id} className="card job-card" index={i}>
                    <div
                      className="job-open"
                      role="button"
                      tabIndex={0}
                      aria-haspopup="dialog"
                      onClick={() => setOpenJob(job)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenJob(job); } }}
                    >
                      <div className="job-head">
                        <div>
                          <h3 className="job-role">{job.role}</h3>
                          <p className="job-company">{job.company}</p>
                        </div>
                        <span className="logo">{job.company[0]}</span>
                      </div>

                      <div className="tag-row">
                        <span className="muted mono job-meta">
                          {[job.type, job.arrangement, job.location].filter(Boolean).join(" · ")}
                        </span>
                        {job.salary && <span className="salary-chip mono">{formatSalary(job.salary)}</span>}
                      </div>

                      <span className="open-hint">
                        Open full details <ArrowRight size={14} weight="bold" className="oh-arrow" />
                      </span>
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
                          href={`/match?job_url=${encodeURIComponent(job.url ?? job.id)}&role=${encodeURIComponent(job.role)}`}
                          className="act act-cta"
                        >
                          Match my resume →
                        </Link>
                      </div>
                    </div>
                  </TiltCard>
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

      <JobLetter job={openJob} onClose={() => setOpenJob(null)} />

      <style>{`
        .band, .wrap { font-family: var(--font-sans), sans-serif; }

        /* ── search band ── */
        /* backdrop-filter makes .band its own stacking context, so it needs an
           explicit z-index or the suggestion panels get painted UNDER the
           category icons / sticky columns that come later in the DOM. */
        .band { position: relative; z-index: 10; background: rgba(20,19,28,.6); border-bottom: 1px solid var(--hairline); backdrop-filter: blur(8px); }
        .band-inner { max-width: 1100px; margin: 0 auto; padding: 20px 24px; display: flex; gap: 12px; flex-wrap: wrap; }
        .field { position: relative; flex: 1; min-width: 200px; display: flex; align-items: center; gap: 8px; padding: 0 14px; border: 1px solid var(--hairline); border-radius: 10px; background: var(--surface); transition: border-color .2s, box-shadow .2s; }
        .field:focus-within { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(127,119,221,.14); }
        /* the wrapper .field shows focus; kill the input's own outline so we
           don't get a second bright frame inside (overrides globals.css). */
        .inp:focus, .inp:focus-visible { outline: none; }
        .ic { color: var(--muted); font-size: 18px; }
        .ic-sm { color: var(--muted); font-size: 14px; margin-right: 8px; }
        .inp { flex: 1; border: none; outline: none; font-family: var(--font-sans), sans-serif; font-size: 15px; padding: 12px 0; background: transparent; color: var(--ink); }
        .inp::placeholder { color: var(--muted); }
        .search-btn { background: var(--accent); color: #fff; font-family: var(--font-sans), sans-serif; font-weight: 600; font-size: 15px; border: none; border-radius: 10px; padding: 0 28px; transition: transform .15s, box-shadow .2s, background .2s; }
        .search-btn:hover { transform: translateY(-1px) scale(1.02); background: #938ce4; box-shadow: 0 6px 18px rgba(127,119,221,.4); }

        /* suggestions — one clean panel attached right under the field */
        .sugg {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0;
          background: var(--surface-2); border: 1px solid var(--accent-line);
          border-radius: 12px; box-shadow: var(--shadow-lg);
          padding: 6px; z-index: 50; max-height: 240px; overflow-y: auto;
          animation: pop .14s ease;
        }
        .sugg-opt { display: flex; align-items: center; width: 100%; text-align: left; font-size: 14px; padding: 9px 10px; border: none; background: none; border-radius: 8px; color: var(--ink); transition: background .15s; }
        .sugg-opt:hover { background: rgba(127,119,221,.14); }
        @keyframes pop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }

        /* ── layout ── */
        .wrap { max-width: 1100px; margin: 0 auto; padding: 24px 24px 80px; }
        .filters { display: flex; gap: 10px; margin-bottom: 22px; flex-wrap: wrap; }
        .dd { position: relative; }
        .dd-btn { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--muted); background: var(--surface); border: 1px solid var(--hairline); padding: 9px 16px; border-radius: 9999px; transition: transform .15s, border-color .2s, background .2s, color .2s; }
        .dd-btn:hover { transform: translateY(-1px); border-color: var(--accent); color: var(--ink); background: rgba(127,119,221,.08); }
        .dd-caret { font-size: 11px; transition: transform .2s; }
        .dd-menu { position: absolute; top: calc(100% + 8px); left: 0; min-width: 180px; background: var(--surface-2); border: 1px solid var(--hairline); border-radius: 12px; box-shadow: var(--shadow-md); padding: 6px; z-index: 30; animation: pop .14s ease; }
        .dd-opt { display: block; width: 100%; text-align: left; font-size: 14px; padding: 9px 12px; border: none; background: none; border-radius: 8px; color: var(--ink); transition: background .15s; }
        .dd-opt:hover { background: rgba(127,119,221,.14); }

        .hidden-note { font-size: 13px; color: var(--muted); margin-bottom: 16px; }
        .link-btn { background: none; border: none; color: var(--accent-bright); font-weight: 600; font-size: 13px; text-decoration: underline; }

        .layout { display: grid; grid-template-columns: 200px 1fr 280px; gap: 22px; align-items: start; }
        .state { padding: 30px 0; }

        /* ── first row: category cards ── */
        .cat-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 22px; scrollbar-width: thin; }
        .cat { flex: 0 0 auto; width: 108px; display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px 10px; background: var(--surface); border: 1px solid var(--hairline); border-radius: 14px; cursor: pointer; transition: transform .15s, border-color .2s, background .2s; }
        .cat:hover { transform: translateY(-2px); border-color: var(--accent); }
        .cat-on { border-color: var(--accent); background: rgba(127,119,221,.12); }
        .cat-ic { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; background: rgba(127,119,221,.12); color: var(--accent-bright); transition: background .2s, color .2s; }
        .cat-on .cat-ic { background: var(--accent); color: #fff; }
        .cat-label { font-size: 12px; font-weight: 600; text-align: center; line-height: 1.3; color: var(--muted); }
        .cat-on .cat-label { color: var(--ink); }

        /* ── first column: occupation checkboxes ── */
        .occ-col { position: sticky; top: 88px; }
        .occ-head { display: flex; align-items: center; gap: 8px; font-family: var(--font-grotesk), sans-serif; font-weight: 600; font-size: 15px; margin-bottom: 12px; color: var(--ink); }
        .occ-list { list-style: none; display: flex; flex-direction: column; gap: 2px; }
        .occ-item { position: relative; display: flex; align-items: center; gap: 10px; padding: 9px 8px; border-radius: 8px; cursor: pointer; transition: background .15s; }
        .occ-item:hover { background: rgba(127,119,221,.08); }
        .occ-item input { position: absolute; opacity: 0; width: 0; height: 0; }
        .occ-box { width: 18px; height: 18px; border-radius: 5px; border: 1.5px solid rgba(127,119,221,.4); display: grid; place-items: center; color: #fff; flex: 0 0 auto; transition: background .15s, border-color .15s; }
        .occ-item input:checked + .occ-box { background: var(--accent); border-color: var(--accent); }
        .occ-item input:focus-visible + .occ-box { outline: 2px solid var(--accent-bright); outline-offset: 2px; }
        .occ-label { flex: 1; font-size: 14px; color: var(--muted); }
        .occ-count { font-family: var(--font-mono), monospace; font-size: 12px; color: var(--muted); }
        .occ-clear { margin-top: 10px; background: none; border: none; color: var(--accent-bright); font-weight: 600; font-size: 13px; text-decoration: underline; padding: 4px 8px; }

        /* ── skeleton job cards ── */
        .sk-card { padding: 22px; }
        .sk-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
        .sk-stack { display: flex; flex-direction: column; gap: 8px; }
        .sk-logo { width: 44px; height: 44px; border-radius: 12px; flex: 0 0 auto; }
        .sk-pills { display: flex; gap: 8px; margin-top: 18px; }
        .skeleton { display: inline-block; }

        /* ── job card + entrance animation ── */
        .results { display: flex; flex-direction: column; gap: 16px; }
        .job-card { transition: box-shadow .25s, border-color .25s, transform .25s; }
        .job-card:hover { transform: translateY(-4px); box-shadow: 0 18px 40px rgba(127,119,221,.16); border-color: var(--accent-line); }
        .job-head { display: flex; justify-content: space-between; align-items: start; gap: 12px; }
        .job-role { font-family: var(--font-grotesk), sans-serif; font-weight: 600; font-size: 20px; letter-spacing: -.01em; color: var(--ink); }
        .job-company { color: var(--muted); font-size: 15px; margin-top: 2px; }
        .logo { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; font-family: var(--font-grotesk), sans-serif; font-weight: 700; font-size: 20px; flex: 0 0 auto; color: var(--accent-bright); background: rgba(127,119,221,.14); transition: transform .2s; }
        .job-card:hover .logo { transform: rotate(-4deg) scale(1.05); }
        .tag-row { display: flex; align-items: center; gap: 10px; margin: 12px 0; flex-wrap: wrap; }
        .job-meta { font-size: 13px; }
        .salary-chip {
          font-size: 12px; font-weight: 600; color: var(--accent-bright);
          background: rgba(127,119,221,.14); border: 1px solid var(--accent-line);
          padding: 3px 10px; border-radius: 9999px; white-space: nowrap;
        }

        /* ── the whole upper card opens the job letter ── */
        .job-open { display: block; width: 100%; text-align: left; background: none; border: none; cursor: pointer; border-radius: 10px; }
        .job-open:focus-visible { outline: 2px solid var(--accent-bright); outline-offset: 4px; }
        .open-hint {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 6px;
          font-size: 13px; font-weight: 600; color: var(--accent-bright);
          transition: gap .2s ease;
        }
        .oh-arrow { transition: transform .2s ease; }
        .job-card:hover .open-hint { gap: 9px; }
        .job-card:hover .oh-arrow { transform: translateX(3px); }

        .job-foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--hairline); flex-wrap: wrap; }
        .posted { font-size: 12px; }
        .actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .act { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--muted); background: none; border: 1px solid var(--hairline); padding: 6px 12px; border-radius: 9999px; transition: transform .15s, color .2s, border-color .2s, background .2s; }
        .act:hover { transform: translateY(-1px); color: var(--ink); border-color: var(--accent); }
        .act[data-on="true"] { color: var(--accent-bright); border-color: var(--accent); background: rgba(127,119,221,.14); }
        .act-cta { color: var(--accent-bright); border-color: var(--accent); }
        .act-cta:hover { background: var(--accent); color: #fff; }

        /* ── sidebar ── */
        .sidebar { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 88px; }
        .side-card { padding: 22px; transition: transform .18s, box-shadow .2s; }
        .side-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .cv-card { border-color: var(--accent-line); background: rgba(127,119,221,.08); }
        .side-title { font-family: var(--font-grotesk), sans-serif; font-weight: 600; font-size: 17px; color: var(--ink); }
        .side-text { font-size: 14px; line-height: 1.55; margin-top: 8px; }
        .side-btn { display: inline-block; margin-top: 16px; text-align: center; }
        .saved-list { list-style: none; margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
        .saved-item { font-size: 14px; font-weight: 500; color: var(--ink); }

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
