const swVersion = '0.0.1';
var cacheName = 'asm-experience-v0.3';
var appShellFiles = [
    'controls.js',
    'index.html',
    'styles.css',
    'montserrat.css',
    'reset.css',
    'assets/images/asm-experience.png',
    'assets/images/cgi.png',
];
var contentToCache = appShellFiles;

const addResourcesToCache = async () => {
    const cache = await caches.open(cacheName);
    console.log('[Service Worker] Mise en cache global');
    await cache.addAll(contentToCache);
};


self.addEventListener('install', function(e) {
    console.log('[Service Worker] Installation');
    e.waitUntil(
        addResourcesToCache()
    );
});

self.addEventListener('activate', function(event) {
  console.log('[Service Worker] Claiming control');
  event.waitUntil(deleteOldCaches());
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

const deleteCache = async (key) => {
  await caches.delete(key);
};

const deleteOldCaches = async () => {
  const keyList = await caches.keys();
  const cachesToDelete = keyList.filter((key) => cacheName != key);
  console.log('[Service Worker] Deleting caches', cachesToDelete);
  await Promise.all(cachesToDelete.map(deleteCache));
};

console.log('[Service Worker] Listener registered');
