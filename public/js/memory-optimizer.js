/**
 * 🧠 Memory Optimizer - 個人使用最適化
 * WeakMap + 自動GC による安定性向上
 */

class MemoryOptimizer {
  constructor() {
    this.cache = new WeakMap();
    this.objectPool = new Map();
    this.cleanupInterval = null;
    this.maxHeapSize = 50 * 1024 * 1024; // 50MB
    
    this.init();
  }

  init() {
    // 定期的なメモリチェック（5秒間隔）
    this.cleanupInterval = setInterval(() => {
      this.performOptimization();
    }, 5000);

    // ページ離脱時のクリーンアップ
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    // メモリ不足時の緊急クリーンアップ
    if ('memory' in performance) {
      this.monitorMemoryUsage();
    }
  }

  /**
   * オブジェクトプールによる再利用
   */
  getPooledObject(type, factory) {
    if (!this.objectPool.has(type)) {
      this.objectPool.set(type, []);
    }

    const pool = this.objectPool.get(type);
    
    if (pool.length > 0) {
      return pool.pop();
    }

    return factory();
  }

  /**
   * オブジェクトをプールに返却
   */
  returnToPool(type, object) {
    if (!this.objectPool.has(type)) {
      this.objectPool.set(type, []);
    }

    const pool = this.objectPool.get(type);
    
    // プールサイズ制限（メモリ効率）
    if (pool.length < 10) {
      // オブジェクトをリセット
      if (object && typeof object.reset === 'function') {
        object.reset();
      }
      pool.push(object);
    }
  }

  /**
   * WeakMapキャッシュ管理
   */
  cacheSet(obj, key, value) {
    if (!this.cache.has(obj)) {
      this.cache.set(obj, new Map());
    }
    this.cache.get(obj).set(key, value);
  }

  cacheGet(obj, key) {
    const objCache = this.cache.get(obj);
    return objCache ? objCache.get(key) : undefined;
  }

  /**
   * メモリ使用量監視
   */
  monitorMemoryUsage() {
    const checkMemory = () => {
      if (performance.memory.usedJSHeapSize > this.maxHeapSize) {
        (process.env.NODE_ENV !== 'production' || true) && console.warn('🧠 High memory usage detected, performing cleanup...');
        this.performEmergencyCleanup();
      }
    };

    // 30秒間隔でメモリチェック
    setInterval(checkMemory, 30000);
  }

  /**
   * パフォーマンス最適化実行
   */
  performOptimization() {
    try {
      // 1. オブジェクトプールの最適化
      this.optimizeObjectPools();

      // 2. DOM要素のクリーンアップ
      this.cleanupDOMReferences();

      // 3. イベントリスナーの整理
      this.cleanupEventListeners();

      // 4. 強制ガベージコレクション（可能な場合）
      if (window.gc && Math.random() < 0.1) { // 10%の確率で実行
        window.gc();
      }

    } catch (error) {
      (process.env.NODE_ENV !== 'production' || true) && console.warn('Memory optimization error:', error);
    }
  }

  /**
   * オブジェクトプール最適化
   */
  optimizeObjectPools() {
    this.objectPool.forEach((pool) => {
      // 大きすぎるプールを縮小
      if (pool.length > 20) {
        pool.splice(10);
      }
    });
  }

  /**
   * DOM参照クリーンアップ
   */
  cleanupDOMReferences() {
    // 削除されたDOM要素への参照をクリア
    const elements = document.querySelectorAll('[data-memory-tracked]');
    elements.forEach(el => {
      if (!el.isConnected) {
        // 要素が DOM から削除されている場合
        this.cache.delete(el);
      }
    });
  }

  /**
   * イベントリスナー整理
   */
  cleanupEventListeners() {
    // 古いイベントリスナーを追跡・削除
    if (window.eventListenerTracker) {
      window.eventListenerTracker.cleanup();
    }
  }

  /**
   * 緊急クリーンアップ
   */
  performEmergencyCleanup() {
    // すべてのプールをクリア
    this.objectPool.clear();
    
    // キャッシュを部分的にクリア（WeakMapは自動）
    
    // 強制ガベージコレクション
    if (window.gc) {
      window.gc();
    }

    process.env.NODE_ENV !== 'production' && console.log('🧠 Emergency memory cleanup completed');
  }

  /**
   * 完全クリーンアップ
   */
  cleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.objectPool.clear();
    
    process.env.NODE_ENV !== 'production' && console.log('🧠 Memory optimizer cleanup completed');
  }

  /**
   * メモリ使用状況取得
   */
  getMemoryStats() {
    const stats = {
      pooledObjects: 0,
      poolTypes: this.objectPool.size
    };

    this.objectPool.forEach(pool => {
      stats.pooledObjects += pool.length;
    });

    if (performance.memory) {
      stats.jsHeapSize = performance.memory.usedJSHeapSize;
      stats.jsHeapSizeLimit = performance.memory.jsHeapSizeLimit;
      stats.heapUsagePercent = Math.round(
        (stats.jsHeapSize / stats.jsHeapSizeLimit) * 100
      );
    }

    return stats;
  }
}

// グローバルインスタンス（個人使用のため）
window.memoryOptimizer = new MemoryOptimizer();

export { MemoryOptimizer };