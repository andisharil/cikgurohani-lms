import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Host-agnostic: produces a self-contained server in .next/standalone
  // so the app runs on any VPS (Docker / `node server.js`) as well as Vercel.
  output: "standalone",
};

export default nextConfig;
