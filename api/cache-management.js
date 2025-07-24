/**
 * キャッシュ管理APIエンドポイント
 */

const { cacheManager } = require('./utils/cache-manager');

exports.handler = async (event, context) => {
  const path = event.path.replace(/\/api\/cache-management\/?/, '');
  const method = event.httpMethod;
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // Handle preflight
  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  try {
    let response;
    
    // ルーティング
    switch (true) {
      // GET /api/cache-management/stats - 全体統計
      case method === 'GET' && (path === 'stats' || path === ''):
        response = {
          stats: cacheManager.getAllStats(),
          health: cacheManager.healthCheck(),
          timestamp: new Date().toISOString()
        };
        break;
      
      // GET /api/cache-management/cache/{name} - 特定キャッシュの詳細
      case method === 'GET' && path.startsWith('cache/'):
        const cacheName = path.split('/')[1];
        response = cacheManager.getCacheDetails(cacheName);
        break;
      
      // DELETE /api/cache-management/cache/{name} - 特定キャッシュをクリア
      case method === 'DELETE' && path.startsWith('cache/'):
        const cacheToDelete = path.split('/')[1];
        cacheManager.clearCache(cacheToDelete);
        response = { 
          success: true, 
          message: `Cache '${cacheToDelete}' cleared`,
          timestamp: new Date().toISOString()
        };
        break;
      
      // DELETE /api/cache-management/all - すべてのキャッシュをクリア
      case method === 'DELETE' && path === 'all':
        cacheManager.clearAll();
        response = { 
          success: true, 
          message: 'All caches cleared',
          timestamp: new Date().toISOString()
        };
        break;
      
      // POST /api/cache-management/optimize - メモリ最適化
      case method === 'POST' && path === 'optimize':
        const optimizationResult = cacheManager.optimizeMemory();
        response = {
          ...optimizationResult,
          timestamp: new Date().toISOString()
        };
        break;
      
      // PUT /api/cache-management/cache/{name}/policy - キャッシュポリシー更新
      case method === 'PUT' && path.includes('/policy'):
        const policyCache = path.split('/')[1];
        const policy = JSON.parse(event.body || '{}');
        cacheManager.updateCachePolicy(policyCache, policy);
        response = { 
          success: true, 
          message: `Cache policy updated for '${policyCache}'`,
          policy,
          timestamp: new Date().toISOString()
        };
        break;
      
      // POST /api/cache-management/warmup/{name} - キャッシュウォームアップ
      case method === 'POST' && path.startsWith('warmup/'):
        const warmupCache = path.split('/')[1];
        // ここでは簡単な例として、空のデータローダーを使用
        const warmupResult = await cacheManager.warmup(warmupCache, async () => ({}));
        response = {
          ...warmupResult,
          timestamp: new Date().toISOString()
        };
        break;
      
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Not found', 
            path,
            method,
            availableEndpoints: [
              'GET /api/cache-management/stats',
              'GET /api/cache-management/cache/{name}',
              'DELETE /api/cache-management/cache/{name}',
              'DELETE /api/cache-management/all',
              'POST /api/cache-management/optimize',
              'PUT /api/cache-management/cache/{name}/policy',
              'POST /api/cache-management/warmup/{name}'
            ]
          })
        };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
    
  } catch (error) {
    (process.env.NODE_ENV !== "production" || true) && console.error('Cache management error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};