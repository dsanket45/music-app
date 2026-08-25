// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',

  plugins: [
    react(),

    // MIME type plugin for direct APK downloading
    {
      name: 'apk-mime-type',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.includes('.apk')) {
            res.setHeader('Content-Type', 'application/vnd.android.package-archive');
            res.setHeader('Content-Disposition', 'attachment; filename="D-Music-App.apk"');
          }
          next();
        });
      }
    },

    // Progressive Web App (PWA) setup
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'icons/dslogo.png',
        'favicon.ico',
        'robots.txt',
        'apple-touch-icon.png'
      ],
      manifest: {
        name: "Sanket's Music Streaming App",
        short_name: "SanketMusic",
        description: "Stream and enjoy music with SanketMusic app. Offline support included!",
        theme_color: "#10B981",
        background_color: "#F8FAFC",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: '/icons/dslogo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/dslogo.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,json}'],
        runtimeCaching: [
          {
            urlPattern: /\.(?:js|css|html|png|svg|ico)$/,
            handler: 'CacheFirst',
          },
          {
            urlPattern: /^https:\/\/.*youtube\.com/,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https:\/\/.*googlevideo\.com/,
            handler: 'NetworkOnly',
          },
        ],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],

  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },

  resolve: {
    alias: {
      '@': '/src',
    },
  },

  server: {
    port: 5173,
    open: true,
  },
})
