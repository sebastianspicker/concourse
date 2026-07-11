import type { ExpoConfig, ConfigContext } from "expo/config";
import { getExpoDefaults } from "./src/config/expoDefaults.js";

export default ({ config }: ConfigContext): ExpoConfig => getExpoDefaults(config);
