import type { NextConfig } from "next";
import path from "path";


import withPWA from "next-pwa";

const supabaseImageHostname = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://yypxmsjyzplvtnkmnvgp.supabase.co"
).hostname;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage
      {
        protocol: "https",
        hostname: supabaseImageHostname,
        pathname: "/storage/v1/object/public/**",
      },

      // Imgur
      {
        protocol: "https",
        hostname: "imgur.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
        pathname: "/**",
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