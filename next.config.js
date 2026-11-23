import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Turbopack rooted on this app (parent lockfiles confuse the monorepo root).
  turbopack: {
    root: dir,
  },

  // Opt out of caching fetch requests in development
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // This `webpack` function is primarily used for configuring production builds (`next build`).
  // For development (`next dev --turbo`), Turbopack is used, and it respects `config.resolve.alias`.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "pg-native": false,
        "cloudflare:sockets": false,
      };
    }

    return config;
  },

  pageExtensions: ["ts", "tsx"],
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: true,
  serverExternalPackages: ["knex", "@libsql/client"],
  // output: 'standalone' // to avoid dynamic backend security risks
  // note: Next.js intentionally does not copy public/ or .next/static/ into .next/standalone,
  // so the eventual npx build script needs to copy those two directories
  // into .next/standalone/public and .next/standalone/.next/static before packing,
  // or CSS and static assets will 404 when a user launches it
};

export default nextConfig;
