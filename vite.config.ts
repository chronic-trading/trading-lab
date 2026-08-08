import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves from /trading-lab/ sub-path; all other hosts use root
const base = process.env.GITHUB_PAGES === 'true' ? '/trading-lab/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // autoUpdate, not prompt. A service worker that waits for the user to
      // accept an update can strand people on an old build indefinitely, and
      // this app has no release notes to make that choice meaningful. Combined
      // with cleanupOutdatedCaches below, an old shell cannot outlive a deploy.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],

      manifest: {
        name: 'Trading Lab — ICT · SMC · Futures Workspace',
        short_name: 'Trading Lab',
        description: 'Build, grade, journal and replay ICT/SMC futures setups.',
        // Must match Vite's base or the installed app opens on a 404.
        start_url: base,
        scope: base,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0d0b09',
        theme_color: '#0d0b09',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },

      workbox: {
        // Shell only. public/data is ~7.3MB of candle JSON refreshed daily by a
        // scheduled action — precaching it would force that download on a first
        // visit and then serve stale candles until the next deploy. It gets a
        // runtime strategy below instead. og.png is social-preview only and is
        // never needed by the running app.
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2}'],
        globIgnores: ['**/data/**', '**/og.png', '**/chronos/**'],

        // Without this, superseded precache entries accumulate across deploys.
        cleanupOutdatedCaches: true,
        // Single-page app: any navigation resolves to the shell, which is what
        // makes a reload work with no network.
        navigateFallback: `${base}index.html`,
        navigateFallbackDenylist: [/^\/api/, /\/data\//],

        runtimeCaching: [
          {
            // Replay candles: fresh when there is a connection, last-known copy
            // when there is not. NetworkFirst rather than StaleWhileRevalidate
            // because these are refreshed daily and showing yesterday's bars
            // while online would be quietly wrong.
            urlPattern: ({ url }) => url.pathname.includes('/data/') && url.pathname.endsWith('.json'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'market-data',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      // The dev server does not need a service worker, and registering one
      // there makes HMR fight the cache.
      devOptions: { enabled: false },
    }),
  ],
})
