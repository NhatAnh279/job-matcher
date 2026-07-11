"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useToast } from "../_components/ToastProvider";
import { AuthShell, Field } from "../login/page";

const shake = { initial: { x: 0 }, animate: { x: [0, -6, 6, -5, 5, 0] }, transition: { duration: 0.4 } };

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const toast = useToast();

  async function handleRegister() {
    setError("");
    if (!name || !email || !password) {
      setError("Fill in every field.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      // Backend declares email/password as form fields (Form(...)) and ignores
      // any extra field, so send url-encoded form data (name is not used by the
      // API but harmless). Register returns the raw Supabase sign-up response —
      // the token, when present, lives under session.access_token.
      const res = await api.post("/api/auth/register", new URLSearchParams({ name, email, password }));
      // Backend returns HTTP 200 even on failure — an { error } body (e.g. email
      // already registered). Surface it instead of pretending the account exists.
      if (res.data?.error) {
        setError(String(res.data.error));
        return;
      }
      const token = res.data?.session?.access_token ?? res.data?.token;
      if (!token) {
        // Signed up but no session returned (e.g. email confirmation required).
        toast("Account created. Please log in.");
        router.push("/login");
        return;
      }
      localStorage.setItem("token", token);
      toast("Account created");
      const next = new URLSearchParams(window.location.search).get("next");
      router.push(next && next.startsWith("/") ? next : "/jobs");
    } catch (err: any) {
      // Per the API contract, register returns 400 when the email is taken.
      const status = err.response?.status;
      if (status === 400) setError("An account with this email already exists.");
      else if (!err.response) {
        // Backend offline: create a dev session so the app stays usable.
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
      eyebrow="Get started, it's free"
      title="Create your account"
      footer={<>Already have one? <Link href="/login" className="link">Log in</Link></>}
    >
      <Field label="Name" type="text" value={name} placeholder="Linh Bui" onChange={setName} />
      <Field label="Email" type="email" value={email} placeholder="you@email.com" onChange={setEmail} />
      <Field label="Password" type="password" value={password} placeholder="At least 6 characters" onChange={setPassword} />
      {error && <motion.p className="form-error" key={error} {...shake}>{error}</motion.p>}
      <button className="btn btn-primary form-btn" onClick={handleRegister} disabled={loading}>
        {loading ? <><span className="spinner" /> Creating account…</> : "Create account"}
      </button>
    </AuthShell>
  );
}
