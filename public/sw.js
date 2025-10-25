/**
 * Service Worker - パフォーマンス最適化とオフライン対応
 */

const CACHE_NAME = 'murder-mystery-v1.2.0';
const STATIC_CACHE = 'static-v1.2.0';

// キャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/ultra-modern-styles.css',
  '/css/components.css',
  '/js/core-app.js',
  '/js/ui-improvements.js',
  '/manifest.json'
];

// インストール時
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 古いキャッシュをクリーンアップ
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// リクエスト処理
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API リクエストは常にネットワークから
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'オフラインです。インターネット接続を確認してください。' 
          }),
          { 
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      })
    );
    return;
  }

  // 静的アセットのキャッシュ戦略
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // サポートされていないスキームを除外
        if (url.protocol === 'chrome-extension:' || 
            url.protocol === 'moz-extension:' ||
            url.protocol === 'ms-browser-extension:' ||
            url.protocol === 'safari-extension:') {
          return response;
        }
        
        // 外部リソース（フォントなど）はキャッシュしない
        if (url.hostname !== location.hostname) {
          return response;
        }
        
        // レスポンスが有効で、同一オリジンの場合のみキャッシュ
        if (response.status === 200 && response.ok) {
          try {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone).catch(_error => {
                // キャッシュエラーは静かに無視
              });
            });
          } catch (e) {
            // Cloneエラーも静かに無視
          }
        }
        return response;
      }).catch(() => {
        // ネットワークエラー時のフォールバック
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});