/**
 * PerformanceOptimizer - パフォーマンス最適化システム
 * メモ化、キャッシュ、バッチ処理、レンダリング最適化
 */
class PerformanceOptimizer {
  constructor(options = {}) {
    this.memoizationCache = new Map();
    this.requestCache = new Map();
    this.computeCache = new Map();
    this.batchQueue = new Map();
    this.renderQueue = [];
    this.observedElements = new WeakMap();
    
    this.config = {
      maxCacheSize: options.maxCacheSize || 1000,
      cacheTTL: options.cacheTTL || 300000, // 5分
      batchDelay: options.batchDelay || 50,
      renderDelay: options.renderDelay || 16, // ~60fps
      enableIntersectionObserver: options.enableIntersectionObserver !== false,
      enableVirtualScrolling: options.enableVirtualScrolling !== false,
      enableImageLazyLoading: options.enableImageLazyLoading !== false
    };
    
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      memoHits: 0,
      memoMisses: 0,
      batchOperations: 0,
      renderOptimizations: 0
    };
    
    this.setupIntersectionObserver();
    this.setupRenderScheduler();
    this.setupMemoryMonitoring();
  }

  /**
   * メモ化デコレータ
   */
  memoize(fn, options = {}) {
    const keyGenerator = options.keyGenerator || ((...args) => JSON.stringify(args));
    const ttl = options.ttl || this.config.cacheTTL;
    const maxSize = options.maxSize || this.config.maxCacheSize;
    
    const cache = new Map();
    
    const memoizedFunction = (...args) => {
      const key = keyGenerator(...args);
      const now = Date.now();
      
      // キャッシュヒット確認
      if (cache.has(key)) {
        const entry = cache.get(key);
        if (now - entry.timestamp < ttl) {
          this.stats.memoHits++;
          return entry.value;
        } else {
          cache.delete(key);
        }
      }
      
      // キャッシュミス - 計算実行
      this.stats.memoMisses++;
      const result = fn.apply(this, args);
      
      // キャッシュサイズ制限
      if (cache.size >= maxSize) {
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
      }
      
      cache.set(key, {
        value: result,
        timestamp: now
      });
      
      return result;
    };
    
    // メタデータ追加
    memoizedFunction.cache = cache;
    memoizedFunction.clearCache = () => cache.clear();
    memoizedFunction.stats = () => ({
      size: cache.size,
      hits: this.stats.memoHits,
      misses: this.stats.memoMisses
    });
    
    return memoizedFunction;
  }

  /**
   * 汎用キャッシュシステム
   */
  cache(key, computeFn, options = {}) {
    const ttl = options.ttl || this.config.cacheTTL;
    const namespace = options.namespace || 'default';
    const cacheKey = `${namespace}:${key}`;
    const now = Date.now();
    
    // キャッシュヒット確認
    if (this.computeCache.has(cacheKey)) {
      const entry = this.computeCache.get(cacheKey);
      if (now - entry.timestamp < ttl) {
        this.stats.cacheHits++;
        return entry.value;
      } else {
        this.computeCache.delete(cacheKey);
      }
    }
    
    // キャッシュミス - 計算実行
    this.stats.cacheMisses++;
    const result = computeFn();
    
    // キャッシュサイズ制限
    if (this.computeCache.size >= this.config.maxCacheSize) {
      this.evictOldestCache();
    }
    
    this.computeCache.set(cacheKey, {
      value: result,
      timestamp: now,
      namespace
    });
    
    return result;
  }

  /**
   * 非同期キャッシュ（Promise対応）
   */
  async cacheAsync(key, asyncComputeFn, options = {}) {
    const ttl = options.ttl || this.config.cacheTTL;
    const namespace = options.namespace || 'async';
    const cacheKey = `${namespace}:${key}`;
    const now = Date.now();
    
    // キャッシュヒット確認
    if (this.computeCache.has(cacheKey)) {
      const entry = this.computeCache.get(cacheKey);
      if (now - entry.timestamp < ttl) {
        this.stats.cacheHits++;
        return entry.value;
      } else {
        this.computeCache.delete(cacheKey);
      }
    }
    
    // 重複リクエスト防止
    if (this.requestCache.has(cacheKey)) {
      return await this.requestCache.get(cacheKey);
    }
    
    // 非同期計算実行
    this.stats.cacheMisses++;
    const promise = asyncComputeFn();
    this.requestCache.set(cacheKey, promise);
    
    try {
      const result = await promise;
      
      // 結果をキャッシュ
      this.computeCache.set(cacheKey, {
        value: result,
        timestamp: now,
        namespace
      });
      
      this.requestCache.delete(cacheKey);
      return result;
      
    } catch (error) {
      this.requestCache.delete(cacheKey);
      throw error;
    }
  }

  /**
   * バッチ処理システム
   */
  batch(operation, data, options = {}) {
    const batchKey = options.batchKey || operation;
    const delay = options.delay || this.config.batchDelay;
    
    if (!this.batchQueue.has(batchKey)) {
      this.batchQueue.set(batchKey, {
        items: [],
        processor: options.processor,
        timeout: null
      });
    }
    
    const batch = this.batchQueue.get(batchKey);
    batch.items.push(data);
    
    // タイマーリセット
    if (batch.timeout) {
      clearTimeout(batch.timeout);
    }
    
    batch.timeout = setTimeout(() => {
      this.processBatch(batchKey);
    }, delay);
    
    return new Promise((resolve, reject) => {
      data._resolve = resolve;
      data._reject = reject;
    });
  }

  /**
   * バッチ処理実行
   */
  async processBatch(batchKey) {
    const batch = this.batchQueue.get(batchKey);
    if (!batch || batch.items.length === 0) return;
    
    this.stats.batchOperations++;
    
    try {
      let results;
      
      if (batch.processor) {
        // カスタムプロセッサ使用
        results = await batch.processor(batch.items);
      } else {
        // デフォルト処理
        results = batch.items;
      }
      
      // 個別Promise解決
      batch.items.forEach((item, index) => {
        if (item._resolve) {
          item._resolve(results[index] || results);
        }
      });
      
    } catch (error) {
      // エラー時は全てreject
      batch.items.forEach(item => {
        if (item._reject) {
          item._reject(error);
        }
      });
    } finally {
      this.batchQueue.delete(batchKey);
    }
  }

  /**
   * DOM更新の最適化
   */
  scheduleRender(callback, priority = 'normal') {
    return new Promise((resolve) => {
      this.renderQueue.push({
        callback,
        priority,
        resolve,
        timestamp: performance.now()
      });
      
      this.processRenderQueue();
    });
  }

  /**
   * レンダーキュー処理
   */
  processRenderQueue() {
    if (this.renderQueue.length === 0) return;
    
    // 優先度でソート
    this.renderQueue.sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
    
    requestAnimationFrame(() => {
      const startTime = performance.now();
      const timeSlice = 5; // 5ms
      
      while (this.renderQueue.length > 0 && (performance.now() - startTime) < timeSlice) {
        const task = this.renderQueue.shift();
        
        try {
          const result = task.callback();
          task.resolve(result);
          this.stats.renderOptimizations++;
        } catch (error) {
          console.error('Render task failed:', error);
          task.resolve(null);
        }
      }
      
      // まだタスクが残っている場合は次のフレームで継続
      if (this.renderQueue.length > 0) {
        this.processRenderQueue();
      }
    });
  }

  /**
   * 仮想スクロール実装
   */
  createVirtualScroller(container, items, renderItem, options = {}) {
    const itemHeight = options.itemHeight || 50;
    const bufferSize = options.bufferSize || 5;
    const overscan = options.overscan || 3;
    
    let scrollTop = 0;
    let containerHeight = container.clientHeight;
    
    const getVisibleRange = () => {
      const start = Math.floor(scrollTop / itemHeight);
      const end = Math.ceil((scrollTop + containerHeight) / itemHeight);
      
      return {
        start: Math.max(0, start - overscan),
        end: Math.min(items.length - 1, end + overscan)
      };
    };
    
    const render = this.memoize(() => {
      const { start, end } = getVisibleRange();
      const visibleItems = [];
      
      for (let i = start; i <= end; i++) {
        if (items[i]) {
          const element = renderItem(items[i], i);
          element.style.position = 'absolute';
          element.style.top = `${i * itemHeight}px`;
          element.style.height = `${itemHeight}px`;
          visibleItems.push(element);
        }
      }
      
      return visibleItems;
    }, {
      keyGenerator: () => `${scrollTop}_${containerHeight}_${items.length}`
    });
    
    const updateScroller = () => {
      scrollTop = container.scrollTop;
      containerHeight = container.clientHeight;
      
      this.scheduleRender(() => {
        const visibleItems = render();
        
        // 既存要素をクリア
        container.innerHTML = '';
        
        // 全体の高さを設定
        const totalHeight = items.length * itemHeight;
        container.style.height = `${totalHeight}px`;
        container.style.position = 'relative';
        
        // 表示要素を追加
        visibleItems.forEach(item => container.appendChild(item));
      });
    };
    
    container.addEventListener('scroll', this.throttle(updateScroller, 16), { passive: true });
    
    // 初期レンダリング
    updateScroller();
    
    return {
      refresh: updateScroller,
      updateItems: (newItems) => {
        items.splice(0, items.length, ...newItems);
        render.clearCache();
        updateScroller();
      }
    };
  }

  /**
   * 画像遅延読み込み
   */
  setupLazyLoading(selector = 'img[data-src]') {
    if (!this.config.enableImageLazyLoading) return;
    
    const images = document.querySelectorAll(selector);
    
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imageObserver.unobserve(img);
        }
      });
    }, {
      rootMargin: '50px'
    });
    
    images.forEach(img => {
      img.classList.add('lazy');
      imageObserver.observe(img);
    });
    
    return imageObserver;
  }

  /**
   * Intersection Observer セットアップ
   */
  setupIntersectionObserver() {
    if (!this.config.enableIntersectionObserver || !('IntersectionObserver' in window)) {
      return;
    }
    
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const element = entry.target;
        const callback = this.observedElements.get(element);
        
        if (callback) {
          callback(entry.isIntersecting, entry);
        }
      });
    }, {
      threshold: [0, 0.25, 0.5, 0.75, 1.0]
    });
  }

  /**
   * 要素の可視性監視
   */
  observeVisibility(element, callback) {
    if (this.intersectionObserver) {
      this.observedElements.set(element, callback);
      this.intersectionObserver.observe(element);
    }
    
    return () => {
      if (this.intersectionObserver) {
        this.intersectionObserver.unobserve(element);
        this.observedElements.delete(element);
      }
    };
  }

  /**
   * スロットリング
   */
  throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    
    return (...args) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func.apply(this, args);
        lastExecTime = currentTime;
      } else {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func.apply(this, args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    };
  }

  /**
   * デバウンシング
   */
  debounce(func, delay) {
    let timeoutId;
    
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * アニメーション最適化
   */
  createOptimizedAnimation(element, keyframes, options = {}) {
    const animation = element.animate(keyframes, {
      duration: options.duration || 300,
      easing: options.easing || 'ease-out',
      fill: 'forwards',
      ...options
    });
    
    // パフォーマンス監視
    animation.addEventListener('finish', () => {
      this.stats.renderOptimizations++;
    });
    
    return animation;
  }

  /**
   * メモリ監視
   */
  setupMemoryMonitoring() {
    if (typeof performance !== 'undefined' && performance.memory) {
      setInterval(() => {
        const memory = performance.memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;
        
        // メモリ使用量が80%を超えた場合、キャッシュクリア
        if (usedMB / limitMB > 0.8) {
          this.clearOldCaches();
          console.warn('High memory usage detected, clearing caches');
        }
      }, 30000); // 30秒間隔
    }
  }

  /**
   * レンダースケジューラ設定
   */
  setupRenderScheduler() {
    // アイドル時間でのキャッシュクリーンアップ
    if ('requestIdleCallback' in window) {
      const scheduleCleanup = () => {
        requestIdleCallback(() => {
          this.cleanupExpiredCaches();
          scheduleCleanup();
        });
      };
      scheduleCleanup();
    }
  }

  /**
   * キャッシュ管理
   */
  evictOldestCache() {
    const oldestEntry = Array.from(this.computeCache.entries())
      .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0];
    
    if (oldestEntry) {
      this.computeCache.delete(oldestEntry[0]);
    }
  }

  cleanupExpiredCaches() {
    const now = Date.now();
    
    // メモ化キャッシュクリーンアップ
    for (const [key, entry] of this.computeCache.entries()) {
      if (now - entry.timestamp > this.config.cacheTTL) {
        this.computeCache.delete(key);
      }
    }
    
    // リクエストキャッシュクリーンアップ
    this.requestCache.clear();
  }

  clearOldCaches() {
    const now = Date.now();
    const halfTTL = this.config.cacheTTL / 2;
    
    for (const [key, entry] of this.computeCache.entries()) {
      if (now - entry.timestamp > halfTTL) {
        this.computeCache.delete(key);
      }
    }
  }

  /**
   * パフォーマンス統計
   */
  getPerformanceStats() {
    const memory = performance.memory || {};
    
    return {
      cache: {
        hits: this.stats.cacheHits,
        misses: this.stats.cacheMisses,
        hitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0,
        size: this.computeCache.size,
        maxSize: this.config.maxCacheSize
      },
      memoization: {
        hits: this.stats.memoHits,
        misses: this.stats.memoMisses,
        hitRate: this.stats.memoHits / (this.stats.memoHits + this.stats.memoMisses) || 0
      },
      batch: {
        operations: this.stats.batchOperations,
        queueSize: this.batchQueue.size
      },
      rendering: {
        optimizations: this.stats.renderOptimizations,
        queueLength: this.renderQueue.length
      },
      memory: {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      }
    };
  }

  /**
   * 設定更新
   */
  configure(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 全キャッシュクリア
   */
  clearAllCaches() {
    this.memoizationCache.clear();
    this.requestCache.clear();
    this.computeCache.clear();
    this.batchQueue.clear();
    this.renderQueue.length = 0;
    
    console.log('All caches cleared');
  }

  /**
   * クリーンアップ
   */
  destroy() {
    this.clearAllCaches();
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    console.log('PerformanceOptimizer destroyed');
  }
}

// グローバルインスタンス作成
const PerformanceManager = new PerformanceOptimizer({
  maxCacheSize: 1000,
  cacheTTL: 300000,
  batchDelay: 50,
  renderDelay: 16
});

// 便利なヘルパー関数
window.memoize = (fn, options) => PerformanceManager.memoize(fn, options);
window.cache = (key, computeFn, options) => PerformanceManager.cache(key, computeFn, options);
window.batch = (operation, data, options) => PerformanceManager.batch(operation, data, options);
window.scheduleRender = (callback, priority) => PerformanceManager.scheduleRender(callback, priority);

export { PerformanceOptimizer, PerformanceManager };