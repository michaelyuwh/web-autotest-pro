// Web AutoTest Pro Service Worker
// Provides offline capabilities, background sync, and push notifications

const CACHE_NAME = 'web-autotest-pro-v1';
const STATIC_CACHE_NAME = 'web-autotest-pro-static-v1';
const DYNAMIC_CACHE_NAME = 'web-autotest-pro-dynamic-v1';

// Resources to cache immediately
const CORE_CACHE_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Core app shell resources will be added by build process
];

// Resources to cache on first access
const DYNAMIC_CACHE_RESOURCES = [
  '/test-cases',
  '/execution', 
  '/recording',
  '/reports',
  '/settings',
  '/dashboard'
];

// Network-first resources (always try network first)
const NETWORK_FIRST_RESOURCES = [
  '/api/',
  '/auth/',
  '/sync/'
];

// Cache-first resources (use cache if available)
const CACHE_FIRST_RESOURCES = [
  '/icons/',
  '/images/',
  '/fonts/',
  '/static/'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache core resources
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching core resources');
        return cache.addAll(CORE_CACHE_RESOURCES);
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => 
              cacheName.startsWith('web-autotest-pro-') && 
              ![STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME].includes(cacheName)
            )
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except known APIs)
  if (url.origin !== self.location.origin) {
    return;
  }
  
  event.respondWith(handleFetch(request, url));
});

async function handleFetch(request, url) {
  const pathname = url.pathname;
  
  try {
    // Network-first strategy for API calls
    if (NETWORK_FIRST_RESOURCES.some(pattern => pathname.startsWith(pattern))) {
      return await networkFirst(request);
    }
    
    // Cache-first strategy for static assets
    if (CACHE_FIRST_RESOURCES.some(pattern => pathname.startsWith(pattern))) {
      return await cacheFirst(request);
    }
    
    // Stale-while-revalidate for app pages
    if (DYNAMIC_CACHE_RESOURCES.includes(pathname) || pathname === '/') {
      return await staleWhileRevalidate(request);
    }
    
    // Default: network with cache fallback
    return await networkWithCacheFallback(request);
    
  } catch (error) {
    console.error('[SW] Fetch error:', error);
    return await getCacheOrOfflinePage(request);
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    return cachedResponse || createOfflineResponse(request);
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return createOfflineResponse(request);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Start network request (don't await)
  const networkPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Wait for network if no cache
  return await networkPromise || createOfflineResponse(request);
}

async function networkWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || createOfflineResponse(request);
  }
}

async function getCacheOrOfflinePage(request) {
  const cachedResponse = await caches.match(request);
  return cachedResponse || createOfflineResponse(request);
}

function createOfflineResponse(request) {
  const url = new URL(request.url);
  
  // Return offline page for navigation requests
  if (request.mode === 'navigate') {
    return caches.match('/') || new Response(
      createOfflineHTML(),
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
  
  // Return JSON error for API requests
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This feature requires an internet connection'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Return generic offline response
  return new Response('Offline', { status: 503 });
}

function createOfflineHTML() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Web AutoTest Pro - Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          color: white;
          margin: 0;
          padding: 0;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .container {
          max-width: 400px;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }
        p {
          margin: 0 0 1.5rem 0;
          opacity: 0.8;
        }
        button {
          background: #3b82f6;
          color: white;
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        button:hover {
          background: #2563eb;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🔌</div>
        <h1>You're Offline</h1>
        <p>Web AutoTest Pro works best with an internet connection, but you can still access cached test cases and reports.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `;
}

// Background Sync for test data
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'test-data-sync') {
    event.waitUntil(syncTestData());
  }
  
  if (event.tag === 'execution-results-sync') {
    event.waitUntil(syncExecutionResults());
  }
});

async function syncTestData() {
  try {
    console.log('[SW] Syncing test data...');
    
    // Get pending sync data from IndexedDB
    const pendingData = await getPendingTestData();
    
    if (pendingData.length === 0) {
      console.log('[SW] No pending test data to sync');
      return;
    }
    
    // Sync each pending item
    for (const item of pendingData) {
      try {
        await syncTestDataItem(item);
        await removePendingTestData(item.id);
        console.log('[SW] Synced test data item:', item.id);
      } catch (error) {
        console.error('[SW] Failed to sync test data item:', item.id, error);
      }
    }
    
    // Notify clients of sync completion
    notifyClients('test-data-synced', { count: pendingData.length });
    
  } catch (error) {
    console.error('[SW] Test data sync failed:', error);
  }
}

async function syncExecutionResults() {
  try {
    console.log('[SW] Syncing execution results...');
    
    // Get pending execution results
    const pendingExecutions = await getPendingExecutionResults();
    
    if (pendingExecutions.length === 0) {
      console.log('[SW] No pending execution results to sync');
      return;
    }
    
    // Sync execution results
    for (const execution of pendingExecutions) {
      try {
        await syncExecutionResult(execution);
        await removePendingExecutionResult(execution.id);
        console.log('[SW] Synced execution result:', execution.id);
      } catch (error) {
        console.error('[SW] Failed to sync execution result:', execution.id, error);
      }
    }
    
    // Notify clients
    notifyClients('execution-results-synced', { count: pendingExecutions.length });
    
  } catch (error) {
    console.error('[SW] Execution results sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  const options = {
    body: 'Test execution completed',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'test-execution',
    requireInteraction: true,
    actions: [
      {
        action: 'view-results',
        title: 'View Results',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    data: {
      url: '/execution',
      timestamp: Date.now()
    }
  };
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      options.body = pushData.message || options.body;
      options.data = { ...options.data, ...pushData };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('Web AutoTest Pro', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view-results') {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/execution')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handling for client communication
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
    return;
  }
  
  if (event.data.type === 'CACHE_TEST_DATA') {
    event.waitUntil(cacheTestData(event.data.data));
    return;
  }
  
  if (event.data.type === 'REQUEST_SYNC') {
    event.waitUntil(
      self.registration.sync.register(event.data.tag || 'test-data-sync')
    );
    return;
  }
});

// Utility functions
async function notifyClients(type, data) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type, data });
  });
}

// Placeholder functions for IndexedDB operations
// These would be implemented with proper IndexedDB integration
async function getPendingTestData() {
  // Implementation would query IndexedDB for pending sync items
  return [];
}

async function syncTestDataItem(item) {
  // Implementation would send data to server
  return Promise.resolve();
}

async function removePendingTestData(id) {
  // Implementation would remove from IndexedDB
  return Promise.resolve();
}

async function getPendingExecutionResults() {
  // Implementation would query IndexedDB for pending executions
  return [];
}

async function syncExecutionResult(execution) {
  // Implementation would send execution results to server
  return Promise.resolve();
}

async function removePendingExecutionResult(id) {
  // Implementation would remove from IndexedDB
  return Promise.resolve();
}

async function cacheTestData(data) {
  // Implementation would store test data in cache
  return Promise.resolve();
}

console.log('[SW] Service worker loaded successfully');