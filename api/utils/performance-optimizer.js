/**
 * シンプルなパフォーマンス最適化
 */

/**
 * 並列実行ヘルパー
 */
export async function executeParallel(tasks, maxConcurrency = 3) {
  const results = [];
  
  // タスクを並列実行（maxConcurrencyの制限付き）
  for (let i = 0; i < tasks.length; i += maxConcurrency) {
    const chunk = tasks.slice(i, i + maxConcurrency);
    const chunkResults = await Promise.allSettled(
      chunk.map(task => task())
    );
    results.push(...chunkResults);
  }
  
  return results;
}

/**
 * シンプルなメモリキャッシュ
 */
export class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100;
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    // サイズ制限チェック
    if (this.cache.size >= this.maxSize) {
      // 最初のアイテムを削除（FIFO）
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

// エクスポート
export const cache = new SimpleCache();