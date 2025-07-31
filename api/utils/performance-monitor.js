/**
 * パフォーマンスモニタリングユーティリティ
 * アプリケーションのパフォーマンスを監視・最適化
 */

const { logger } = require('./logger.js');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: new Map(),
      operations: new Map(),
      avgResponseTime: 0,
      totalRequests: 0,
      activeRequests: 0,
      peakActiveRequests: 0
    };
    
    this.thresholds = {
      slowRequestMs: 3000,
      verySlowRequestMs: 8000,
      memoryWarningMB: 400,
      memoryCriticalMB: 450
    };
  }

  /**
   * リクエストの開始を記録
   */
  startRequest(requestId, metadata = {}) {
    const request = {
      id: requestId,
      startTime: Date.now(),
      metadata,
      markers: new Map()
    };
    
    this.metrics.requests.set(requestId, request);
    this.metrics.activeRequests++;
    
    if (this.metrics.activeRequests > this.metrics.peakActiveRequests) {
      this.metrics.peakActiveRequests = this.metrics.activeRequests;
    }
    
    return request;
  }

  /**
   * リクエストの終了を記録
   */
  endRequest(requestId, status = 'success') {
    const request = this.metrics.requests.get(requestId);
    if (!request) return;
    
    request.endTime = Date.now();
    request.duration = request.endTime - request.startTime;
    request.status = status;
    
    this.metrics.activeRequests--;
    this.metrics.totalRequests++;
    
    // 平均応答時間を更新
    this.updateAverageResponseTime(request.duration);
    
    // 遅いリクエストの警告
    if (request.duration > this.thresholds.verySlowRequestMs) {
      logger.warn(`🐌 Very slow request detected: ${requestId} took ${request.duration}ms`);
    } else if (request.duration > this.thresholds.slowRequestMs) {
      logger.debug(`⚠️ Slow request: ${requestId} took ${request.duration}ms`);
    }
    
    // メモリ制限のため、古いリクエスト情報を削除
    if (this.metrics.requests.size > 100) {
      const oldestKey = this.metrics.requests.keys().next().value;
      this.metrics.requests.delete(oldestKey);
    }
  }

  /**
   * リクエスト内のマーカーを追加
   */
  addMarker(requestId, markerName) {
    const request = this.metrics.requests.get(requestId);
    if (!request) return;
    
    request.markers.set(markerName, Date.now() - request.startTime);
  }

  /**
   * オペレーションのパフォーマンスを記録
   */
  async measureOperation(operationName, fn) {
    const startTime = Date.now();
    let result;
    let error;
    
    try {
      result = await fn();
    } catch (e) {
      error = e;
    }
    
    const duration = Date.now() - startTime;
    this.recordOperation(operationName, duration, !error);
    
    if (error) throw error;
    return result;
  }

  /**
   * オペレーションの記録
   */
  recordOperation(name, duration, success = true) {
    let operation = this.metrics.operations.get(name);
    
    if (!operation) {
      operation = {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        failures: 0
      };
      this.metrics.operations.set(name, operation);
    }
    
    operation.count++;
    operation.totalDuration += duration;
    operation.avgDuration = operation.totalDuration / operation.count;
    operation.minDuration = Math.min(operation.minDuration, duration);
    operation.maxDuration = Math.max(operation.maxDuration, duration);
    
    if (!success) {
      operation.failures++;
    }
  }

  /**
   * 平均応答時間を更新
   */
  updateAverageResponseTime(duration) {
    const total = this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + duration;
    this.metrics.avgResponseTime = total / this.metrics.totalRequests;
  }

  /**
   * メモリ使用状況をチェック
   */
  checkMemoryUsage() {
    const usage = process.memoryUsage();
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    
    if (heapUsedMB > this.thresholds.memoryCriticalMB) {
      logger.error(`🚨 Critical memory usage: ${heapUsedMB.toFixed(2)}MB`);
      return 'critical';
    } else if (heapUsedMB > this.thresholds.memoryWarningMB) {
      logger.warn(`⚠️ High memory usage: ${heapUsedMB.toFixed(2)}MB`);
      return 'warning';
    }
    
    return 'normal';
  }

  /**
   * パフォーマンスレポートを生成
   */
  generateReport() {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    
    const report = {
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      requests: {
        total: this.metrics.totalRequests,
        active: this.metrics.activeRequests,
        peakActive: this.metrics.peakActiveRequests,
        avgResponseTime: `${this.metrics.avgResponseTime.toFixed(2)}ms`
      },
      memory: {
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)}MB`,
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`
      },
      operations: {}
    };
    
    // 主要なオペレーションの統計を含める
    this.metrics.operations.forEach((stats, name) => {
      report.operations[name] = {
        count: stats.count,
        avgDuration: `${stats.avgDuration.toFixed(2)}ms`,
        minDuration: `${stats.minDuration.toFixed(2)}ms`,
        maxDuration: `${stats.maxDuration.toFixed(2)}ms`,
        failureRate: `${((stats.failures / stats.count) * 100).toFixed(2)}%`
      };
    });
    
    return report;
  }

  /**
   * パフォーマンスの問題を診断
   */
  diagnosePerformanceIssues() {
    const issues = [];
    const memoryStatus = this.checkMemoryUsage();
    
    if (memoryStatus !== 'normal') {
      issues.push({
        type: 'memory',
        severity: memoryStatus,
        message: 'High memory usage detected'
      });
    }
    
    if (this.metrics.avgResponseTime > 5000) {
      issues.push({
        type: 'response_time',
        severity: 'warning',
        message: 'Average response time is too high'
      });
    }
    
    this.metrics.operations.forEach((stats, name) => {
      if (stats.avgDuration > 3000) {
        issues.push({
          type: 'slow_operation',
          severity: 'warning',
          operation: name,
          message: `Operation ${name} is running slowly`
        });
      }
      
      const failureRate = stats.failures / stats.count;
      if (failureRate > 0.1) {
        issues.push({
          type: 'high_failure_rate',
          severity: 'error',
          operation: name,
          message: `Operation ${name} has high failure rate: ${(failureRate * 100).toFixed(2)}%`
        });
      }
    });
    
    return issues;
  }
}

// シングルトンインスタンス
const performanceMonitor = new PerformanceMonitor();

module.exports = {
  performanceMonitor,
  PerformanceMonitor
};