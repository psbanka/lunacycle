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
    allowedHosts: ['sparq.local', 'sparq'],
    cors: false,
    headers: {
      "Access-Control-Allow-Origin": "*", // Allow CORS
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
    },
  },
}));
