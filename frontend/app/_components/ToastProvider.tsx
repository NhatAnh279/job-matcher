"use client";

/* ════════════════════════════════════════════════════════════════
   TOAST PROVIDER — transient feedback (saved a job, logged in, an error).
   Wraps the app in layout.tsx. Any client component can call:
     const toast = useToast();
     toast("Saved to your list");          // success (default)
     toast("Something went wrong", "error");
   Toasts auto-dismiss; they stack bottom-right and slide in.
   ════════════════════════════════════════════════════════════════ */

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle, WarningCircle, X } from "@phosphor-icons/react";

type Tone = "ok" | "error";
type Toast = { id: number; message: string; tone: Tone };

const ToastCtx = createContext<(message: string, tone?: Tone) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback((message: string, tone: Tone = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => dismiss(id), 3400);
  }, [dismiss]);

  return (
    <ToastCtx.Provider value={push}>
      {children}

      <div className="toast-wrap" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.tone === "ok"
              ? <CheckCircle size={18} weight="fill" className="toast-ic ok" />
              : <WarningCircle size={18} weight="fill" className="toast-ic err" />}
            <span className="toast-msg">{t.message}</span>
            <button className="toast-x" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X size={13} weight="bold" />
            </button>
          </div>
        ))}
      </div>

      <style>{`
        .toast-wrap {
          position: fixed; z-index: 100; right: 20px; bottom: 20px;
          display: flex; flex-direction: column; gap: 10px; pointer-events: none;
        }
        .toast {
          pointer-events: auto;
          display: flex; align-items: center; gap: 10px;
          min-width: 240px; max-width: 360px;
          padding: 12px 12px 12px 14px;
          background: #fff; color: #16181D;
          border: 1px solid rgba(0,0,0,.08); border-radius: 12px;
          box-shadow: 0 12px 30px rgba(0,0,0,.14);
          animation: toastIn .32s cubic-bezier(.22,1,.36,1) both;
        }
        .toast-ic { flex: 0 0 auto; }
        .toast-ic.ok { color: #0E9F6E; }
        .toast-ic.err { color: #E11D48; }
        .toast-msg { flex: 1; font-size: 14px; font-weight: 500; line-height: 1.35; }
        .toast-x {
          flex: 0 0 auto; display: grid; place-items: center;
          width: 22px; height: 22px; border-radius: 6px;
          background: none; border: none; color: #9CA3AF;
          transition: color .15s, background .15s;
        }
        .toast-x:hover { color: #16181D; background: rgba(0,0,0,.05); }
        @keyframes toastIn { from { opacity: 0; transform: translateY(12px) scale(.98); } to { opacity: 1; transform: none; } }
        @media (prefers-reduced-motion: reduce) { .toast { animation: none; } }
        @media (max-width: 520px) {
          .toast-wrap { right: 12px; left: 12px; bottom: 12px; }
          .toast { min-width: 0; max-width: none; }
        }
      `}</style>
    </ToastCtx.Provider>
  );
}
