import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ops.sniper",
  appName: "Sniper",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
