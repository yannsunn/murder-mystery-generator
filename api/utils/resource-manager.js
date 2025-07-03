/**
 * 🔧 ウルトラリソースマネージャー - メモリリーク完全防止システム
 * EventSource、タイマー、接続の自動管理
 */

import { logger } from './logger.js';

export class UltraResourceManager {
  constructor() {
    this.eventSources = new Map();
    this.timers = new Set();
    this.connections = new Map();
    this.cleanupInterval = null;
    this.isActive = true;
    
    // プロセス終了時の自動クリーンアップ
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
    process.on('uncaughtException', () => this.shutdown());
    
    logger.debug('🔧 UltraResourceManager initialized');
  }

  /**
   * EventSource登録と自動管理
   */
  registerEventSource(id, eventSource) {
    if (!this.isActive) return;
    
    this.eventSources.set(id, {
      source: eventSource,
      createdAt: Date.now()
    });
    
    // 自動エラーハンドリング
    eventSource.onerror = (error) => {
      logger.warn(`EventSource error for ${id}:`, error);
      this.cleanupEventSource(id);
    };
    
    // 自動タイムアウト (30分)
    const timeout = setTimeout(() => {
      logger.warn(`EventSource timeout for ${id}, cleaning up`);
      this.cleanupEventSource(id);
    }, 30 * 60 * 1000);
    
    this.timers.add(timeout);
    
    logger.debug(`EventSource registered: ${id}`);
  }

  /**
   * EventSource個別クリーンアップ
   */
  cleanupEventSource(id) {
    const eventSourceData = this.eventSources.get(id);
    if (eventSourceData) {
      try {
        eventSourceData.source.close();
        logger.debug(`EventSource closed: ${id}`);
      } catch (error) {
        logger.warn(`Error closing EventSource ${id}:`, error);
      }
      this.eventSources.delete(id);
    }
  }

  /**
   * 管理されたタイマー作成
   */
  setTimeout(callback, delay, ...args) {
    if (!this.isActive) return null;
    
    const timer = setTimeout((...timerArgs) => {
      try {
        callback(...timerArgs);
      } catch (error) {
        logger.error('Timer callback error:', error);
      } finally {
        this.timers.delete(timer);
      }
    }, delay, ...args);
    
    this.timers.add(timer);
    return timer;
  }

  /**
   * 管理されたインターバル作成
   */
  setInterval(callback, interval, ...args) {
    if (!this.isActive) return null;
    
    const timer = setInterval((...timerArgs) => {
      try {
        callback(...timerArgs);
      } catch (error) {
        logger.error('Interval callback error:', error);
      }
    }, interval, ...args);
    
    this.timers.add(timer);
    return timer;
  }

  /**
   * タイマークリア
   */
  clearTimeout(timer) {
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(timer);
    }
  }

  /**
   * インターバルクリア
   */
  clearInterval(timer) {
    if (timer) {
      clearInterval(timer);
      this.timers.delete(timer);
    }
  }

  /**
   * 接続管理
   */
  registerConnection(id, connection) {
    if (!this.isActive) return;
    
    this.connections.set(id, {
      connection,
      createdAt: Date.now(),
      lastUsed: Date.now()
    });
    
    logger.debug(`Connection registered: ${id}`);
  }

  /**
   * 接続取得（最終使用時刻更新）
   */
  getConnection(id) {
    const connectionData = this.connections.get(id);
    if (connectionData) {
      connectionData.lastUsed = Date.now();
      return connectionData.connection;
    }
    return null;
  }

  /**
   * 接続クリーンアップ
   */
  cleanupConnection(id) {
    const connectionData = this.connections.get(id);
    if (connectionData) {
      try {
        if (connectionData.connection.close) {
          connectionData.connection.close();
        }
        logger.debug(`Connection closed: ${id}`);
      } catch (error) {
        logger.warn(`Error closing connection ${id}:`, error);
      }
      this.connections.delete(id);
    }
  }

  /**
   * 定期的なリソースクリーンアップ開始
   */
  startPeriodicCleanup(intervalMs = 60000) { // 1分ごと
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = this.setInterval(() => {
      this.performCleanup();
    }, intervalMs);
    
    logger.debug('Periodic cleanup started');
  }

  /**
   * 定期クリーンアップ実行
   */
  performCleanup() {
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30分
    
    // 古いEventSourceをクリーンアップ
    for (const [id, data] of this.eventSources.entries()) {
      if (now - data.createdAt > maxAge) {
        logger.debug(`Cleaning up old EventSource: ${id}`);
        this.cleanupEventSource(id);
      }
    }
    
    // 古い接続をクリーンアップ
    for (const [id, data] of this.connections.entries()) {
      if (now - data.lastUsed > maxAge) {
        logger.debug(`Cleaning up old connection: ${id}`);
        this.cleanupConnection(id);
      }
    }
    
    logger.debug(`Cleanup completed. Active: EventSources=${this.eventSources.size}, Timers=${this.timers.size}, Connections=${this.connections.size}`);
  }

  /**
   * 全リソースクリーンアップ
   */
  cleanup() {
    logger.debug('Starting full resource cleanup');
    
    // EventSourceクリーンアップ
    for (const id of this.eventSources.keys()) {
      this.cleanupEventSource(id);
    }
    
    // タイマークリーンアップ
    for (const timer of this.timers) {
      try {
        clearTimeout(timer);
        clearInterval(timer);
      } catch (error) {
        // 無視
      }
    }
    this.timers.clear();
    
    // 接続クリーンアップ
    for (const id of this.connections.keys()) {
      this.cleanupConnection(id);
    }
    
    // 定期クリーンアップ停止
    if (this.cleanupInterval) {
      this.clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    logger.debug('Full resource cleanup completed');
  }

  /**
   * システムシャットダウン
   */
  shutdown() {
    if (!this.isActive) return;
    
    logger.info('Resource manager shutting down...');
    this.isActive = false;
    this.cleanup();
    logger.info('Resource manager shutdown complete');
  }

  /**
   * 統計情報取得
   */
  getStats() {
    return {
      eventSources: this.eventSources.size,
      timers: this.timers.size,
      connections: this.connections.size,
      isActive: this.isActive
    };
  }
}

// シングルトンインスタンス
export const resourceManager = new UltraResourceManager();

// 自動開始
resourceManager.startPeriodicCleanup();