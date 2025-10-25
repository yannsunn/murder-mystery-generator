/**
 * メモリ管理ユーティリティ
 * メモリリークを防ぎ、パフォーマンスを最適化
 */

const { logger } = require('./logger.js');

class MemoryManager {
  constructor() {
    this.caches = new Map();
    this.maxCacheSize = 1000;
    this.maxCacheAge = 3600000; // 1時間
    this.cleanupInterval = 300000; // 5分ごと
    this.cleanupTimer = null;
    
    // 自動クリーンアップを開始
    this.startAutoCleanup();
  }

  /**
   * キャッシュを追加（サイズ制限付き）
   */
  addToCache(cacheName, key, value) {
    if (!this.caches.has(cacheName)) {
      this.caches.set(cacheName, new Map());
    }
    
    const cache = this.caches.get(cacheName);
    
    // サイズ制限チェック
    if (cache.size >= this.maxCacheSize) {
      // 最も古いエントリを削除
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  /**
   * キャッシュから取得
   */
  getFromCache(cacheName, key) {
    const cache = this.caches.get(cacheName);
    if (!cache) {return null;}
    
    const entry = cache.get(key);
    if (!entry) {return null;}
    
    // 期限切れチェック
    if (Date.now() - entry.timestamp > this.maxCacheAge) {
      cache.delete(key);
      return null;
    }
    
    return entry.value;
  }

  /**
   * 特定のキャッシュをクリア
   */
  clearCache(cacheName) {
    if (this.caches.has(cacheName)) {
      this.caches.get(cacheName).clear();
    }
  }

  /**
   * すべてのキャッシュをクリア
   */
  clearAllCaches() {
    this.caches.forEach(cache => cache.clear());
    this.caches.clear();
  }

  /**
   * 古いエントリをクリーンアップ
   */
  cleanupOldEntries() {
    let cleaned = 0;

    this.caches.forEach((cache) => {
      const now = Date.now();
      const keysToDelete = [];
      
      cache.forEach((entry, key) => {
        if (now - entry.timestamp > this.maxCacheAge) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        cache.delete(key);
        cleaned++;
      });
    });
    
    if (cleaned > 0) {
      logger.debug(`🧹 Cleaned ${cleaned} expired cache entries`);
    }
  }

  /**
   * 自動クリーンアップを開始
   */
  startAutoCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldEntries();
    }, this.cleanupInterval);
    
    // Node.jsプロセス終了時にクリーンアップ
    process.on('exit', () => {
      this.stopAutoCleanup();
    });
  }

  /**
   * 自動クリーンアップを停止
   */
  stopAutoCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * メモリ使用状況を取得
   */
  getMemoryStats() {
    const stats = {
      caches: {},
      totalEntries: 0,
      memoryUsage: process.memoryUsage()
    };
    
    this.caches.forEach((cache, name) => {
      stats.caches[name] = cache.size;
      stats.totalEntries += cache.size;
    });
    
    return stats;
  }

  /**
   * メモリ使用量が閾値を超えたらクリーンアップ
   */
  checkMemoryPressure() {
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
    
    if (heapUsedPercent > 80) {
      logger.warn(`⚠️ High memory usage detected (${heapUsedPercent.toFixed(1)}%), triggering cleanup`);
      this.cleanupOldEntries();
      
      // それでも高い場合は一部のキャッシュをクリア
      if (heapUsedPercent > 90) {
        const cacheNames = Array.from(this.caches.keys());
        const toClean = Math.floor(cacheNames.length / 2);
        
        for (let i = 0; i < toClean; i++) {
          this.clearCache(cacheNames[i]);
        }
      }
    }
  }
}

// シングルトンインスタンス
const memoryManager = new MemoryManager();

module.exports = {
  memoryManager,
  MemoryManager
};