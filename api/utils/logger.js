/**
 * 📊 ENHANCED LOGGING SYSTEM
 * 統一エラーハンドリングと連携した高機能ログシステム
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

/**
 * 📝 LOG LEVELS
 * ログレベル定義
 */
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  SUCCESS: 2,
  WARN: 3,
  ERROR: 4,
  CRITICAL: 5
};

/**
 * 🎨 LOG COLORS
 * コンソールカラー定義
 */
const LOG_COLORS = {
  DEBUG: '\x1b[36m',    // Cyan
  INFO: '\x1b[34m',     // Blue
  SUCCESS: '\x1b[32m',  // Green
  WARN: '\x1b[33m',     // Yellow
  ERROR: '\x1b[31m',    // Red
  CRITICAL: '\x1b[35m', // Magenta
  RESET: '\x1b[0m'      // Reset
};

/**
 * 🚀 ENHANCED LOGGER CLASS
 * 拡張ログシステム
 */
class EnhancedLogger {
  constructor(options = {}) {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.parseLogLevel(options.logLevel || process.env.LOG_LEVEL || 'INFO');
    this.enableColors = !this.isProduction && (options.enableColors !== false);
    this.enableFileLogging = this.isProduction || (options.enableFileLogging === true);
    this.logDir = options.logDir || path.join(process.cwd(), 'logs');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    this.logBuffer = [];
    this.bufferSize = options.bufferSize || 100;
    this.flushInterval = options.flushInterval || 5000; // 5秒
    this.metadata = {
      service: options.service || 'murder-mystery-app',
      version: options.version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      instanceId: this.generateInstanceId()
    };
    
    this.setupFileLogging();
    this.setupPeriodicFlush();
    this.setupProcessHandlers();
  }

  /**
   * ログレベル解析
   */
  parseLogLevel(level) {
    const upperLevel = level.toUpperCase();
    return LOG_LEVELS[upperLevel] !== undefined ? LOG_LEVELS[upperLevel] : LOG_LEVELS.INFO;
  }

