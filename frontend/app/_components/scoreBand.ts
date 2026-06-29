/* ONE colour-band system, used by the ring, bars, best-fit numbers and the
   history table so the whole app reads a score the same way. Returns CSS vars
   defined in globals.css (:root). */

export type Band = { key: "high" | "mid" | "low"; color: string; rgb: string };

export function scoreBand(score: number): Band {
  if (score >= 70) return { key: "high", color: "var(--band-high)", rgb: "var(--band-high-rgb)" };
  if (score >= 50) return { key: "mid", color: "var(--band-mid)", rgb: "var(--band-mid-rgb)" };
  return { key: "low", color: "var(--band-low)", rgb: "var(--band-low-rgb)" };
}
