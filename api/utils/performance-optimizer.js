/**
 * シンプルなパフォーマンス最適化
 */

// 新しい動的キャッシュシステムを使用
const { SimpleCacheCompat } = require('./dynamic-cache');
const { cacheManager } = require('./cache-manager');

/**
 * 並列実行ヘルパー
 */
async function executeParallel(tasks, maxConcurrency = 3) {
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
 * シンプルなメモリキャッシュ（互換性のため維持、内部では動的キャッシュを使用）
 */
class SimpleCache extends SimpleCacheCompat {
  constructor() {
    super();
    // 互換性のためのプロパティ
    this.maxSize = 100;
  }

  // 互換性のためのメソッド
  size() {
    return super.size();
  }
}

// シングルトンインスタンス（既存のコードとの互換性を維持）
const cache = new SimpleCache();

// CommonJS形式でエクスポート
module.exports = {
  executeParallel,
  SimpleCache,
  cache,
  // 新しいキャッシュシステムへのアクセスも提供
  cacheManager,
  advancedCache: cache
};