/**
 * 動的調整機能を持つLRUキャッシュシステム
 */

const os = require('os');

/**
 * LRUキャッシュノード
 */
class CacheNode {
  constructor(key, value, size = 1) {
    this.key = key;
    this.value = value;
    this.size = size;
    this.prev = null;
    this.next = null;
    this.accessCount = 0;
    this.lastAccessed = Date.now();
  }
}

/**
 * 動的調整機能を持つLRUキャッシュ
 */
class DynamicLRUCache {
  constructor(options = {}) {
    // 設定
    this.maxSize = options.maxSize || 100;
    this.maxMemoryMB = options.maxMemoryMB || 50;
    this.minSize = options.minSize || 10;
    this.ttl = options.ttl || 3600000; // 1時間
    this.enableMemoryMonitoring = options.enableMemoryMonitoring !== false;
    this.enableDynamicResizing = options.enableDynamicResizing !== false;
    this.memoryCheckInterval = options.memoryCheckInterval || 60000; // 1分
    
    // 内部データ構造
    this.cache = new Map();
    this.head = new CacheNode(null, null);
    this.tail = new CacheNode(null, null);
    this.head.next = this.tail;
    this.tail.prev = this.head;
    
    // 統計情報
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      memoryUsageMB: 0,
      totalSize: 0,
      averageAccessTime: 0,
      lastMemoryCheck: Date.now(),
      resizeEvents: []
    };
    
