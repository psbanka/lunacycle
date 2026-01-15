/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';
import path from 'path';

const VITE_DEVELOPMENT_PORT = parseInt(
  process.env?.VITE_DEVELOPMENT_PORT || "8080",
  10,
);

export default defineConfig(({ mode }) => ({
  root: import.meta.dirname,
  cacheDir: '../../node_modules/.vite/apps/lunacycle-web',
  server: {
    allowedHosts: ['sparq.local', 'sparq', 'localhost'],
    cors: false,
    headers: {
      "Access-Control-Allow-Origin": "http://localhost:8080",
    },
    host: "::",
    port: VITE_DEVELOPMENT_PORT,
  },
  preview: {
    port: VITE_DEVELOPMENT_PORT,
    host: 'localhost',
  },
  plugins: [react(), nxViteTsPaths(), nxCopyAssetsPlugin(['*.md'])],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@lunacycle/types": path.resolve(import.meta.dirname, "../../libs/shared/types/src/index.ts"),
      "@lunacycle/lunar-phase": path.resolve(import.meta.dirname, "../../libs/shared/lunar-phase/src/index.ts"),
      "@lunacycle/auth-client": path.resolve(import.meta.dirname, "../../libs/shared/auth-client/src/index.ts"),
    },
  },
  build: {
    outDir: '../../dist/apps/lunacycle-web',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
