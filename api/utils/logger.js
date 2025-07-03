/**
 * 🔧 統一ログ管理システム - 本番環境での自動無効化
 * console.log代替システム
 */

export class UltraLogger {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.debugMode = process.env.DEBUG_MODE === 'true';
    this.logLevel = process.env.LOG_LEVEL || (this.isProduction ? 'error' : 'debug');
  }

  /**
   * デバッグログ - 本番環境では無効
   */
  debug(...args) {
    if (!this.isProduction || this.debugMode) {
      console.log('🐛 [DEBUG]', ...args);
    }
  }

  /**
   * 情報ログ - 本番環境では無効
   */
  info(...args) {
    if (!this.isProduction || this.debugMode) {
      console.log('ℹ️ [INFO]', ...args);
    }
  }

  /**
   * 警告ログ - 本番環境でも表示
   */
  warn(...args) {
    console.warn('⚠️ [WARN]', ...args);
  }

  /**
   * エラーログ - 本番環境でも表示
   */
  error(...args) {
    console.error('❌ [ERROR]', ...args);
  }

  /**
   * 成功ログ - 本番環境では無効
   */
  success(...args) {
    if (!this.isProduction || this.debugMode) {
      console.log('✅ [SUCCESS]', ...args);
    }
  }

  /**
   * パフォーマンスログ - 本番環境では無効
   */
  perf(label, startTime) {
    if (!this.isProduction || this.debugMode) {
      const duration = Date.now() - startTime;
      console.log(`⚡ [PERF] ${label}: ${duration}ms`);
    }
  }

  /**
   * API呼び出しログ - 本番環境では無効
   */
  api(method, url, status, duration) {
    if (!this.isProduction || this.debugMode) {
      console.log(`🌐 [API] ${method} ${url} - ${status} (${duration}ms)`);
    }
  }

  /**
   * セキュリティログ - 本番環境でも表示
   */
  security(...args) {
    console.log('🔒 [SECURITY]', ...args);
  }
}

// シングルトンインスタンス
export const logger = new UltraLogger();

// レガシー互換性のためのconsole.log代替
export const log = {
  debug: (...args) => logger.debug(...args),
  info: (...args) => logger.info(...args),
  warn: (...args) => logger.warn(...args),
  error: (...args) => logger.error(...args),
  success: (...args) => logger.success(...args)
};