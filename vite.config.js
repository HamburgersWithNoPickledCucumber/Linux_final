const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')
const { rmSync } = require('node:fs')
const { resolve } = require('node:path')

module.exports = defineConfig({
  plugins: [
    {
      name: 'clean-dashboard-assets',
      buildStart() {
        rmSync(resolve(__dirname, 'app/assets'), { recursive: true, force: true })
      },
    },
    react(),
  ],
  build: {
    outDir: 'app',
    emptyOutDir: false,
  },
  server: {
    proxy: {
      '/server': 'http://localhost:2800',
      '/websocket': {
        target: 'http://localhost:2800',
        ws: true,
      },
    },
  },
})
