import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    strictPort: true,
    proxy: {
      // Dev-only: forward /api to your Django dev server.
      // In production nginx proxies /api directly.
      "/api": {
        target: process.env.VITE_API_DEV_PROXY || "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/media": {
        target: process.env.VITE_API_DEV_PROXY || "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
      "/static": {
        target: process.env.VITE_API_DEV_PROXY || "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    target: "es2020",
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          icons: ["lucide-react"],
        },
      },
    },
  },
});
