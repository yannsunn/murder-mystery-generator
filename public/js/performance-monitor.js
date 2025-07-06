/**
 * 📊 Real-time Performance Monitor - LEGACY (統合版に移行済み)
 * @deprecated 統合監視システム (/api/core/monitoring.js) を使用してください
 * 
 * このファイルは後方互換性のため残されていますが、
 * 新しい統合監視システムを使用することを推奨します。
 */

// 統合監視システムのクライアント版を読み込み
// 実際の実装は /api/core/monitoring.js にあります

class LegacyPerformanceMonitor {
  constructor() {
    this.metrics = {
      coreWebVitals: {},
      resourceTiming: [],
      userTiming: [],
      memoryUsage: [],
      networkTiming: [],
      errorLog: []
    };
    
    this.observers = [];
    this.isMonitoring = false;
    this.reportingInterval = null;
    this.thresholds = {
      LCP: 2500, // Largest Contentful Paint
      FID: 100,  // First Input Delay
      CLS: 0.1,  // Cumulative Layout Shift
      FCP: 1800, // First Contentful Paint
      TTFB: 800  // Time to First Byte
    };
    
    this.alerts = [];
    this.performanceScore = 100;
  }

  /**
   * 監視開始
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    logger.info('📊 Performance monitoring started');
    this.isMonitoring = true;

    // Core Web Vitals 監視
    this.initCoreWebVitals();
    
    // Resource timing 監視
    this.initResourceTimingObserver();
    
    // Memory usage 監視
    this.initMemoryMonitoring();
    
    // Navigation timing 監視
    this.initNavigationTiming();
    
    // Error tracking 監視
    this.initErrorTracking();
    
    // Long task 監視
    this.initLongTaskObserver();
    
    // Layout shift 監視
    this.initLayoutShiftObserver();

    // 定期レポート開始
    this.startPeriodicReporting();
  }

  /**
   * Core Web Vitals 初期化
   */
  initCoreWebVitals() {
    // LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          
          this.metrics.coreWebVitals.LCP = {
            value: lastEntry.startTime,
            rating: this.rateMetric('LCP', lastEntry.startTime),
            timestamp: Date.now()
          };
          
          this.checkThreshold('LCP', lastEntry.startTime);
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        logger.warn('LCP observer not supported');
      }
    }

    // FCP (First Contentful Paint)
    try {
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.coreWebVitals.FCP = {
              value: entry.startTime,
              rating: this.rateMetric('FCP', entry.startTime),
              timestamp: Date.now()
            };
            
            this.checkThreshold('FCP', entry.startTime);
          }
        });
      });
      
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch (e) {
      logger.warn('FCP observer not supported');
    }

    // FID (First Input Delay) - event listener として実装
    const firstInputHandler = (event) => {
      const now = performance.now();
      const fid = now - event.timeStamp;
      
      this.metrics.coreWebVitals.FID = {
        value: fid,
        rating: this.rateMetric('FID', fid),
        timestamp: Date.now()
      };
      
      this.checkThreshold('FID', fid);
      
      // 一度だけ測定
      ['mousedown', 'keydown', 'touchstart', 'pointerdown'].forEach(type => {
        document.removeEventListener(type, firstInputHandler, true);
      });
    };

    ['mousedown', 'keydown', 'touchstart', 'pointerdown'].forEach(type => {
      document.addEventListener(type, firstInputHandler, true);
    });
  }

  /**
   * Layout Shift 監視
   */
  initLayoutShiftObserver() {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries = [];

    try {
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // セッションウィンドウ内でのCLS計算
          if (!entry.hadRecentInput) {
            const firstSessionEntry = sessionEntries[0];
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            // 新しいセッションかチェック（5秒以上の間隔）
            if (sessionValue && 
                entry.startTime - lastSessionEntry.startTime > 5000) {
              clsValue = Math.max(clsValue, sessionValue);
              sessionValue = 0;
              sessionEntries = [];
            }

            sessionValue += entry.value;
            sessionEntries.push(entry);
          }
        }

        // 現在のCLS値を更新
        const currentCLS = Math.max(clsValue, sessionValue);
        
        this.metrics.coreWebVitals.CLS = {
          value: currentCLS,
          rating: this.rateMetric('CLS', currentCLS),
          timestamp: Date.now()
        };
        
        this.checkThreshold('CLS', currentCLS);
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
      logger.warn('Layout Shift observer not supported');
    }
  }

  /**
   * Resource Timing 監視
   */
  initResourceTimingObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const resourceObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          const resourceData = {
            name: entry.name,
            type: this.getResourceType(entry.name),
            startTime: entry.startTime,
            duration: entry.duration,
            size: entry.transferSize || 0,
            cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
            timestamp: Date.now()
          };
          
          this.metrics.resourceTiming.push(resourceData);
          
          // 遅いリソースの検出
          if (entry.duration > 3000) { // 3秒以上
            this.addAlert('slow-resource', `Slow resource: ${entry.name} (${Math.round(entry.duration)}ms)`);
          }
          
          // リストサイズ制限
          if (this.metrics.resourceTiming.length > 100) {
            this.metrics.resourceTiming.shift();
          }
        });
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    } catch (e) {
      logger.warn('Resource timing observer not supported');
    }
  }

  /**
   * Long Task 監視
   */
  initLongTaskObserver() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const longTaskObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          const taskData = {
            name: entry.name,
            startTime: entry.startTime,
            duration: entry.duration,
            timestamp: Date.now()
          };
          
          this.metrics.userTiming.push(taskData);
          
          // 長いタスクをアラートとして記録
          this.addAlert('long-task', `Long task detected: ${Math.round(entry.duration)}ms`);
          
          // パフォーマンススコアを減点
          this.performanceScore = Math.max(0, this.performanceScore - 5);
        });
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (e) {
      logger.warn('Long task observer not supported');
    }
  }

  /**
   * Memory 使用量監視
   */
  initMemoryMonitoring() {
    if (!('memory' in performance)) {
      logger.warn('Memory API not supported');
      return;
    }

    const checkMemory = () => {
      if (this.isMonitoring) {
        const memory = performance.memory;
        const memoryData = {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit,
          timestamp: Date.now()
        };
        
        this.metrics.memoryUsage.push(memoryData);
        
        // メモリ使用率チェック
        const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
        if (usage > 90) {
          this.addAlert('memory-high', `High memory usage: ${usage.toFixed(1)}%`);
        }
        
        // リストサイズ制限
        if (this.metrics.memoryUsage.length > 50) {
          this.metrics.memoryUsage.shift();
        }
        
        setTimeout(checkMemory, 5000); // 5秒ごと
      }
    };

    checkMemory();
  }

  /**
   * Navigation Timing 監視
   */
  initNavigationTiming() {
    if (!('PerformanceNavigationTiming' in window)) {
      logger.warn('Navigation Timing API not supported');
      return;
    }

    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
      const loadComplete = navigation.loadEventEnd - navigation.navigationStart;
      
      this.metrics.networkTiming = {
        TTFB: ttfb,
        domContentLoaded,
        loadComplete,
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnect: navigation.connectEnd - navigation.connectStart,
        timestamp: Date.now()
      };
      
      this.checkThreshold('TTFB', ttfb);
    }
  }

  /**
   * Error tracking 初期化
   */
  initErrorTracking() {
    // JavaScript エラー
    window.addEventListener('error', (event) => {
      this.addError('js-error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.addError('promise-rejection', {
        reason: event.reason?.toString() || 'Unknown reason'
      });
    });

    // Resource load errors
    document.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.addError('resource-error', {
          element: event.target.tagName,
          source: event.target.src || event.target.href,
          message: 'Failed to load resource'
        });
      }
    }, true);
  }

  /**
   * エラー追加
   */
  addError(type, details) {
    const error = {
      type,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.metrics.errorLog.push(error);
    
    // エラーアラート
    this.addAlert('error', `${type}: ${details.message || details.reason || 'Unknown error'}`);
    
    // パフォーマンススコアを減点
    this.performanceScore = Math.max(0, this.performanceScore - 10);
    
    // リストサイズ制限
    if (this.metrics.errorLog.length > 50) {
      this.metrics.errorLog.shift();
    }
  }

  /**
   * アラート追加
   */
  addAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(type)
    };
    
    this.alerts.push(alert);
    
    // 重要度に応じてログ出力
    if (alert.severity === 'high') {
      logger.error(`🚨 Performance Alert: ${message}`);
    } else if (alert.severity === 'medium') {
      logger.warn(`⚠️ Performance Warning: ${message}`);
    } else {
      logger.debug(`ℹ️ Performance Info: ${message}`);
    }
    
    // アラート数制限
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
  }

  /**
   * しきい値チェック
   */
  checkThreshold(metric, value) {
    const threshold = this.thresholds[metric];
    if (!threshold) return;

    const rating = this.rateMetric(metric, value);
    
    if (rating === 'poor') {
      this.addAlert('threshold-exceeded', 
        `${metric} exceeded threshold: ${value} > ${threshold}`);
      this.performanceScore = Math.max(0, this.performanceScore - 15);
    } else if (rating === 'needs-improvement') {
      this.performanceScore = Math.max(0, this.performanceScore - 5);
    }
  }

  /**
   * メトリクス評価
   */
  rateMetric(metric, value) {
    const thresholds = {
      LCP: [2500, 4000],
      FID: [100, 300],
      CLS: [0.1, 0.25],
      FCP: [1800, 3000],
      TTFB: [800, 1800]
    };

    const [good, poor] = thresholds[metric] || [0, Infinity];
    
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  }

  /**
   * アラート重要度取得
   */
  getAlertSeverity(type) {
    const severityMap = {
      'error': 'high',
      'threshold-exceeded': 'high',
      'memory-high': 'medium',
      'long-task': 'medium',
      'slow-resource': 'low'
    };
    
    return severityMap[type] || 'low';
  }

  /**
   * リソースタイプ判定
   */
  getResourceType(url) {
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.js')) return 'script';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  /**
   * 定期レポート開始
   */
  startPeriodicReporting() {
    this.reportingInterval = setInterval(() => {
      this.generatePerformanceReport();
    }, 30000); // 30秒ごと
  }

  /**
   * パフォーマンスレポート生成
   */
  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      score: this.calculatePerformanceScore(),
      coreWebVitals: this.metrics.coreWebVitals,
      summary: {
        totalResources: this.metrics.resourceTiming.length,
        totalErrors: this.metrics.errorLog.length,
        activeAlerts: this.alerts.filter(a => 
          Date.now() - a.timestamp < 300000 // 5分以内
        ).length
      },
      recommendations: this.generateRecommendations()
    };

    // ダッシュボード更新
    this.updatePerformanceDashboard(report);
    
    return report;
  }

  /**
   * パフォーマンススコア計算
   */
  calculatePerformanceScore() {
    let score = 100;
    
    // Core Web Vitals によるスコア調整
    Object.entries(this.metrics.coreWebVitals).forEach(([metric, data]) => {
      if (data.rating === 'poor') {
        score -= 20;
      } else if (data.rating === 'needs-improvement') {
        score -= 10;
      }
    });
    
    // エラーによるスコア調整
    const recentErrors = this.metrics.errorLog.filter(
      error => Date.now() - error.timestamp < 300000 // 5分以内
    );
    score -= recentErrors.length * 5;
    
    // 遅いリソースによるスコア調整
    const slowResources = this.metrics.resourceTiming.filter(
      resource => resource.duration > 3000
    );
    score -= slowResources.length * 3;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 推奨事項生成
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Core Web Vitals の改善提案
    Object.entries(this.metrics.coreWebVitals).forEach(([metric, data]) => {
      if (data.rating === 'poor') {
        recommendations.push({
          type: 'critical',
          metric,
          message: this.getImprovementSuggestion(metric),
          priority: 'high'
        });
      }
    });
    
    // リソース最適化提案
    const largeResources = this.metrics.resourceTiming.filter(
      resource => resource.size > 1000000 // 1MB以上
    );
    
    if (largeResources.length > 0) {
      recommendations.push({
        type: 'optimization',
        message: `${largeResources.length}個の大きなリソースが検出されました。圧縮または分割を検討してください。`,
        priority: 'medium'
      });
    }
    
    return recommendations;
  }

  /**
   * 改善提案取得
   */
  getImprovementSuggestion(metric) {
    const suggestions = {
      LCP: 'サーバー応答時間の最適化、画像の最適化、不要なJavaScriptの削除を検討してください。',
      FID: 'JavaScriptの実行時間を短縮、コード分割の実装を検討してください。',
      CLS: 'サイズが指定されていない画像や動的コンテンツの修正を行ってください。',
      FCP: 'Critical CSSのインライン化、フォントの最適化を検討してください。',
      TTFB: 'サーバー処理時間の最適化、CDNの利用を検討してください。'
    };
    
    return suggestions[metric] || 'パフォーマンスの最適化を検討してください。';
  }

  /**
   * パフォーマンスダッシュボード更新
   */
  updatePerformanceDashboard(report) {
    // ダッシュボード要素の作成・更新
    let dashboard = document.getElementById('performance-dashboard');
    
    if (!dashboard) {
      dashboard = document.createElement('div');
      dashboard.id = 'performance-dashboard';
      dashboard.className = 'performance-dashboard';
      dashboard.innerHTML = `
        <div class="performance-header">
          <h3>📊 Performance Monitor</h3>
          <span class="performance-score" id="perf-score">100</span>
        </div>
        <div class="performance-metrics" id="perf-metrics"></div>
        <div class="performance-alerts" id="perf-alerts"></div>
      `;
      
      // 右下に固定表示
      dashboard.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 15px;
        border-radius: 10px;
        font-size: 12px;
        z-index: 1000;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        max-height: 400px;
        overflow-y: auto;
      `;
      
      document.body.appendChild(dashboard);
    }
    
    // スコア更新
    const scoreElement = document.getElementById('perf-score');
    if (scoreElement) {
      const score = report.score;
      scoreElement.textContent = Math.round(score);
      scoreElement.style.color = score >= 80 ? '#4ade80' : score >= 60 ? '#fbbf24' : '#f87171';
    }
    
    // メトリクス更新
    const metricsElement = document.getElementById('perf-metrics');
    if (metricsElement) {
      metricsElement.innerHTML = Object.entries(report.coreWebVitals)
        .map(([metric, data]) => `
          <div class="metric">
            <span>${metric}:</span>
            <span class="metric-value metric-${data.rating}">
              ${Math.round(data.value)}${metric === 'CLS' ? '' : 'ms'}
            </span>
          </div>
        `).join('');
    }
    
    // アラート更新
    const alertsElement = document.getElementById('perf-alerts');
    if (alertsElement) {
      const recentAlerts = this.alerts
        .filter(a => Date.now() - a.timestamp < 60000) // 1分以内
        .slice(-3);
        
      alertsElement.innerHTML = recentAlerts
        .map(alert => `
          <div class="alert alert-${alert.severity}">
            ${alert.message}
          </div>
        `).join('');
    }
  }

  /**
   * 監視停止
   */
  stopMonitoring() {
    this.isMonitoring = false;
    
    // Observer の停止
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (e) {
        // ignore
      }
    });
    this.observers = [];
    
    // レポーティング停止
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }
    
    logger.info('📊 Performance monitoring stopped');
  }

  /**
   * メトリクス取得
   */
  getMetrics() {
    return {
      ...this.metrics,
      score: this.calculatePerformanceScore(),
      alerts: this.alerts
    };
  }

  /**
   * リセット
   */
  reset() {
    this.metrics = {
      coreWebVitals: {},
      resourceTiming: [],
      userTiming: [],
      memoryUsage: [],
      networkTiming: [],
      errorLog: []
    };
    
    this.alerts = [];
    this.performanceScore = 100;
  }
}

// グローバルインスタンス
window.performanceMonitor = new PerformanceMonitor();

// 自動開始
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.performanceMonitor.startMonitoring();
  });
} else {
  window.performanceMonitor.startMonitoring();
}

// エクスポート
export { PerformanceMonitor };