"use client";

/* ════════════════════════════════════════════════════════════════
   MATCH LETTER — a saved match from History opens like a letter,
   replaying everything the backend stored for that run: score,
   matched skills, missing skills, and the date. (shap impact and the
   original job_url are NOT stored in match_history, so the letter says
   so honestly and offers to run a fresh match instead.)
   Same chrome as JobLetter: portal, unfold-from-top, Esc/backdrop.
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, Check, ArrowRight, CalendarBlank, Buildings } from "@phosphor-icons/react";
import ScoreArc from "./ScoreArc";
import { scoreBand } from "./scoreBand";

export type MatchEntry = {
  role: string;
  company: string;
  score: number;
  matched: string[];
  missing: string[];
  date: string;
};

export default function MatchLetter({ entry, onClose }: { entry: MatchEntry | null; onClose: () => void }) {
  const reduce = useReducedMotion();
  const sheetRef = useRef<HTMLDivElement>(null);
  const open = entry !== null;

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

  const band = entry ? scoreBand(entry.score) : null;
  const bandLabel = entry
    ? entry.score >= 70 ? "Strong match" : entry.score >= 50 ? "Partial match" : "Weak match"
    : "";
  const takeaway = entry
    ? entry.score >= 70
      ? "You're a strong fit. Worth applying."
      : entry.score >= 50
        ? "A partial fit. Closing a couple of gaps would lift this."
        : "A stretch for now. Focus on the missing skills first."
    : "";

  const sheetVariants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        hidden: { opacity: 0, y: -18, scale: 0.96, rotateX: -14 },
        show: { opacity: 1, y: 0, scale: 1, rotateX: 0 },
        exit: { opacity: 0, y: -12, scale: 0.97, rotateX: -8 },
      };

  return createPortal(
    <AnimatePresence>
      {open && entry && band && (
        <motion.div
          className="ml-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            ref={sheetRef}
            className="ml-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={`Match result: ${entry.role} at ${entry.company}, scored ${entry.score}`}
            tabIndex={-1}
            variants={sheetVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="ml-close" onClick={onClose} aria-label="Close">
              <X size={16} weight="bold" />
            </button>

            {/* letterhead */}
            <header className="ml-head">
              <span className="ml-seal" aria-hidden>{entry.company[0]}</span>
              <div>
                <p className="ml-eyebrow mono">Saved match</p>
                <h2 className="ml-role">{entry.role}</h2>
                <p className="ml-company">{entry.company}</p>
              </div>
            </header>

            <dl className="ml-fields">
              <div className="ml-field"><Buildings size={15} /><dt>Company</dt><dd>{entry.company}</dd></div>
              <div className="ml-field"><CalendarBlank size={15} /><dt>Matched</dt><dd>{entry.date}</dd></div>
            </dl>

            <div className="ml-crease" aria-hidden />

            {/* the replayed result: ring + skills, same vocabulary as /match */}
            <div className="ml-result">
              <div className="ml-ring">
                <ScoreArc
                  value={entry.score}
                  size={150}
                  thickness={12}
                  accentColor={band.color}
                  ariaLabel={`Match score ${entry.score} out of 100`}
                />
                <span className="band-tag mono" style={{ color: band.color, background: `rgba(${band.rgb}, 0.12)` }}>
                  {bandLabel}
                </span>
              </div>

              <div className="ml-skills">
                <div className="skill-card">
                  <p className="card-label">You have · {entry.matched.length}</p>
                  {entry.matched.length === 0 && <p className="ml-none">None recorded</p>}
                  {entry.matched.map((s) => (
                    <div key={s} className="srow have">
                      <span className="badge ok"><Check size={12} weight="bold" /></span> {s}
                    </div>
                  ))}
                </div>
                <div className="skill-card">
                  <p className="card-label">Missing · {entry.missing.length}</p>
                  {entry.missing.length === 0 && <p className="ml-none">None recorded</p>}
                  {entry.missing.map((s) => (
                    <div key={s} className="srow miss">
                      <span className="badge no"><X size={12} weight="bold" /></span> {s}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="ml-take">{takeaway}</p>

            {/* honest note: what history doesn't keep */}
            <p className="ml-note mono">
              Skill-impact breakdown isn&apos;t saved with history — run a fresh match to see it.
            </p>

            <footer className="ml-foot">
              <Link href="/jobs" className="btn btn-primary ml-cta">
                Run a fresh match <ArrowRight size={16} weight="bold" />
              </Link>
              <button className="btn btn-ghost" onClick={onClose}>Close</button>
            </footer>
          </motion.div>

          <style>{`
            .ml-backdrop {
              position: fixed; inset: 0; z-index: 100;
              display: grid; place-items: center; padding: 24px;
              background: rgba(6, 5, 12, 0.72); backdrop-filter: blur(6px);
            }
            .ml-sheet {
              position: relative; width: min(94vw, 640px); max-height: 88vh; overflow-y: auto;
              background:
                linear-gradient(180deg, rgba(127,119,221,.07), transparent 120px),
                var(--surface-2);
              border: 1px solid var(--accent-line); border-radius: 18px;
              padding: 30px 30px 26px;
              box-shadow: 0 40px 90px -20px rgba(0,0,0,.7), 0 0 0 1px rgba(127,119,221,.08),
                          0 20px 60px -24px rgba(127,119,221,.5);
              transform-origin: top center; outline: none; scrollbar-width: thin;
            }
            .ml-sheet::before {
              content: ""; position: absolute; top: 0; left: 26px; right: 26px; height: 2px;
              background: linear-gradient(90deg, transparent, var(--accent), transparent); opacity: .6;
            }
            .ml-close {
              position: absolute; top: 16px; right: 16px; z-index: 2;
              width: 34px; height: 34px; display: grid; place-items: center;
              border-radius: 9999px; border: 1px solid var(--hairline);
              background: rgba(127,119,221,.10); color: var(--muted);
              transition: color .2s, background .2s, transform .2s;
            }
            .ml-close:hover { color: var(--ink); background: rgba(127,119,221,.2); transform: rotate(90deg); }

            .ml-head { display: flex; gap: 16px; align-items: flex-start; padding-right: 40px; }
            .ml-seal {
              flex: 0 0 auto; width: 52px; height: 52px; border-radius: 14px;
              display: grid; place-items: center;
              font-family: var(--font-grotesk), sans-serif; font-weight: 700; font-size: 24px;
              color: var(--accent-bright); background: rgba(127,119,221,.16);
              border: 1px solid var(--accent-line);
            }
            .ml-eyebrow { font-size: 11px; letter-spacing: .12em; text-transform: uppercase; color: var(--accent-bright); }
            .ml-role { font-family: var(--font-grotesk), sans-serif; font-weight: 700; font-size: clamp(21px, 4vw, 26px); letter-spacing: -.01em; color: var(--ink); margin-top: 4px; line-height: 1.15; text-wrap: balance; }
            .ml-company { font-size: 15px; color: var(--muted); margin-top: 4px; }

            .ml-fields { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
            .ml-field {
              display: inline-flex; align-items: center; gap: 8px;
              padding: 8px 14px; border-radius: 10px;
              background: rgba(127,119,221,.08); border: 1px solid var(--hairline);
              color: var(--muted); font-size: 13px;
            }
            .ml-field svg { color: var(--accent-bright); flex: 0 0 auto; }
            .ml-field dt { font-family: var(--font-mono), monospace; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }
            .ml-field dd { color: var(--ink); font-weight: 600; }

            .ml-crease { height: 1px; margin: 22px 0; background: repeating-linear-gradient(90deg, var(--hairline) 0 6px, transparent 6px 12px); }

            .ml-result { display: grid; grid-template-columns: auto 1fr; gap: 22px; align-items: center; }
            .ml-ring { display: flex; flex-direction: column; align-items: center; gap: 12px; }
            .ml-skills { display: flex; gap: 12px; align-items: stretch; }
            .ml-skills .skill-card { min-width: 0; }
            .ml-none { font-size: 13px; color: var(--muted); font-style: italic; }

            .ml-take { font-size: 15px; color: var(--ink); margin-top: 20px; }
            .ml-note { font-size: 11px; color: var(--muted); margin-top: 8px; }

            .ml-foot {
              position: sticky; bottom: -26px; margin: 22px -30px -26px; padding: 18px 30px;
              display: flex; gap: 12px; flex-wrap: wrap;
              background: linear-gradient(180deg, transparent, var(--surface-2) 40%);
              border-top: 1px solid var(--hairline);
            }
            .ml-cta { flex: 1; min-width: 200px; }

            @media (max-width: 620px) {
              .ml-result { grid-template-columns: 1fr; justify-items: center; }
              .ml-skills { width: 100%; flex-direction: column; }
            }
            @media (prefers-reduced-motion: reduce) {
              .ml-backdrop { backdrop-filter: none; }
              .ml-close:hover { transform: none; }
            }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
