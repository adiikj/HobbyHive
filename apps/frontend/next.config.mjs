/** @type {import('next').NextConfig} */

// Where the Express backend runs, as seen from the Next.js server (not the browser). The browser only
// ever talks to this app's own origin; these rewrites forward API, upload, and socket traffic server-side.
// That keeps it to a single port — so remote dev over SSH/VS Code only needs :3000 forwarded — and makes
// every API call same-origin (no CORS, first-party cookies).
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8001";

const nextConfig = {
  // The on-screen dev indicator (bottom-left icon / route segment explorer)
  // has a known Next.js bug where it crashes HMR after heavy file churn in a
  // dev session: "Could not find the module ... segment-explorer-node.js" or
  // "__webpack_modules__[moduleId] is not a function", which then shows up as
  // missing CSS or a full dev-server 500 until the server is restarted.
  // Disabling it avoids loading that overlay at all. Dev-only setting, no
  // effect on production builds.
  devIndicators: false,
  // socket.io requests "/socket.io/?..." — the default trailing-slash redirect would break its handshake
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${BACKEND_URL}/api/v1/:path*` },
      { source: "/uploads/:path*", destination: `${BACKEND_URL}/uploads/:path*` },
      { source: "/socket.io/:path*", destination: `${BACKEND_URL}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;
