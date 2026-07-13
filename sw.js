/* くみ弁 — オフラインでも画面が開くようにするための仕組み（Service Worker）
   ・画面のファイルだけを保存する
   ・データのやり取り（Apps Script）は保存しない（いつも新しい数字を取りに行く）      */

const CACHE = 'kumiben-v1';
const SHELL = [
  './',
  './index.html',
  './config.js',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // 保存の通信はそのまま通す
  if (req.url.indexOf('script.google') >= 0) return;      // データ通信は触らない

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
