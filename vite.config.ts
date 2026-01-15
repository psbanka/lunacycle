import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const VITE_DEVELOPMENT_PORT = parseInt(
  process.env?.VITE_DEVELOPMENT_PORT || "8080",
  10,
);
const basePath = "/";


export default defineConfig(({ mode }) => ({
  server: {
    allowedHosts: ['sparq.local', 'sparq', 'localhost'],
    cors: false,
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:8080", // Allow CORS
    },
    host: "::",
    port: VITE_DEVELOPMENT_PORT,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@lunacycle/types": path.resolve(__dirname, "./libs/shared/types/src/index.ts"),
      "@lunacycle/lunar-phase": path.resolve(__dirname, "./libs/shared/lunar-phase/src/index.ts"),
      "@lunacycle/auth-client": path.resolve(__dirname, "./libs/shared/auth-client/src/index.ts"),
    },
  },
}));
