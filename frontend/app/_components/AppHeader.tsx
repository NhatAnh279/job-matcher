"use client";

/* ════════════════════════════════════════════════════════════════
   APP HEADER — the top bar shown on every logged-in page
   (Jobs, Match, History). The landing page has its own nav.
   `active` highlights the current link in that page's accent color.
   This folder starts with "_" so Next.js does NOT treat it as a route.
   ════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { useRouter } from "next/navigation";
import Ant from "./Ant";

const LINKS = [
  { href: "/jobs",    label: "Jobs",    accent: "#2563EB" },
  { href: "/match",   label: "Match",   accent: "#0E9F6E" },
  { href: "/history", label: "History", accent: "#E11D48" },
];

export default function AppHeader({ active }: { active?: string }) {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("token"); // clear the saved login token
    router.push("/login");
  }

  return (
    <header className="app-header">
      <Link href="/" className="brand" aria-label="Job Matcher home">
        <Ant size={28} walk />
        <span className="brand-name">Job Matcher</span>
      </Link>

      <nav className="app-links">
        {LINKS.map((l) => {
          const isActive = active === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className="app-link"
              style={isActive ? { color: l.accent, background: `${l.accent}1f` } : undefined}
            >
              {l.label}
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
          font-size: 14px; font-weight: 500; color: #6B7280;
          padding: 7px 14px; border-radius: 9999px;
          transition: color .2s, background .2s;
        }
        .app-link:hover { color: #16181D; }
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
