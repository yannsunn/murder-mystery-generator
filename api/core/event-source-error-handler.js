/**
 * 🛡️ EventSource統一エラーハンドラー
 * EventSourceのエラーハンドリングを統一化
 */

const { logger } = require('../utils/logger.js');

/**
 * EventSource関連のエラータイプ
 */
const EVENT_SOURCE_ERROR_TYPES = {
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  WRITE_FAILED: 'WRITE_FAILED',
  CLIENT_DISCONNECTED: 'CLIENT_DISCONNECTED',
  TIMEOUT: 'TIMEOUT',
  MEMORY_PRESSURE: 'MEMORY_PRESSURE',
  RATE_LIMIT: 'RATE_LIMIT',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
};

/**
 * EventSource専用エラークラス
 */
class EventSourceError extends Error {
  constructor(message, type = EVENT_SOURCE_ERROR_TYPES.CONNECTION_FAILED, connectionId = null, statusCode = 500) {
    super(message);
    this.name = 'EventSourceError';
    this.type = type;
    this.connectionId = connectionId;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    
    // スタックトレースを保持
    Error.captureStackTrace(this, EventSourceError);
  }
}

/**
 * EventSourceエラーハンドラークラス
 */
class EventSourceErrorHandler {
  constructor() {
    this.errorCounts = new Map();
    this.errorHistory = [];
    this.maxErrorHistory = 100;
    this.errorThreshold = 10; // 10回エラーで接続を強制終了
    this.resetInterval = 60000; // 1分でエラーカウントリセット
    
    // 定期的なエラーカウントリセット
    setInterval(() => {
      this.resetErrorCounts();
    }, this.resetInterval);
  }

  /**
   * エラーのログ記録と処理
   */
  handleError(error, connectionId = null, context = {}) {
    const errorInfo = {
      message: error.message,
      type: error.type || EVENT_SOURCE_ERROR_TYPES.CONNECTION_FAILED,
      connectionId,
      context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };

    // エラー履歴に追加
    this.addToErrorHistory(errorInfo);

    // 接続別エラーカウントの更新
    if (connectionId) {
      this.incrementErrorCount(connectionId);
    }

    // エラータイプ別の処理
    switch (error.type) {
      case EVENT_SOURCE_ERROR_TYPES.CONNECTION_FAILED:
        this.handleConnectionError(errorInfo);
        break;
      case EVENT_SOURCE_ERROR_TYPES.WRITE_FAILED:
        this.handleWriteError(errorInfo);
        break;
      case EVENT_SOURCE_ERROR_TYPES.CLIENT_DISCONNECTED:
        this.handleClientDisconnected(errorInfo);
        break;
      case EVENT_SOURCE_ERROR_TYPES.TIMEOUT:
        this.handleTimeout(errorInfo);
        break;
      case EVENT_SOURCE_ERROR_TYPES.MEMORY_PRESSURE:
        this.handleMemoryPressure(errorInfo);
        break;
      case EVENT_SOURCE_ERROR_TYPES.RATE_LIMIT:
        this.handleRateLimit(errorInfo);
        break;
      case EVENT_SOURCE_ERROR_TYPES.VALIDATION_ERROR:
        this.handleValidationError(errorInfo);
        break;
      default:
        this.handleGenericError(errorInfo);
    }

    // 閾値を超えた場合の処理
    if (connectionId && this.shouldTerminateConnection(connectionId)) {
      logger.error(`🚨 Connection ${connectionId} exceeded error threshold - terminating`);
      return { shouldTerminate: true, errorInfo };
    }

    return { shouldTerminate: false, errorInfo };
  }

  /**
   * 接続エラーの処理
   */
  handleConnectionError(errorInfo) {
    logger.error(`🔌 Connection error for ${errorInfo.connectionId}:`, errorInfo.message);
    
    // 接続エラーの統計を更新
    this.updateErrorStats('connection_errors');
  }

  /**
   * 書き込みエラーの処理
   */
  handleWriteError(errorInfo) {
    logger.error(`✍️ Write error for ${errorInfo.connectionId}:`, errorInfo.message);
    
    // レスポンスが破損している可能性が高い
    this.updateErrorStats('write_errors');
  }

