export default {
  // Switched to webpack for dev mode to ensure reliable client-side source maps,
  // which can be unstable with experimental Next.js versions.
  webpack: (config, { dev, isServer }) => {
    // Add aliases to prevent bundling server-side modules on the client.
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "pg-native": false,
        "cloudflare:sockets": false,
      };
    }

    return config;
  },

  pageExtensions: ["ts", "tsx", "js", "jsx"], // FIXME: finish converting js(x) files to ts(x)
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: true,
  serverExternalPackages: ["knex", "@libsql/client"],
};
