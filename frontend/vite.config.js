import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/server': {
        target: 'http://localhost:2800',
        changeOrigin: true,
      },
      '/websocket': {
        target: 'http://localhost:2800',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:2800',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: '../app-react',
    emptyOutDir: true,
  },
});
