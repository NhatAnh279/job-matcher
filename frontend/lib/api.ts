/* ════════════════════════════════════════════════════════════════
   API CLIENT — the single axios instance every page imports as
   `@/lib/api`. Without this, every `api.get` / `api.post` call is a
   crash that only the pages' try/catch blocks hide behind mock data.

   • baseURL comes from NEXT_PUBLIC_API_URL (see .env.local / .env.example),
     and falls back to the local backend so dev works with zero setup.
   • Every request automatically carries the saved login token.
   ════════════════════════════════════════════════════════════════ */

import axios from "axios";

// NEXT_PUBLIC_ vars are inlined into the browser bundle at build time.
const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const api = axios.create({
  baseURL,
  // The HF Spaces free tier can take 30s+ to respond from a cold start; a
  // short timeout aborts mid-download and silently drops to mock data.
  timeout: 60000,
});

// Attach the bearer token (saved by login/register) to every request.
// Guarded with `typeof window` so it stays safe if ever run on the server.
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
