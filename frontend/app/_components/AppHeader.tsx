"use client";

/* ════════════════════════════════════════════════════════════════
   APP HEADER — the top bar shown on every logged-in page
   (Jobs, Match, History). The landing page has its own nav.
   The accent pill SLIDES between nav items: it rests on the active
   link and follows the hovered one (Framer Motion layoutId).
   This folder starts with "_" so Next.js does NOT treat it as a route.
   ════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import BrandMark, { type Mood } from "./BrandMark";

const LINKS = [
  { href: "/jobs",    label: "Jobs",    accent: "#2563EB" },
  { href: "/match",   label: "Match",   accent: "#0E9F6E" },
  { href: "/history", label: "History", accent: "#E11D48" },
];

export default function AppHeader({ active, mood = "idle" }: { active?: string; mood?: Mood }) {
  const router = useRouter();
  // the pill sits on the hovered link; falls back to the active route
  const [hovered, setHovered] = useState<string | null>(null);
  const pillOn = hovered ?? active;
  // the mascot dot wears the active page's accent
  const accent = LINKS.find((l) => l.href === active)?.accent ?? "#16181D";

  function logout() {
    localStorage.removeItem("token"); // clear the saved login token
    router.push("/login");
  }

  return (
    <header className="app-header">
      <Link href="/" className="brand" aria-label="Job Fit home">
        <BrandMark size={26} accent={accent} mood={mood} />
        <span className="brand-name">Job Fit</span>
      </Link>

      <nav className="app-links" onMouseLeave={() => setHovered(null)}>
        {LINKS.map((l) => {
          const isActive = active === l.href;
          const hasPill = pillOn === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className="app-link"
              onMouseEnter={() => setHovered(l.href)}
              style={{ color: isActive ? l.accent : undefined }}
            >
              {hasPill && (
                <motion.span
                  layoutId="nav-pill"
                  className="nav-pill"
                  style={{ background: `${l.accent}1f` }}
                  transition={{ type: "spring", stiffness: 450, damping: 34 }}
                />
              )}
              <span className="app-link-label">{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <button className="logout" onClick={logout}>Log out</button>

      <style>{`
        .app-header {
          position: sticky; top: 0; z-index: 20;
          display: flex; align-items: center; gap: 24px;
          height: 64px; padding: 0 24px;
          background: rgba(255,255,255,.8); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(0,0,0,.08);
        }
        .brand { display: flex; align-items: center; gap: 10px; }
        .brand-name { font-family: var(--font-grotesk), sans-serif; font-weight: 700; font-size: 16px; letter-spacing: -.01em; }
        .app-links { display: flex; align-items: center; gap: 4px; margin-left: auto; }
        .app-link {
          position: relative;
          font-size: 14px; font-weight: 500; color: #6B7280;
          padding: 7px 14px; border-radius: 9999px;
          transition: color .2s;
        }
        .app-link:hover { color: #16181D; }
        .nav-pill { position: absolute; inset: 0; border-radius: 9999px; }
        .app-link-label { position: relative; z-index: 1; }
        .logout { font-size: 14px; color: #6B7280; background: none; border: none; }
        .logout:hover { color: #16181D; }
        @media (max-width: 640px) {
          .app-links { gap: 0; }
          .app-link { padding: 7px 10px; }
        }
      `}</style>
    </header>
  );
}
