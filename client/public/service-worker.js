// Service Worker for ASTRAL_NOTES v2.0
// Enhanced with AI assistance, voice features, and advanced collaboration

const CACHE_NAME = 'astral-notes-v2';
const STATIC_CACHE = 'astral-static-v2';
const DATA_CACHE = 'astral-data-v2';
const AI_CACHE = 'astral-ai-v1';
const VOICE_CACHE = 'astral-voice-v1';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && 
                   cacheName !== STATIC_CACHE && 
                   cacheName !== DATA_CACHE;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // API requests - network first with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DATA_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Try cache on network failure
          return caches.match(request);
        })
    );
    return;
  }
  
  // Static assets - cache first with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Update cache in background
        fetch(request).then((response) => {
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response);
            });
          }
        });
        return cachedResponse;
      }
      
      return fetch(request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
      });
    })
  );
});

// Background sync for offline changes
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered');
  
  if (event.tag === 'sync-changes') {
    event.waitUntil(syncOfflineChanges());
  }
});

// Push notifications for collaboration
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update in ASTRAL_NOTES',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('ASTRAL_NOTES', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});

// Message handler for client communication
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      })
    );
  }
});

// Sync offline changes with server
async function syncOfflineChanges() {
  try {
    // Get pending changes from IndexedDB
    const db = await openDB();
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const changes = await store.getAll();
    
    // Send each change to server
    for (const change of changes) {
      const response = await fetch(change.url, {
        method: change.method,
        headers: change.headers,
        body: JSON.stringify(change.body)
      });
      
      if (response.ok) {
        // Remove from sync queue
        const deleteTx = db.transaction('sync_queue', 'readwrite');
        const deleteStore = deleteTx.objectStore('sync_queue');
        await deleteStore.delete(change.id);
      }
    }
    
    // Notify clients of successful sync
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        timestamp: Date.now()
      });
    });
  } catch (error) {
    console.error('[Service Worker] Sync failed:', error);
  }
}

// File handling for PWA file associations
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle file opens
  if (url.pathname === '/open-file' && event.request.method === 'POST') {
    event.respondWith(handleFileOpen(event.request));
    return;
  }
  
  // Cache AI responses for offline use
  if (url.pathname.includes('/api/ai/')) {
    event.respondWith(
      caches.open(AI_CACHE).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request).then(response => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }
  
  // Cache voice processing results
  if (url.pathname.includes('/api/voice/')) {
    event.respondWith(
      caches.open(VOICE_CACHE).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return fetch(event.request).then(response => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      })
    );
    return;
  }
});

// Handle file opening from OS
async function handleFileOpen(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  
  if (file) {
    const clients = await self.clients.matchAll({ type: 'window' });
    if (clients.length > 0) {
      clients[0].postMessage({
        type: 'FILE_OPEN',
        file: {
          name: file.name,
          type: file.type,
          content: await file.text()
        }
      });
      
      return Response.redirect('/', 302);
    }
  }
  
  return new Response('File handling failed', { status: 400 });
}

// Enhanced background sync for AI processing
self.addEventListener('sync', (event) => {
  if (event.tag === 'ai-processing') {
    event.waitUntil(processOfflineAIRequests());
  }
  
  if (event.tag === 'voice-transcription') {
    event.waitUntil(processOfflineVoiceRequests());
  }
});

// Process AI requests made while offline
async function processOfflineAIRequests() {
  try {
    const db = await openDB();
    const tx = db.transaction('ai_queue', 'readonly');
    const store = tx.objectStore('ai_queue');
    const requests = await store.getAll();
    
    for (const request of requests) {
      const response = await fetch('/api/ai/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.data)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Store result and notify client
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'AI_RESULT',
            requestId: request.id,
            result: result
          });
        });
        
        // Remove from queue
        const deleteTx = db.transaction('ai_queue', 'readwrite');
        await deleteTx.objectStore('ai_queue').delete(request.id);
      }
    }
  } catch (error) {
    console.error('[Service Worker] AI processing failed:', error);
  }
}

// Process voice transcription requests made while offline
async function processOfflineVoiceRequests() {
  try {
    const db = await openDB();
    const tx = db.transaction('voice_queue', 'readonly');
    const store = tx.objectStore('voice_queue');
    const requests = await store.getAll();
    
    for (const request of requests) {
      const response = await fetch('/api/voice/transcribe', {
        method: 'POST',
        body: request.audioBlob
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Notify client
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'VOICE_RESULT',
            requestId: request.id,
            transcript: result.transcript
          });
        });
        
        // Remove from queue
        const deleteTx = db.transaction('voice_queue', 'readwrite');
        await deleteTx.objectStore('voice_queue').delete(request.id);
      }
    }
  } catch (error) {
    console.error('[Service Worker] Voice processing failed:', error);
  }
}

// Open IndexedDB with enhanced stores
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AstralNotesDB', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('ai_queue')) {
        db.createObjectStore('ai_queue', { keyPath: 'id', autoIncrement: true });
      }
      
      if (!db.objectStoreNames.contains('voice_queue')) {
        db.createObjectStore('voice_queue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}