/**
 * ⚡ パフォーマンス最適化システム
 * 並列生成・インテリジェントキャッシュ・ロードバランシング
 */

import crypto from 'crypto';

/**
 * 🚀 並列生成エンジン
 */
export class ParallelGenerationEngine {
  constructor(options = {}) {
    this.maxConcurrency = options.maxConcurrency || 3;
    this.timeout = options.timeout || 60000;
    this.retryAttempts = options.retryAttempts || 2;
    this.activeJobs = new Map();
    this.jobQueue = [];
  }

  /**
   * 🔄 並列生成実行
   */
  async generateConcurrently(tasks, context = {}) {
    
    try {
      // タスクを優先度と依存関係でソート
      const sortedTasks = this.sortTasksByPriority(tasks);
      
      // 独立タスクと依存タスクを分離
      const { independentTasks, dependentTasks } = this.separateTasksByDependency(sortedTasks);
      
      // 独立タスクを並列実行
      const independentResults = await this.executeIndependentTasks(independentTasks, context);
      
      // 依存タスクを順次実行（結果を使用）
      const dependentResults = await this.executeDependentTasks(dependentTasks, {
        ...context,
        ...independentResults
      });
      
      return { ...independentResults, ...dependentResults };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🎯 独立タスク並列実行
   */
  async executeIndependentTasks(tasks, context) {
    const chunks = this.chunkTasks(tasks, this.maxConcurrency);
    const results = {};
    
    for (const chunk of chunks) {
      const chunkPromises = chunk.map(task => 
        this.executeTaskWithRetry(task, context)
      );
      
      const chunkResults = await Promise.allSettled(chunkPromises);
      
      chunkResults.forEach((result, index) => {
        const task = chunk[index];
        if (result.status === 'fulfilled') {
          results[task.name] = result.value;
        } else {
          results[task.name] = { error: result.reason.message };
        }
      });
    }
    
    return results;
  }

  /**
   * 📋 依存タスク順次実行
   */
  async executeDependentTasks(tasks, context) {
    const results = {};
    
    for (const task of tasks) {
      try {
        const result = await this.executeTaskWithRetry(task, context);
        results[task.name] = result;
        
        // 次のタスクのためにコンテキストを更新
        context = { ...context, [task.name]: result };
        
      } catch (error) {
        results[task.name] = { error: error.message };
      }
    }
    
    return results;
  }

  /**
   * 🔁 リトライ付きタスク実行
   */
  async executeTaskWithRetry(task, context, attempt = 1) {
    const jobId = `${task.name}-${Date.now()}-${attempt}`;
    
    try {
      this.activeJobs.set(jobId, { task, startTime: Date.now() });
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Task ${task.name} timed out`)), this.timeout);
      });
      
      const result = await Promise.race([
        task.handler(context.formData || {}, context),
        timeoutPromise
      ]);
      
      this.activeJobs.delete(jobId);
      
      return result;
      
    } catch (error) {
      this.activeJobs.delete(jobId);
      
      if (attempt < this.retryAttempts) {
        await this.delay(1000 * attempt); // 指数バックオフ
        return this.executeTaskWithRetry(task, context, attempt + 1);
      }
      
      throw error;
    }
  }

  /**
   * 📊 タスク優先度ソート
   */
  sortTasksByPriority(tasks) {
    return tasks.sort((a, b) => {
      // 重要度が高いタスクを優先
      const priorityA = a.priority || a.weight || 0;
      const priorityB = b.priority || b.weight || 0;
      return priorityB - priorityA;
    });
  }

  /**
   * 🔗 依存関係による分離
   */
  separateTasksByDependency(tasks) {
    const independentTasks = [];
    const dependentTasks = [];
    
    tasks.forEach(task => {
      if (task.dependencies && task.dependencies.length > 0) {
        dependentTasks.push(task);
      } else {
        independentTasks.push(task);
      }
    });
    
    return { independentTasks, dependentTasks };
  }

  /**
   * 📦 タスクチャンク分割
   */
  chunkTasks(tasks, chunkSize) {
    const chunks = [];
    for (let i = 0; i < tasks.length; i += chunkSize) {
      chunks.push(tasks.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * ⏱️ 遅延ユーティリティ
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 📈 パフォーマンス統計取得
   */
  getPerformanceStats() {
    const activeJobCount = this.activeJobs.size;
    const queuedJobCount = this.jobQueue.length;
    
    return {
      activeJobs: activeJobCount,
      queuedJobs: queuedJobCount,
      maxConcurrency: this.maxConcurrency,
      averageExecutionTime: this.calculateAverageExecutionTime()
    };
  }

  calculateAverageExecutionTime() {
    // 簡略実装
    return 30000; // 30秒の仮の値
  }
}

/**
 * 🧠 インテリジェントキャッシュシステム
 */
export class IntelligentCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 3600000; // 1時間
    this.cache = new Map();
    this.accessCounts = new Map();
    this.semanticCache = new Map();
    this.compressionThreshold = options.compressionThreshold || 10000;
  }

  /**
   * 🔍 セマンティック検索付きキャッシュ取得
   */
  async get(key, semanticKey = null) {
    // 完全一致キャッシュチェック
    const exactMatch = this.getExactMatch(key);
    if (exactMatch) {
      this.updateAccessCount(key);
      return exactMatch;
    }

    // セマンティック類似キャッシュチェック
    if (semanticKey) {
      const similarMatch = await this.findSimilarContent(semanticKey);
      if (similarMatch) {
        return similarMatch;
      }
    }

    return null;
  }

  /**
   * 💾 インテリジェント保存
   */
  async set(key, value, semanticKey = null, metadata = {}) {
    try {
      // サイズ制限チェック
      if (this.cache.size >= this.maxSize) {
        await this.evictLeastUsed();
      }

      // データ圧縮（大きなデータの場合）
      const processedValue = await this.compressIfNeeded(value);

      const cacheEntry = {
        data: processedValue,
        timestamp: Date.now(),
        ttl: this.ttl,
        metadata: {
          ...metadata,
          size: this.calculateSize(value),
          compressed: processedValue !== value
        }
      };

      this.cache.set(key, cacheEntry);
      this.accessCounts.set(key, 1);

      // セマンティックキャッシュに追加
      if (semanticKey) {
        await this.addToSemanticCache(semanticKey, value, key);
      }

      
    } catch (error) {
    }
  }

  /**
   * 🔍 完全一致取得
   */
  getExactMatch(key) {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // TTL チェック
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.accessCounts.delete(key);
      return null;
    }

    return entry.metadata.compressed 
      ? this.decompress(entry.data) 
      : entry.data;
  }

  /**
   * 🎯 セマンティック類似検索
   */
  async findSimilarContent(semanticKey, threshold = 0.85) {
    try {
      const keyHash = this.createSemanticHash(semanticKey);
      
      for (const [cachedHash, cacheData] of this.semanticCache) {
        const similarity = this.calculateSimilarity(keyHash, cachedHash);
        
        if (similarity > threshold) {
          const cachedEntry = this.cache.get(cacheData.originalKey);
          if (cachedEntry) {
            return cachedEntry.metadata.compressed 
              ? this.decompress(cachedEntry.data)
              : cachedEntry.data;
          }
        }
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  }

  /**
   * 📊 セマンティックハッシュ作成
   */
  createSemanticHash(content) {
    // 簡略化されたセマンティックハッシュ
    const normalized = content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .sort()
      .join(' ');
    
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  /**
   * 📐 類似度計算
   */
  calculateSimilarity(hash1, hash2) {
    // Hamming距離ベースの簡単な類似度計算
    let similarity = 0;
    const maxLength = Math.max(hash1.length, hash2.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (hash1[i] === hash2[i]) {
        similarity++;
      }
    }
    
    return similarity / maxLength;
  }

  /**
   * 📦 セマンティックキャッシュ追加
   */
  async addToSemanticCache(semanticKey, value, originalKey) {
    const hash = this.createSemanticHash(semanticKey);
    this.semanticCache.set(hash, {
      originalKey,
      timestamp: Date.now(),
      preview: this.createPreview(value)
    });
  }

  /**
   * 🗑️ 最少使用アイテム削除
   */
  async evictLeastUsed() {
    let leastUsedKey = null;
    let minAccess = Infinity;
    
    for (const [key, count] of this.accessCounts) {
      if (count < minAccess) {
        minAccess = count;
        leastUsedKey = key;
      }
    }
    
    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.accessCounts.delete(leastUsedKey);
    }
  }

  /**
   * 🗜️ データ圧縮
   */
  async compressIfNeeded(value) {
    const size = this.calculateSize(value);
    
    if (size > this.compressionThreshold) {
      // 実際の圧縮実装は省略（zlib等を使用）
      return value; // 現在は非圧縮で返す
    }
    
    return value;
  }

  /**
   * 📏 データサイズ計算
   */
  calculateSize(value) {
    return JSON.stringify(value).length;
  }

  /**
   * 📊 アクセス数更新
   */
  updateAccessCount(key) {
    const currentCount = this.accessCounts.get(key) || 0;
    this.accessCounts.set(key, currentCount + 1);
  }

  /**
   * 📖 プレビュー作成
   */
  createPreview(value) {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return str.substring(0, 200) + (str.length > 200 ? '...' : '');
  }

  /**
   * 📊 キャッシュ統計
   */
  getStats() {
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + entry.metadata.size, 0);
    
    return {
      totalEntries: this.cache.size,
      totalSize,
      semanticEntries: this.semanticCache.size,
      hitRate: this.calculateHitRate(),
      averageAccessCount: this.calculateAverageAccess()
    };
  }

  calculateHitRate() {
    // 簡略実装
    return 0.75; // 75%の仮の値
  }

  calculateAverageAccess() {
    const totalAccess = Array.from(this.accessCounts.values())
      .reduce((sum, count) => sum + count, 0);
    return totalAccess / this.accessCounts.size || 0;
  }

  /**
   * 🧹 クリーンアップ
   */
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];
    
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.accessCounts.delete(key);
    });
    
  }
}

/**
 * ⚖️ ロードバランサー
 */
export class LoadBalancer {
  constructor() {
    this.workers = [];
    this.roundRobinIndex = 0;
    this.healthCheck = new Map();
  }

  /**
   * 📊 タスク分散
   */
  distribute(tasks, strategy = 'round-robin') {
    switch (strategy) {
      case 'round-robin':
        return this.roundRobinDistribution(tasks);
      case 'weighted':
        return this.weightedDistribution(tasks);
      case 'least-connections':
        return this.leastConnectionsDistribution(tasks);
      default:
        return this.roundRobinDistribution(tasks);
    }
  }

  roundRobinDistribution(tasks) {
    const distribution = [];
    const workerCount = Math.max(1, Math.min(tasks.length, 3));
    
    for (let i = 0; i < workerCount; i++) {
      distribution.push([]);
    }
    
    tasks.forEach((task, index) => {
      const workerIndex = index % workerCount;
      distribution[workerIndex].push(task);
    });
    
    return distribution;
  }

  weightedDistribution(tasks) {
    // 重み付き分散の簡略実装
    return this.roundRobinDistribution(tasks);
  }

  leastConnectionsDistribution(tasks) {
    // 最少接続数分散の簡略実装
    return this.roundRobinDistribution(tasks);
  }
}

// シングルトンインスタンス
export const parallelEngine = new ParallelGenerationEngine();
export const intelligentCache = new IntelligentCache();
export const loadBalancer = new LoadBalancer();

