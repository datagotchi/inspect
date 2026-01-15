import CopyPlugin from "copy-webpack-plugin";

export default {
  webpack: (config, { webpack, dev }) => {
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^pg-native$|^cloudflare:sockets$/,
      }),
    );

    config.plugins.push(
      new CopyPlugin({
        patterns: [
          {
            from: "node_modules/bootstrap/dist/js/bootstrap.bundle.js",
            to: "../public/",
          },
        ],
      }),
    );

    config.performance = {
      maxAssetSize: 512000,
      maxEntrypointSize: 512000,
    };

    return config;
  },
  pageExtensions: ["ts", "tsx", "js", "jsx"], // FIXME: finish converting js(x) files to ts(x)
  experimental: {
    forceSwcTransforms: true,
  },
  images: {
    unoptimized: true,
  },
  productionBrowserSourceMaps: true,
  serverExternalPackages: ["knex"],
};
