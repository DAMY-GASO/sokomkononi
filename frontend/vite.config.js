import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_DEV_PROXY || "http://localhost:8000";

  const proxy = {
    "/api": { target, changeOrigin: true, secure: false },
    "/media": { target, changeOrigin: true, secure: false },
    "/static": { target, changeOrigin: true, secure: false },
  };

  return {
    plugins: [react()],
    server: {
      port: 3001,
      strictPort: true,
      proxy,
    },
    build: {
      outDir: "dist",
      sourcemap: false,
      target: "es2020", // ✅ Inasaidia sana kwa Mobile Performance
      cssCodeSplit: true, // ✅ Inagawanya CSS kwenye chunks ndogo badala ya file moja kubwa
      chunkSizeWarningLimit: 800, // ✅ Ongeza uwezo wa kugawanya chunks vizuri
      rollupOptions: {
        output: {
          // ✅ TUNATUMIA FUNCTION BADALA YA OBJECT KWA MANUALCHUNKS
          // Hii inaruhusu Rollup ku-group modules zote zinazohusiana (hata za dynamic import)
          manualChunks(id) {
            // 1. Group React, Router na state management zote pamoja
            if (id.includes("node_modules")) {
              if (id.includes("react") || id.includes("scheduler")) {
                return "vendor-react";
              }
              if (id.includes("lucide-react")) {
                return "vendor-icons";
              }
              if (id.includes("recharts") || id.includes("chart")) {
                return "vendor-charts";
              }
              // Libraries zingine zote za nje
              return "vendor-other";
            }

            // 2. ✅ FIX: Weka API na Stores PAMOJA (app-core) ili kuepuka "Circular chunk"
            // Kwa sababu client.js (API) inategemea adminPath.js (Store),
            // na listingsStore.js (Store) inategemea listings.js (API).
            if (id.includes("/src/config/") || id.includes("/src/api/")) {
              return "app-core";
            }
          },
        },
      },
    },
  };
});