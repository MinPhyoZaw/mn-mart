import type { NextConfig } from "next";
import path from "path";
// @ts-expect-error next-pwa does not publish TypeScript declarations.
import withPWA from "next-pwa";

const supabaseImageHostname = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://yypxmsjyzplvtnkmnvgp.supabase.co"
).hostname;

const nextConfig: NextConfig = {
  images: {
    // Supabase occasionally takes longer to serve a stored image than Next's
    // image optimizer allows. Serve storage objects directly so a slow product
    // image cannot turn into a 504 response and interfere with checkout.
    unoptimized: true,
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
