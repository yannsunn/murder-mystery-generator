/**
 * シンプルなリソースマネージャー
 */

const { logger } = require('./logger.js');

class SimpleResourceManager {
  constructor() {
    this.eventSources = new Map();
    this.timers = new Set();
  }

  /**
   * EventSource登録
   */
  registerEventSource(id, eventSource) {
    // 既存のEventSourceがあれば閉じる
    this.cleanupEventSource(id);
    
    this.eventSources.set(id, eventSource);
    
    // エラー時の自動クリーンアップ
    eventSource.onerror = () => {
      logger.debug(`EventSource error: ${id}`);
      this.cleanupEventSource(id);
    };
  }

  /**
   * EventSourceクリーンアップ
   */
  cleanupEventSource(id) {
    const eventSource = this.eventSources.get(id);
    if (eventSource) {
      try {
        eventSource.close();
      } catch (error) {
        // エラーは無視
      }
      this.eventSources.delete(id);
    }
  }

  /**
   * タイマー管理
   */
  setTimeout(callback, delay) {
    const timer = setTimeout(() => {
      callback();
      this.timers.delete(timer);
    }, delay);
    
    this.timers.add(timer);
    return timer;
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
    // EventSourceクリーンアップ
    for (const id of this.eventSources.keys()) {
      this.cleanupEventSource(id);
    }
    
    // タイマークリーンアップ
    for (const timer of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  /**
   * 統計情報
   */
  getStats() {
    return {
      eventSources: this.eventSources.size,
      timers: this.timers.size
    };
  }
}

// シングルトンインスタンス
const resourceManager = new SimpleResourceManager();

module.exports = { resourceManager };

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => resourceManager.cleanup());
process.on('SIGTERM', () => resourceManager.cleanup());