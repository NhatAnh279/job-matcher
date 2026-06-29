"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useToast } from "../_components/ToastProvider";

// Error message that shakes when it appears (spec §2.4).
const shake = { initial: { x: 0 }, animate: { x: [0, -6, 6, -5, 5, 0] }, transition: { duration: 0.4 } };

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function handleLogin() {
    setError("");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      // Send the login request, then save the returned token
      const res = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      toast("Welcome back");
      // Return to the page that sent us here (e.g. /match), else go to /jobs.
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/") ? next : "/jobs");
    } catch (err: any) {
      // Map the documented status codes to plain messages
      const status = err.response?.status;
      if (status === 404) setError("No account found with this email.");
      else if (status === 401) setError("Incorrect password.");
      else if (status === 400) setError("Email and password are required.");
      else if (!err.response) {
        // No response at all = backend offline. Sign in with a dev session so the
        // app stays usable before the API is live; real auth takes over once it is.
        localStorage.setItem("token", "dev-offline-session");
        toast("Backend offline. Signed in with a dev session.");
        const next = new URLSearchParams(window.location.search).get("next");
        router.push(next && next.startsWith("/") ? next : "/jobs");
      }
      else setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to Job Fit"
      footer={<>New here? <Link href="/register" className="link">Create an account</Link></>}
    >
      <Field label="Email" type="email" value={email} placeholder="you@email.com" onChange={setEmail} />
      <Field label="Password" type="password" value={password} placeholder="••••••••" onChange={setPassword} />
      {error && <motion.p className="form-error" key={error} {...shake}>{error}</motion.p>}
      <button className="btn btn-primary form-btn" onClick={handleLogin} disabled={loading}>
        {loading ? <><span className="spinner" /> Logging in…</> : "Log in"}
      </button>
    </AuthShell>
  );
}

/* ── shared auth layout + field (also used by the register page) ── */
export function AuthShell({
  eyebrow, title, children, footer,
}: { eyebrow: string; title: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="auth-stage">
      <Link href="/" className="auth-brand" aria-label="Job Fit home">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect width="28" height="28" rx="8" fill="#16181D" />
          <path d="M7.4 14.3 L11.2 18 L16 8.8" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="19.6" cy="9" r="1.9" fill="#fff" />
        </svg>
        <span className="auth-brand-name">Job Fit</span>
      </Link>

      <div className="auth-card">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="h-display auth-title">{title}</h1>
        <div className="auth-fields">{children}</div>
        <p className="auth-footer muted">{footer}</p>
      </div>

      <style>{`
        .auth-stage { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 28px; padding: 24px; }
        .auth-brand { display: flex; align-items: center; gap: 10px; }
        .auth-brand-name { font-family: var(--font-grotesk), sans-serif; font-weight: 700; font-size: 17px; letter-spacing: -.01em; }
        .auth-card { width: 100%; max-width: 380px; background: #fff; border: 1px solid rgba(0,0,0,.08); border-radius: 20px; padding: 32px; }
        .auth-title { font-size: 24px; margin: 6px 0 22px; }
        .auth-fields { display: flex; flex-direction: column; gap: 16px; }
        .auth-footer { font-size: 14px; text-align: center; margin-top: 22px; }
        .link { position: relative; color: #2563EB; font-weight: 500; transition: color .15s ease-out; }
        .link::after { content: ""; position: absolute; left: 0; bottom: -2px; width: 0; height: 2px; background: #2563EB; transition: width .2s ease-out; }
        .link:hover { color: #1d4ed8; }
        .link:hover::after { width: 100%; }
        .form-error { font-size: 14px; color: #E11D48; }
        .form-btn { width: 100%; margin-top: 4px; }
      `}</style>
    </div>
  );
}

export function Field({
  label, type, value, placeholder, onChange,
}: { label: string; type: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="field-input"
      />
      <style>{`
        .field { display: flex; flex-direction: column; gap: 6px; }
        .field-label { font-size: 13px; font-weight: 500; color: #6B7280; }
        .field-input {
          font-family: inherit; font-size: 15px; padding: 11px 13px;
          border: 1px solid rgba(0,0,0,.14); border-radius: 10px; background: #fff;
          transition: border-color .2s;
        }
        .field-input:focus { outline: none; border-color: #16181D; }
      `}</style>
    </label>
  );
}
