/**
 * Logger - 高性能ログシステム
 * レベル別ログ、フィルタリング、パフォーマンス追跡
 */
class Logger {
  constructor(options = {}) {
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3,
      TRACE: 4
    };

    this.currentLevel = options.level ?? this.levels.INFO;
    this.enableColors = options.colors ?? true;
    this.enableTimestamp = options.timestamp ?? true;
    this.maxLogSize = options.maxLogSize ?? 1000;
    this.namespace = options.namespace ?? 'App';
    
    this.logs = [];
    this.performance = new Map();
    this.filters = [];
    this.outputs = [this.consoleOutput.bind(this)];

    this.colors = {
      ERROR: '#ff4757',
      WARN: '#ffa502',
      INFO: '#3742fa',
      DEBUG: '#2ed573',
      TRACE: '#747d8c'
    };

    this.setupProductionMode();
  }

  /**
   * 本番環境設定
   */
  setupProductionMode() {
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      this.currentLevel = this.levels.WARN;
      this.enableColors = false;
    }
  }

  /**
   * ログレベル設定
   */
  setLevel(level) {
    if (typeof level === 'string') {
      this.currentLevel = this.levels[level.toUpperCase()] ?? this.levels.INFO;
    } else if (typeof level === 'number') {
      this.currentLevel = level;
    }
    return this;
  }

  /**
   * フィルターを追加
   */
  addFilter(filterFn) {
    if (typeof filterFn === 'function') {
      this.filters.push(filterFn);
    }
    return this;
  }

  /**
   * 出力先を追加
   */
  addOutput(outputFn) {
    if (typeof outputFn === 'function') {
      this.outputs.push(outputFn);
    }
    return this;
  }

  /**
   * ログ出力の共通処理
   */
  log(level, message, ...args) {
    const levelNum = this.levels[level];
    if (levelNum > this.currentLevel) return;

    const logEntry = {
      level,
      message,
      args,
      timestamp: new Date(),
      namespace: this.namespace,
      stack: level === 'ERROR' ? new Error().stack : null
    };

    // フィルター適用
    for (const filter of this.filters) {
      if (!filter(logEntry)) return;
    }

    // ログ保存
    this.addToLogs(logEntry);

    // 出力
    for (const output of this.outputs) {
      output(logEntry);
    }
  }

  /**
   * コンソール出力
   */
  consoleOutput(logEntry) {
    const { level, message, args, timestamp, namespace } = logEntry;
    
    const prefix = this.createPrefix(level, timestamp, namespace);
    const color = this.colors[level];
    
    if (this.enableColors && typeof console[level.toLowerCase()] === 'function') {
      console[level.toLowerCase()](
        `%c${prefix}`,
        `color: ${color}; font-weight: bold;`,
        message,
        ...args
      );
    } else {
      console.log(prefix, message, ...args);
    }
  }

  /**
   * プレフィックス作成
   */
  createPrefix(level, timestamp, namespace) {
    let prefix = `[${level}]`;
    
    if (this.enableTimestamp) {
      const time = timestamp.toISOString().substr(11, 8);
      prefix = `[${time}] ${prefix}`;
    }
    
    if (namespace) {
      prefix = `${prefix} [${namespace}]`;
    }
    
    return prefix;
  }

  /**
   * ログを保存
   */
  addToLogs(logEntry) {
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogSize) {
      this.logs.shift();
    }
  }

  /**
   * パフォーマンス測定開始
   */
  time(label) {
    this.performance.set(label, {
      start: performance.now(),
      label
    });
    this.debug(`⏱️ Timer started: ${label}`);
  }

  /**
   * パフォーマンス測定終了
   */
  timeEnd(label) {
    const entry = this.performance.get(label);
    if (!entry) {
      this.warn(`Timer "${label}" does not exist`);
      return;
    }

    const duration = performance.now() - entry.start;
    this.performance.delete(label);
    
    this.info(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * メモリ使用量ログ
   */
  logMemory() {
    if ('memory' in performance) {
      const memory = performance.memory;
      this.info('💾 Memory Usage:', {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
      });
    }
  }

  /**
   * エラーレポート作成
   */
  createErrorReport(error) {
    const report = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      logs: this.getLogs('ERROR', 10),
      performance: Object.fromEntries(this.performance)
    };

    this.error('📋 Error Report Generated:', report);
    return report;
  }

  /**
   * ログを取得
   */
  getLogs(level = null, limit = null) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return filteredLogs;
  }

  /**
   * ログをクリア
   */
  clear() {
    this.logs = [];
    this.performance.clear();
    this.info('🧹 Logs cleared');
  }

  /**
   * 統計情報
   */
  getStats() {
    const stats = {};
    for (const level of Object.keys(this.levels)) {
      stats[level] = this.logs.filter(log => log.level === level).length;
    }
    return stats;
  }

  // レベル別メソッド
  error(message, ...args) { this.log('ERROR', message, ...args); }
  warn(message, ...args) { this.log('WARN', message, ...args); }
  info(message, ...args) { this.log('INFO', message, ...args); }
  debug(message, ...args) { this.log('DEBUG', message, ...args); }
  trace(message, ...args) { this.log('TRACE', message, ...args); }

  /**
   * 子ロガー作成
   */
  child(namespace) {
    return new Logger({
      level: this.currentLevel,
      colors: this.enableColors,
      timestamp: this.enableTimestamp,
      namespace: `${this.namespace}:${namespace}`
    });
  }

  /**
   * ログをエクスポート
   */
  export(format = 'json') {
    if (format === 'json') {
      return JSON.stringify({
        namespace: this.namespace,
        logs: this.logs,
        stats: this.getStats(),
        timestamp: new Date().toISOString()
      }, null, 2);
    }
    
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'namespace', 'message'];
      const rows = this.logs.map(log => [
        log.timestamp.toISOString(),
        log.level,
        log.namespace,
        log.message
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}

// グローバルロガーのシングルトン
window.Logger = window.Logger || new Logger({ namespace: 'MurderMystery' });

export default Logger;