  /**
   * インスタンスID生成
   */
  generateInstanceId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * ファイルログ設定
   */
  setupFileLogging() {
    if (!this.enableFileLogging) {return;}
    
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      (process.env.NODE_ENV !== 'production' || true) && console.error('Failed to create log directory:', error);
      this.enableFileLogging = false;
    }
  }

  /**
   * 定期フラッシュ設定
   */
  setupPeriodicFlush() {
    if (!this.enableFileLogging) {return;}
    
    this.flushTimer = setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  /**
   * プロセスハンドラー設定
   */
  setupProcessHandlers() {
    // プロセス終了時にバッファーをフラッシュ
    const gracefulShutdown = () => {
      this.flushLogs();
      if (this.flushTimer) {
        clearInterval(this.flushTimer);
      }
    };
    
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
    process.on('beforeExit', gracefulShutdown);
  }

  /**
   * メインログメソッド
   */
  log(level, message, ...args) {
    const levelNum = LOG_LEVELS[level] || LOG_LEVELS.INFO;
    
    // ログレベルフィルタリング
    if (levelNum < this.logLevel) {
      return;
    }
    
    const timestamp = new Date().toISOString();
    const logEntry = this.createLogEntry(level, message, args, timestamp);
    
    // コンソール出力
    this.outputToConsole(logEntry);
    
    // ファイルログバッファーに追加
    if (this.enableFileLogging) {
      this.addToBuffer(logEntry);
    }
    
    return logEntry;
  }

  /**
   * ログエントリ作成
   */
  createLogEntry(level, message, args, timestamp) {
    const entry = {
      timestamp,
      level,
      message: this.formatMessage(message, args),
      metadata: { ...this.metadata },
      pid: process.pid,
      memory: process.memoryUsage()
    };
    
    // スタックトレースをエラーやクリティカルレベルに追加
    if (level === 'ERROR' || level === 'CRITICAL') {
      entry.stack = this.captureStackTrace();
    }
    
    // 引数にエラーオブジェクトが含まれているかチェック
    const errorArg = args.find(arg => arg instanceof Error);
    if (errorArg) {
      entry.error = {
        name: errorArg.name,
        message: errorArg.message,
        stack: errorArg.stack
      };
    }
    
    return entry;
  }

  /**
   * メッセージフォーマット
   */
  formatMessage(message, args) {
    if (args.length === 0) {
      return message;
    }
    
    // 引数を文字列化
    const formattedArgs = args.map(arg => {
      if (typeof arg === 'object') {
        return util.inspect(arg, { depth: 3, colors: false });
      }
      return String(arg);
    });
    
    return `${message} ${formattedArgs.join(' ')}`;
  }

  /**
   * スタックトレース取得
   */
  captureStackTrace() {
    const stack = new Error().stack;
    return stack ? stack.split('\n').slice(3) : []; // ログ関数を除外
  }

  /**
   * コンソール出力
   */
  outputToConsole(logEntry) {
    const { timestamp, level, message } = logEntry;
    const color = this.enableColors ? LOG_COLORS[level] : '';
    const reset = this.enableColors ? LOG_COLORS.RESET : '';
    const time = new Date(timestamp).toLocaleTimeString();
    
    const formattedMessage = `${color}[${time}] [${level}] ${message}${reset}`;
    
    // レベルに応じたコンソール出力
    switch (level) {
    case 'DEBUG':
    case 'INFO':
    case 'SUCCESS':
      process.env.NODE_ENV !== 'production' && console.log(formattedMessage);
      break;
    case 'WARN':
      (process.env.NODE_ENV !== 'production' || true) && console.warn(formattedMessage);
      break;
    case 'ERROR':
    case 'CRITICAL':
      (process.env.NODE_ENV !== 'production' || true) && console.error(formattedMessage);
      break;
    default:
      process.env.NODE_ENV !== 'production' && console.log(formattedMessage);
    }
  }

  /**
   * バッファーに追加
   */
  addToBuffer(logEntry) {
    this.logBuffer.push(logEntry);
    
    // バッファーサイズを超えたらフラッシュ
    if (this.logBuffer.length >= this.bufferSize) {
      this.flushLogs();
    }
  }

  /**
   * バッファーをファイルにフラッシュ
   */
  flushLogs() {
    if (!this.enableFileLogging || this.logBuffer.length === 0) {
      return;
    }
    
    try {
      const logFile = this.getLogFileName();
      const logPath = path.join(this.logDir, logFile);
      
      // ファイルサイズチェックとローテーション
      this.rotateLogFileIfNeeded(logPath);
      
      // バッファー内容をファイルに書き込み
      const logData = this.logBuffer.map(entry => JSON.stringify(entry)).join('\n') + '\n';
      fs.appendFileSync(logPath, logData);
      
      // バッファークリア
      this.logBuffer = [];
    } catch (error) {
      (process.env.NODE_ENV !== 'production' || true) && console.error('Failed to flush logs to file:', error);
    }
  }

  /**
   * ログファイル名生成
   */
  getLogFileName() {
    const date = new Date().toISOString().split('T')[0];
    return `app-${date}.log`;
  }

  /**
   * ログファイルローテーション
   */
  rotateLogFileIfNeeded(logPath) {
    try {
      if (fs.existsSync(logPath)) {
        const stats = fs.statSync(logPath);
        if (stats.size > this.maxFileSize) {
          // ファイルをローテーション
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rotatedPath = logPath.replace('.log', `-${timestamp}.log`);
          fs.renameSync(logPath, rotatedPath);
          
          // 古いファイルを削除
          this.cleanupOldLogFiles();
        }
      }
    } catch (error) {
      (process.env.NODE_ENV !== 'production' || true) && console.error('Failed to rotate log file:', error);
    }
  }

  /**
   * 古いログファイルのクリーンアップ
   */
  cleanupOldLogFiles() {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          mtime: fs.statSync(path.join(this.logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime);
      
      // 最大ファイル数を超えたら古いファイルを削除
      if (files.length > this.maxFiles) {
        files.slice(this.maxFiles).forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      (process.env.NODE_ENV !== 'production' || true) && console.error('Failed to cleanup old log files:', error);
    }
  }

  /**
   * ログレベル別メソッド
   */
  debug(message, ...args) {
    return this.log('DEBUG', message, ...args);
  }

  info(message, ...args) {
    return this.log('INFO', message, ...args);
  }

  success(message, ...args) {
    return this.log('SUCCESS', message, ...args);
  }

  warn(message, ...args) {
    return this.log('WARN', message, ...args);
  }

  error(message, ...args) {
    return this.log('ERROR', message, ...args);
  }

  critical(message, ...args) {
    return this.log('CRITICAL', message, ...args);
  }

  /**
   * ログレベル変更
   */
  setLogLevel(level) {
    this.logLevel = this.parseLogLevel(level);
  }

  /**
   * ログ統計取得
   */
  getStats() {
    return {
      logLevel: Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === this.logLevel),
      bufferSize: this.logBuffer.length,
      maxBufferSize: this.bufferSize,
      fileLoggingEnabled: this.enableFileLogging,
      logDirectory: this.logDir,
      metadata: this.metadata
    };
  }

  /**
   * ログシステムシャットダウン
   */
  shutdown() {
    this.flushLogs();
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }
}

// シングルトンインスタンス
const logger = new EnhancedLogger();

// 後方互換性のためのSimpleLogger
class SimpleLogger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  debug(...args) {
    return logger.debug(...args);
  }

  info(...args) {
    return logger.info(...args);
  }

  warn(...args) {
    return logger.warn(...args);
  }

  error(...args) {
    return logger.error(...args);
  }

  success(...args) {
    return logger.success(...args);
  }
}

// 便利なエクスポート（後方互換性）
const log = {
  debug: (...args) => logger.debug(...args),
  info: (...args) => logger.info(...args),
  warn: (...args) => logger.warn(...args),
  error: (...args) => logger.error(...args),
  success: (...args) => logger.success(...args),
  critical: (...args) => logger.critical(...args)
};

// CommonJS形式でエクスポート
module.exports = {
  // メインログシステム
  EnhancedLogger,
  logger,
  
  // 後方互換性
  SimpleLogger,
  log,
  
  // 定数
  LOG_LEVELS,
  LOG_COLORS
};