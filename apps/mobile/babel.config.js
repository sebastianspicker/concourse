/** Babel configuration for the Expo mobile bundle. */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
  };
};
