/* eslint-disable */
// 🌟 위 주석 한 줄이 에디터의 붉은 밑줄을 싹 없애줍니다!

const CACHE_NAME = 'calendar-pwa-v2';

const urlsToCache = [
    '/calendar/',
    '/calendar/index.html',
    '/calendar/favicon.ico'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});