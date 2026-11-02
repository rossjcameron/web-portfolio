import { defineConfig } from 'vite'

export default defineConfig({
  // Relative asset paths so the build works on GitHub Pages, Netlify or any static host
  base: './',
  build: {
    // Three.js is lazy-loaded in its own ~170 kB (gzip) chunk; that is expected
    chunkSizeWarningLimit: 700,
  },
})
