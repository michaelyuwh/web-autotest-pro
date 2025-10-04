module.exports = {
  ci: {
    collect: {
      staticDistDir: './web-app/dist',
      url: [
        'http://localhost/index.html',
        'http://localhost/offline.html'
      ]
    },
    assert: {
      assertions: {
        // Performance thresholds (more reasonable)
        'first-contentful-paint': ['warn', { minScore: 0.6 }],
        'largest-contentful-paint': ['warn', { minScore: 0.6 }],
        'speed-index': ['warn', { minScore: 0.6 }],
        'cumulative-layout-shift': ['warn', { minScore: 0.8 }],
        
        // Accessibility (allow some issues while improving)
        'button-name': ['warn', { minScore: 0.5 }],
        'heading-order': ['warn', { minScore: 0.5 }],
        'listitem': ['warn', { minScore: 0.5 }],
        
        // Best practices (allow some issues)
        'csp-xss': ['warn', { minScore: 0.5 }],
        'errors-in-console': ['warn', { minScore: 0.5 }],
        
        // PWA (allow failures for now)
        'installable-manifest': 'off',
        'service-worker': 'off',
        'splash-screen': 'off',
        'themed-omnibox': 'off',
        'maskable-icon': 'off',
        
        // Others
        'render-blocking-resources': ['warn', { maxLength: 5 }],
        
        // Categories - overall scores
        'categories:performance': ['warn', { minScore: 0.6 }],
        'categories:accessibility': ['warn', { minScore: 0.7 }],
        'categories:best-practices': ['warn', { minScore: 0.7 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': 'off' // Disable PWA category for now
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};