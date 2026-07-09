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
  timeout: 15000, // 15s — generous enough for a resume upload + scoring
});

// Gửi token đăng nhập qua FORM-DATA (body) thay vì Authorization header.
// Lưu ý: GET không có body nên không thể dùng form-data -> gắn token vào query (?token=).
// (Khác với PDF contract vốn dùng header — đổi theo yêu cầu; cần xác nhận backend đọc token từ đâu.)
api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const token = localStorage.getItem("token");
  if (!token) return config;

  const method = (config.method ?? "get").toLowerCase();

  if (config.data instanceof FormData) {
    // Request đã là form-data (vd: /api/match) -> thêm field "token"
    config.data.append("token", token);
  } else if (method === "get") {
    // GET không có body -> gắn token vào query param
    config.params = { ...(config.params ?? {}), token };
  } else {
    // POST/PUT có body JSON -> chuyển sang form-data kèm token
    const form = new FormData();
    const body = (config.data ?? {}) as Record<string, unknown>;
    Object.entries(body).forEach(([k, v]) => form.append(k, String(v)));
    form.append("token", token);
    config.data = form;
  }
  return config;
});

export default api;
