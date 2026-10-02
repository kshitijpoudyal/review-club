import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
      },
      includeAssets: ['favicon.svg', 'icons/*.svg'],
      manifest: {
        name: 'Amazon Review Tracker',
        short_name: 'Review Tracker',
        description: 'Track Amazon product reviews and manage PayPal transactions',
        theme_color: '#022448',
        background_color: '#022448',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'icons/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    host: true,
    open: true,
    watch: {
      // Without this, every `npm run build` (which writes a fresh set of
      // hashed files into dist/) gets picked up by the dev server's watcher
      // as a source change and forces a full browser reload.
      ignored: ['**/dist/**'],
    },
  }
})
