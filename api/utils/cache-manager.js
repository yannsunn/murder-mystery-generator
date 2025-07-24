/**
 * キャッシュマネージャー - 複数のキャッシュインスタンスを統合管理
 */

const { DynamicLRUCache } = require('./dynamic-cache');

/**
 * キャッシュマネージャークラス
 */
class CacheManager {
  constructor() {
    this.caches = new Map();
    this.globalStats = {
      totalHits: 0,
      totalMisses: 0,
      totalEvictions: 0,
      startTime: Date.now()
    };
    
    // デフォルトキャッシュの設定
    this.defaultConfigs = {
      general: {
        maxSize: 100,
        maxMemoryMB: 50,
        ttl: 3600000, // 1時間
        enableMemoryMonitoring: true,
        enableDynamicResizing: true
      },
      api: {
        maxSize: 200,
        maxMemoryMB: 100,
        ttl: 300000, // 5分
        enableMemoryMonitoring: true,
        enableDynamicResizing: true
      },
      session: {
        maxSize: 50,
        maxMemoryMB: 25,
        ttl: 1800000, // 30分
        enableMemoryMonitoring: true,
        enableDynamicResizing: false
      },
      static: {
        maxSize: 500,
        maxMemoryMB: 200,
        ttl: 86400000, // 24時間
        enableMemoryMonitoring: true,
        enableDynamicResizing: true
      }
    };
    
    // デフォルトキャッシュを初期化
    this.initializeDefaultCaches();
    
    // 定期的な統計収集
    this.startStatsCollection();
  }

  /**
   * デフォルトキャッシュを初期化
   */
  initializeDefaultCaches() {
    Object.entries(this.defaultConfigs).forEach(([name, config]) => {
      this.createCache(name, config);
    });
  }

  /**
   * 新しいキャッシュインスタンスを作成
   */
  createCache(name, config = {}) {
    if (this.caches.has(name)) {
      throw new Error(`Cache with name '${name}' already exists`);
    }
    
    const cache = new DynamicLRUCache(config);
    this.caches.set(name, cache);
    return cache;
  }

  /**
   * キャッシュインスタンスを取得
   */
  getCache(name = 'general') {
    const cache = this.caches.get(name);
    if (!cache) {
      throw new Error(`Cache with name '${name}' not found`);
    }
    return cache;
  }

  /**
   * 値を取得（キャッシュ名指定）
   */
  get(key, cacheName = 'general') {
    const cache = this.getCache(cacheName);
    const result = cache.get(key);
    
    // グローバル統計を更新
    if (result !== null) {
      this.globalStats.totalHits++;
    } else {
      this.globalStats.totalMisses++;
    }
    
    return result;
  }

  /**
   * 値を設定（キャッシュ名指定）
   */
  set(key, value, cacheName = 'general', size = 1) {
    const cache = this.getCache(cacheName);
    cache.set(key, value, size);
  }

  /**
   * 値を削除（キャッシュ名指定）
   */
  remove(key, cacheName = 'general') {
    const cache = this.getCache(cacheName);
    return cache.remove(key);
  }

  /**
   * 特定のキャッシュをクリア
   */
  clearCache(cacheName) {
    const cache = this.getCache(cacheName);
    cache.clear();
  }

  /**
   * すべてのキャッシュをクリア
   */
  clearAll() {
    this.caches.forEach(cache => cache.clear());
  }

  /**
   * キャッシュポリシーを更新
   */
  updateCachePolicy(cacheName, policy) {
    const cache = this.getCache(cacheName);
    cache.adjustCachePolicy(policy);
  }

  /**
   * すべてのキャッシュの統計情報を取得
   */
  getAllStats() {
    const cacheStats = {};
    let totalMemoryMB = 0;
    let totalSize = 0;
    let totalMaxSize = 0;
    
    this.caches.forEach((cache, name) => {
      const stats = cache.getStats();
      cacheStats[name] = stats;
      totalMemoryMB += parseFloat(stats.memoryUsageMB);
      totalSize += stats.size;
      totalMaxSize += stats.maxSize;
    });
    
    const uptime = Date.now() - this.globalStats.startTime;
    const avgHitRate = this.globalStats.totalHits + this.globalStats.totalMisses > 0
      ? (this.globalStats.totalHits / (this.globalStats.totalHits + this.globalStats.totalMisses)) * 100
      : 0;
    
    return {
      global: {
        ...this.globalStats,
        uptimeMs: uptime,
        uptimeHours: (uptime / 3600000).toFixed(2),
        avgHitRate: avgHitRate.toFixed(2) + '%',
        totalMemoryMB: totalMemoryMB.toFixed(2),
        totalSize,
        totalMaxSize,
        cacheCount: this.caches.size
      },
      caches: cacheStats
    };
  }

