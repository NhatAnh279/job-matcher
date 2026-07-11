"use client";

/* ════════════════════════════════════════════════════════════════
   JOB LETTER — a job opens like a letter. Portal modal (escapes the
   card's tilt/overflow context) that unfolds from the top, shows the
   FULL backend record for one job, and highlights the skills mentioned
   in the description. Esc / backdrop / focus-trap-lite / scroll-lock.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ArrowRight, MapPin, Clock, Buildings, House, CurrencyDollar } from "@phosphor-icons/react";

export type LetterJob = {
  id: string;
  role: string;
  company: string;
  location: string;
  type: string;
  arrangement: string;
  salary: string;
  source: string;
  posted: string;
  description: string;
  url?: string;
};

/* Skills we can recognise in a JD — highlighted so the wall of text reads as
   "here's what they want". Same vocabulary the backend's extractor works from. */
const JD_SKILLS = [
  "Power BI", "Tableau", "Looker", "Qlik", "Alteryx", "Google Analytics", "Salesforce",
  "Machine Learning", "Data Modelling", "Data Modeling", "Data Visualisation", "Data Visualization",
  "Snowflake", "Databricks", "Spark", "Azure", "AWS", "GCP", "Reporting", "Dashboards",
  "Stakeholder", "Communication", "Analytics", "Statistics", "Forecasting", "Governance",
  "Python", "Excel", "SQL", "VBA", "SAS", "DAX", "ETL", "R",
];
const SKILL_RE = new RegExp(
  `\\b(${[...JD_SKILLS]
    .sort((a, b) => b.length - a.length)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")})\\b`,
  "gi",
);
function highlightSkills(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  SKILL_RE.lastIndex = 0;
  while ((m = SKILL_RE.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<mark key={key++} className="jl-skill">{m[0]}</mark>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function JobLetter({ job, onClose }: { job: LetterJob | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);
  const open = job !== null;

  // Esc to close + lock body scroll while open + move focus into the sheet.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => sheetRef.current?.focus(), 40);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  // Letter "unfold": hinge open from the top edge. Crossfade under reduced motion.
  const sheetVariants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        hidden: { opacity: 0, y: -18, scale: 0.96, rotateX: -14 },
        show: { opacity: 1, y: 0, scale: 1, rotateX: 0 },
        exit: { opacity: 0, y: -12, scale: 0.97, rotateX: -8 },
      };

  return createPortal(
    <AnimatePresence>
      {open && job && (
        <motion.div
          className="jl-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={sheetRef}
            className="jl-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`${job.role} at ${job.company}`}
            tabIndex={-1}
            variants={sheetVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="jl-close" onClick={onClose} aria-label="Close">
              <X size={16} weight="bold" />
            </button>

            {/* letterhead: wax-seal monogram + who this is about */}
            <header className="jl-head">
              <span className="jl-seal" aria-hidden>{job.company[0]}</span>
              <div className="jl-headtext">
                <p className="jl-eyebrow mono">The role · {job.source}</p>
                <h2 className="jl-role">{job.role}</h2>
                <p className="jl-company">{job.company}</p>
              </div>
            </header>

            {/* header fields, letter-style */}
            <dl className="jl-fields">
              {job.type && <div className="jl-field"><Buildings size={15} /><dt>Type</dt><dd>{job.type}</dd></div>}
              {job.arrangement && <div className="jl-field"><House size={15} /><dt>Work style</dt><dd>{job.arrangement}</dd></div>}
              {job.salary && <div className="jl-field jl-field-pay"><CurrencyDollar size={15} /><dt>Pay</dt><dd>{job.salary}</dd></div>}
              <div className="jl-field"><MapPin size={15} /><dt>Location</dt><dd>{job.location}</dd></div>
              <div className="jl-field"><Clock size={15} /><dt>Posted</dt><dd>{job.posted}</dd></div>
            </dl>

            <div className="jl-crease" aria-hidden />

            {/* body: the full description, skills highlighted in place */}
            <section className="jl-bodywrap">
              <p className="jl-kicker mono">What they&apos;re looking for</p>
              {job.description
                ? <p className="jl-body">{highlightSkills(job.description)}</p>
                : <p className="jl-body jl-empty">No description provided for this role.</p>}
            </section>

            <footer className="jl-foot">
              <Link
                href={`/match?job_url=${encodeURIComponent(job.url ?? job.id)}&role=${encodeURIComponent(job.role)}`}
                className="btn btn-primary jl-cta"
              >
                Match my resume <ArrowRight size={16} weight="bold" />
              </Link>
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
            </footer>
          </motion.div>

          <style>{`
            .jl-backdrop {
              position: fixed; inset: 0; z-index: 100;
              display: grid; place-items: center; padding: 24px;
              background: rgba(6, 5, 12, 0.72); backdrop-filter: blur(6px);
            }
            .jl-sheet {
              position: relative; width: min(94vw, 620px); max-height: 88vh; overflow-y: auto;
              background:
                linear-gradient(180deg, rgba(127,119,221,.07), transparent 120px),
                var(--surface-2);
              border: 1px solid var(--accent-line); border-radius: 18px;
              padding: 30px 30px 26px;
              box-shadow: 0 40px 90px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(127,119,221,.08),
                          0 20px 60px -24px rgba(127,119,221,.5);
              transform-origin: top center; outline: none;
              scrollbar-width: thin;
            }
            /* the "sealed edge" of the letter along the very top */
            .jl-sheet::before {
              content: ""; position: absolute; top: 0; left: 26px; right: 26px; height: 2px;
              background: linear-gradient(90deg, transparent, var(--accent), transparent); opacity: .6;
            }
            .jl-close {
              position: absolute; top: 16px; right: 16px; z-index: 2;
              width: 34px; height: 34px; display: grid; place-items: center;
              border-radius: 9999px; border: 1px solid var(--hairline);
              background: rgba(127,119,221,.10); color: var(--muted);
              transition: color .2s, background .2s, transform .2s;
            }
            .jl-close:hover { color: var(--ink); background: rgba(127,119,221,.2); transform: rotate(90deg); }

            .jl-head { display: flex; gap: 16px; align-items: flex-start; padding-right: 40px; }
            .jl-seal {
              flex: 0 0 auto; width: 52px; height: 52px; border-radius: 14px;
              display: grid; place-items: center;
              font-family: var(--font-grotesk), sans-serif; font-weight: 700; font-size: 24px;
              color: var(--accent-bright); background: rgba(127,119,221,.16);
              border: 1px solid var(--accent-line);
            }
            .jl-eyebrow { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--accent-bright); }
            .jl-role { font-family: var(--font-grotesk), sans-serif; font-weight: 700; font-size: clamp(22px, 4vw, 28px); letter-spacing: -.01em; color: var(--ink); margin-top: 4px; line-height: 1.15; text-wrap: balance; }
            .jl-company { font-size: 15px; color: var(--muted); margin-top: 4px; }

            .jl-fields { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
            .jl-field {
              display: inline-flex; align-items: center; gap: 8px;
              padding: 8px 14px; border-radius: 10px;
              background: rgba(127,119,221,.08); border: 1px solid var(--hairline);
              color: var(--muted); font-size: 13px;
            }
            .jl-field svg { color: var(--accent-bright); flex: 0 0 auto; }
            .jl-field dt { font-family: var(--font-mono), monospace; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
            .jl-field dd { color: var(--ink); font-weight: 600; }
            .jl-field-pay { background: rgba(127,119,221,.16); border-color: var(--accent-line); }
            .jl-field-pay dd { color: var(--accent-bright); }

            .jl-crease { height: 1px; margin: 24px 0; background: repeating-linear-gradient(90deg, var(--hairline) 0 6px, transparent 6px 12px); }

            .jl-kicker { font-size: 10px; letter-spacing: .12em; text-transform: uppercase; color: var(--accent-bright); margin-bottom: 10px; }
            .jl-body { font-size: 15px; line-height: 1.75; color: var(--ink); white-space: pre-line; text-wrap: pretty; }
            .jl-empty { color: var(--muted); font-style: italic; }
            .jl-skill { background: rgba(127,119,221,.22); color: var(--accent-bright); padding: 1px 6px; border-radius: 5px; font-weight: 600; }

            .jl-foot {
              position: sticky; bottom: -26px; margin: 26px -30px -26px; padding: 18px 30px;
              display: flex; gap: 12px; flex-wrap: wrap;
              background: linear-gradient(180deg, transparent, var(--surface-2) 40%);
              border-top: 1px solid var(--hairline);
            }
            .jl-cta { flex: 1; min-width: 200px; }

            @media (prefers-reduced-motion: reduce) {
              .jl-backdrop { backdrop-filter: none; }
              .jl-close:hover { transform: none; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
