/**
 * 🔍 Performance Monitoring System - LEGACY (統合版に移行済み)
 * @deprecated 統合監視システム (/api/core/monitoring.js) を使用してください
 */

const { unifiedMonitor, createPerformanceMiddleware } = require('../core/monitoring');

// レガシー互換性のため、新しい統合システムを再エクスポート
module.exports = {
  performanceMonitor: unifiedMonitor,
  createPerformanceMiddleware,
  getPerformanceMetrics: require('../core/monitoring').getPerformanceMetrics,
  PerformanceMonitor: require('../core/monitoring').UnifiedPerformanceMonitor
};

// 従来のimport文をコメントアウト
// import { envManager } from '../config/env-manager.js';

// パフォーマンスメトリクス保存（プロダクションではRedis/CloudWatch等使用）
const performanceMetrics = new Map();
const errorMetrics = new Map();
const alertThresholds = {
  responseTime: 5000, // 5秒
  errorRate: 0.05, // 5%
  memoryUsage: 0.85, // 85%
  concurrentRequests: 50
};

/**
 * パフォーマンス監視ミドルウェア
 */
export class PerformanceMonitor {
  constructor() {
    this.activeRequests = new Map();
    this.metrics = {
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTime: 0,
      currentConcurrentRequests: 0
    };
    
    // 定期的なメトリクス集計（1分毎）
    setInterval(() => this.aggregateMetrics(), 60000);
    
    // 定期的なクリーンアップ（5分毎）
    setInterval(() => this.cleanup(), 300000);
  }

