// Extends app.json. EXPO_BASE_URL is set only for the GitHub Pages web
// export (npm run build:pages), where the app lives under /D-I-S-APP-/.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments ?? {}),
    baseUrl: process.env.EXPO_BASE_URL ?? '',
  },
});
