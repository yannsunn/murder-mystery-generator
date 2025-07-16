/**
 * シンプルなリソースマネージャー
 * 統合EventSourceManagerと連携して動作
 */

const { logger } = require('./logger.js');

class SimpleResourceManager {
  constructor() {
    this.eventSources = new Map();
    this.timers = new Set();
    this.intervals = new Set();
    this.callbacks = new Map();
  }

  /**
   * EventSource登録
   */
  registerEventSource(id, eventSource) {
    // 既存のEventSourceがあれば閉じる
    this.cleanupEventSource(id);
    
    this.eventSources.set(id, eventSource);
    
    // エラー時の自動クリーンアップ
    if (eventSource && typeof eventSource.onerror !== 'undefined') {
      eventSource.onerror = () => {
        logger.debug(`EventSource error: ${id}`);
        this.cleanupEventSource(id);
      };
    }
    
    // コールバック関数の場合
    if (eventSource && typeof eventSource.close === 'function') {
      this.callbacks.set(id, eventSource.close);
    }
  }

  /**
   * EventSourceクリーンアップ
   */
  cleanupEventSource(id) {
    const eventSource = this.eventSources.get(id);
    if (eventSource) {
      try {
        if (typeof eventSource.close === 'function') {
          eventSource.close();
        }
      } catch (error) {
        // エラーは無視
      }
      this.eventSources.delete(id);
    }
    
    // コールバック関数の実行
    const callback = this.callbacks.get(id);
    if (callback && typeof callback === 'function') {
      try {
        callback();
      } catch (error) {
        logger.debug(`Callback error for ${id}: ${error.message}`);
      }
      this.callbacks.delete(id);
    }
  }

  /**
   * タイマー管理
   */
  setTimeout(callback, delay) {
    const timer = setTimeout(() => {
      try {
        callback();
      } catch (error) {
        logger.error(`Timer callback error: ${error.message}`);
      }
      this.timers.delete(timer);
    }, delay);
    
    this.timers.add(timer);
    return timer;
  }

  /**
   * インターバル管理
   */
  setInterval(callback, delay) {
    const interval = setInterval(() => {
      try {
        callback();
      } catch (error) {
        logger.error(`Interval callback error: ${error.message}`);
      }
    }, delay);
    
    this.intervals.add(interval);
    return interval;
  }
  
  /**
   * インターバルクリア
   */
  clearInterval(interval) {
    if (interval && this.intervals.has(interval)) {
      clearInterval(interval);
      this.intervals.delete(interval);
    }
  }
  
  /**
   * タイマークリア
   */
  clearTimeout(timer) {
    if (timer && this.timers.has(timer)) {
      clearTimeout(timer);
      this.timers.delete(timer);
    }
  }

  /**
   * 全リソースクリーンアップ
   */
  cleanup() {
    logger.info('🧹 Resource Manager cleanup starting...');
    
    // EventSourceクリーンアップ
    for (const id of this.eventSources.keys()) {
      this.cleanupEventSource(id);
    }
    
    // タイマークリーンアップ
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
    
    // インターバルクリーンアップ
    for (const interval of this.intervals) {
      clearInterval(interval);
    }
    this.intervals.clear();
    
    // コールバッククリア
    this.callbacks.clear();
    
    logger.info('✅ Resource Manager cleanup completed');
  }

  /**
   * 統計情報
   */
  getStats() {
    return {
      eventSources: this.eventSources.size,
      timers: this.timers.size,
      intervals: this.intervals.size,
      callbacks: this.callbacks.size,
      memoryUsage: process.memoryUsage()
    };
  }
}

// シングルトンインスタンス
const resourceManager = new SimpleResourceManager();

module.exports = { 
  resourceManager,
  SimpleResourceManager
};

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  logger.info('SIGINT received - cleaning up resources...');
  resourceManager.cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received - cleaning up resources...');
  resourceManager.cleanup();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  resourceManager.cleanup();
  process.exit(1);
});