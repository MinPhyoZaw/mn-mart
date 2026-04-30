import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["imgur.com", "i.imgur.com"],
  },
  // Ensure Next resolves file-tracing from this project root (prevents scanning parent lockfiles)
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
