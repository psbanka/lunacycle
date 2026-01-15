import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 8081,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lunacycle/auth-client': path.resolve(__dirname, '../../libs/shared/auth-client/src/index.ts'),
    },
  },
});
