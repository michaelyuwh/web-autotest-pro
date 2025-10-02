// Workbox Configuration for Web AutoTest Pro PWA
// Advanced service worker configuration for offline support and caching

module.exports = {
  globDirectory: 'dist/',
  globPatterns: [
    '**/*.{html,js,css,png,jpg,jpeg,svg,ico,woff,woff2,ttf,eot}'
  ],
  swDest: 'dist/sw.js',
  ignoreURLParametersMatching: [
    /^utm_/,
    /^fbclid$/,
    /^gclid$/,
    /^_ga$/
  ],
  
  // Runtime caching strategies
  runtimeCaching: [
    // API calls - Network First with fallback
    {
      urlPattern: /^https:\/\/api\.autotest-pro\.dev\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
        backgroundSync: {
          name: 'api-background-sync',
          options: {
            maxRetentionTime: 24 * 60, // 24 hours
          },
        },
      },
    },
    
    // WebSocket connections - Network Only (cannot be cached)
    {
      urlPattern: /^wss?:\/\/.*\/ws/,
      handler: 'NetworkOnly',
    },
    
    // Static assets - Cache First
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    
    // Fonts - Cache First with long expiration
    {
      urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'fonts-cache',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    
    // JavaScript and CSS - Stale While Revalidate
    {
      urlPattern: /\.(?:js|css)$/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources-cache',
        expiration: {
          maxEntries: 60,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    
    // HTML pages - Network First with cache fallback
    {
      urlPattern: /\.(?:html)$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        networkTimeoutSeconds: 3,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    
    // External CDN resources - Stale While Revalidate
    {
      urlPattern: /^https:\/\/cdn\./,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'cdn-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    
    // Google Fonts - Cache First
    {
      urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'google-fonts-stylesheets',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    
    {
      urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-webfonts',
        expiration: {
          maxEntries: 30,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
  ],
  
  // Skip waiting to ensure immediate activation
  skipWaiting: true,
  clientsClaim: true,
  
  // Cleanup old caches
  cleanupOutdatedCaches: true,
  
  // Navigation preload for faster page loads
  navigationPreload: true,
  
  // Offline fallback
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [
    /^\/_/,
    /\/[^/?]+\.[^/]+$/,
    /^\/api\//,
  ],
  
  // Additional configuration
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
  
  // Manifest transformations
  manifestTransforms: [
    (manifestEntries) => {
      const manifest = manifestEntries.map((entry) => {
        // Add cache busting for critical files
        if (entry.url.endsWith('.js') || entry.url.endsWith('.css')) {
          return {
            ...entry,
            revision: `${entry.revision}-${Date.now()}`,
          };
        }
        return entry;
      });
      
      return { manifest };
    },
  ],
  
  // Mode-specific configuration
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  
  // Source map support for debugging
  sourceMaps: process.env.NODE_ENV !== 'production',
  
  // Additional SW features
  additionalManifestEntries: [
    {
      url: '/offline.html',
      revision: null,
    },
  ],
};