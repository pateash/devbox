// Signing credentials are intentionally supplied only by release CI.
module.exports = async function notarizeIfConfigured() {
  if (!process.env.APPLE_ID || !process.env.APPLE_APP_SPECIFIC_PASSWORD || !process.env.APPLE_TEAM_ID) return
  const { notarize } = require('@electron/notarize')
  await notarize({ appBundleId: 'com.devbox.app', appleId: process.env.APPLE_ID, appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD, teamId: process.env.APPLE_TEAM_ID })
}
