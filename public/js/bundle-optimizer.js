/**
 * 🎯 Bundle Optimizer - リソース最適化エンジン
 * CSS/JS動的読み込み、レイジーローディング、パフォーマンス監視
 */

class BundleOptimizer {
  constructor() {
    this.loadedResources = new Set();
    this.criticalResources = new Set();
    this.performanceMetrics = {
      resourceLoadTimes: [],
      totalLoadTime: 0,
      cacheHits: 0,
      bundleSize: 0
    };
    this.observer = null;
    this.loadQueue = [];
    this.isOptimizing = false;
  }

  /**
   * 初期化
   */
  async initialize() {
    logger.info('🎯 Bundle Optimizer 初期化開始');
    
    try {
      // Critical CSS がロード済みかチェック
      this.detectCriticalResources();
      
      // Intersection Observer セットアップ
      this.setupIntersectionObserver();
      
      // リソース監視開始
      this.startResourceMonitoring();
      
      // 遅延ロード可能な要素を検出
      this.detectLazyLoadElements();
      
      logger.success('✅ Bundle Optimizer 初期化完了');
      
    } catch (error) {
      logger.error('Bundle Optimizer 初期化エラー:', error);
    }
  }

  /**
   * Critical リソース検出
   */
  detectCriticalResources() {
    // Critical CSS
    const criticalCSS = document.querySelector('link[href*="optimized-bundle"]');
    if (criticalCSS) {
      this.criticalResources.add('critical-css');
    }

    // Critical JS (app-core.js)
    const criticalJS = document.querySelector('script[src*="app-core"]');
    if (criticalJS) {
      this.criticalResources.add('critical-js');
    }

    logger.debug(`Critical resources detected: ${this.criticalResources.size}`);
  }

  /**
   * 非同期CSS読み込み
   */
  async loadCSSAsync(href, id = null) {
    return new Promise((resolve, reject) => {
      if (this.loadedResources.has(href)) {
        resolve(`CSS already loaded: ${href}`);
        return;
      }

      const startTime = performance.now();
      const link = document.createElement('link');
      
      link.rel = 'stylesheet';
      link.href = href;
      if (id) link.id = id;
      
      link.onload = () => {
        const loadTime = performance.now() - startTime;
        this.performanceMetrics.resourceLoadTimes.push({
          resource: href,
          type: 'css',
          loadTime
        });
        
        this.loadedResources.add(href);
        logger.debug(`✅ CSS loaded: ${href} (${Math.round(loadTime)}ms)`);
        resolve(href);
      };
      
      link.onerror = () => {
        logger.error(`❌ CSS load failed: ${href}`);
        reject(new Error(`Failed to load CSS: ${href}`));
      };
      
      document.head.appendChild(link);
    });
  }

  /**
   * 非同期JS読み込み
   */
  async loadJSAsync(src, id = null, defer = true) {
    return new Promise((resolve, reject) => {
      if (this.loadedResources.has(src)) {
        resolve(`JS already loaded: ${src}`);
        return;
      }

      const startTime = performance.now();
      const script = document.createElement('script');
      
      script.src = src;
      if (id) script.id = id;
      if (defer) script.defer = true;
      
      script.onload = () => {
        const loadTime = performance.now() - startTime;
        this.performanceMetrics.resourceLoadTimes.push({
          resource: src,
          type: 'js',
          loadTime
        });
        
        this.loadedResources.add(src);
        logger.debug(`✅ JS loaded: ${src} (${Math.round(loadTime)}ms)`);
        resolve(src);
      };
      
      script.onerror = () => {
        logger.error(`❌ JS load failed: ${src}`);
        reject(new Error(`Failed to load JS: ${src}`));
      };
      
      document.head.appendChild(script);
    });
  }

  /**
   * 条件付きリソース読み込み
   */
  async loadResourceConditionally(resource, condition) {
    if (typeof condition === 'function') {
      const shouldLoad = await condition();
      if (!shouldLoad) {
        logger.debug(`⏭️ Skipping resource: ${resource.url} (condition not met)`);
        return;
      }
    }

    const { type, url, id } = resource;
    
    if (type === 'css') {
      return await this.loadCSSAsync(url, id);
    } else if (type === 'js') {
      return await this.loadJSAsync(url, id);
    }
  }

