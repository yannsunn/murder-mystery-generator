/**
 * シンプルなパフォーマンス最適化
 */

// 新しい動的キャッシュシステムを使用
// const { SimpleCacheCompat } = require('./dynamic-cache'); // File removed
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

// シングルトンインスタンス（既存のコードとの互換性を維持）
// SimpleCacheCompatを直接使用して重複を削除
const cache = new SimpleCacheCompat();

// CommonJS形式でエクスポート
module.exports = {
  executeParallel,
  SimpleCache: SimpleCacheCompat, // 互換性のためSimpleCacheCompatをSimpleCacheとしてエクスポート
  cache,
  // 新しいキャッシュシステムへのアクセスも提供
  cacheManager,
  advancedCache: cache
};