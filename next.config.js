export default {
  turbopack: {
    resolveAlias: {
      "pg-native": "false",
      "cloudflare:sockets": "false",
    },
  },

  pageExtensions: ["ts", "tsx", "js", "jsx"], // FIXME: finish converting js(x) files to ts(x)
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: true,
  serverExternalPackages: ["knex", "@libsql/client"],
};
