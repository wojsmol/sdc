// documentation/src/plugins/alias-plugin.js
const path = require("path");

module.exports = function aliasPlugin() {
  const resolvedPath = path.resolve(process.cwd(), "src");

  return {
    name: "alias-plugin",
    configureWebpack(config, isServer, utils) {
      return {
        resolve: {
          alias: {
            "@": resolvedPath,
          },
        },
      };
    },
  };
};
