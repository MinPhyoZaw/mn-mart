import type { NextConfig } from "next";
import path from "path";
import defaultRuntimeCaching from "next-pwa/cache";


import withPWA from "next-pwa";

const supabaseImageHostname = new URL(
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://yypxmsjyzplvtnkmnvgp.supabase.co"
).hostname;

const runtimeCaching = [
  {
    urlPattern: ({ url }: { url: URL }) =>
      url.origin === self.origin && url.pathname.startsWith("/api/"),
    handler: "NetworkOnly",
    method: "GET",
    options: {
      fetchOptions: { cache: "no-store" },
    },
  },
  ...defaultRuntimeCaching.filter(
    (entry) => entry.options?.cacheName !== "apis"
  ),
];

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
  customWorkerDir: "worker",
  runtimeCaching,
  register: false,
  skipWaiting: true,
  buildExcludes: [/app-build-manifest\.json$/],
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
