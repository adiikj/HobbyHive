/** @type {import('next').NextConfig} */
const nextConfig = {
  // The on-screen dev indicator (bottom-left icon / route segment explorer)
  // has a known Next.js bug where it crashes HMR after heavy file churn in a
  // dev session: "Could not find the module ... segment-explorer-node.js" or
  // "__webpack_modules__[moduleId] is not a function", which then shows up as
  // missing CSS or a full dev-server 500 until the server is restarted.
  // Disabling it avoids loading that overlay at all. Dev-only setting, no
  // effect on production builds.
  devIndicators: false,
};

export default nextConfig;
