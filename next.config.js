export default {
  // Opt out of caching fetch requests in development
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // This `webpack` function is primarily used for configuring production builds (`next build`).
  // For development (`next dev --turbo`), Turbopack is used, and it respects `config.resolve.alias`.
  webpack: (config, { dev, isServer }) => {
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
};
