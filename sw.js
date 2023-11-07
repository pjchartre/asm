var cacheName = 'asm-experience';
var appShellFiles = [
    'controls.js',
    'index.html',
    'sw.js',
    'styles.css',
    'reset.css',
];

const addResourcesToCache = async () => {
    const cache = await caches.open(cacheName);
    console.log('[Service Worker] Mise en cache global');
    await cache.addAll(contentToCache);
};

var contentToCache = appShellFiles;
self.addEventListener('install', function(e) {
    console.log('[Service Worker] Installation');
    e.waitUntil(
        addResourcesToCache()
    );
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Claiming control');
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    console.log('[Service Worker] Ressource récupérée '+e.request.url);
    e.respondWith(
        caches.match(e.request).then((r) => {
            console.log('[Service Worker] Récupération de la ressource: '+e.request.url);
            return r || fetch(e.request).then((response) => {
                return caches.open(cacheName).then((cache) => {
                    if(response.status !== 206 && !e.request.url.endsWith('data/content.json')) {
                        console.log('[Service Worker] Mise en cache de la nouvelle ressource: '+e.request.url);
                        cache.put(e.request, response.clone());
                    }
                    return response;
                });
            });
        })
    );
});

console.log('[Service Worker] Listener registered');
