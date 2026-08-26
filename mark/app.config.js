// Extends app.json. Same pattern as art-eye: a build stamp so a live build
// can be told apart from a stale cached one.
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
    buildSha: shortSha(),
    buildDate: new Date().toISOString().slice(0, 10),
  },
});
