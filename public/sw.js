/**
 * 🔧 Service Worker - PWA & Performance Enhancement
 * キャッシュ戦略・オフライン対応
 */

const CACHE_NAME = 'murder-mystery-generator-v1.2.0';
const STATIC_CACHE = 'static-v1.2.0';
const DYNAMIC_CACHE = 'dynamic-v1.2.0';

// キャッシュするリソース
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/ultra-modern-styles.css',
  '/css/accessibility.css',
  '/css/mobile-responsive.css',
  '/js/input-validator.js',
  '/js/SkeletonLoader.js',
  '/js/UXEnhancer.js',
  '/js/UltraIntegratedApp.js',
  '/js/app-initializer.js',
  '/manifest.json'
];

// 外部リソースは別途処理
const EXTERNAL_FONTS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
  'https://fonts.gstatic.com'
];

// キャッシュしないパス
const NEVER_CACHE = [
  '/api/',
  '/admin/',
  '/.well-known/'
];

/**
 * 🚀 Service Worker インストール
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Caching static assets...');
        // 静的アセットを個別にキャッシュしてエラー耐性を向上
        return Promise.allSettled(
          STATIC_ASSETS.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                } else {
                  console.warn(`⚠️ Bad response for ${url}:`, response.status);
                  return null;
                }
              })
              .catch(error => {
                // Chrome拡張やCSP違反は静かに無視
                if (error.message.includes('extension') || 
                    error.message.includes('Content Security Policy')) {
                  return null;
                }
                console.warn(`⚠️ Failed to cache ${url}:`, error);
                return null;
              })
          )
        );
      })
      .then(() => {
        console.log('✅ Static assets caching completed (with possible warnings)');
        return self.skipWaiting(); // 即座にアクティブ化
      })
      .catch(error => {
        console.error('❌ Failed to cache static assets:', error);
        // エラーが発生してもService Workerの登録は続行
        return self.skipWaiting();
      })
  );
});

/**
 * 🔄 Service Worker アクティベーション
 */
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // 古いキャッシュを削除
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 全てのクライアントを制御下に置く
      self.clients.claim()
    ])
  );
});

/**
 * 📡 Fetch イベント - ネットワーク戦略
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // 安全なURLチェック
  let url;
  try {
    url = new URL(request.url);
  } catch (error) {
    console.warn('⚠️ Invalid URL, skipping:', request.url);
    return;
  }
  
  // Chrome拡張やDeveloper Toolsのリクエストを完全スキップ
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' || 
      url.protocol === 'safari-extension:' ||
      url.protocol === 'edge-extension:' ||
      url.protocol === 'ms-browser-extension:' ||
      url.hostname === 'localhost' && url.port === '9222' ||
      url.hostname.includes('extension') ||
      request.url.includes('extension://')) {
    console.log('🔇 Skipping extension request:', request.url);
    return;
  }
  
  // キャッシュしないパスをスキップ
  if (NEVER_CACHE.some(path => url.pathname.startsWith(path))) {
    return;
  }
  
  // GET リクエストのみ処理
  if (request.method !== 'GET') {
    return;
  }
  
  // 外部フォントは特別処理（CSP制約のため）
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    // 外部フォントはネットワークファーストで、失敗時は無視
    event.respondWith(
      fetch(request).catch(() => {
        console.log('📝 External font request failed, continuing without cache');
        return new Response('', { status: 404 });
      })
    );
    return;
  }
  
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        // キャッシュヒット時の戦略
        if (cachedResponse) {
          // 静的アセットはキャッシュ優先
          if (STATIC_ASSETS.includes(url.pathname)) {
            return cachedResponse;
          }
          
          // 動的コンテンツはネットワーク優先、フォールバック
          return fetch(request)
            .then(networkResponse => {
              // 成功時は新しいレスポンスをキャッシュ
              if (networkResponse.ok) {
                const responseClone = networkResponse.clone();
                caches.open(DYNAMIC_CACHE)
                  .then(cache => cache.put(request, responseClone));
              }
              return networkResponse;
            })
            .catch(() => {
              // ネットワークエラー時はキャッシュを返す
              console.log('📡 Network failed, serving from cache:', url.pathname);
              return cachedResponse;
            });
        }
        
        // キャッシュミス時はネットワークから取得
        return fetch(request)
          .then(networkResponse => {
            // 成功時はキャッシュに保存
            if (networkResponse.ok) {
              const responseClone = networkResponse.clone();
              caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(request, responseClone));
            }
            return networkResponse;
          })
          .catch(error => {
            console.error('❌ Fetch failed:', error);
            
            // HTMLページの場合はオフラインページを返す
            if (request.headers.get('accept')?.includes('text/html')) {
              return new Response(`
                <!DOCTYPE html>
                <html lang="ja">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>オフライン - Murder Mystery Generator</title>
                  <style>
                    body { 
                      font-family: Inter, sans-serif; 
                      text-align: center; 
                      padding: 2rem; 
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      min-height: 100vh;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      flex-direction: column;
                    }
                    .offline-content {
                      background: rgba(255, 255, 255, 0.1);
                      padding: 2rem;
                      border-radius: 1rem;
                      backdrop-filter: blur(10px);
                    }
                    h1 { margin-bottom: 1rem; }
                    p { margin-bottom: 1.5rem; line-height: 1.6; }
                    button {
                      background: #6d28d9;
                      color: white;
                      border: none;
                      padding: 1rem 2rem;
                      border-radius: 0.5rem;
                      cursor: pointer;
                      font-size: 1rem;
                      transition: background 0.2s;
                    }
                    button:hover { background: #5b21b6; }
                  </style>
                </head>
                <body>
                  <div class="offline-content">
                    <h1>📡 オフライン</h1>
                    <p>インターネット接続を確認して、再度お試しください。</p>
                    <p>一部の機能はオフラインでも利用可能です。</p>
                    <button onclick="window.location.reload()">🔄 再試行</button>
                  </div>
                </body>
                </html>
              `, {
                status: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              });
            }
            
            throw error;
          });
      })
  );
});

/**
 * 📨 メッセージハンドリング
 */
self.addEventListener('message', (event) => {
  const { data } = event;
  
  switch (data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(DYNAMIC_CACHE)
          .then(cache => cache.addAll(data.urls))
          .then(() => event.ports[0].postMessage({ success: true }))
          .catch(error => event.ports[0].postMessage({ success: false, error }))
      );
      break;
      
    default:
      console.log('🔔 Unknown message type:', data.type);
  }
});

/**
 * 🔄 Background Sync (将来の機能拡張用)
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('🔄 Background sync triggered');
    // 将来的にオフライン時の生成データの同期などに使用
  }
});

/**
 * 🔔 Push Notifications (将来の機能拡張用)
 */
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2'
      },
      actions: [
        {
          action: 'explore',
          title: '確認',
          icon: '/images/checkmark.png'
        },
        {
          action: 'close',
          title: '閉じる',
          icon: '/images/xmark.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification('Murder Mystery Generator', options)
    );
  }
});

console.log('🚀 Service Worker loaded successfully');