  /**
   * 画像レイジーローディング
   */
  setupIntersectionObserver() {
    if (!('IntersectionObserver' in window)) {
      logger.warn('IntersectionObserver not supported');
      return;
    }

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadLazyElement(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '50px'
    });
  }

  /**
   * レイジーロード対象要素の検出
   */
  detectLazyLoadElements() {
    // data-src 属性を持つ画像
    const lazyImages = document.querySelectorAll('img[data-src]');
    lazyImages.forEach(img => {
      this.observer.observe(img);
    });

    // data-lazy-css 属性を持つ要素
    const lazyCSSElements = document.querySelectorAll('[data-lazy-css]');
    lazyCSSElements.forEach(element => {
      this.observer.observe(element);
    });

    // data-lazy-js 属性を持つ要素
    const lazyJSElements = document.querySelectorAll('[data-lazy-js]');
    lazyJSElements.forEach(element => {
      this.observer.observe(element);
    });

    logger.debug(`Lazy load targets: ${lazyImages.length + lazyCSSElements.length + lazyJSElements.length}`);
  }

  /**
   * レイジーロード要素の読み込み
   */
  async loadLazyElement(element) {
    try {
      // 画像の場合
      if (element.tagName === 'IMG' && element.dataset.src) {
        const img = element;
        img.src = img.dataset.src;
        img.classList.add('lazy-loaded');
        delete img.dataset.src;
        this.observer.unobserve(element);
        return;
      }

      // CSS レイジーロード
      if (element.dataset.lazyCss) {
        await this.loadCSSAsync(element.dataset.lazyCss);
        element.classList.add('css-loaded');
        delete element.dataset.lazyCss;
        this.observer.unobserve(element);
      }

      // JS レイジーロード
      if (element.dataset.lazyJs) {
        await this.loadJSAsync(element.dataset.lazyJs);
        element.classList.add('js-loaded');
        delete element.dataset.lazyJs;
        this.observer.unobserve(element);
      }

    } catch (error) {
      logger.error('Lazy load error:', error);
    }
  }

  /**
   * キューシステム
   */
  async processLoadQueue() {
    if (this.isOptimizing || this.loadQueue.length === 0) {
      return;
    }

    this.isOptimizing = true;
    logger.debug(`🔄 Processing load queue: ${this.loadQueue.length} items`);

    try {
      // 優先度に基づいてソート
      this.loadQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0));

      // 並列実行（最大3つまで）
      const promises = this.loadQueue.splice(0, 3).map(async (item) => {
        return await this.loadResourceConditionally(item.resource, item.condition);
      });

      await Promise.allSettled(promises);

      // キューが残っている場合は再帰的に処理
      if (this.loadQueue.length > 0) {
        setTimeout(() => {
          this.isOptimizing = false;
          this.processLoadQueue();
        }, 100);
      } else {
        this.isOptimizing = false;
      }

    } catch (error) {
      logger.error('Load queue processing error:', error);
      this.isOptimizing = false;
    }
  }

  /**
   * リソースをキューに追加
   */
  addToQueue(resource, condition = null, priority = 0) {
    this.loadQueue.push({
      resource,
      condition,
      priority,
      addedAt: Date.now()
    });

    // キュー処理開始
    this.processLoadQueue();
  }

  /**
   * パフォーマンス監視
   */
  startResourceMonitoring() {
    // PerformanceObserver for resource timing
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            this.performanceMetrics.resourceLoadTimes.push({
              resource: entry.name,
              type: this.getResourceType(entry.name),
              loadTime: entry.responseEnd - entry.startTime,
              size: entry.transferSize || 0
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    }

    // 定期的なメトリクス計算
    setInterval(() => {
      this.calculateMetrics();
    }, 10000); // 10秒ごと
  }

  /**
   * リソースタイプ判定
   */
  getResourceType(url) {
    if (url.includes('.css')) return 'css';
    if (url.includes('.js')) return 'js';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    return 'other';
  }

  /**
   * メトリクス計算
   */
  calculateMetrics() {
    const resources = this.performanceMetrics.resourceLoadTimes;
    
    if (resources.length === 0) return;

    const totalLoadTime = resources.reduce((sum, r) => sum + r.loadTime, 0);
    const totalSize = resources.reduce((sum, r) => sum + (r.size || 0), 0);
    
    const metrics = {
      totalResources: resources.length,
      avgLoadTime: totalLoadTime / resources.length,
      totalLoadTime,
      totalSize,
      cacheHitRate: this.performanceMetrics.cacheHits / resources.length * 100,
      resourcesByType: {}
    };

    // タイプ別集計
    ['css', 'js', 'image', 'font', 'other'].forEach(type => {
      const typeResources = resources.filter(r => r.type === type);
      if (typeResources.length > 0) {
        metrics.resourcesByType[type] = {
          count: typeResources.length,
          avgLoadTime: typeResources.reduce((sum, r) => sum + r.loadTime, 0) / typeResources.length,
          totalSize: typeResources.reduce((sum, r) => sum + (r.size || 0), 0)
        };
      }
    });

    logger.debug('📊 Resource metrics:', metrics);
    return metrics;
  }

  /**
   * プリロード実行
   */
  preloadResources(resources) {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.url;
      
      if (resource.type === 'css') {
        link.as = 'style';
      } else if (resource.type === 'js') {
        link.as = 'script';
      } else if (resource.type === 'font') {
        link.as = 'font';
        link.crossOrigin = 'anonymous';
      }
      
      document.head.appendChild(link);
    });
  }

  /**
   * 統計取得
   */
  getStats() {
    return {
      loadedResources: this.loadedResources.size,
      criticalResources: this.criticalResources.size,
      queueLength: this.loadQueue.length,
      metrics: this.calculateMetrics()
    };
  }

  /**
   * レスポンシブ画像最適化
   */
  optimizeImages() {
    const images = document.querySelectorAll('img:not([data-optimized])');
    
    images.forEach(img => {
      // WebP サポートチェック
      if (this.supportsWebP()) {
        const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        
        // WebP版が存在するかチェック
        this.checkImageExists(webpSrc).then(exists => {
          if (exists) {
            img.src = webpSrc;
          }
        });
      }
      
      // 適切なサイズ設定
      if (!img.hasAttribute('sizes')) {
        img.setAttribute('sizes', 
          '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        );
      }
      
      img.setAttribute('data-optimized', 'true');
    });
  }

  /**
   * WebP サポート確認
   */
  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('webp') !== -1;
  }

  /**
   * 画像存在確認
   */
  async checkImageExists(src) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.loadQueue = [];
    this.loadedResources.clear();
  }
}

// グローバルインスタンス
window.bundleOptimizer = new BundleOptimizer();

// 自動初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.bundleOptimizer.initialize();
  });
} else {
  window.bundleOptimizer.initialize();
}

// エクスポート
export { BundleOptimizer };