module.exports = function tailwindPlugin() {
  return {
    name: "tailwindcss-v4-plugin",
    configurePostCss(postcssOptions) {
      postcssOptions.plugins.push(require("@tailwindcss/postcss"));
      return postcssOptions;
    },
  };
};
