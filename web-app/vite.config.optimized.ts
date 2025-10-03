import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      includeAssets: ['favicon.ico', 'icons/*.png', 'manifest.json'],
      manifest: false // Use our custom manifest.json
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared/src')
    }
  },
  define: {
    'process.env': {}
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },
  build: {
    target: 'esnext',
    // Enable advanced minification for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info']
      },
      mangle: {
        safari10: true
      }
    },
    rollupOptions: {
      external: ['playwright', 'playwright-core'],
      output: {
        manualChunks: {
          // Core React dependencies - most stable, best for caching
          'react-core': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          
          // UI libraries - separate for better caching
          'ui-motion': ['framer-motion'],
          'ui-icons': ['lucide-react'],
          'ui-utils': ['clsx', 'tailwind-merge'],
          
          // AI and ML libraries (largest chunk) - separate for lazy loading
          'ai-core': ['@mlc-ai/web-llm'],
          
          // Document generation - used less frequently
          'document-gen': ['jspdf', 'html2canvas', 'gif.js'],
          
          // Data processing utilities
          'data-processing': ['papaparse', 'js-yaml', 'uuid'],
          
          // Storage and caching
          'storage-cache': ['idb', '@tanstack/react-query', 'zustand']
        },
        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[jt]sx?$/, '') || 'chunk'
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
        // Optimize entry file names
        entryFileNames: 'assets/entry-[hash].js',
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/styles-[hash].css';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    },
    // Set realistic chunk size limits
    chunkSizeWarningLimit: 800,
    // Disable source maps in production for smaller bundle
    sourcemap: false,
    // Enable asset inlining for small files
    assetsInlineLimit: 4096,
    // Enable CSS code splitting
    cssCodeSplit: true
  },
  server: {
    port: 3000,
    open: true,
    // Enable HMR for better development experience
    hmr: {
      overlay: true
    }
  },
  // Production optimizations
  esbuild: {
    drop: ['console', 'debugger'],
    pure: ['console.log', 'console.debug', 'console.info']
  }
});