import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the sandboxed live-preview host to load dev assets/HMR in `next dev`.
  allowedDevOrigins: ["*.e2b.app"],
};

export default nextConfig;
