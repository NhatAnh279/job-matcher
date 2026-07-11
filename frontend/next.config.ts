import type { NextConfig } from "next";

// Backend to proxy to. Requests the browser makes to /api/* are forwarded
// here by the Next.js dev/prod server (server-to-server), so the browser
// only ever talks to its own origin — no CORS involved.
const API_TARGET = process.env.API_PROXY_TARGET ?? "https://tommy279-job-matcher.hf.space";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_TARGET}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
