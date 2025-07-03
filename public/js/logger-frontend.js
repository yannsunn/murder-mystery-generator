/**
 * 🔧 フロントエンド統一ログシステム - 本番環境自動無効化
 */

class FrontendLogger {
  constructor() {
    this.isProduction = window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1' && 
                       !window.location.hostname.includes('dev');
    this.debugMode = localStorage.getItem('debug_mode') === 'true';
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
   * ユーザーアクションログ - 本番環境では無効
   */
  userAction(action, data) {
    if (!this.isProduction || this.debugMode) {
      console.log(`👤 [USER] ${action}`, data);
    }
  }
}

// グローバルインスタンス
window.logger = new FrontendLogger();

// レガシー互換性のためのconsole.log代替
window.log = {
  debug: (...args) => window.logger.debug(...args),
  info: (...args) => window.logger.info(...args),
  warn: (...args) => window.logger.warn(...args),
  error: (...args) => window.logger.error(...args),
  success: (...args) => window.logger.success(...args)
};