  /**
   * キャッシュの詳細情報を取得
   */
  getCacheDetails(cacheName) {
    const cache = this.getCache(cacheName);
    return cache.getDetailedInfo();
  }

  /**
   * メモリ最適化を実行
   */
  optimizeMemory() {
    const stats = this.getAllStats();
    const systemMemory = this.caches.get('general').getSystemMemoryInfo();
    const memoryUsagePercent = parseFloat(systemMemory.usagePercent);
    
    // メモリ使用率が高い場合、各キャッシュのサイズを調整
    if (memoryUsagePercent > 80) {
      this.caches.forEach((cache, name) => {
        const currentMax = cache.maxSize;
        const newMax = Math.max(cache.minSize, Math.floor(currentMax * 0.8));
        cache.adjustCachePolicy({ maxSize: newMax });
      });
      
      return {
        action: 'reduced',
        reason: 'High memory usage',
        memoryUsagePercent
      };
    }
    
    // メモリに余裕があり、ヒット率が高いキャッシュを拡張
    if (memoryUsagePercent < 50) {
      let expanded = [];
      
      this.caches.forEach((cache, name) => {
        const stats = cache.getStats();
        const hitRate = parseFloat(stats.hitRate);
        
        if (hitRate > 75) {
          const currentMax = cache.maxSize;
          const newMax = Math.floor(currentMax * 1.2);
          cache.adjustCachePolicy({ maxSize: newMax });
          expanded.push(name);
        }
      });
      
      return {
        action: 'expanded',
        expandedCaches: expanded,
        reason: 'Low memory usage and high hit rates',
        memoryUsagePercent
      };
    }
    
    return {
      action: 'none',
      reason: 'Memory usage is optimal',
      memoryUsagePercent
    };
  }

  /**
   * キャッシュウォームアップ
   */
  async warmup(cacheName, dataLoader) {
    const cache = this.getCache(cacheName);
    const data = await dataLoader();
    
    Object.entries(data).forEach(([key, value]) => {
      cache.set(key, value);
    });
    
    return {
      cacheName,
      itemsLoaded: Object.keys(data).length
    };
  }

  /**
   * 統計収集を開始
   */
  startStatsCollection() {
    // 5分ごとに統計を収集
    this.statsInterval = setInterval(() => {
      this.collectStats();
    }, 300000);
  }

  /**
   * 統計を収集
   */
  collectStats() {
    this.caches.forEach((cache, name) => {
      const stats = cache.getStats();
      // ここで統計をログに記録したり、メトリクスサービスに送信したりできます
      if (process.env.NODE_ENV === 'development') {
        process.env.NODE_ENV !== "production" && console.log(`Cache ${name} stats:`, {
          hitRate: stats.hitRate,
          size: stats.size,
          memoryMB: stats.memoryUsageMB
        });
      }
    });
  }

  /**
   * キャッシュマネージャーを破棄
   */
  destroy() {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    
    this.caches.forEach(cache => cache.destroy());
    this.caches.clear();
  }

  /**
   * キャッシュヘルスチェック
   */
  healthCheck() {
    const issues = [];
    const stats = this.getAllStats();
    
    // 各キャッシュのヘルスチェック
    this.caches.forEach((cache, name) => {
      const cacheStats = cache.getStats();
      const hitRate = parseFloat(cacheStats.hitRate);
      
      // ヒット率が低すぎる場合
      if (hitRate < 20 && cacheStats.hits + cacheStats.misses > 100) {
        issues.push({
          cache: name,
          issue: 'Low hit rate',
          hitRate: cacheStats.hitRate,
          recommendation: 'Consider adjusting TTL or cache size'
        });
      }
      
      // メモリ使用量が多すぎる場合
      if (parseFloat(cacheStats.memoryUsageMB) > cache.maxMemoryMB * 0.9) {
        issues.push({
          cache: name,
          issue: 'High memory usage',
          memoryUsageMB: cacheStats.memoryUsageMB,
          recommendation: 'Consider reducing cache size or TTL'
        });
      }
    });
    
    // システムメモリの確認
    const systemMemory = this.caches.get('general').getSystemMemoryInfo();
    if (parseFloat(systemMemory.usagePercent) > 85) {
      issues.push({
        issue: 'High system memory usage',
        systemMemoryPercent: systemMemory.usagePercent,
        recommendation: 'Consider reducing overall cache sizes'
      });
    }
    
    return {
      healthy: issues.length === 0,
      issues,
      stats
    };
  }
}

// シングルトンインスタンス
const cacheManager = new CacheManager();

// エクスポート
module.exports = {
  CacheManager,
  cacheManager
};