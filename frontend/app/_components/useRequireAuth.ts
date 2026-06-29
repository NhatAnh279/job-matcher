"use client";

/* ════════════════════════════════════════════════════════════════
   useRequireAuth — gate for pages the API contract marks "Auth: Yes"
   (jobs, match, history). If there's no saved login token, redirect to
   /login?next=<this page> so the user returns here after logging in.

   Returns `ready`: false until the check passes (render nothing meanwhile,
   so protected content never flashes for a logged-out visitor).
   ════════════════════════════════════════════════════════════════ */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useRequireAuth(): boolean {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      const here = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(here)}`);
    } else {
      setReady(true);
    }
  }, [router]);

  return ready;
}
