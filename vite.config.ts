/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// `base` must match the GitHub Pages path: https://<user>.github.io/holocron/
// When running locally (npm run dev) Vite serves it at http://localhost:5173/holocron/
export default defineConfig({
  base: '/holocron/',
  // Shown in Settings so a phone can tell which build it is running.
  define: { __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC') },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'apple-touch-icon.png', 'logo.png', 'logo/*.png'],
      manifest: {
        name: 'Holocron',
        short_name: 'Holocron',
        description: 'A gym assistant that builds your routine from the evidence and tracks every session.',
        theme_color: '#080a0c',
        background_color: '#080a0c',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/holocron/',
        scope: '/holocron/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/holocron/index.html',
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
})
