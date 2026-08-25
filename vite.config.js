// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // ✅ Important: makes asset paths relative (fixes MIME/type and blank screen on Netlify)
  base: '/',


  plugins: [
    react(),

    // ✅ Progressive Web App (PWA) setup
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto', // ensures registerSW.js auto-injected in dist/index.html
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
        theme_color: "#1DB954",
        background_color: "#000000ff",
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
    // Your app assets
    {
      urlPattern: /\.(?:js|css|html|png|svg|ico)$/,
      handler: 'CacheFirst',
    },
    // YouTube → NEVER cache
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
        enabled: false, // disable SW in dev mode (for smoother local debugging)
      },
    }),
  ],

  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        // ✅ ensures consistent file names for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },

  resolve: {
    alias: {
      '@': '/src', // cleaner imports like "@/components/Navbar"
    },
  },

  server: {
    port: 5173,
    open: true,
  },
})
