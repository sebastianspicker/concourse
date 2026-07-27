/** Metro configuration for the mobile monorepo bundle. */
const { getDefaultConfig } = module.require("expo/metro-config");
const path = module.require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

// Keep monorepo visibility but avoid custom resolver remapping that can break
// Expo Router web entry resolution under pnpm.
config.watchFolders = [workspaceRoot];

module.exports = config;
