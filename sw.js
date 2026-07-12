const CACHE_NAME = 'idb-app-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/dark.css',
    '/css/components.css',
    '/js/app.js',
    '/js/router.js',
    '/js/database/DatabaseManager.js',
    '/js/components/Sidebar.js',
    '/js/components/Header.js',
    '/js/components/Toast.js',
    '/js/components/Modal.js',
    '/js/components/Popup.js',
    '/js/components/ContextMenu.js',
    '/js/pages/Dashboard.js',
    '/js/pages/Notes.js',
    '/js/pages/Settings.js',
    '/js/pages/Users.js',
    '/js/utils/helpers.js',
    '/js/utils/virtualList.js',
    '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache opened');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activate Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch with cache first strategy
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(
                    response => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        return response;
                    }
                );
            })
    );
});
