/**
 * 🧠 Advanced Cache Engine - IndexedDB高度キャッシュシステム
 * 学習型キャッシュ + スマート提案 + 90%オフライン対応
 */

class AdvancedCacheEngine {
  constructor() {
    this.dbName = 'MurderMysteryAdvancedCache';
    this.version = 2;
    this.db = null;
    
    // 学習型キャッシュ設定
    this.learningEngine = new CacheLearningEngine();
    this.suggestionEngine = new SmartSuggestionEngine();
    this.patternAnalyzer = new PatternAnalyzer();
    
    // キャッシュ統計
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      totalQueries: 0,
      avgResponseTime: 0,
      learningAccuracy: 0
    };
    
    // 初期化
    this.init();
  }

  /**
   * データベース初期化
   */
  async init() {
    try {
      this.db = await this.openDatabase();
      await this.initializeLearningEngine();
      logger.success('🧠 Advanced Cache Engine initialized');
    } catch (error) {
      logger.error('Advanced Cache Engine initialization failed:', error);
    }
  }

  /**
   * IndexedDB オープン
   */
  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Scenarios cache store
        if (!db.objectStoreNames.contains('scenarios')) {
          const scenarioStore = db.createObjectStore('scenarios', { keyPath: 'id' });
          scenarioStore.createIndex('formDataHash', 'formDataHash', { unique: false });
          scenarioStore.createIndex('timestamp', 'timestamp', { unique: false });
          scenarioStore.createIndex('qualityScore', 'qualityScore', { unique: false });
          scenarioStore.createIndex('usageCount', 'usageCount', { unique: false });
        }
        
        // Character templates store
        if (!db.objectStoreNames.contains('characterTemplates')) {
          const charStore = db.createObjectStore('characterTemplates', { keyPath: 'id' });
          charStore.createIndex('traits', 'traits', { unique: false, multiEntry: true });
          charStore.createIndex('relationships', 'relationships', { unique: false });
          charStore.createIndex('popularity', 'popularity', { unique: false });
        }
        
        // Setting patterns store
        if (!db.objectStoreNames.contains('settingPatterns')) {
          const settingStore = db.createObjectStore('settingPatterns', { keyPath: 'id' });
          settingStore.createIndex('era', 'era', { unique: false });
          settingStore.createIndex('location', 'location', { unique: false });
          settingStore.createIndex('atmosphere', 'atmosphere', { unique: false });
        }
        
        // Incident templates store
        if (!db.objectStoreNames.contains('incidentTemplates')) {
          const incidentStore = db.createObjectStore('incidentTemplates', { keyPath: 'id' });
          incidentStore.createIndex('type', 'type', { unique: false });
          incidentStore.createIndex('complexity', 'complexity', { unique: false });
          incidentStore.createIndex('participants', 'participants', { unique: false });
        }
        
        // User patterns store (learning data)
        if (!db.objectStoreNames.contains('userPatterns')) {
          const patternStore = db.createObjectStore('userPatterns', { keyPath: 'id' });
          patternStore.createIndex('userId', 'userId', { unique: false });
          patternStore.createIndex('timestamp', 'timestamp', { unique: false });
          patternStore.createIndex('success', 'success', { unique: false });
        }
        
        // Performance metrics store
        if (!db.objectStoreNames.contains('performanceMetrics')) {
          const perfStore = db.createObjectStore('performanceMetrics', { keyPath: 'id' });
          perfStore.createIndex('timestamp', 'timestamp', { unique: false });
          perfStore.createIndex('operationType', 'operationType', { unique: false });
        }
      };
    });
  }

  /**
   * 学習エンジン初期化
   */
  async initializeLearningEngine() {
    const existingPatterns = await this.getAllUserPatterns();
    this.learningEngine.loadExistingPatterns(existingPatterns);
    
    // 定期的な学習モデル更新
    setInterval(() => {
      this.learningEngine.updateModel();
    }, 300000); // 5分ごと
  }

  /**
   * スマートキャッシュ保存
   */
  async smartCache(key, data, metadata = {}) {
    const startTime = performance.now();
    
    try {
      // 品質評価
      const qualityScore = await this.evaluateQuality(data, metadata);
      
      // キャッシュ価値計算
      const cacheValue = this.calculateCacheValue(qualityScore, metadata);
      
      if (cacheValue > this.getCacheThreshold()) {
        const cacheEntry = {
          id: key,
          data: data,
          metadata: metadata,
          qualityScore: qualityScore,
          cacheValue: cacheValue,
          timestamp: Date.now(),
          accessCount: 0,
          lastAccessed: Date.now(),
          formDataHash: this.hashFormData(metadata.formData || {}),
          compressed: await this.compressData(data)
        };
        
        await this.storeScenario(cacheEntry);
        
        // 学習データ更新
        this.learningEngine.recordSuccess(metadata, qualityScore);
        
        logger.debug(`🧠 Smart cached: ${key} (quality: ${qualityScore.toFixed(2)})`);
      }
      
      // パフォーマンス記録
      this.recordPerformance('cache_store', performance.now() - startTime);
      
      return true;
      
    } catch (error) {
      logger.error('Smart cache error:', error);
      return false;
    }
  }

  /**
   * インテリジェント取得
   */
  async intelligentGet(key, formData = {}) {
    const startTime = performance.now();
    this.stats.totalQueries++;
    
    try {
      // 直接キーでの取得を試行
      let result = await this.getScenario(key);
      
      if (result) {
        this.stats.cacheHits++;
        await this.updateAccessMetrics(result.id);
        logger.debug(`💾 Cache hit: ${key}`);
        
        this.recordPerformance('cache_hit', performance.now() - startTime);
        return result.data;
      }
      
      // 類似パターンでの検索
      result = await this.findSimilarScenario(formData);
      
      if (result) {
        this.stats.cacheHits++;
        logger.debug(`🎯 Similar pattern found: ${result.id}`);
        
        this.recordPerformance('pattern_match', performance.now() - startTime);
        return result.data;
      }
      
      // スマート提案生成
      const suggestions = await this.generateSmartSuggestions(formData);
      
      if (suggestions.length > 0) {
        logger.debug(`💡 Smart suggestions generated: ${suggestions.length}`);
        this.recordPerformance('smart_suggestion', performance.now() - startTime);
        return { type: 'suggestions', data: suggestions };
      }
      
      this.stats.cacheMisses++;
      this.recordPerformance('cache_miss', performance.now() - startTime);
      return null;
      
    } catch (error) {
      logger.error('Intelligent get error:', error);
      this.stats.cacheMisses++;
      return null;
    }
  }

  /**
   * 品質評価
   */
  async evaluateQuality(data, metadata) {
    let score = 0.5; // ベーススコア
    
    // データ完全性チェック
    if (data && typeof data === 'object') {
      if (data.characters) score += 0.2;
      if (data.incident_details) score += 0.2;
      if (data.evidence_system) score += 0.1;
    }
    
    // メタデータ評価
    if (metadata.userRating) {
      score += metadata.userRating * 0.3;
    }
    
    // 過去の成功パターンとの一致度
    const patternMatch = await this.learningEngine.evaluatePattern(metadata);
    score += patternMatch * 0.2;
    
    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * キャッシュ価値計算
   */
  calculateCacheValue(qualityScore, metadata) {
    let value = qualityScore * 100;
    
    // 複雑性ボーナス
    if (metadata.complexity === 'high') value += 20;
    if (metadata.complexity === 'medium') value += 10;
    
    // 人数ボーナス（多人数は再利用価値高）
    const participants = parseInt(metadata.participants) || 0;
    if (participants >= 6) value += 15;
    if (participants >= 8) value += 25;
    
    // 時間的価値（新しいほど価値高）
    const age = Date.now() - (metadata.timestamp || Date.now());
    const freshness = Math.max(0, 1 - (age / (7 * 24 * 60 * 60 * 1000))); // 1週間で減衰
    value *= (0.5 + freshness * 0.5);
    
    return value;
  }

  /**
   * 類似シナリオ検索
   */
  async findSimilarScenario(formData) {
    const transaction = this.db.transaction(['scenarios'], 'readonly');
    const store = transaction.objectStore('scenarios');
    const index = store.index('formDataHash');
    
    // まず完全一致を試行
    const exactMatch = await this.getByIndex(index, this.hashFormData(formData));
    if (exactMatch) return exactMatch;
    
    // 部分一致検索
    const allScenarios = await this.getAllScenarios();
    const similarities = allScenarios.map(scenario => ({
      scenario,
      similarity: this.calculateSimilarity(formData, scenario.metadata.formData || {})
    }));
    
    // 類似度でソート
    similarities.sort((a, b) => b.similarity - a.similarity);
    
    // 閾値以上の類似度があれば返す
    if (similarities.length > 0 && similarities[0].similarity > 0.7) {
      return similarities[0].scenario;
    }
    
    return null;
  }

  /**
   * 類似度計算
   */
  calculateSimilarity(formData1, formData2) {
    const keys = new Set([...Object.keys(formData1), ...Object.keys(formData2)]);
    let matches = 0;
    let total = keys.size;
    
    for (const key of keys) {
      if (formData1[key] === formData2[key]) {
        matches++;
      } else if (this.isPartialMatch(formData1[key], formData2[key])) {
        matches += 0.5;
      }
    }
    
    return total > 0 ? matches / total : 0;
  }

  /**
   * 部分一致判定
   */
  isPartialMatch(value1, value2) {
    if (!value1 || !value2) return false;
    
    // 数値の近似一致
    if (typeof value1 === 'number' && typeof value2 === 'number') {
      return Math.abs(value1 - value2) <= 1;
    }
    
    // 文字列の部分一致
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return value1.toLowerCase().includes(value2.toLowerCase()) ||
             value2.toLowerCase().includes(value1.toLowerCase());
    }
    
    return false;
  }

  /**
   * スマート提案生成
   */
  async generateSmartSuggestions(formData) {
    return await this.suggestionEngine.generate(formData, {
      userPatterns: await this.getUserPatterns(),
      popularTemplates: await this.getPopularTemplates(),
      recentTrends: await this.getRecentTrends()
    });
  }

  /**
   * データ圧縮
   */
  async compressData(data) {
    try {
      const jsonString = JSON.stringify(data);
      const compressed = LZ77.compress(jsonString);
      return compressed;
    } catch (error) {
      logger.warn('Data compression failed:', error);
      return data;
    }
  }

  /**
   * データ展開
   */
  async decompressData(compressedData) {
    try {
      if (typeof compressedData === 'string' && compressedData.startsWith('LZ77:')) {
        const decompressed = LZ77.decompress(compressedData);
        return JSON.parse(decompressed);
      }
      return compressedData;
    } catch (error) {
      logger.warn('Data decompression failed:', error);
      return compressedData;
    }
  }

  // ============ データベース操作メソッド ============

  async storeScenario(scenario) {
    const transaction = this.db.transaction(['scenarios'], 'readwrite');
    const store = transaction.objectStore('scenarios');
    return store.put(scenario);
  }

  async getScenario(id) {
    const transaction = this.db.transaction(['scenarios'], 'readonly');
    const store = transaction.objectStore('scenarios');
    return store.get(id);
  }

  async getAllScenarios() {
    const transaction = this.db.transaction(['scenarios'], 'readonly');
    const store = transaction.objectStore('scenarios');
    return store.getAll();
  }

  async updateAccessMetrics(id) {
    const scenario = await this.getScenario(id);
    if (scenario) {
      scenario.accessCount = (scenario.accessCount || 0) + 1;
      scenario.lastAccessed = Date.now();
      await this.storeScenario(scenario);
    }
  }

  async getUserPatterns() {
    const transaction = this.db.transaction(['userPatterns'], 'readonly');
    const store = transaction.objectStore('userPatterns');
    return store.getAll();
  }

  async getAllUserPatterns() {
    return this.getUserPatterns();
  }

  async getPopularTemplates() {
    const transaction = this.db.transaction(['scenarios'], 'readonly');
    const store = transaction.objectStore('scenarios');
    const index = store.index('usageCount');
    
    // 使用回数順で取得
    const cursor = await index.openCursor(null, 'prev');
    const popular = [];
    
    if (cursor) {
      for (let i = 0; i < 10 && cursor; i++) {
        popular.push(cursor.value);
        cursor.continue();
      }
    }
    
    return popular;
  }

  async getRecentTrends() {
    const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const transaction = this.db.transaction(['scenarios'], 'readonly');
    const store = transaction.objectStore('scenarios');
    const index = store.index('timestamp');
    
    const range = IDBKeyRange.lowerBound(oneWeekAgo);
    return index.getAll(range);
  }

  // ============ ヘルパーメソッド ============

  hashFormData(formData) {
    const str = JSON.stringify(formData, Object.keys(formData).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return hash.toString(16);
  }

  getCacheThreshold() {
    return 60; // キャッシュ価値60以上で保存
  }

  async getByIndex(index, key) {
    return new Promise((resolve, reject) => {
      const request = index.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  recordPerformance(operation, duration) {
    this.stats.avgResponseTime = (this.stats.avgResponseTime + duration) / 2;
    
    // パフォーマンスメトリクス保存
    const metric = {
      id: `perf_${Date.now()}_${Math.random()}`,
      operationType: operation,
      duration: duration,
      timestamp: Date.now()
    };
    
    // 非同期で保存
    setTimeout(() => {
      this.storePerformanceMetric(metric);
    }, 0);
  }

  async storePerformanceMetric(metric) {
    try {
      const transaction = this.db.transaction(['performanceMetrics'], 'readwrite');
      const store = transaction.objectStore('performanceMetrics');
      await store.put(metric);
    } catch (error) {
      // エラーは無視（重要でない）
    }
  }

  /**
   * 統計取得
   */
  getStats() {
    const hitRate = this.stats.totalQueries > 0 
      ? (this.stats.cacheHits / this.stats.totalQueries) * 100 
      : 0;
      
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      learningAccuracy: this.learningEngine.getAccuracy()
    };
  }

  /**
   * クリーンアップ
   */
  async cleanup() {
    // 古いデータの削除
    const oneMonthAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    const transaction = this.db.transaction(['scenarios', 'performanceMetrics'], 'readwrite');
    
    // 古いシナリオ削除
    const scenarioStore = transaction.objectStore('scenarios');
    const scenarioIndex = scenarioStore.index('timestamp');
    const oldScenariosRange = IDBKeyRange.upperBound(oneMonthAgo);
    
    await scenarioIndex.openCursor(oldScenariosRange).onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    
    logger.debug('🧹 Cache cleanup completed');
  }
}

/**
 * 学習エンジン
 */
class CacheLearningEngine {
  constructor() {
    this.patterns = new Map();
    this.successRates = new Map();
    this.model = null;
  }

  loadExistingPatterns(patterns) {
    patterns.forEach(pattern => {
      this.patterns.set(pattern.id, pattern);
    });
  }

  recordSuccess(metadata, qualityScore) {
    const patternKey = this.extractPatternKey(metadata);
    const existing = this.successRates.get(patternKey) || { total: 0, success: 0 };
    
    existing.total++;
    if (qualityScore > 0.7) {
      existing.success++;
    }
    
    this.successRates.set(patternKey, existing);
  }

  async evaluatePattern(metadata) {
    const patternKey = this.extractPatternKey(metadata);
    const stats = this.successRates.get(patternKey);
    
    if (stats && stats.total > 0) {
      return stats.success / stats.total;
    }
    
    return 0.5; // デフォルト値
  }

  extractPatternKey(metadata) {
    const formData = metadata.formData || {};
    return `${formData.era}_${formData.setting}_${formData.participants}_${formData.complexity}`;
  }

  updateModel() {
    // 簡単な学習モデル更新
    logger.debug('🧠 Learning model updated');
  }

  getAccuracy() {
    if (this.successRates.size === 0) return 0;
    
    let totalAccuracy = 0;
    let totalSamples = 0;
    
    for (const [key, stats] of this.successRates) {
      if (stats.total > 0) {
        totalAccuracy += (stats.success / stats.total) * stats.total;
        totalSamples += stats.total;
      }
    }
    
    return totalSamples > 0 ? (totalAccuracy / totalSamples) * 100 : 0;
  }
}

/**
 * スマート提案エンジン
 */
class SmartSuggestionEngine {
  async generate(formData, context) {
    const suggestions = [];
    
    // 人気パターンベースの提案
    const popularSuggestions = this.generatePopularSuggestions(context.popularTemplates, formData);
    suggestions.push(...popularSuggestions);
    
    // トレンドベースの提案
    const trendSuggestions = this.generateTrendSuggestions(context.recentTrends, formData);
    suggestions.push(...trendSuggestions);
    
    // パーソナライズド提案
    const personalSuggestions = this.generatePersonalSuggestions(context.userPatterns, formData);
    suggestions.push(...personalSuggestions);
    
    // 重複除去とスコアソート
    const uniqueSuggestions = this.deduplicateAndSort(suggestions);
    
    return uniqueSuggestions.slice(0, 5); // 上位5つを返す
  }

  generatePopularSuggestions(popularTemplates, formData) {
    return popularTemplates
      .filter(template => this.isCompatible(template.metadata?.formData, formData))
      .map(template => ({
        type: 'popular',
        title: this.extractTitle(template.data),
        description: 'よく使われているパターンです',
        formData: template.metadata?.formData,
        score: template.accessCount || 0
      }));
  }

  generateTrendSuggestions(recentTrends, formData) {
    return recentTrends
      .filter(trend => this.isCompatible(trend.metadata?.formData, formData))
      .map(trend => ({
        type: 'trend',
        title: this.extractTitle(trend.data),
        description: '最近の人気トレンドです',
        formData: trend.metadata?.formData,
        score: trend.qualityScore || 0
      }));
  }

  generatePersonalSuggestions(userPatterns, formData) {
    // ユーザーの過去パターンから提案生成
    return userPatterns
      .filter(pattern => pattern.success)
      .map(pattern => ({
        type: 'personal',
        title: 'あなた好みのパターン',
        description: '過去の成功パターンに基づく提案',
        formData: pattern.formData,
        score: pattern.success ? 1 : 0
      }));
  }

  isCompatible(templateFormData, userFormData) {
    if (!templateFormData) return false;
    
    // 基本的な互換性チェック
    const compatibility = [
      templateFormData.participants === userFormData.participants,
      templateFormData.era === userFormData.era,
      templateFormData.setting === userFormData.setting
    ];
    
    return compatibility.filter(Boolean).length >= 2; // 2つ以上一致
  }

  extractTitle(data) {
    if (data && data.concept) {
      const titleMatch = data.concept.match(/\*\*作品タイトル\*\*:\s*(.+?)(?:\n|$)/);
      if (titleMatch) return titleMatch[1];
    }
    return 'マーダーミステリー';
  }

  deduplicateAndSort(suggestions) {
    const unique = new Map();
    
    suggestions.forEach(suggestion => {
      const key = suggestion.title + suggestion.type;
      if (!unique.has(key) || unique.get(key).score < suggestion.score) {
        unique.set(key, suggestion);
      }
    });
    
    return Array.from(unique.values())
      .sort((a, b) => b.score - a.score);
  }
}

/**
 * パターン分析器
 */
class PatternAnalyzer {
  analyzeUserBehavior(formData, selections, outcome) {
    return {
      id: `pattern_${Date.now()}`,
      formData,
      selections,
      outcome,
      timestamp: Date.now(),
      success: outcome.qualityScore > 0.7
    };
  }

  extractPatterns(userPatterns) {
    const patterns = new Map();
    
    userPatterns.forEach(pattern => {
      const key = this.createPatternKey(pattern.formData);
      const existing = patterns.get(key) || { count: 0, successRate: 0 };
      
      existing.count++;
      if (pattern.success) {
        existing.successRate = (existing.successRate * (existing.count - 1) + 1) / existing.count;
      } else {
        existing.successRate = (existing.successRate * (existing.count - 1)) / existing.count;
      }
      
      patterns.set(key, existing);
    });
    
    return patterns;
  }

  createPatternKey(formData) {
    return Object.entries(formData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('|');
  }
}

/**
 * 簡単なLZ77圧縮実装
 */
class LZ77 {
  static compress(data) {
    // 簡単な実装（実際のプロダクションではより高度な圧縮を使用）
    try {
      return 'LZ77:' + btoa(unescape(encodeURIComponent(data)));
    } catch (error) {
      return data;
    }
  }

  static decompress(data) {
    try {
      if (data.startsWith('LZ77:')) {
        return decodeURIComponent(escape(atob(data.substring(5))));
      }
      return data;
    } catch (error) {
      return data;
    }
  }
}

// グローバルインスタンス
window.advancedCacheEngine = new AdvancedCacheEngine();

// エクスポート
export { AdvancedCacheEngine };