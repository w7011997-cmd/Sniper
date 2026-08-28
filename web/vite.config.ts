import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // lets you preview on your phone browser via LAN while testing in Termux
    port: 5173,
  },
  build: {
    outDir: "dist",
  },
});
