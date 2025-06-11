/**
 * EventEmitter - 軽量なイベント駆動システム
 * Observer パターンの実装
 */
class EventEmitter {
  constructor() {
    this.events = new Map();
    this.maxListeners = 50;
  }

  /**
   * イベントリスナーを追加
   * @param {string} event - イベント名
   * @param {Function} listener - リスナー関数
   * @param {Object} options - オプション
   */
  on(event, listener, options = {}) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function');
    }

    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    const listeners = this.events.get(event);
    
    if (listeners.length >= this.maxListeners) {
      console.warn(`MaxListenersExceededWarning: ${event} has ${listeners.length} listeners`);
    }

    listeners.push({
      listener,
      once: options.once || false,
      context: options.context || null
    });

    return this;
  }

  /**
   * 一度だけ実行されるリスナーを追加
   */
  once(event, listener, context = null) {
    return this.on(event, listener, { once: true, context });
  }

  /**
   * イベントを発火
   * @param {string} event - イベント名
   * @param {...any} args - 引数
   */
  emit(event, ...args) {
    if (!this.events.has(event)) {
      return false;
    }

    const listeners = this.events.get(event).slice(); // コピーを作成
    let removed = 0;

    for (let i = 0; i < listeners.length; i++) {
      const { listener, once, context } = listeners[i];
      
      try {
        if (context) {
          listener.call(context, ...args);
        } else {
          listener(...args);
        }
      } catch (error) {
        console.error(`Error in event listener for "${event}":`, error);
      }

      if (once) {
        this.events.get(event).splice(i - removed, 1);
        removed++;
      }
    }

    return true;
  }

  /**
   * リスナーを削除
   */
  off(event, listener) {
    if (!this.events.has(event)) {
      return this;
    }

    if (!listener) {
      this.events.delete(event);
      return this;
    }

    const listeners = this.events.get(event);
    const index = listeners.findIndex(item => item.listener === listener);
    
    if (index !== -1) {
      listeners.splice(index, 1);
    }

    if (listeners.length === 0) {
      this.events.delete(event);
    }

    return this;
  }

  /**
   * 全てのリスナーを削除
   */
  removeAllListeners(event = null) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
    return this;
  }

  /**
   * リスナー数を取得
   */
  listenerCount(event) {
    return this.events.has(event) ? this.events.get(event).length : 0;
  }

  /**
   * デバッグ用情報取得
   */
  getDebugInfo() {
    const info = {};
    for (const [event, listeners] of this.events) {
      info[event] = listeners.length;
    }
    return info;
  }
}

// グローバルイベントバスのシングルトン
window.EventBus = window.EventBus || new EventEmitter();

export default EventEmitter;