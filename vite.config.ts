import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// PWA Configuration for Web AutoTest Pro
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.autotest-pro\.dev\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              networkTimeoutSeconds: 3,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              },
            },
          },
        ],
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Web AutoTest Pro',
        short_name: 'AutoTest Pro',
        description: 'Professional web testing automation platform with cross-device synchronization',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        categories: ['productivity', 'developer', 'utilities'],
        lang: 'en-US',
        dir: 'ltr',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png'
          },
          {
            src: 'pwa-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'pwa-256x256.png',
            sizes: '256x256',
            type: 'image/png'
          }
        ],
        screenshots: [
          {
            src: 'screenshot-1.png',
            sizes: '1280x720',
            type: 'image/png',
            label: 'Test Recording Interface'
          },
          {
            src: 'screenshot-2.png',
            sizes: '1280x720',
            type: 'image/png',
            label: 'Test Playback Dashboard'
          }
        ],
        shortcuts: [
          {
            name: 'New Test Recording',
            short_name: 'Record',
            description: 'Start a new test recording session',
            url: '/recorder',
            icons: [{ src: 'record-icon.png', sizes: '96x96' }]
          },
          {
            name: 'Run Tests',
            short_name: 'Run',
            description: 'Execute saved test suites',
            url: '/playback',
            icons: [{ src: 'play-icon.png', sizes: '96x96' }]
          },
          {
            name: 'Test Dashboard',
            short_name: 'Dashboard',
            description: 'View test results and analytics',
            url: '/dashboard',
            icons: [{ src: 'dashboard-icon.png', sizes: '96x96' }]
          }
        ],
        related_applications: [
          {
            platform: 'play',
            url: 'https://play.google.com/store/apps/details?id=com.autotest.companion',
            id: 'com.autotest.companion'
          },
          {
            platform: 'itunes',
            url: 'https://apps.apple.com/app/autotest-companion/id123456789'
          }
        ],
        prefer_related_applications: false
      },
      devOptions: {
        enabled: process.env.NODE_ENV === 'development',
        type: 'module',
        navigateFallback: 'index.html',
      },
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './web-app/src'),
      '@components': path.resolve(__dirname, './web-app/src/components'),
      '@hooks': path.resolve(__dirname, './web-app/src/hooks'),
      '@utils': path.resolve(__dirname, './web-app/src/utils'),
      '@services': path.resolve(__dirname, './web-app/src/services'),
      '@types': path.resolve(__dirname, './web-app/src/types'),
      '@assets': path.resolve(__dirname, './web-app/src/assets'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react'],
          testing: ['selenium-webdriver', 'playwright'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    host: true,
    cors: true,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: process.env.VITE_WS_URL || 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __GIT_COMMIT__: JSON.stringify(process.env.GITHUB_SHA || 'dev'),
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@vite/client', '@vite/env'],
  },
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});