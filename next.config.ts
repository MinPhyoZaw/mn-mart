import type { NextConfig } from "next";
import path from "path";

const supabaseImageHostname = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yypxmsjyzplvtnkmnvgp.supabase.co",
).hostname;

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: ["imgur.com", "i.imgur.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseImageHostname,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Ensure Next resolves file-tracing from this project root (prevents scanning parent lockfiles)
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
