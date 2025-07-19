/**
 * キャッシュ移行ヘルパー
 * SimpleCacheからDynamicLRUCacheへの移行をサポート
 */

const { SimpleCacheCompat, DynamicLRUCache } = require('./dynamic-cache');
const { cacheManager } = require('./cache-manager');

/**
 * SimpleCacheの互換性を保ちながら、DynamicLRUCacheに移行
 */
function migrateToAdvancedCache(existingCache) {
  const advancedCache = new SimpleCacheCompat();
  
  // 既存のキャッシュデータをコピー（もし存在すれば）
  if (existingCache && existingCache.cache && existingCache.cache instanceof Map) {
    existingCache.cache.forEach((value, key) => {
      advancedCache.set(key, value.data || value);
    });
  }
  
  return advancedCache;
}

/**
 * performance-optimizer.jsの更新用エクスポート
 */
const createSimpleCache = () => new SimpleCacheCompat();

/**
 * APIエンドポイント用のキャッシュ設定
 */
function setupAPICache(endpoint, options = {}) {
  const cacheName = `api_${endpoint}`;
  const config = {
    maxSize: options.maxSize || 100,
    maxMemoryMB: options.maxMemoryMB || 50,
    ttl: options.ttl || 300000, // 5分
    enableMemoryMonitoring: true,
    enableDynamicResizing: true,
    ...options
  };
  
  return cacheManager.createCache(cacheName, config);
}

/**
 * キャッシュミドルウェア（Express用）
 */
function cacheMiddleware(cacheName = 'api', keyGenerator = null) {
  return (req, res, next) => {
    // キーの生成
    const key = keyGenerator 
      ? keyGenerator(req)
      : `${req.method}:${req.originalUrl || req.url}`;
    
    // キャッシュから取得を試みる
    const cached = cacheManager.get(key, cacheName);
    
    if (cached) {
      // キャッシュヒット
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', key);
      
      // SimpleCacheとの互換性のため、dataプロパティをチェック
      const data = cached.data || cached;
      return res.json(data);
    }
    
    // キャッシュミス
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Cache-Key', key);
    
    // レスポンスをインターセプトしてキャッシュに保存
    const originalJson = res.json;
    res.json = function(data) {
      // レスポンスをキャッシュに保存
      if (res.statusCode === 200) {
        cacheManager.set(key, data, cacheName);
      }
      
      // 元のjsonメソッドを呼び出す
      return originalJson.call(this, data);
    };
    
    next();
  };
}

/**
 * キャッシュデコレーター（関数用）
 */
function withCache(fn, options = {}) {
  const cacheName = options.cacheName || 'general';
  const keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args));
  const ttl = options.ttl;
  
  return async function(...args) {
    const key = keyGenerator(...args);
    
    // キャッシュから取得
    const cached = cacheManager.get(key, cacheName);
    if (cached) {
      return cached.data || cached;
    }
    
    // 関数を実行
    const result = await fn.apply(this, args);
    
    // 結果をキャッシュに保存
    if (result !== null && result !== undefined) {
      cacheManager.set(key, result, cacheName);
    }
    
    return result;
  };
}

/**
 * キャッシュ統計エンドポイント（Express用）
 */
function cacheStatsEndpoint() {
  return (req, res) => {
    const stats = cacheManager.getAllStats();
    const health = cacheManager.healthCheck();
    
    res.json({
      stats,
      health,
      timestamp: new Date().toISOString()
    });
  };
}

/**
 * キャッシュ管理エンドポイント（Express用）
 */
function cacheManagementEndpoints() {
  const router = require('express').Router();
  
  // 統計情報
  router.get('/stats', cacheStatsEndpoint());
  
  // 特定のキャッシュの詳細
  router.get('/cache/:name', (req, res) => {
    try {
      const details = cacheManager.getCacheDetails(req.params.name);
      res.json(details);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });
  
  // キャッシュクリア
  router.delete('/cache/:name', (req, res) => {
    try {
      cacheManager.clearCache(req.params.name);
      res.json({ success: true, message: `Cache '${req.params.name}' cleared` });
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  });
  
  // すべてのキャッシュクリア
  router.delete('/all', (req, res) => {
    cacheManager.clearAll();
    res.json({ success: true, message: 'All caches cleared' });
  });
  
  // メモリ最適化
  router.post('/optimize', (req, res) => {
    const result = cacheManager.optimizeMemory();
    res.json(result);
  });
  
  // キャッシュポリシー更新
  router.put('/cache/:name/policy', (req, res) => {
    try {
      cacheManager.updateCachePolicy(req.params.name, req.body);
      res.json({ success: true, message: `Cache policy updated for '${req.params.name}'` });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  return router;
}

// エクスポート
module.exports = {
  migrateToAdvancedCache,
  createSimpleCache,
  setupAPICache,
  cacheMiddleware,
  withCache,
  cacheStatsEndpoint,
  cacheManagementEndpoints,
  // 既存のSimpleCacheとの互換性のため
  SimpleCache: SimpleCacheCompat,
  cache: new SimpleCacheCompat()
};