  /**
   * クライアント切断の処理
   */
  handleClientDisconnected(errorInfo) {
    logger.debug(`👋 Client disconnected: ${errorInfo.connectionId}`);
    
    // 正常な切断として扱う
    this.updateErrorStats('client_disconnections');
  }

  /**
   * タイムアウトの処理
   */
  handleTimeout(errorInfo) {
    logger.warn(`⏰ Timeout for ${errorInfo.connectionId}:`, errorInfo.message);
    
    this.updateErrorStats('timeouts');
  }

  /**
   * メモリプレッシャーの処理
   */
  handleMemoryPressure(errorInfo) {
    logger.error(`🧠 Memory pressure detected for ${errorInfo.connectionId}:`, errorInfo.message);
    
    // メモリ使用量の警告
    const memoryUsage = process.memoryUsage();
    logger.warn('📊 Memory usage:', {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
    });
    
    this.updateErrorStats('memory_pressure');
  }

  /**
   * レート制限の処理
   */
  handleRateLimit(errorInfo) {
    logger.warn(`🚦 Rate limit exceeded for ${errorInfo.connectionId}:`, errorInfo.message);
    
    this.updateErrorStats('rate_limits');
  }

  /**
   * バリデーションエラーの処理
   */
  handleValidationError(errorInfo) {
    logger.warn(`🔍 Validation error for ${errorInfo.connectionId}:`, errorInfo.message);
    
    this.updateErrorStats('validation_errors');
  }

  /**
   * 汎用エラーの処理
   */
  handleGenericError(errorInfo) {
    logger.error(`🚨 Generic error for ${errorInfo.connectionId}:`, errorInfo.message);
    
    this.updateErrorStats('generic_errors');
  }

  /**
   * エラー履歴に追加
   */
  addToErrorHistory(errorInfo) {
    this.errorHistory.unshift(errorInfo);
    
    // 履歴の上限を維持
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(0, this.maxErrorHistory);
    }
  }

  /**
   * エラーカウントの増加
   */
  incrementErrorCount(connectionId) {
    const currentCount = this.errorCounts.get(connectionId) || 0;
    this.errorCounts.set(connectionId, currentCount + 1);
  }

  /**
   * 接続を終了すべきかの判定
   */
  shouldTerminateConnection(connectionId) {
    const errorCount = this.errorCounts.get(connectionId) || 0;
    return errorCount >= this.errorThreshold;
  }

  /**
   * エラーカウントのリセット
   */
  resetErrorCounts() {
    const resetCount = this.errorCounts.size;
    this.errorCounts.clear();
    
    if (resetCount > 0) {
      logger.debug(`🔄 Error counts reset for ${resetCount} connections`);
    }
  }

  /**
   * エラー統計の更新
   */
  updateErrorStats(errorType) {
    // 実装はシンプルにログ出力のみ
    logger.debug(`📊 Error stat updated: ${errorType}`);
  }

  /**
   * エラー統計の取得
   */
  getErrorStats() {
    const recentErrors = this.errorHistory.slice(0, 10);
    const errorsByType = {};
    
    this.errorHistory.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    });
    
    return {
      totalErrors: this.errorHistory.length,
      activeErrorCounts: this.errorCounts.size,
      errorsByType,
      recentErrors,
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * エラー履歴のクリア
   */
  clearErrorHistory() {
    this.errorHistory = [];
    this.errorCounts.clear();
    logger.info('🧹 Error history cleared');
  }

  /**
   * 安全なレスポンス終了
   */
  static safeEndResponse(res, message = 'Connection closed due to error') {
    if (!res || res.destroyed) {
      return false;
    }
    
    try {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end(message);
      } else {
        res.destroy();
      }
      return true;
    } catch (error) {
      logger.debug(`Error ending response: ${error.message}`);
      return false;
    }
  }

  /**
   * 統一エラーレスポンス
   */
  static createErrorResponse(error, connectionId = null) {
    return {
      success: false,
      error: {
        type: error.type || EVENT_SOURCE_ERROR_TYPES.CONNECTION_FAILED,
        message: error.message,
        connectionId,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// シングルトンインスタンス
const eventSourceErrorHandler = new EventSourceErrorHandler();

module.exports = {
  EventSourceError,
  EventSourceErrorHandler,
  EVENT_SOURCE_ERROR_TYPES,
  eventSourceErrorHandler
};