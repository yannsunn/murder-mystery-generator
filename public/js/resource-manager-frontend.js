/**
 * 🔧 フロントエンド リソースマネージャー - メモリリーク防止
 */

class FrontendResourceManager {
  constructor() {
    this.eventSources = new Map();
    this.timers = new Set();
    this.intervals = new Set();
    this.eventListeners = new Map();
    this.isActive = true;
    
    // ページアンロード時の自動クリーンアップ
    window.addEventListener('beforeunload', () => this.cleanup());
    window.addEventListener('unload', () => this.cleanup());
    
    // ページ非表示時のクリーンアップ
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.cleanup();
      }
    });
    
    logger.debug('🔧 Frontend Resource Manager initialized');
  }

  /**
   * EventSource管理
   */
  createEventSource(url, options = {}) {
    if (!this.isActive) return null;
    
    const id = options.id || `es_${Date.now()}`;
    const eventSource = new EventSource(url);
    
    this.eventSources.set(id, {
      source: eventSource,
      createdAt: Date.now(),
      url: url
    });
    
    // 自動エラーハンドリング
    eventSource.onerror = (error) => {
      logger.warn(`EventSource error for ${id}:`, error);
      this.closeEventSource(id);
    };
    
    // 自動タイムアウト (30分)
    const timeout = this.setTimeout(() => {
      logger.warn(`EventSource timeout for ${id}`);
      this.closeEventSource(id);
    }, 30 * 60 * 1000);
    
    logger.debug(`EventSource created: ${id} -> ${url}`);
    return { eventSource, id };
  }

  /**
   * EventSource終了
   */
  closeEventSource(id) {
    const data = this.eventSources.get(id);
    if (data) {
      try {
        data.source.close();
        logger.debug(`EventSource closed: ${id}`);
      } catch (error) {
        logger.warn(`Error closing EventSource ${id}:`, error);
      }
      this.eventSources.delete(id);
    }
  }

  /**
   * 管理されたsetTimeout
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
   * 管理されたsetInterval
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
    
    this.intervals.add(timer);
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
      this.intervals.delete(timer);
    }
  }

  /**
   * イベントリスナー管理
   */
  addEventListener(element, event, handler, options = {}) {
    if (!this.isActive) return;
    
    const key = `${element.tagName || 'unknown'}_${event}_${Date.now()}`;
    
    element.addEventListener(event, handler, options);
    
    this.eventListeners.set(key, {
      element,
      event,
      handler,
      options,
      createdAt: Date.now()
    });
    
    logger.debug(`Event listener added: ${key}`);
    return key;
  }

  /**
   * イベントリスナー削除
   */
  removeEventListener(key) {
    const data = this.eventListeners.get(key);
    if (data) {
      try {
        data.element.removeEventListener(data.event, data.handler, data.options);
        logger.debug(`Event listener removed: ${key}`);
      } catch (error) {
        logger.warn(`Error removing event listener ${key}:`, error);
      }
      this.eventListeners.delete(key);
    }
  }

  /**
   * 全リソースクリーンアップ
   */
  cleanup() {
    if (!this.isActive) return;
    
    logger.debug('Starting frontend resource cleanup');
    
    // EventSourceクリーンアップ
    for (const id of this.eventSources.keys()) {
      this.closeEventSource(id);
    }
    
    // タイマークリーンアップ
    for (const timer of this.timers) {
      try {
        clearTimeout(timer);
      } catch (error) {
        // 無視
      }
    }
    this.timers.clear();
    
    // インターバルクリーンアップ
    for (const timer of this.intervals) {
      try {
        clearInterval(timer);
      } catch (error) {
        // 無視
      }
    }
    this.intervals.clear();
    
    // イベントリスナークリーンアップ
    for (const key of this.eventListeners.keys()) {
      this.removeEventListener(key);
    }
    
    logger.debug('Frontend resource cleanup completed');
  }

  /**
   * 統計情報
   */
  getStats() {
    return {
      eventSources: this.eventSources.size,
      timers: this.timers.size,
      intervals: this.intervals.size,
      eventListeners: this.eventListeners.size,
      isActive: this.isActive
    };
  }
}

// グローバルインスタンス
window.resourceManager = new FrontendResourceManager();