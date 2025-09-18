// ASTRAL_NOTES Service Worker for PWA functionality
const CACHE_NAME = 'astral-notes-v1.0.0';
const STATIC_CACHE_NAME = 'astral-notes-static-v1.0.0';
const RUNTIME_CACHE_NAME = 'astral-notes-runtime-v1.0.0';

// Check if we're in development mode
const isDevelopment = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Resources to cache immediately when service worker installs
const STATIC_RESOURCES = [
  '/',
  '/dashboard',
  '/projects',
  '/quick-notes',
  '/ai-writing',
  '/professional',
  '/search',
  '/offline',
  '/manifest.json'
];

// Dynamic resources that should be cached when accessed
const RUNTIME_CACHE_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
  /\/api\//
];

// Development resources to ignore
const DEV_IGNORE_PATTERNS = [
  /\?t=\d+/,  // Vite timestamp queries
  /\/@vite/,  // Vite internal
  /\/__vite_ping/,  // Vite ping
  /\/src\//,  // Source files in dev
  /\.js\?v=/,  // Vite versioned JS
  /\.css\?v=/,  // Vite versioned CSS
  /\/@id/,  // Vite virtual modules
  /\/node_modules/  // Node modules
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        // Skip caching in development mode to avoid conflicts
        if (!isDevelopment) {
          const staticCache = await caches.open(STATIC_CACHE_NAME);
          await staticCache.addAll(STATIC_RESOURCES);
          console.log('[SW] Static resources cached successfully');
        } else {
          console.log('[SW] Development mode - skipping static resource caching');
        }
        
        // Force activation of new service worker
        await self.skipWaiting();
      } catch (error) {
        console.error('[SW] Failed to cache static resources:', error);
      }
    })()
  );
});

// Activate event - cleanup old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name !== STATIC_CACHE_NAME && 
          name !== RUNTIME_CACHE_NAME &&
          name.startsWith('astral-notes-')
        );
        
        await Promise.all(
          oldCaches.map(name => caches.delete(name))
        );
        
        console.log('[SW] Old caches cleaned up:', oldCaches);
        
        // Take control of all pages
        await self.clients.claim();
        console.log('[SW] Service worker activated and claimed all clients');
      } catch (error) {
        console.error('[SW] Failed to activate service worker:', error);
      }
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // In development mode, skip dev resources to avoid conflicts with Vite
  if (isDevelopment) {
    const shouldIgnore = DEV_IGNORE_PATTERNS.some(pattern => pattern.test(request.url));
    if (shouldIgnore) {
      return; // Let Vite handle these requests
    }
  }
  
  // Handle different types of requests
  if (url.pathname.startsWith('/api/')) {
    // API requests - network first with cache fallback
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticResource(request)) {
    // Static resources - cache first (skip in development)
    if (!isDevelopment) {
      event.respondWith(handleStaticResource(request));
    }
  } else if (isRuntimeCacheable(request)) {
    // Runtime cacheable resources - stale while revalidate
    event.respondWith(handleRuntimeResource(request));
  } else {
    // Navigation requests - network first with offline fallback
    event.respondWith(handleNavigationRequest(request));
  }
});

// Network first strategy for API requests
async function handleAPIRequest(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful API responses
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('[SW] API request failed, checking cache:', request.url);
    
    // Try to return cached version
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline indicator for failed API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This feature requires an internet connection',
        offline: true 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Cache first strategy for static resources
async function handleStaticResource(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Failed to fetch static resource:', request.url);
    throw error;
  }
}

// Stale while revalidate for runtime resources
async function handleRuntimeResource(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Start network request in background
  const networkPromise = fetch(request).then(response => {
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
  return networkPromise || new Response('Offline', { status: 503 });
}

// Network first for navigation with offline fallback
async function handleNavigationRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] Navigation request failed, serving offline page');
    
    // Try to return a cached page
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    return caches.match('/offline') || new Response(
      createOfflinePage(),
      { 
        headers: { 'Content-Type': 'text/html' },
        status: 200
      }
    );
  }
}

// Helper functions
function isStaticResource(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/static/') || 
         url.pathname.includes('.js') || 
         url.pathname.includes('.css') ||
         url.pathname === '/manifest.json';
}

function isRuntimeCacheable(request) {
  return RUNTIME_CACHE_PATTERNS.some(pattern => 
    pattern.test(request.url)
  );
}

function createOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Offline - ASTRAL_NOTES</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .offline-container {
          text-align: center;
          max-width: 500px;
          background: rgba(255, 255, 255, 0.1);
          padding: 40px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        .offline-icon {
          font-size: 4rem;
          margin-bottom: 20px;
        }
        h1 { margin: 0 0 20px 0; font-size: 2rem; }
        p { margin: 0 0 30px 0; opacity: 0.9; line-height: 1.6; }
        .retry-button {
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 12px 30px;
          border-radius: 25px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s ease;
        }
        .retry-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        .features {
          margin-top: 30px;
          text-align: left;
        }
        .feature {
          margin: 10px 0;
          padding: 10px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1>You're Offline</h1>
        <p>
          No internet connection detected. Don't worry - ASTRAL_NOTES works offline too!
          Your work is automatically saved locally and will sync when you're back online.
        </p>
        
        <button class="retry-button" onclick="window.location.reload()">
          Try Again
        </button>
        
        <div class="features">
          <div class="feature">
            <strong>✍️ Continue Writing</strong><br>
            Your documents are cached and ready to edit
          </div>
          <div class="feature">
            <strong>💾 Auto-Save</strong><br>
            Changes are saved locally automatically
          </div>
          <div class="feature">
            <strong>🔄 Auto-Sync</strong><br>
            Work will sync when connection returns
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Background sync for when connection returns
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'project-sync') {
    event.waitUntil(syncProjects());
  }
});

async function syncProjects() {
  try {
    // Get pending sync data from IndexedDB or localStorage
    const pendingData = JSON.parse(localStorage.getItem('pendingSync') || '[]');
    
    for (const item of pendingData) {
      try {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
      } catch (error) {
        console.error('[SW] Failed to sync item:', error);
      }
    }
    
    // Clear pending data after successful sync
    localStorage.removeItem('pendingSync');
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  
  const options = {
    body: data.body || 'New update available',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: data.tag || 'general',
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [
      {
        action: 'open',
        title: 'Open App',
        icon: '/icon-72.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(
      data.title || 'ASTRAL_NOTES',
      options
    )
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

console.log('[SW] Service worker loaded successfully');