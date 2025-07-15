/**
 * シンプルなロガー
 */

class SimpleLogger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  debug(...args) {
    if (!this.isProduction) {
      console.log('[DEBUG]', ...args);
    }
  }

  info(...args) {
    if (!this.isProduction) {
      console.log('[INFO]', ...args);
    }
  }

  warn(...args) {
    console.warn('[WARN]', ...args);
  }

  error(...args) {
    console.error('[ERROR]', ...args);
  }

  success(...args) {
    if (!this.isProduction) {
      console.log('[SUCCESS]', ...args);
    }
  }
}

// シングルトンインスタンス
const logger = new SimpleLogger();

// 便利なエクスポート
const log = {
  debug: (...args) => logger.debug(...args),
  info: (...args) => logger.info(...args),
  warn: (...args) => logger.warn(...args),
  error: (...args) => logger.error(...args),
  success: (...args) => logger.success(...args)
};

// CommonJS形式でエクスポート
module.exports = { logger, log };