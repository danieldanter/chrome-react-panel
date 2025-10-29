// vite.config.ts
// Updated to build both panel and content script

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        panel: resolve(__dirname, "panel.html"),
        "content-script": resolve(__dirname, "src/content/content-script.ts"), // ✅ NEW
      },
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]",
      },
    },
  },
});
