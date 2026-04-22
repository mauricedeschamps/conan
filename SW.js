// sw.js - Cache First with Network Fallback

const CACHE_NAME = 'anime-quotes-v1';
const urlsToCache = [
  './',
  '.index.html',        // 前回のHTMLファイル名（適宜修正）
  '.manifest.json',
  'https://fonts.googleapis.com/css2?family=Segoe+UI&display=swap'  // 外部フォント（任意）
  // 必要に応じて追加のCSS/JS/画像があれば列挙
];

// インストール時にキャッシュを保存
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // 新しいService Workerをすぐにアクティブにする
  self.skipWaiting();
});

// リクエストをインターセプト
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにあればそれを返す
        if (response) {
          return response;
        }
        // なければネットワークへ
        return fetch(event.request).then(
          networkResponse => {
            // 有効なレスポンスならキャッシュに追加（オプション）
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
          }
        ).catch(() => {
          // オフラインでかつキャッシュがない場合のフォールバック（ページによってはカスタムオフラインページを返す）
          // ここではシンプルにテキストエラー
          return new Response('Offline: Unable to load content.', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' })
          });
        });
      })
  );
});

// 古いキャッシュの削除
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // 即座にクライアントを制御
});