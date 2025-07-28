/**
 * 📊 UNIFIED PERFORMANCE MONITORING - 統合監視システム
 * クライアント・サーバー共通のパフォーマンス監視とメトリクス収集
 */

// 環境判定
const isServer = typeof window === 'undefined';

// パフォーマンスメトリクス保存
const performanceMetrics = new Map();
const errorMetrics = new Map();

// 統合アラート閾値
const ALERT_THRESHOLDS = {
  // サーバー側閾値
  server: {
    responseTime: 5000, // 5秒
    errorRate: 0.05, // 5%
    memoryUsage: 0.85, // 85%
    concurrentRequests: 50,
    cpuUsage: 0.8 // 80%
  },
  // クライアント側閾値
  client: {
    LCP: 2500, // Largest Contentful Paint
    FID: 100,  // First Input Delay
    CLS: 0.1,  // Cumulative Layout Shift
    FCP: 1800, // First Contentful Paint
    TTFB: 800, // Time to First Byte
    memoryUsage: 0.9 // 90%
  }
};

/**
 * 🔧 統合パフォーマンス監視クラス
 */
class UnifiedPerformanceMonitor {
  constructor() {
    this.isServer = isServer;
    this.isMonitoring = false;
    this.metrics = this.initializeMetrics();
    this.observers = [];
    this.activeRequests = new Map();
    this.reportingInterval = null;
    this.alerts = [];
    this.performanceScore = 100;
    
    // サーバー専用初期化
    if (this.isServer) {
      this.initializeServerMonitoring();
    } else {
      this.initializeClientMonitoring();
    }
  }

  /**
   * 📊 メトリクス初期化
   */
  initializeMetrics() {
    if (this.isServer) {
      return {
        totalRequests: 0,
        totalErrors: 0,
        averageResponseTime: 0,
        currentConcurrentRequests: 0,
        memoryUsage: 0,
        cpuUsage: 0
      };
    } else {
      return {
        coreWebVitals: {},
        resourceTiming: [],
        userTiming: [],
        memoryUsage: [],
        networkTiming: [],
        errorLog: []
      };
    }
  }

  /**
   * 🖥️ サーバー監視初期化
   */
  initializeServerMonitoring() {
    if (!this.isServer) return;

    // 定期的なメトリクス集計（1分毎）
    setInterval(() => this.aggregateMetrics(), 60000);
    
    // 定期的なクリーンアップ（5分毎）
    setInterval(() => this.cleanup(), 300000);
    
    // システムメトリクス監視（30秒毎）
    setInterval(() => this.collectSystemMetrics(), 30000);
  }

  /**
   * 🌐 クライアント監視初期化
   */
  initializeClientMonitoring() {
    if (this.isServer) return;

    // Core Web Vitals の初期化は startMonitoring で行う
    this.thresholds = ALERT_THRESHOLDS.client;
  }

  /**
   * 🚀 監視開始
   */
  startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;

    if (this.isServer) {
      this.startServerMonitoring();
    } else {
      this.startClientMonitoring();
    }

