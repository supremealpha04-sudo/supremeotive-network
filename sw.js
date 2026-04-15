const CACHE_NAME = 'suprememotive-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/about.html',
  '/contact.html',
  '/privacy.html',
  '/terms.html',
  '/support.html',
  '/login.html',
  '/profile.html',
  '/ebooks.html',
  '/post.html',
  '/videos.html',
  '/video-player.html',
  '/admin/admin-dashboard.html',
  '/admin/post-admin.html',
  '/admin/ebook-admin.html',
  '/admin/video-admin.html',
  '/admin/unlock-admin.html',
  '/admin/admin-quotes.html',
  '/logo.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Cache add error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Skip cross-origin requests and API calls
  if (!requestUrl.origin.startsWith(self.location.origin) ||
      requestUrl.pathname.startsWith('/api/') ||
      requestUrl.pathname.includes('supabase.co')) {
    return;
  }

  // For HTML pages – network first, fallback to cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request)
          .then(cached => {
            if (cached) return cached;
            return caches.match('/index.html');
          })
        )
    );
    return;
  }

  // For static assets – cache first, network fallback
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) return response;
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        });
      })
      .catch(() => {
        if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
          return caches.match('/logo.png');
        }
        return new Response('Offline content not available', { status: 503 });
      })
  );
});fl 