const path = require("path");

module.exports = function aliasPlugin() {
  return {
    name: "alias-plugin",
    configureWebpack(config, isServer, utils) {
      return {
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "../../src"), // adjust relative path to project root
          },
        },
      };
    },
  };
};
