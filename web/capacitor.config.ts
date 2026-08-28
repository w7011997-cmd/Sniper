import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ops.snookerapp",
  appName: "Snooker App",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