  /**
   * リクエスト開始追跡
   */
  startRequest(req) {
    const requestId = `${req.method}_${Date.now()}_${Math.random()}`;
    const startTime = process.hrtime.bigint();
    
    const requestData = {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
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
   * リクエスト終了追跡
   */
  endRequest(requestId, res, error = null) {
    const requestData = this.activeRequests.get(requestId);
    if (!requestData) return;

    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - requestData.startTime) / 1000000; // ms変換
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
    
    // メトリクス記録
    this.recordMetrics(finalData);
    
    // アラート判定
    this.checkAlerts(finalData);
    
    // アクティブリクエストから削除
    this.activeRequests.delete(requestId);
    this.metrics.currentConcurrentRequests = this.activeRequests.size;
    
    return finalData;
  }

  /**
   * メトリクス記録
   */
  recordMetrics(requestData) {
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
    
    if (requestData.responseTime > alertThresholds.responseTime) {
      metrics.slowRequests++;
    }
    
    metrics.memoryPeak = Math.max(metrics.memoryPeak, requestData.memoryAfter.heapUsed);
    
    // 平均レスポンス時間更新
    this.updateAverageResponseTime(requestData.responseTime);
  }

  /**
   * エラー記録
   */
  recordError(requestData) {
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
   * アラート判定
   */
  checkAlerts(requestData) {
    const alerts = [];
    
    // レスポンス時間チェック
    if (requestData.responseTime > alertThresholds.responseTime) {
      alerts.push({
        type: 'SLOW_RESPONSE',
        message: `Slow response detected: ${requestData.responseTime}ms`,
        threshold: alertThresholds.responseTime,
        actual: requestData.responseTime,
        endpoint: requestData.url
      });
    }
    
    // 同時接続数チェック
    if (this.metrics.currentConcurrentRequests > alertThresholds.concurrentRequests) {
      alerts.push({
        type: 'HIGH_CONCURRENCY',
        message: `High concurrent requests: ${this.metrics.currentConcurrentRequests}`,
        threshold: alertThresholds.concurrentRequests,
        actual: this.metrics.currentConcurrentRequests
      });
    }
    
    // メモリ使用量チェック
    const memoryUsage = requestData.memoryAfter.heapUsed / requestData.memoryAfter.heapTotal;
    if (memoryUsage > alertThresholds.memoryUsage) {
      alerts.push({
        type: 'HIGH_MEMORY',
        message: `High memory usage: ${(memoryUsage * 100).toFixed(1)}%`,
        threshold: alertThresholds.memoryUsage * 100,
        actual: memoryUsage * 100
      });
    }
    
    // アラート送信
    if (alerts.length > 0) {
      this.sendAlerts(alerts);
    }
  }

  /**
   * アラート送信
   */
  async sendAlerts(alerts) {
    
    // 本番環境では Slack/Discord/メール通知などを実装
    if (envManager.get('ALERT_WEBHOOK_URL')) {
      try {
        await fetch(envManager.get('ALERT_WEBHOOK_URL'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Performance Alert - Murder Mystery App`,
            attachments: alerts.map(alert => ({
              color: 'danger',
              title: alert.type,
              text: alert.message,
              fields: [
                { title: 'Threshold', value: alert.threshold, short: true },
                { title: 'Actual', value: alert.actual, short: true }
              ]
            }))
          })
        });
      } catch (error) {
      }
    }
  }

  /**
   * メトリクス集計
   */
  aggregateMetrics() {
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
    
    // エラー率計算
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    
    // 平均レスポンス時間計算
    const avgResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
    
      requests: totalRequests,
      errors: totalErrors,
      errorRate: `${(errorRate * 100).toFixed(2)}%`,
      avgResponseTime: `${avgResponseTime.toFixed(2)}ms`,
      concurrent: this.metrics.currentConcurrentRequests
    });
    
    // エラー率が閾値を超えた場合のアラート
    if (errorRate > alertThresholds.errorRate) {
      this.sendAlerts([{
        type: 'HIGH_ERROR_RATE',
        message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
        threshold: alertThresholds.errorRate * 100,
        actual: errorRate * 100
      }]);
    }
  }

  /**
   * 平均レスポンス時間更新
   */
  updateAverageResponseTime(responseTime) {
    const alpha = 0.1; // 移動平均の重み
    this.metrics.averageResponseTime = 
      this.metrics.averageResponseTime * (1 - alpha) + responseTime * alpha;
  }

  /**
   * クリーンアップ
   */
  cleanup() {
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
   * エンドポイントカテゴリ取得
   */
  getEndpointCategory(url) {
    if (url.includes('/api/ultra-integrated-generator')) return 'generation';
    if (url.includes('/api/micro-generation-system')) return 'micro';
    if (url.includes('/api/export')) return 'export';
    if (url.includes('/api/health')) return 'health';
    if (url.includes('/api/scenario-storage')) return 'storage';
    return 'other';
  }

  /**
   * クライアントIP取得
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
  }

  /**
   * パフォーマンスレポート生成
   */
  generateReport() {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    
    const report = {
      period: '24 hours',
      timestamp: new Date().toISOString(),
      summary: { ...this.metrics },
      endpoints: {},
      errors: {},
      slowestRequests: []
    };
    
    // エンドポイント別統計
    for (const [key, metrics] of performanceMetrics.entries()) {
      const [minute, method, endpoint] = key.split('_');
      const metricTime = parseInt(minute) * 60000;
      
      if (metricTime >= last24Hours) {
        const endpointKey = `${method}_${endpoint}`;
        if (!report.endpoints[endpointKey]) {
          report.endpoints[endpointKey] = {
            requests: 0,
            errors: 0,
            totalResponseTime: 0,
            slowRequests: 0
          };
        }
        
        const ep = report.endpoints[endpointKey];
        ep.requests += metrics.requests;
        ep.errors += metrics.errors;
        ep.totalResponseTime += metrics.totalResponseTime;
        ep.slowRequests += metrics.slowRequests;
      }
    }
    
    // エンドポイント別平均計算
    Object.values(report.endpoints).forEach(ep => {
      ep.avgResponseTime = ep.requests > 0 ? ep.totalResponseTime / ep.requests : 0;
      ep.errorRate = ep.requests > 0 ? ep.errors / ep.requests : 0;
    });
    
    return report;
  }

  /**
   * Express/Vercel ミドルウェア
   */
  middleware() {
    return (req, res, next) => {
      const requestId = this.startRequest(req);
      
      // レスポンス終了時の処理
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
      
      // エラーハンドリング
      req.on('error', (error) => {
        endRequest(error);
      });
      
      res.on('error', (error) => {
        endRequest(error);
      });
      
      next?.();
    };
  }
}

// シングルトンインスタンス
export const performanceMonitor = new PerformanceMonitor();

/**
 * パフォーマンス監視ミドルウェア取得
 */
export function createPerformanceMiddleware() {
  return performanceMonitor.middleware();
}

/**
 * メトリクス取得API
 */
export function getPerformanceMetrics() {
  return {
    current: performanceMonitor.metrics,
    report: performanceMonitor.generateReport(),
    alerts: alertThresholds
  };
}