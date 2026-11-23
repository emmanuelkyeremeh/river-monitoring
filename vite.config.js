import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [{
    name: 'offline-app-shell',
    generateBundle(_options, bundle) {
      const paths = ['/', '/index.html', '/pra-river.webp', '/pra-comparison.jpg', ...Object.keys(bundle).map(path => '/' + path)];
      const release = Object.keys(bundle).join('|');
      this.emitFile({
        type: 'asset', fileName: 'sw.js', source: `
const cacheName = ${JSON.stringify('river-monitoring:' + release)};
const assets = ${JSON.stringify(paths)};
self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('river-monitoring:') && key !== cacheName)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (event.request.mode !== 'navigate' && !assets.includes(url.pathname)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.open(cacheName).then(cache => cache.match('/index.html'))));
    return;
  }
  event.respondWith(caches.open(cacheName).then(async cache => (await cache.match(url.pathname)) || fetch(event.request)));
});
`,
      });
    },
  }],
});
