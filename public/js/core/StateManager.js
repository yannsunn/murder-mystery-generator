/**
 * StateManager - 状態管理システム
 * Redux風の単一ストア実装
 */
class StateManager extends EventEmitter {
  constructor(initialState = {}) {
    super();
    this.state = this.deepClone(initialState);
    this.history = [this.deepClone(this.state)];
    this.maxHistory = 50;
    this.middlewares = [];
    this.reducers = new Map();
  }

  /**
   * ミドルウェアを追加
   */
  use(middleware) {
    if (typeof middleware !== 'function') {
      throw new TypeError('Middleware must be a function');
    }
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * リデューサーを登録
   */
  addReducer(name, reducer) {
    if (typeof reducer !== 'function') {
      throw new TypeError('Reducer must be a function');
    }
    this.reducers.set(name, reducer);
    return this;
  }

  /**
   * アクションをディスパッチ
   */
  dispatch(action) {
    if (!action || typeof action !== 'object' || !action.type) {
      throw new Error('Action must be an object with a type property');
    }

    // ミドルウェア実行
    let processedAction = action;
    for (const middleware of this.middlewares) {
      try {
        processedAction = middleware(processedAction, this.state) || processedAction;
      } catch (error) {
        console.error('Middleware error:', error);
      }
    }

    // 前の状態を保存
    const prevState = this.deepClone(this.state);

    // リデューサーを実行
    let newState = this.deepClone(this.state);
    for (const [name, reducer] of this.reducers) {
      try {
        const slice = reducer(newState[name], processedAction);
        if (slice !== undefined) {
          newState[name] = slice;
        }
      } catch (error) {
        console.error(`Reducer "${name}" error:`, error);
      }
    }

    // 状態が変更された場合のみ更新
    if (!this.deepEqual(prevState, newState)) {
      this.state = newState;
      this.addToHistory(newState);
      
      // 変更イベントを発火
      this.emit('state:change', {
        action: processedAction,
        prevState,
        newState: this.deepClone(newState)
      });

      // 特定のキーの変更イベント
      this.emitSpecificChanges(prevState, newState, processedAction);
    }

    return this;
  }

  /**
   * 現在の状態を取得
   */
  getState(path = null) {
    if (!path) {
      return this.deepClone(this.state);
    }

    const keys = path.split('.');
    let value = this.state;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return this.deepClone(value);
  }

  /**
   * 状態を直接設定（開発用）
   */
  setState(newState) {
    if (process?.env?.NODE_ENV === 'development') {
      const prevState = this.deepClone(this.state);
      this.state = this.deepClone(newState);
      this.addToHistory(this.state);
      
      this.emit('state:change', {
        action: { type: 'SET_STATE' },
        prevState,
        newState: this.deepClone(this.state)
      });
    } else {
      console.warn('setState should only be used in development');
    }
  }

  /**
   * 状態の購読
   */
  subscribe(path, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    const listener = ({ newState, prevState }) => {
      const newValue = path ? this.getValueByPath(newState, path) : newState;
      const prevValue = path ? this.getValueByPath(prevState, path) : prevState;
      
      if (!this.deepEqual(newValue, prevValue)) {
        callback(newValue, prevValue);
      }
    };

    this.on('state:change', listener);
    
    return () => this.off('state:change', listener);
  }

  /**
   * ヒストリー管理
   */
  addToHistory(state) {
    this.history.push(this.deepClone(state));
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  /**
   * 状態を戻す
   */
  undo() {
    if (this.history.length > 1) {
      this.history.pop(); // 現在の状態を削除
      const prevState = this.history[this.history.length - 1];
      this.state = this.deepClone(prevState);
      
      this.emit('state:undo', {
        state: this.deepClone(this.state)
      });
    }
  }

  /**
   * 特定の変更イベントを発火
   */
  emitSpecificChanges(prevState, newState, action) {
    const changes = this.getChangedPaths(prevState, newState);
    
    for (const path of changes) {
      this.emit(`state:change:${path}`, {
        action,
        path,
        value: this.getValueByPath(newState, path),
        prevValue: this.getValueByPath(prevState, path)
      });
    }
  }

  /**
   * 変更されたパスを取得
   */
  getChangedPaths(obj1, obj2, prefix = '') {
    const changes = [];
    const keys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);

    for (const key of keys) {
      const path = prefix ? `${prefix}.${key}` : key;
      const val1 = obj1?.[key];
      const val2 = obj2?.[key];

      if (!this.deepEqual(val1, val2)) {
        changes.push(path);
        
        if (typeof val1 === 'object' && typeof val2 === 'object' && val1 && val2) {
          changes.push(...this.getChangedPaths(val1, val2, path));
        }
      }
    }

    return changes;
  }

  /**
   * パスで値を取得
   */
  getValueByPath(obj, path) {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * ディープクローン
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepClone(item));
    if (typeof obj === 'object') {
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
  }

  /**
   * ディープイコール
   */
  deepEqual(obj1, obj2) {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return obj1 === obj2;
    if (typeof obj1 !== typeof obj2) return false;

    if (typeof obj1 === 'object') {
      if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
      
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);
      
      if (keys1.length !== keys2.length) return false;
      
      for (const key of keys1) {
        if (!keys2.includes(key) || !this.deepEqual(obj1[key], obj2[key])) {
          return false;
        }
      }
      
      return true;
    }

    return obj1 === obj2;
  }

  /**
   * デバッグ用情報
   */
  getDebugInfo() {
    return {
      state: this.deepClone(this.state),
      historyLength: this.history.length,
      reducerCount: this.reducers.size,
      middlewareCount: this.middlewares.length,
      listenerCount: this.listenerCount('state:change')
    };
  }
}

export default StateManager;