const CACHE_NAME = 'carles-farm-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/src/styles.css',
  '/assets/logo-full.svg',
  '/assets/logo-mark.svg',
  '/assets/logo-wordmark.svg',
  '/assets/favicon.svg',
  '/assets/login-hero.svg',
  '/manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).catch(() => null));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(match => match || caches.match('/index.html'))));
});
