const CACHE_NAME = 'pointify-v6';
const CORE_ASSETS = [
  './',
  './index.html',
  './app.html',
  './manifest.json',
  './js/db.js',
  './js/auth.js',
  './js/pos.js',
  './js/inventory.js',
  './js/reports.js',
  './js/settings.js'
];

const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://cdn-icons-png.flaticon.com/512/3144/3144456.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force immediate activation
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Critical Assets - Must succeed
      await cache.addAll(CORE_ASSETS);

      // External Assets - Try best effort (don't fail install if offline/CORS issues)
      try {
        await Promise.all(
          EXTERNAL_ASSETS.map(url =>
            fetch(url, { mode: 'no-cors' }) // Handle opaque responses
              .then(res => cache.put(url, res))
              .catch(e => console.warn('Failed to cache external:', url))
          )
        );
      } catch (e) {
        console.warn('External assets caching incomplete');
      }
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      clients.claim(), // Take control of all clients immediately
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) return caches.delete(key);
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Add to cache for future use
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
