// Extends app.json. EXPO_BASE_URL is set only for the GitHub Pages web
// export (npm run build:pages), where the app lives under /D-I-S-APP-/.
const { execSync } = require('child_process');

function shortSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: __dirname }).toString().trim();
  } catch {
    return 'unknown';
  }
}

module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...(config.experiments ?? {}),
    baseUrl: process.env.EXPO_BASE_URL ?? '',
  },
  extra: {
    ...(config.extra ?? {}),
    // Stamped at export time so a live build can always be told apart from a
    // stale cached one — see the footer on the Curator tab.
    buildSha: shortSha(),
    buildDate: new Date().toISOString().slice(0, 10),
  },
});
