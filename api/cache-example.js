/**
 * 動的キャッシュシステムの使用例
 */

const { cacheManager } = require('./utils/cache-manager');
const { withCache, cacheMiddleware } = require('./utils/cache-migration');

/**
 * APIエンドポイントでの使用例
 */
exports.handler = async (event, context) => {
  // 1. 基本的なキャッシュの使用
  const cacheKey = 'api:data:' + event.path;
  
  // キャッシュから取得を試みる
  const cachedData = cacheManager.get(cacheKey, 'api');
  if (cachedData) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT'
      },
      body: JSON.stringify(cachedData)
    };
  }
  
  // データを生成（実際のAPI処理）
  const data = await generateExpensiveData();
  
  // キャッシュに保存（サイズを指定可能）
  cacheManager.set(cacheKey, data, 'api', estimateDataSize(data));
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Cache': 'MISS'
    },
    body: JSON.stringify(data)
  };
};

/**
 * 高価な処理をキャッシュでラップ
 */
const cachedDatabaseQuery = withCache(
  async (query, params) => {
    // 実際のデータベースクエリ
    console.log('Executing database query:', query);
    return { results: [], query, params };
  },
  {
    cacheName: 'api',
    keyGenerator: (query, params) => `db:${query}:${JSON.stringify(params)}`,
    ttl: 300000 // 5分
  }
);

/**
 * カスタムキャッシュの作成例
 */
async function setupCustomCache() {
  // セッション用のキャッシュを作成
  cacheManager.createCache('sessions', {
    maxSize: 1000,
    maxMemoryMB: 100,
    ttl: 1800000, // 30分
    enableMemoryMonitoring: true,
    enableDynamicResizing: false // セッションは固定サイズ
  });
  
  // 画像処理用のキャッシュを作成
  cacheManager.createCache('images', {
    maxSize: 50,
    maxMemoryMB: 500, // 画像は大きいので多めに
    ttl: 86400000, // 24時間
    enableMemoryMonitoring: true,
    enableDynamicResizing: true
  });
}

/**
 * キャッシュウォームアップの例
 */
async function warmupCache() {
  // よく使われるデータを事前にロード
  await cacheManager.warmup('api', async () => {
    const popularData = {
      'api:data:/popular/1': { id: 1, name: 'Popular Item 1' },
      'api:data:/popular/2': { id: 2, name: 'Popular Item 2' },
      'api:data:/popular/3': { id: 3, name: 'Popular Item 3' }
    };
    return popularData;
  });
}

/**
 * キャッシュ統計の監視例
 */
function monitorCachePerformance() {
  setInterval(() => {
    const stats = cacheManager.getAllStats();
    const health = cacheManager.healthCheck();
    
    // ヒット率が低い場合の警告
    Object.entries(stats.caches).forEach(([name, cache]) => {
      const hitRate = parseFloat(cache.hitRate);
      if (hitRate < 30 && cache.hits + cache.misses > 100) {
        console.warn(`Cache ${name} has low hit rate: ${cache.hitRate}`);
      }
    });
    
    // メモリ使用量が高い場合の自動最適化
    if (!health.healthy) {
      console.log('Cache health issues detected:', health.issues);
      cacheManager.optimizeMemory();
    }
  }, 300000); // 5分ごと
}

/**
 * Express.jsでの使用例
 */
function setupExpressCache(app) {
  // グローバルキャッシュミドルウェア
  app.use('/api/data', cacheMiddleware('api', (req) => {
    // カスタムキー生成
    return `${req.method}:${req.path}:${JSON.stringify(req.query)}`;
  }));
  
  // 特定のルート用キャッシュ
  app.get('/api/expensive-operation', 
    cacheMiddleware('api'),
    async (req, res) => {
      const result = await performExpensiveOperation();
      res.json(result);
    }
  );
  
  // キャッシュ管理エンドポイント
  app.use('/api/cache', require('./utils/cache-migration').cacheManagementEndpoints());
}

/**
 * ヘルパー関数
 */
async function generateExpensiveData() {
  // シミュレート: 時間のかかる処理
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    timestamp: Date.now(),
    data: Array(10).fill(0).map((_, i) => ({
      id: i,
      value: Math.random()
    }))
  };
}

function estimateDataSize(data) {
  // 簡易的なサイズ推定（KB単位）
  const jsonString = JSON.stringify(data);
  return Math.ceil(jsonString.length / 1024);
}

async function performExpensiveOperation() {
  await new Promise(resolve => setTimeout(resolve, 200));
  return { result: 'expensive operation completed' };
}

/**
 * 使用方法のドキュメント
 */
const USAGE_EXAMPLES = `
# 動的キャッシュシステムの使用方法

## 1. 基本的な使用
const { cacheManager } = require('./utils/cache-manager');

// 値を設定
cacheManager.set('key', 'value', 'cacheName');

// 値を取得
const value = cacheManager.get('key', 'cacheName');

## 2. カスタムキャッシュの作成
cacheManager.createCache('myCache', {
  maxSize: 200,
  maxMemoryMB: 100,
  ttl: 600000, // 10分
  enableDynamicResizing: true
});

## 3. 関数のキャッシュ化
const cachedFunction = withCache(originalFunction, {
  cacheName: 'api',
  keyGenerator: (...args) => generateKey(args),
  ttl: 300000
});

## 4. Express.jsミドルウェア
app.use('/api', cacheMiddleware('api'));

## 5. 統計情報の取得
const stats = cacheManager.getAllStats();
console.log('Hit rate:', stats.global.avgHitRate);

## 6. メモリ最適化
const result = cacheManager.optimizeMemory();

## 7. ヘルスチェック
const health = cacheManager.healthCheck();
if (!health.healthy) {
  console.log('Issues:', health.issues);
}
`;

// エクスポート
module.exports = {
  handler: exports.handler,
  cachedDatabaseQuery,
  setupCustomCache,
  warmupCache,
  monitorCachePerformance,
  setupExpressCache,
  USAGE_EXAMPLES
};