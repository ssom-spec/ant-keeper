// 개미 사육 관리 - 앱 셀 캐시용 최소 서비스워커
// 실제 데이터는 IndexedDB에 저장되며, 이 파일은 오프라인에서도 화면 자체가 열리도록 돕는 역할만 한다.
const CACHE_NAME = 'antkeeper-shell-v1';
const SHELL_FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_FILES))
      .catch((err) => console.error('[sw] 캐시 저장 실패', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // 같은 출처(앱 셀)의 파일만 캐시 우선으로 응답. 외부 CDN(pdf.js 등)은 캐시하지 않고 그대로 통과.
  if (!req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
