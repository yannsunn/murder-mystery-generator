/**
 * 🔧 Offline Service Worker - オフライン対応専用Service Worker
 * キャッシュ戦略とバックグラウンド同期
 */

const CACHE_NAME = 'murder-mystery-offline-v2';
const ESSENTIAL_CACHE_NAME = 'murder-mystery-essential-v2';
const API_CACHE_NAME = 'murder-mystery-api-v2';

// キャッシュ対象ファイル
const ESSENTIAL_FILES = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/main.js',
  '/js/offline-enhancement-engine.js',
  '/js/advanced-cache-engine.js',
  '/js/smart-suggestion-system.js',
  '/js/parallel-worker-manager.js',
  '/js/workers/ai-processing-worker.js',
  '/manifest.json'
];

const STATIC_RESOURCES = [
  '/assets/icons/',
  '/images/',
  '/fonts/'
];

// API エンドポイント
const API_ENDPOINTS = [
  '/api/generate',
  '/api/ping'
];

/**
 * Service Worker インストール
 */
self.addEventListener('install', (event) => {
  // Service Worker installing - debug log removed for production
  
  event.waitUntil(
    Promise.all([
      // 必須ファイルのキャッシュ
      caches.open(ESSENTIAL_CACHE_NAME).then(cache => {
        return cache.addAll(ESSENTIAL_FILES);
      }),
      
      // 即座にアクティベート
      self.skipWaiting()
    ])
  );
});

/**
 * Service Worker アクティベート
 */
self.addEventListener('activate', (event) => {
  // Service Worker activating - debug log removed for production
  
  event.waitUntil(
    Promise.all([
      // 古いキャッシュの削除
      cleanupOldCaches(),
      
      // 全てのクライアントを制御
      self.clients.claim()
    ])
  );
});

/**
 * フェッチイベント処理
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // APIリクエストの処理
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // 静的リソースの処理
  if (isStaticResource(request)) {
    event.respondWith(handleStaticResource(request));
    return;
  }
  
  // HTMLページの処理
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }
  
  // その他のリクエスト
  event.respondWith(handleOtherRequests(request));
});

/**
 * メッセージイベント処理
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
  case 'CACHE_RESOURCE':
    cacheResource(data.url, data.cacheName);
    break;
      
  case 'CLEAR_CACHE':
    clearCache(data.cacheName);
    break;
      
  case 'GET_CACHE_STATUS':
    getCacheStatus().then(status => {
      event.ports[0].postMessage(status);
    });
    break;
      
  default:
      // Unknown message type - debug log removed for production
  }
});

/**
 * バックグラウンド同期
 */
self.addEventListener('sync', (event) => {
  // Background sync triggered - debug log removed for production
  
  if (event.tag === 'sync-offline-data') {
    event.waitUntil(syncOfflineData());
  }
});

/**
 * APIリクエスト処理
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // まずネットワークを試行
    const networkResponse = await fetch(request.clone());
    
    if (networkResponse.ok) {
      // 成功したレスポンスをキャッシュ
      if (request.method === 'GET') {
        const cache = await caches.open(API_CACHE_NAME);
        cache.put(request.clone(), networkResponse.clone());
      }
      
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    // Network failed, trying cache - debug log removed for production
    
    // ネットワーク失敗時はキャッシュから取得
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // キャッシュもない場合のフォールバック
    return createOfflineFallbackResponse(request);
  }
}

/**
 * 静的リソース処理
 */
async function handleStaticResource(request) {
  // Cache First 戦略
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // レスポンスをキャッシュ
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.clone(), networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // Failed to fetch static resource - debug log removed for production
    
    // 代替リソースまたはエラーレスポンス
    return new Response('Resource unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

/**
 * ナビゲーション処理
 */
async function handleNavigation(request) {
  // Network First 戦略（HTMLページ）
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 成功したページをキャッシュ
      const cache = await caches.open(CACHE_NAME);
      cache.put(request.clone(), networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    // Navigation network failed, using cache - debug log removed for production
    
    // キャッシュからページを取得
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // フォールバックページ
    return caches.match('/index.html');
  }
}

/**
 * その他のリクエスト処理
 */
async function handleOtherRequests(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

/**
 * オフラインフォールバックレスポンス作成
 */
function createOfflineFallbackResponse(request) {
  const url = new URL(request.url);
  
  // APIエンドポイント別のフォールバック
  switch (url.pathname) {
  case '/api/generate':
    return new Response(JSON.stringify({
      success: false,
      offline: true,
      message: 'オフライン生成機能を使用してください',
      fallback: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
      
  case '/api/ping':
    return new Response('offline', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    });
      
  default:
    return new Response(JSON.stringify({
      error: 'Service unavailable offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * 静的リソース判定
 */
function isStaticResource(request) {
  const url = new URL(request.url);
  
  return STATIC_RESOURCES.some(pattern => 
    url.pathname.startsWith(pattern)
  ) || /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico)$/.test(url.pathname);
}

/**
 * 古いキャッシュのクリーンアップ
 */
async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [CACHE_NAME, ESSENTIAL_CACHE_NAME, API_CACHE_NAME];
  
  const deletionPromises = cacheNames
    .filter(cacheName => !currentCaches.includes(cacheName))
    .map(cacheName => {
      // Deleting old cache - debug log removed for production
      return caches.delete(cacheName);
    });
  
  return Promise.all(deletionPromises);
}

/**
 * リソースキャッシュ
 */
async function cacheResource(url, cacheName = CACHE_NAME) {
  try {
    const cache = await caches.open(cacheName);
    await cache.add(url);
    // Cached resource - debug log removed for production
  } catch (error) {
  }
}

/**
 * キャッシュクリア
 */
async function clearCache(cacheName) {
  try {
    await caches.delete(cacheName);
  } catch (error) {
  }
}

/**
 * キャッシュ状態取得
 */
async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = {
      size: keys.length,
      urls: keys.map(req => req.url)
    };
  }
  
  return status;
}

/**
 * オフラインデータ同期
 */
async function syncOfflineData() {
  
  try {
    // IndexedDBからsync待ちデータを取得
    const syncData = await getSyncPendingData();
    
    for (const item of syncData) {
      try {
        await syncSingleItem(item);
        await markItemAsSynced(item.id);
      } catch (error) {
      }
    }
    
    // 同期完了をクライアントに通知
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'background_sync',
        synced: syncData.length
      });
    });
    
  } catch (error) {
  }
}

/**
 * 同期待ちデータ取得
 */
async function getSyncPendingData() {
  // 実際のプロダクションではIndexedDBから取得
  return [];
}

/**
 * 単一アイテム同期
 */
async function syncSingleItem(item) {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item)
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * アイテムを同期済みとしてマーク
 */
async function markItemAsSynced(itemId) {
  // 実際のプロダクションではIndexedDBを更新
}

/**
 * プリキャッシュ戦略
 */
async function precacheResources() {
  const cache = await caches.open(CACHE_NAME);
  
  // 重要なリソースを事前キャッシュ
  const precacheUrls = [
    '/api/templates.json',
    '/api/config.json'
  ];
  
  for (const url of precacheUrls) {
    try {
      await cache.add(url);
    } catch (error) {
    }
  }
}

// 初期化時に事前キャッシュを実行
self.addEventListener('install', (event) => {
  event.waitUntil(precacheResources());
});

