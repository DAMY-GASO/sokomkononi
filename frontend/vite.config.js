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
      target: "es2020", // Inasaidia Mobile Performance
      cssCodeSplit: true, // CSS inagawanywa kwenye chunks ndogo
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          // Gawanya TU libraries za node_modules.
          // Code ya src/ (config, api, pages) imeachwa kwa Rollup ili
          // isitengeneze circular chunks ("Cannot access 'x' before initialization").
          manualChunks(id) {
            if (!id.includes("node_modules")) return;

            // React core tu (match kamili, si kila kitu chenye neno "react")
            if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) {
              return "vendor-react";
            }

            // Libraries nzito za charts
            if (/node_modules\/(recharts|d3-[^/]+)\//.test(id)) {
              return "vendor-charts";
            }

            // Leaflet (ramani)
            if (/node_modules\/leaflet\//.test(id)) {
              return "vendor-leaflet";
            }

            // Libraries zingine zote: Rollup iamue yenyewe
          },
        },
      },
    },
  };
});
