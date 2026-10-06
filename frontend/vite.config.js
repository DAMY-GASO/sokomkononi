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
      target: "es2020",
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            icons: ["lucide-react"],
          },
        },
      },
    },
  };
});
