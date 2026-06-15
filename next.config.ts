import type { NextConfig } from "next";
import path from "path";
// @ts-ignore
import withPWA from "next-pwa";

const supabaseImageHostname = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://yypxmsjyzplvtnkmnvgp.supabase.co"
).hostname;

const nextConfig: NextConfig = {
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

  outputFileTracingRoot: path.join(__dirname),
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);