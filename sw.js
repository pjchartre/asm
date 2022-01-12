var cacheName = 'asm-experience';
var appShellFiles = [
    'controls.js',
    'index.html',
    'sw.js',
    'styles.css',
    'reset.css',
    'assets/video/angle1.mp4',
    'assets/video/angle2.mp4',
    'assets/video/angle3.mp4',
    'assets/video/angle4.mp4',
    'assets/video/explanation.mp4',
];

var contentToCache = appShellFiles; //TODO discover resources mp4 to load
self.addEventListener('install', function(e) {
    console.log('[Service Worker] Installation');
    e.waitUntil(
        caches.open(cacheName).then((cache) => {
            console.log('[Service Worker] Mise en cache global');
            return cache.addAll(contentToCache);
        })
    );
});

self.addEventListener('fetch', (e) => {
    console.log('[Service Worker] Ressource récupérée '+e.request.url);
    e.respondWith(
        caches.match(e.request).then((r) => {
            console.log('[Service Worker] Récupération de la ressource: '+e.request.url);
            return r || fetch(e.request).then((response) => {
                return caches.open(cacheName).then((cache) => {
                    console.log('[Service Worker] Mise en cache de la nouvelle ressource: '+e.request.url);
                    cache.put(e.request, response.clone());
                    return response;
                });
            });
        })
    );
});