    // メモリ監視タイマー
    if (this.enableMemoryMonitoring) {
      this.startMemoryMonitoring();
    }
  }

  /**
   * キャッシュから値を取得
   */
  get(key) {
    const node = this.cache.get(key);
    
    if (!node) {
      this.stats.misses++;
      return null;
    }
    
    // TTLチェック
    if (this.ttl && Date.now() - node.lastAccessed > this.ttl) {
      this.remove(key);
      this.stats.misses++;
      return null;
    }
    
    // 統計更新
    this.stats.hits++;
    node.accessCount++;
    node.lastAccessed = Date.now();
    
    // LRU: 最近使用したノードを先頭に移動
    this.moveToHead(node);
    
    return node.value;
  }

  /**
   * キャッシュに値を設定
   */
  set(key, value, size = 1) {
    let node = this.cache.get(key);
    
    if (node) {
      // 既存のキーを更新
      this.stats.totalSize -= node.size;
      node.value = value;
      node.size = size;
      node.lastAccessed = Date.now();
      this.moveToHead(node);
    } else {
      // 新しいキーを追加
      node = new CacheNode(key, value, size);
      this.cache.set(key, node);
      this.addToHead(node);
    }
    
    this.stats.totalSize += size;
    
    // サイズ制限チェック
    while (this.cache.size > this.maxSize || 
           (this.enableMemoryMonitoring && this.getEstimatedMemoryMB() > this.maxMemoryMB)) {
      this.evictLRU();
    }
  }

  /**
   * キャッシュから削除
   */
  remove(key) {
    const node = this.cache.get(key);
    if (!node) return false;
    
    this.removeNode(node);
    this.cache.delete(key);
    this.stats.totalSize -= node.size;
    return true;
  }

  /**
   * キャッシュをクリア
   */
  clear() {
    this.cache.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.stats.totalSize = 0;
    this.stats.evictions = 0;
  }

  /**
   * キャッシュサイズを取得
   */
  size() {
    return this.cache.size;
  }

  /**
   * キャッシュ統計を取得
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100
      : 0;
    
    return {
      ...this.stats,
      hitRate: hitRate.toFixed(2) + '%',
      size: this.cache.size,
      maxSize: this.maxSize,
      memoryUsageMB: this.getEstimatedMemoryMB().toFixed(2),
      systemMemory: this.getSystemMemoryInfo()
    };
  }

  /**
   * キャッシュポリシーを動的に調整
   */
  adjustCachePolicy(options) {
    if (options.maxSize !== undefined) {
      this.maxSize = Math.max(this.minSize, options.maxSize);
    }
    if (options.maxMemoryMB !== undefined) {
      this.maxMemoryMB = options.maxMemoryMB;
    }
    if (options.ttl !== undefined) {
      this.ttl = options.ttl;
    }
    
    // サイズ調整後のクリーンアップ
    this.enforceConstraints();
  }

  /**
   * ノードを先頭に追加
   */
  addToHead(node) {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next.prev = node;
    this.head.next = node;
  }

  /**
   * ノードを削除
   */
  removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  /**
   * ノードを先頭に移動
   */
  moveToHead(node) {
    this.removeNode(node);
    this.addToHead(node);
  }

  /**
   * LRUアイテムを削除
   */
  evictLRU() {
    const lru = this.tail.prev;
    if (lru === this.head) return;
    
    this.removeNode(lru);
    this.cache.delete(lru.key);
    this.stats.totalSize -= lru.size;
    this.stats.evictions++;
  }

  /**
   * メモリ使用量の推定（MB）
   */
  getEstimatedMemoryMB() {
    // 簡易的な推定: 各エントリーを1KBと仮定し、sizeプロパティで調整
    const estimatedKB = this.stats.totalSize;
    return estimatedKB / 1024;
  }

  /**
   * システムメモリ情報を取得
   */
  getSystemMemoryInfo() {
    const totalMem = os.totalmem() / 1024 / 1024; // MB
    const freeMem = os.freemem() / 1024 / 1024; // MB
    const usedMem = totalMem - freeMem;
    const usagePercent = (usedMem / totalMem) * 100;
    
    return {
      totalMB: totalMem.toFixed(2),
      freeMB: freeMem.toFixed(2),
      usedMB: usedMem.toFixed(2),
      usagePercent: usagePercent.toFixed(2) + '%'
    };
  }

  /**
   * メモリ監視を開始
   */
  startMemoryMonitoring() {
    this.memoryMonitorInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, this.memoryCheckInterval);
  }

  /**
   * メモリ監視を停止
   */
  stopMemoryMonitoring() {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = null;
    }
  }

  /**
   * メモリ使用量をチェックし、必要に応じてキャッシュサイズを調整
   */
  checkMemoryUsage() {
    const memInfo = this.getSystemMemoryInfo();
    const usagePercent = parseFloat(memInfo.usagePercent);
    
    this.stats.lastMemoryCheck = Date.now();
    this.stats.memoryUsageMB = this.getEstimatedMemoryMB();
    
    if (!this.enableDynamicResizing) return;
    
    // メモリ使用率に基づいてキャッシュサイズを調整
    if (usagePercent > 85) {
      // メモリ逼迫時: キャッシュサイズを削減
      const newSize = Math.max(this.minSize, Math.floor(this.maxSize * 0.7));
      if (newSize < this.maxSize) {
        this.stats.resizeEvents.push({
          timestamp: Date.now(),
          action: 'shrink',
          oldSize: this.maxSize,
          newSize: newSize,
          reason: `High memory usage: ${usagePercent}%`
        });
        this.maxSize = newSize;
        this.enforceConstraints();
      }
    } else if (usagePercent < 50 && this.stats.hitRate > 80) {
      // メモリに余裕があり、ヒット率が高い場合: キャッシュサイズを拡大
      const newSize = Math.min(this.maxSize * 1.3, this.maxSize + 50);
      if (newSize > this.maxSize) {
        this.stats.resizeEvents.push({
          timestamp: Date.now(),
          action: 'grow',
          oldSize: this.maxSize,
          newSize: Math.floor(newSize),
          reason: `Low memory usage: ${usagePercent}%, High hit rate`
        });
        this.maxSize = Math.floor(newSize);
      }
    }
    
    // 古いリサイズイベントを削除（最新10件のみ保持）
    if (this.stats.resizeEvents.length > 10) {
      this.stats.resizeEvents = this.stats.resizeEvents.slice(-10);
    }
  }

  /**
   * 制約を適用
   */
  enforceConstraints() {
    while (this.cache.size > this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * キャッシュの詳細情報を取得
   */
  getDetailedInfo() {
    const entries = [];
    let current = this.head.next;
    
    while (current !== this.tail && entries.length < 10) {
      entries.push({
        key: current.key,
        size: current.size,
        accessCount: current.accessCount,
        lastAccessed: new Date(current.lastAccessed).toISOString(),
        age: Date.now() - current.lastAccessed
      });
      current = current.next;
    }
    
    return {
      stats: this.getStats(),
      recentEntries: entries,
      config: {
        maxSize: this.maxSize,
        minSize: this.minSize,
        maxMemoryMB: this.maxMemoryMB,
        ttl: this.ttl,
        enableMemoryMonitoring: this.enableMemoryMonitoring,
        enableDynamicResizing: this.enableDynamicResizing
      }
    };
  }

  /**
   * デストラクタ
   */
  destroy() {
    this.stopMemoryMonitoring();
    this.clear();
  }
}

/**
 * SimpleCacheとの互換性レイヤー
 */
class SimpleCacheCompat extends DynamicLRUCache {
  constructor() {
    super({
      maxSize: 100,
      enableMemoryMonitoring: true,
      enableDynamicResizing: true
    });
  }
  
  // SimpleCacheとの互換性のためのメソッド
  get(key) {
    const result = super.get(key);
    return result ? { data: result, timestamp: Date.now() } : undefined;
  }
  
  set(key, value) {
    super.set(key, value);
  }
}

// シングルトンインスタンス（SimpleCacheとの互換性）
const cache = new SimpleCacheCompat();

// エクスポート
module.exports = {
  DynamicLRUCache,
  SimpleCacheCompat,
  cache
};