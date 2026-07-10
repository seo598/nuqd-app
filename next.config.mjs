/**
 * Set PAGES=true to build a static export for GitHub Pages (served from the
 * /nuqd-app subpath). Local `npm run dev` / `npm run build` are unaffected.
 */
const isPages = process.env.PAGES === "true";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(isPages
    ? {
        output: "export",
        basePath: "/nuqd-app",
        assetPrefix: "/nuqd-app/",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
