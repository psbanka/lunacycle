import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const VITE_DEVELOPMENT_PORT = parseInt(
  process.env?.VITE_DEVELOPMENT_PORT || "8080",
  10,
);
const basePath = "/";

// https://vitejs.dev/config/

export default defineConfig(({ mode }) => ({
  server: {
    cors: false,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allow CORS
    },
    host: "::",
    port: VITE_DEVELOPMENT_PORT,
    proxy: {
      "^/silent-check-sso.html": {
        rewrite: (path) =>
          path.replace(/^\/silent-check-sso.html'/, "/silent-check-sso.html"),
        target: `http://localhost:${VITE_DEVELOPMENT_PORT}${basePath}`,
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
