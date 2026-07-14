"use client";

/* ════════════════════════════════════════════════════════════════
   APP HEADER — the top bar shown on every logged-in page
   (Jobs, Match, History). The landing page has its own nav.
   `active` highlights the current link in that page's accent color.
   This folder starts with "_" so Next.js does NOT treat it as a route.
   ════════════════════════════════════════════════════════════════ */

import Link from "next/link";
import { useRouter } from "next/navigation";

const LINKS = [
  { href: "/jobs",     label: "Jobs" },
  { href: "/match",    label: "Match" },
  { href: "/insights", label: "Insights" },
  { href: "/history",  label: "History" },
];

export default function AppHeader({ active }: { active?: string }) {
  const router = useRouter();

  function logout() {
    localStorage.removeItem("token"); // clear the saved login token
    router.push("/login");
  }

  return (
    <header className="app-header">
      {/* Logged-in home is the app, not the marketing landing — going to "/"
          shows the logged-out-looking cover and reads as an accidental logout. */}
      <Link href="/jobs" className="brand" aria-label="Job Match home">
        <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="#7f77dd" />
          <path d="M7.4 14.3 L11.2 18 L16 8.8" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="19.6" cy="9" r="1.9" fill="#FFFFFF" />
        </svg>
        <span className="brand-name">Job Match</span>
      </Link>

      <nav className="app-links">
        {LINKS.map((l) => {
          const isActive = active === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`app-link ${isActive ? "app-link-on" : ""}`}
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
          background: rgba(14,13,22,.72); backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(127,119,221,.18);
        }
        .brand { display: flex; align-items: center; gap: 10px; }
        .brand-name { font-family: var(--font-grotesk), sans-serif; font-weight: 700; font-size: 16px; letter-spacing: -.01em; color: var(--ink); }
        .app-links { display: flex; align-items: center; gap: 4px; margin-left: auto; }
        .app-link {
          font-size: 14px; font-weight: 500; color: var(--muted);
          padding: 7px 14px; border-radius: 9999px;
          transition: color .2s, background .2s;
        }
        .app-link:hover { color: var(--ink); }
        .app-link-on { color: var(--accent-bright); background: rgba(127,119,221,.14); }
        .logout { font-size: 14px; color: var(--muted); background: none; border: none; transition: color .2s; }
        .logout:hover { color: var(--ink); }
        @media (max-width: 640px) {
          .app-links { gap: 0; }
          .app-link { padding: 7px 10px; }
        }
      `}</style>
    </header>
  );
}
