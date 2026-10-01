// Extends app.json. The website hosts the web build of this app under a sub-path, so the
// export reads that path from the environment: `PREVIEW_BASE_URL=/preview npx expo export -p web`.
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    ...(process.env.PREVIEW_BASE_URL ? { baseUrl: process.env.PREVIEW_BASE_URL } : {}),
  },
});