    // 定期レポート開始
    this.startPeriodicReporting();
  }

  /**
   * 🖥️ サーバー監視開始
   */
  startServerMonitoring() {
    if (!this.isServer) return;
    
    // システムメトリクス収集開始
    this.collectSystemMetrics();
  }

  /**
   * 🌐 クライアント監視開始
   */
  startClientMonitoring() {
    if (this.isServer || typeof window === 'undefined') return;

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
  }

  /**
   * 🎯 Core Web Vitals 初期化（クライアント専用）
   */
  initCoreWebVitals() {
    if (this.isServer || !('PerformanceObserver' in window)) return;

    // LCP (Largest Contentful Paint)
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.metrics.coreWebVitals.LCP = {
          value: lastEntry.startTime,
          rating: this.rateMetric('LCP', lastEntry.startTime),
          timestamp: Date.now()
        };
        
        this.checkClientThreshold('LCP', lastEntry.startTime);
      });
      
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);
    } catch (e) {
    }

    // FCP (First Contentful Paint)
    try {
      const fcpObserver = new PerformanceObserver((entryList) => {
        entryList.getEntries().forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.coreWebVitals.FCP = {
              value: entry.startTime,
              rating: this.rateMetric('FCP', entry.startTime),
              timestamp: Date.now()
            };
            
            this.checkClientThreshold('FCP', entry.startTime);
          }
        });
      });
      
      fcpObserver.observe({ entryTypes: ['paint'] });
      this.observers.push(fcpObserver);
    } catch (e) {
    }

    // FID (First Input Delay)
    const firstInputHandler = (event) => {
      const now = performance.now();
      const fid = now - event.timeStamp;
      
      this.metrics.coreWebVitals.FID = {
        value: fid,
        rating: this.rateMetric('FID', fid),
        timestamp: Date.now()
      };
      
      this.checkClientThreshold('FID', fid);
      
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
   * 🔄 Layout Shift 監視（クライアント専用）
   */
  initLayoutShiftObserver() {
    if (this.isServer || !('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries = [];

    try {
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

            // 新しいセッションかチェック（5秒以上の間隔）
            if (sessionValue && lastSessionEntry &&
                entry.startTime - lastSessionEntry.startTime > 5000) {
              clsValue = Math.max(clsValue, sessionValue);
              sessionValue = 0;
              sessionEntries = [];
            }

            sessionValue += entry.value;
            sessionEntries.push(entry);
          }
        }

        const currentCLS = Math.max(clsValue, sessionValue);
        
        this.metrics.coreWebVitals.CLS = {
          value: currentCLS,
          rating: this.rateMetric('CLS', currentCLS),
          timestamp: Date.now()
        };
        
        this.checkClientThreshold('CLS', currentCLS);
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    } catch (e) {
    }
  }

  /**
   * 📊 Resource Timing 監視（クライアント専用）
   */
  initResourceTimingObserver() {
    if (this.isServer || !('PerformanceObserver' in window)) return;

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
          if (entry.duration > 3000) {
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
    }
  }

  /**
   * ⏱️ Long Task 監視（クライアント専用）
   */
  initLongTaskObserver() {
    if (this.isServer || !('PerformanceObserver' in window)) return;

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
          this.addAlert('long-task', `Long task detected: ${Math.round(entry.duration)}ms`);
          this.performanceScore = Math.max(0, this.performanceScore - 5);
        });
      });

      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    } catch (e) {
    }
  }

  /**
   * 💾 Memory 使用量監視（クライアント専用）
   */
  initMemoryMonitoring() {
    if (this.isServer || !('memory' in performance)) return;

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
        
        const usage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit);
        if (usage > ALERT_THRESHOLDS.client.memoryUsage) {
          this.addAlert('memory-high', `High memory usage: ${(usage * 100).toFixed(1)}%`);
        }
        
        if (this.metrics.memoryUsage.length > 50) {
          this.metrics.memoryUsage.shift();
        }
        
        setTimeout(checkMemory, 5000);
      }
    };

    checkMemory();
  }

  /**
   * 🌐 Navigation Timing 監視（クライアント専用）
   */
  initNavigationTiming() {
    if (this.isServer || !('PerformanceNavigationTiming' in window)) return;

    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      
      this.metrics.networkTiming = {
        TTFB: ttfb,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcpConnect: navigation.connectEnd - navigation.connectStart,
        timestamp: Date.now()
      };
      
      this.checkClientThreshold('TTFB', ttfb);
    }
  }

  /**
   * 🚨 Error tracking 初期化（クライアント専用）
   */
  initErrorTracking() {
    if (this.isServer) return;

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
   * 🖥️ システムメトリクス収集（サーバー専用）
   */
  collectSystemMetrics() {
    if (!this.isServer) return;

    const memoryUsage = process.memoryUsage();
    this.metrics.memoryUsage = memoryUsage.heapUsed / memoryUsage.heapTotal;
    
    // CPU使用率の簡易計算
    const startUsage = process.cpuUsage();
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const totalUsage = endUsage.user + endUsage.system;
      this.metrics.cpuUsage = totalUsage / 1000000; // マイクロ秒から秒へ変換
      
      // アラートチェック
      if (this.metrics.memoryUsage > ALERT_THRESHOLDS.server.memoryUsage) {
        this.addAlert('server-memory-high', 
          `Server memory usage: ${(this.metrics.memoryUsage * 100).toFixed(1)}%`);
      }
      
      if (this.metrics.cpuUsage > ALERT_THRESHOLDS.server.cpuUsage) {
        this.addAlert('server-cpu-high', 
          `Server CPU usage: ${(this.metrics.cpuUsage * 100).toFixed(1)}%`);
      }
    }, 100);
  }

  /**
   * 🔍 リクエスト開始追跡（サーバー専用）
   */
  startRequest(req) {
    if (!this.isServer) return null;

    const requestId = `${req.method}_${Date.now()}_${Math.random()}`;
    const startTime = process.hrtime.bigint();
    
    const requestData = {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers?.['user-agent'] || 'unknown',
      ip: this.getClientIP(req),
      startTime,
      memoryBefore: process.memoryUsage()
    };
    
    this.activeRequests.set(requestId, requestData);
    this.metrics.currentConcurrentRequests = this.activeRequests.size;
    this.metrics.totalRequests++;
    
    return requestId;
  }

  /**
   * ✅ リクエスト終了追跡（サーバー専用）
   */
  endRequest(requestId, res, error = null) {
    if (!this.isServer) return null;

    const requestData = this.activeRequests.get(requestId);
    if (!requestData) return null;

    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - requestData.startTime) / 1000000;
    const memoryAfter = process.memoryUsage();
    
    const finalData = {
      ...requestData,
      endTime,
      responseTime,
      statusCode: res.statusCode,
      error: error ? error.message : null,
      memoryAfter,
      memoryDelta: {
        rss: memoryAfter.rss - requestData.memoryBefore.rss,
        heapUsed: memoryAfter.heapUsed - requestData.memoryBefore.heapUsed
      }
    };
    
    this.recordServerMetrics(finalData);
    this.checkServerAlerts(finalData);
    
    this.activeRequests.delete(requestId);
    this.metrics.currentConcurrentRequests = this.activeRequests.size;
    
    return finalData;
  }

  /**
   * 📊 サーバーメトリクス記録
   */
  recordServerMetrics(requestData) {
    if (!this.isServer) return;

    const minute = Math.floor(Date.now() / 60000);
    const key = `${minute}_${requestData.method}_${this.getEndpointCategory(requestData.url)}`;
    
    if (!performanceMetrics.has(key)) {
      performanceMetrics.set(key, {
        requests: 0,
        totalResponseTime: 0,
        errors: 0,
        slowRequests: 0,
        memoryPeak: 0
      });
    }
    
    const metrics = performanceMetrics.get(key);
    metrics.requests++;
    metrics.totalResponseTime += requestData.responseTime;
    
    if (requestData.error) {
      metrics.errors++;
      this.recordError(requestData);
    }
    
    if (requestData.responseTime > ALERT_THRESHOLDS.server.responseTime) {
      metrics.slowRequests++;
    }
    
    metrics.memoryPeak = Math.max(metrics.memoryPeak, requestData.memoryAfter.heapUsed);
    this.updateAverageResponseTime(requestData.responseTime);
  }

  /**
   * 🚨 サーバーアラートチェック
   */
  checkServerAlerts(requestData) {
    if (!this.isServer) return;

    const alerts = [];
    
    if (requestData.responseTime > ALERT_THRESHOLDS.server.responseTime) {
      alerts.push({
        type: 'SLOW_RESPONSE',
        message: `Slow response detected: ${requestData.responseTime}ms`,
        threshold: ALERT_THRESHOLDS.server.responseTime,
        actual: requestData.responseTime,
        endpoint: requestData.url
      });
    }
    
    if (this.metrics.currentConcurrentRequests > ALERT_THRESHOLDS.server.concurrentRequests) {
      alerts.push({
        type: 'HIGH_CONCURRENCY',
        message: `High concurrent requests: ${this.metrics.currentConcurrentRequests}`,
        threshold: ALERT_THRESHOLDS.server.concurrentRequests,
        actual: this.metrics.currentConcurrentRequests
      });
    }
    
    if (alerts.length > 0) {
      this.sendAlerts(alerts);
    }
  }

  /**
   * 🎯 クライアント閾値チェック
   */
  checkClientThreshold(metric, value) {
    if (this.isServer) return;

    const threshold = ALERT_THRESHOLDS.client[metric];
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
   * ⭐ メトリクス評価
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
   * 🚨 アラート追加
   */
  addAlert(type, message) {
    const alert = {
      type,
      message,
      timestamp: Date.now(),
      severity: this.getAlertSeverity(type),
      source: this.isServer ? 'server' : 'client'
    };
    
    this.alerts.push(alert);
    
    const logLevel = alert.severity === 'high' ? 'error' : 
                    alert.severity === 'medium' ? 'warn' : 'info';
    console[logLevel](`🚨 Performance Alert [${alert.source}]: ${message}`);
    
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }
  }

  /**
   * 🚨 エラー追加（クライアント専用）
   */
  addError(type, details) {
    if (this.isServer) return;

    const error = {
      type,
      details,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.metrics.errorLog.push(error);
    this.addAlert('error', `${type}: ${details.message || details.reason || 'Unknown error'}`);
    this.performanceScore = Math.max(0, this.performanceScore - 10);
    
    if (this.metrics.errorLog.length > 50) {
      this.metrics.errorLog.shift();
    }
  }

  /**
   * 📊 エラー記録（サーバー専用）
   */
  recordError(requestData) {
    if (!this.isServer) return;

    const errorKey = `${requestData.error}_${requestData.url}`;
    
    if (!errorMetrics.has(errorKey)) {
      errorMetrics.set(errorKey, {
        count: 0,
        firstOccurrence: requestData.startTime,
        lastOccurrence: requestData.endTime,
        endpoints: new Set()
      });
    }
    
    const errorData = errorMetrics.get(errorKey);
    errorData.count++;
    errorData.lastOccurrence = requestData.endTime;
    errorData.endpoints.add(requestData.url);
  }

  /**
   * 🚨 アラート送信
   */
  async sendAlerts(alerts) {
    process.env.NODE_ENV !== "production" && console.log('🚨 Performance Alerts:', 
                JSON.stringify(alerts, null, 2));
    
    // 本番環境では外部アラートサービスに送信
    if (this.isServer && process.env.ALERT_WEBHOOK_URL) {
      try {
        const response = await fetch(process.env.ALERT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Performance Alert - Murder Mystery App [${this.isServer ? 'Server' : 'Client'}]`,
            attachments: alerts.map(alert => ({
              color: alert.severity === 'high' ? 'danger' : 'warning',
              title: alert.type,
              text: alert.message
            }))
          })
        });
      } catch (error) {
      }
    }
  }

  /**
   * 🎯 アラート重要度取得
   */
  getAlertSeverity(type) {
    const severityMap = {
      'error': 'high',
      'threshold-exceeded': 'high',
      'server-memory-high': 'high',
      'server-cpu-high': 'high',
      'memory-high': 'medium',
      'long-task': 'medium',
      'slow-resource': 'low',
      'SLOW_RESPONSE': 'high',
      'HIGH_CONCURRENCY': 'medium'
    };
    
    return severityMap[type] || 'low';
  }

  /**
   * 🔧 ユーティリティメソッド
   */
  getResourceType(url) {
    if (this.isServer) return 'unknown';
    
    if (url.includes('.css')) return 'stylesheet';
    if (url.includes('.js')) return 'script';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) return 'image';
    if (url.match(/\.(woff|woff2|ttf|eot)$/i)) return 'font';
    if (url.includes('/api/')) return 'api';
    return 'other';
  }

  getEndpointCategory(url) {
    if (!this.isServer) return 'unknown';
    
    if (url.includes('/api/ultra-integrated-generator')) return 'generation';
    if (url.includes('/api/micro-generation-system')) return 'micro';
    if (url.includes('/api/export')) return 'export';
    if (url.includes('/api/health')) return 'health';
    if (url.includes('/api/scenario-storage')) return 'storage';
    return 'other';
  }

  getClientIP(req) {
    if (!this.isServer) return 'unknown';
    
    // Vercel環境ではreq.headersが未定義の場合があるため安全にアクセス
    if (!req || !req.headers) {
      return 'unknown';
    }
    
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
  }

  updateAverageResponseTime(responseTime) {
    if (!this.isServer) return;
    
    const alpha = 0.1;
    this.metrics.averageResponseTime = 
      this.metrics.averageResponseTime * (1 - alpha) + responseTime * alpha;
  }

  /**
   * 📊 定期レポート開始
   */
  startPeriodicReporting() {
    this.reportingInterval = setInterval(() => {
      this.generatePerformanceReport();
    }, 30000); // 30秒ごと
  }

  /**
   * 📊 パフォーマンスレポート生成
   */
  generatePerformanceReport() {
    const report = {
      timestamp: Date.now(),
      source: this.isServer ? 'server' : 'client',
      score: this.calculatePerformanceScore(),
      metrics: this.metrics,
      alerts: this.alerts.filter(a => Date.now() - a.timestamp < 300000), // 5分以内
      recommendations: this.generateRecommendations()
    };

    process.env.NODE_ENV !== "production" && console.log('📊 Performance Report:', 
                JSON.stringify(report, null, 2));
    
    return report;
  }

  /**
   * 🏆 パフォーマンススコア計算
   */
  calculatePerformanceScore() {
    let score = 100;
    
    if (this.isServer) {
      // サーバー側スコア計算
      if (this.metrics.averageResponseTime > ALERT_THRESHOLDS.server.responseTime) {
        score -= 30;
      }
      if (this.metrics.memoryUsage > ALERT_THRESHOLDS.server.memoryUsage) {
        score -= 20;
      }
      if (this.metrics.cpuUsage > ALERT_THRESHOLDS.server.cpuUsage) {
        score -= 20;
      }
    } else {
      // クライアント側スコア計算
      Object.entries(this.metrics.coreWebVitals || {}).forEach(([metric, data]) => {
        if (data.rating === 'poor') {
          score -= 20;
        } else if (data.rating === 'needs-improvement') {
          score -= 10;
        }
      });
      
      const recentErrors = (this.metrics.errorLog || []).filter(
        error => Date.now() - error.timestamp < 300000
      );
      score -= recentErrors.length * 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * 💡 推奨事項生成
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.isServer) {
      if (this.metrics.averageResponseTime > ALERT_THRESHOLDS.server.responseTime) {
        recommendations.push({
          type: 'critical',
          message: 'サーバー応答時間が遅すぎます。最適化を検討してください。',
          priority: 'high'
        });
      }
      
      if (this.metrics.memoryUsage > ALERT_THRESHOLDS.server.memoryUsage) {
        recommendations.push({
          type: 'optimization',
          message: 'メモリ使用量が高いです。メモリリークを確認してください。',
          priority: 'medium'
        });
      }
    } else {
      Object.entries(this.metrics.coreWebVitals || {}).forEach(([metric, data]) => {
        if (data.rating === 'poor') {
          recommendations.push({
            type: 'critical',
            metric,
            message: this.getImprovementSuggestion(metric),
            priority: 'high'
          });
        }
      });
    }
    
    return recommendations;
  }

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
   * 🧹 クリーンアップ
   */
  cleanup() {
    if (!this.isServer) return;

    const cutoff = Date.now() - 60 * 60 * 1000; // 1時間前
    const cutoffMinute = Math.floor(cutoff / 60000);
    
    for (const key of performanceMetrics.keys()) {
      const [minute] = key.split('_');
      if (parseInt(minute) < cutoffMinute) {
        performanceMetrics.delete(key);
      }
    }
    
  }

  /**
   * 📊 集計メトリクス
   */
  aggregateMetrics() {
    if (!this.isServer) return;

    const now = Date.now();
    const last5Minutes = now - 5 * 60 * 1000;
    
    let totalRequests = 0;
    let totalErrors = 0;
    let totalResponseTime = 0;
    
    for (const [key, metrics] of performanceMetrics.entries()) {
      const [minute] = key.split('_');
      const metricTime = parseInt(minute) * 60000;
      
      if (metricTime >= last5Minutes) {
        totalRequests += metrics.requests;
        totalErrors += metrics.errors;
        totalResponseTime += metrics.totalResponseTime;
      }
    }
    
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    const avgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
    
    return {
      requests: totalRequests,
      errors: totalErrors,
      errorRate: `${(errorRate * 100).toFixed(2)}%`,
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      concurrent: this.metrics.currentConcurrentRequests
    };
    
    if (errorRate > ALERT_THRESHOLDS.server.errorRate) {
      this.sendAlerts([{
        type: 'HIGH_ERROR_RATE',
        message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
        threshold: ALERT_THRESHOLDS.server.errorRate * 100,
        actual: errorRate * 100
      }]);
    }
  }

  /**
   * 🛑 監視停止
   */
  stopMonitoring() {
    this.isMonitoring = false;
    
    if (!this.isServer) {
      this.observers.forEach(observer => {
        try {
          observer.disconnect();
        } catch (e) {
          // ignore
        }
      });
      this.observers = [];
    }
    
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }
    
  }

  /**
   * 📊 メトリクス取得
   */
  getMetrics() {
    return {
      source: this.isServer ? 'server' : 'client',
      metrics: this.metrics,
      score: this.calculatePerformanceScore(),
      alerts: this.alerts,
      thresholds: this.isServer ? ALERT_THRESHOLDS.server : ALERT_THRESHOLDS.client
    };
  }

  /**
   * 🔄 リセット
   */
  reset() {
    this.metrics = this.initializeMetrics();
    this.alerts = [];
    this.performanceScore = 100;
  }

  /**
   * 🔧 Express/Vercel ミドルウェア（サーバー専用）
   */
  middleware() {
    if (!this.isServer) return (req, res, next) => next?.();

    return (req, res, next) => {
      const requestId = this.startRequest(req);
      
      const originalSend = res.send;
      const originalJson = res.json;
      const originalEnd = res.end;
      
      const endRequest = (error = null) => {
        this.endRequest(requestId, res, error);
      };
      
      res.send = function(data) {
        endRequest();
        return originalSend.call(this, data);
      };
      
      res.json = function(data) {
        endRequest();
        return originalJson.call(this, data);
      };
      
      res.end = function(chunk, encoding) {
        endRequest();
        return originalEnd.call(this, chunk, encoding);
      };
      
      req.on('error', endRequest);
      res.on('error', endRequest);
      
      next?.();
    };
  }
}

// シングルトンインスタンス
const unifiedMonitor = new UnifiedPerformanceMonitor();

// ES6モジュールエクスポート
const createPerformanceMiddleware = () => unifiedMonitor.middleware();
const getPerformanceMetrics = () => unifiedMonitor.getMetrics();

// CommonJS形式でエクスポート
module.exports = {
  UnifiedPerformanceMonitor,
  unifiedMonitor,
  createPerformanceMiddleware,
  getPerformanceMetrics,
  ALERT_THRESHOLDS
};

// ブラウザ環境での自動開始
if (typeof window !== 'undefined') {
  window.UnifiedPerformanceMonitor = UnifiedPerformanceMonitor;
  window.unifiedMonitor = unifiedMonitor;
  
  // 自動開始
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      unifiedMonitor.startMonitoring();
    });
  } else {
    unifiedMonitor.startMonitoring();
  }
}