/**
 * シンプルなパフォーマンス最適化
 */

// 動的キャッシュシステムを使用
const { cacheManager } = require('./cache-manager');

// シンプルなキャッシュ実装（後方互換性のため）
class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    this.cache.set(key, value);
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }
}

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