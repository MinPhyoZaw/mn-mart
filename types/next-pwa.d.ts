declare module "next-pwa";

declare module "next-pwa/cache" {
  type RuntimeCachingEntry = {
    urlPattern: RegExp | ((args: { url: URL }) => boolean);
    handler: string;
    method?: string;
    options?: {
      cacheName?: string;
      [key: string]: unknown;
    };
  };

  const runtimeCaching: RuntimeCachingEntry[];
  export default runtimeCaching;
}
