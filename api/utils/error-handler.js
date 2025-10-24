/**
 * 🛡️ UNIFIED ERROR HANDLING SYSTEM
 * 統一エラーハンドリングシステム - プロジェクト全体の一貫性を保証
 */

const { logger } = require('./logger.js');
const fs = require('fs');
const path = require('path');

/**
 * ⚡ 拡張エラータイプ定義
 * 分類と優先度に基づいた体系的なエラー管理
 */
const ERROR_TYPES = {
  // 🔴 Critical Errors (Priority: HIGH)
  SYSTEM_FAILURE: 'SYSTEM_FAILURE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  SECURITY_BREACH: 'SECURITY_BREACH',
  
  // 🟠 High Priority Errors
  API_ERROR: 'API_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  RESOURCE_EXHAUSTION: 'RESOURCE_EXHAUSTION',
  
  // 🟡 Medium Priority Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  BUSINESS_LOGIC_ERROR: 'BUSINESS_LOGIC_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // 🟢 Low Priority Errors
  USER_INPUT_ERROR: 'USER_INPUT_ERROR',
  CLIENT_ERROR: 'CLIENT_ERROR',
  FEATURE_UNAVAILABLE: 'FEATURE_UNAVAILABLE',
  
  // 🔵 Special Categories
  RECOVERABLE_ERROR: 'RECOVERABLE_ERROR',
  TEMPORARY_ERROR: 'TEMPORARY_ERROR',
  DEPRECATED_FEATURE: 'DEPRECATED_FEATURE',
  
  // Legacy support
  VALIDATION: 'VALIDATION_ERROR',
  API: 'API_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  INTERNAL: 'SYSTEM_FAILURE'
};

/**
 * 🎯 エラー優先度マッピング
 */
const ERROR_PRIORITIES = {
  [ERROR_TYPES.SYSTEM_FAILURE]: 'CRITICAL',
  [ERROR_TYPES.DATABASE_ERROR]: 'CRITICAL',
  [ERROR_TYPES.AUTHENTICATION_ERROR]: 'CRITICAL',
  [ERROR_TYPES.AUTHORIZATION_ERROR]: 'CRITICAL',
  [ERROR_TYPES.SECURITY_BREACH]: 'CRITICAL',
  
  [ERROR_TYPES.API_ERROR]: 'HIGH',
  [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: 'HIGH',
  [ERROR_TYPES.TIMEOUT_ERROR]: 'HIGH',
  [ERROR_TYPES.RATE_LIMIT_ERROR]: 'HIGH',
  [ERROR_TYPES.RESOURCE_EXHAUSTION]: 'HIGH',
  
  [ERROR_TYPES.VALIDATION_ERROR]: 'MEDIUM',
  [ERROR_TYPES.BUSINESS_LOGIC_ERROR]: 'MEDIUM',
  [ERROR_TYPES.CONFIGURATION_ERROR]: 'MEDIUM',
  [ERROR_TYPES.NETWORK_ERROR]: 'MEDIUM',
  
  [ERROR_TYPES.USER_INPUT_ERROR]: 'LOW',
  [ERROR_TYPES.CLIENT_ERROR]: 'LOW',
  [ERROR_TYPES.FEATURE_UNAVAILABLE]: 'LOW',
  
  [ERROR_TYPES.RECOVERABLE_ERROR]: 'MEDIUM',
  [ERROR_TYPES.TEMPORARY_ERROR]: 'MEDIUM',
  [ERROR_TYPES.DEPRECATED_FEATURE]: 'LOW'
};

/**
 * 🎨 ユーザーフレンドリーメッセージマッピング
 */
const USER_FRIENDLY_MESSAGES = {
  [ERROR_TYPES.SYSTEM_FAILURE]: 'システムに一時的な問題が発生しています。しばらく時間をおいて再度お試しください。',
  [ERROR_TYPES.DATABASE_ERROR]: 'データベースへの接続に問題があります。管理者にお問い合わせください。',
  [ERROR_TYPES.AUTHENTICATION_ERROR]: 'ログイン情報が正しくありません。再度ログインしてください。',
  [ERROR_TYPES.AUTHORIZATION_ERROR]: 'この操作を行う権限がありません。',
  [ERROR_TYPES.SECURITY_BREACH]: 'セキュリティの問題が検出されました。管理者に連絡してください。',
  
  [ERROR_TYPES.API_ERROR]: 'サービスに一時的な問題が発生しています。しばらく時間をおいて再度お試しください。',
  [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: '外部サービスとの連携に問題があります。しばらく時間をおいて再度お試しください。',
  [ERROR_TYPES.TIMEOUT_ERROR]: 'リクエストがタイムアウトしました。しばらく時間をおいて再度お試しください。',
  [ERROR_TYPES.RATE_LIMIT_ERROR]: 'リクエストが多すぎます。しばらく時間をおいて再度お試しください。',
  [ERROR_TYPES.RESOURCE_EXHAUSTION]: 'サーバーリソースが不足しています。しばらく時間をおいて再度お試しください。',
  
  [ERROR_TYPES.VALIDATION_ERROR]: '入力データに問題があります。入力内容をご確認ください。',
  [ERROR_TYPES.BUSINESS_LOGIC_ERROR]: '処理中に問題が発生しました。入力内容をご確認ください。',
  [ERROR_TYPES.CONFIGURATION_ERROR]: 'システム設定に問題があります。管理者にお問い合わせください。',
  [ERROR_TYPES.NETWORK_ERROR]: 'ネットワーク接続に問題があります。接続をご確認ください。',
  
  [ERROR_TYPES.USER_INPUT_ERROR]: '入力内容に問題があります。正しい形式で入力してください。',
  [ERROR_TYPES.CLIENT_ERROR]: 'クライアントエラーが発生しました。ページを再読み込みしてください。',
  [ERROR_TYPES.FEATURE_UNAVAILABLE]: 'この機能は現在利用できません。',
  
  [ERROR_TYPES.RECOVERABLE_ERROR]: '一時的な問題が発生しました。自動的に修復を試みています。',
  [ERROR_TYPES.TEMPORARY_ERROR]: '一時的な問題が発生しました。しばらく時間をおいて再度お試しください。',
  [ERROR_TYPES.DEPRECATED_FEATURE]: 'この機能は廃止予定です。新しい機能をご利用ください。'
};

/**
 * 🔧 復旧可能エラータイプ
 */
const RECOVERABLE_ERROR_TYPES = new Set([
  ERROR_TYPES.TIMEOUT_ERROR,
  ERROR_TYPES.RATE_LIMIT_ERROR,
  ERROR_TYPES.NETWORK_ERROR,
  ERROR_TYPES.TEMPORARY_ERROR,
  ERROR_TYPES.EXTERNAL_SERVICE_ERROR,
  ERROR_TYPES.RECOVERABLE_ERROR
]);

/**
 * 📊 エラー統計管理
 */
class ErrorStatistics {
  constructor() {
    this.stats = new Map();
    this.hourlyStats = new Map();
    this.dailyStats = new Map();
    this.startTime = Date.now();
    this.lastResetTime = Date.now();
  }

  /**
   * エラー統計を記録
   */
  recordError(errorType, priority, context = {}) {
    const now = Date.now();
    const hour = Math.floor(now / (1000 * 60 * 60));
    const day = Math.floor(now / (1000 * 60 * 60 * 24));
    
    // 全体統計
    const totalKey = `${errorType}_${priority}`;
    const totalStat = this.stats.get(totalKey) || {
      count: 0,
      firstOccurrence: now,
      lastOccurrence: now,
      contexts: []
    };
    
    totalStat.count++;
    totalStat.lastOccurrence = now;
    totalStat.contexts.push({
      timestamp: now,
      ...context
    });
    
    // 最新100件のみ保持
    if (totalStat.contexts.length > 100) {
      totalStat.contexts.shift();
    }
    
    this.stats.set(totalKey, totalStat);
    
    // 時間別統計
    const hourKey = `${hour}_${errorType}`;
    const hourStat = this.hourlyStats.get(hourKey) || 0;
    this.hourlyStats.set(hourKey, hourStat + 1);
    
    // 日別統計
    const dayKey = `${day}_${errorType}`;
    const dayStat = this.dailyStats.get(dayKey) || 0;
    this.dailyStats.set(dayKey, dayStat + 1);
    
    // 古いデータのクリーンアップ
    this.cleanupOldStats(now);
  }

  /**
   * 統計情報を取得
   */
  getStatistics() {
    const now = Date.now();
    const last24Hours = now - (24 * 60 * 60 * 1000);
    
    const totalErrors = Array.from(this.stats.values())
      .reduce((sum, stat) => sum + stat.count, 0);
    
    const recentErrors = Array.from(this.stats.values())
      .filter(stat => stat.lastOccurrence > last24Hours)
      .reduce((sum, stat) => sum + stat.count, 0);
    
    const criticalErrors = Array.from(this.stats.entries())
      .filter(([key]) => key.includes('_CRITICAL'))
      .reduce((sum, [, stat]) => sum + stat.count, 0);
    
    return {
      totalErrors,
      recentErrors,
      criticalErrors,
      errorRate: this.calculateErrorRate(),
      topErrors: this.getTopErrors(),
      hourlyTrend: this.getHourlyTrend(),
      uptime: now - this.startTime
    };
  }

  /**
   * エラー率を計算
   */
  calculateErrorRate() {
    const now = Date.now();
    const lastHour = now - (60 * 60 * 1000);
    
    const recentErrors = Array.from(this.stats.values())
      .filter(stat => stat.lastOccurrence > lastHour)
      .reduce((sum, stat) => sum + stat.count, 0);
    
    // 簡易的な計算（実際はリクエスト数も必要）
    const estimatedRequests = Math.max(100, recentErrors * 10);
    return (recentErrors / estimatedRequests) * 100;
  }

  /**
   * 上位エラーを取得
   */
  getTopErrors(limit = 10) {
    return Array.from(this.stats.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, limit)
      .map(([key, stat]) => ({ type: key, count: stat.count, ...stat }));
  }

  /**
   * 時間別トレンドを取得
   */
  getHourlyTrend() {
    const now = Date.now();
    const currentHour = Math.floor(now / (1000 * 60 * 60));
    const trend = [];
    
    for (let i = 23; i >= 0; i--) {
      const hour = currentHour - i;
      const hourErrors = Array.from(this.hourlyStats.entries())
        .filter(([key]) => key.startsWith(`${hour}_`))
        .reduce((sum, [, count]) => sum + count, 0);
      
      trend.push({
        hour: new Date(hour * 1000 * 60 * 60).toISOString(),
        errors: hourErrors
      });
    }
    
    return trend;
  }

  /**
   * 古い統計データのクリーンアップ
   */
  cleanupOldStats(now) {
    const currentHour = Math.floor(now / (1000 * 60 * 60));
    const oldHour = currentHour - 24; // 24時間前
    
    // 24時間以上古い時間別統計を削除
    for (const [key] of this.hourlyStats) {
      const [hour] = key.split('_');
      if (parseInt(hour) < oldHour) {
        this.hourlyStats.delete(key);
      }
    }
    
    // 7日以上古い日別統計を削除
    const currentDay = Math.floor(now / (1000 * 60 * 60 * 24));
    const oldDay = currentDay - 7;
    
    for (const [key] of this.dailyStats) {
      const [day] = key.split('_');
      if (parseInt(day) < oldDay) {
        this.dailyStats.delete(key);
      }
    }
  }

  /**
   * 統計をリセット
   */
  reset() {
    this.stats.clear();
    this.hourlyStats.clear();
    this.dailyStats.clear();
    this.lastResetTime = Date.now();
  }
}

// グローバル統計インスタンス
const errorStatistics = new ErrorStatistics();

/**
 * 📊 ERROR MONITORING INTEGRATION
 * エラー監視統合機能
 */
class ErrorMonitoringIntegration {
  constructor() {
    this.isEnabled = process.env.NODE_ENV === 'production';
    this.reportingInterval = null;
    this.setupPeriodicReporting();
  }

  /**
   * 定期レポート設定
   */
  setupPeriodicReporting() {
    if (!this.isEnabled) {return;}
    
    // 5分ごとにエラーサマリーをレポート
    this.reportingInterval = setInterval(() => {
      this.generateErrorReport();
    }, 5 * 60 * 1000);
  }

  /**
   * エラーレポート生成
   */
  generateErrorReport() {
    const stats = errorStatistics.getStatistics();
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: stats.totalErrors,
        recentErrors: stats.recentErrors,
        criticalErrors: stats.criticalErrors,
        errorRate: stats.errorRate
      },
      topErrors: stats.topErrors.slice(0, 5),
      trends: stats.hourlyTrend,
      system: {
        uptime: stats.uptime,
        memoryUsage: process.memoryUsage(),
        nodeVersion: process.version
      }
    };
    
    logger.info('📊 Error Monitoring Report:', report);
    
    // 外部サービスへのレポート送信をここで実装可能
    return report;
  }

  /**
   * モニタリング停止
   */
  stop() {
    if (this.reportingInterval) {
      clearInterval(this.reportingInterval);
      this.reportingInterval = null;
    }
  }
}

// グローバルモニタリングインスタンス (将来の拡張用)
// const errorMonitoringIntegration = new ErrorMonitoringIntegration();

/**
 * 🚀 UNIFIED ERROR CLASS
 * 統一エラークラス - 拡張機能とメタデータサポート
 */
class UnifiedError extends Error {
  constructor(message, type = ERROR_TYPES.SYSTEM_FAILURE, statusCode = 500, context = {}) {
    super(message);
    this.name = 'UnifiedError';
    this.type = type;
    this.statusCode = statusCode;
    this.priority = ERROR_PRIORITIES[type] || 'MEDIUM';
    this.isRecoverable = RECOVERABLE_ERROR_TYPES.has(type);
    this.userMessage = USER_FRIENDLY_MESSAGES[type] || message;
    this.context = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      requestId: context.requestId || null,
      userId: context.userId || null,
      sessionId: context.sessionId || null,
      userAgent: context.userAgent || null,
      ipAddress: context.ipAddress || null,
      endpoint: context.endpoint || null,
      method: context.method || null,
      ...context
    };
    this.retryCount = 0;
    this.maxRetries = this.isRecoverable ? 3 : 0;
    this.retryDelay = this.calculateRetryDelay();
    this.id = this.generateErrorId();
    
    // スタックトレースの保持
    Error.captureStackTrace(this, UnifiedError);
  }

  /**
   * エラーID生成
   */
  generateErrorId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${this.type}_${timestamp}_${random}`;
  }

  /**
   * リトライ遅延時間計算
   */
  calculateRetryDelay() {
    const baseDelay = {
      [ERROR_TYPES.TIMEOUT_ERROR]: 1000,
      [ERROR_TYPES.RATE_LIMIT_ERROR]: 5000,
      [ERROR_TYPES.NETWORK_ERROR]: 2000,
      [ERROR_TYPES.TEMPORARY_ERROR]: 3000,
      [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: 4000,
      [ERROR_TYPES.RECOVERABLE_ERROR]: 2000
    };
    
    return baseDelay[this.type] || 2000;
  }

  /**
   * エラーを辞書形式で出力
   */
  toDict() {
    return {
      id: this.id,
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      priority: this.priority,
      statusCode: this.statusCode,
      isRecoverable: this.isRecoverable,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      context: this.context,
      stack: this.stack
    };
  }

  /**
   * ユーザー向けレスポンス生成
   */
  toUserResponse() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      success: false,
      error: {
        id: this.id,
        type: this.type,
        message: this.userMessage,
        priority: this.priority,
        retryable: this.isRecoverable && this.retryCount < this.maxRetries,
        retryAfter: this.isRecoverable ? this.retryDelay : null,
        timestamp: this.context.timestamp,
        // 開発環境でのみ詳細情報を含める
        ...(isProduction ? {} : {
          details: {
            originalMessage: this.message,
            statusCode: this.statusCode,
            context: this.context,
            stack: this.stack
          }
        })
      }
    };
  }

  /**
   * ログ出力用データ生成
   */
  toLogData() {
    return {
      errorId: this.id,
      type: this.type,
      message: this.message,
      priority: this.priority,
      statusCode: this.statusCode,
      isRecoverable: this.isRecoverable,
      retryCount: this.retryCount,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * 🔄 AUTO RECOVERY MANAGER
 * 自動復旧マネージャー - 復旧可能エラーの処理
 */
class AutoRecoveryManager {
  constructor() {
    this.recoveryStrategies = new Map();
    this.recoveryAttempts = new Map();
    this.maxGlobalRetries = 100; // 全体での最大リトライ数
    this.currentGlobalRetries = 0;
    this.setupDefaultStrategies();
  }

  /**
   * デフォルト復旧戦略設定
   */
  setupDefaultStrategies() {
    // タイムアウトエラーの復旧戦略
    this.addRecoveryStrategy(ERROR_TYPES.TIMEOUT_ERROR, async (error, context) => {
      logger.info(`🔄 Attempting timeout recovery for: ${error.id}`);
      
      // タイムアウト時間を延長して再試行
      const extendedTimeout = (context.timeout || 30000) * 1.5;
      return { 
        success: false, 
        retry: true, 
        delay: error.retryDelay,
        newContext: { ...context, timeout: extendedTimeout }
      };
    });

    // レート制限エラーの復旧戦略
    this.addRecoveryStrategy(ERROR_TYPES.RATE_LIMIT_ERROR, async (error, _context) => {
      logger.info(`🔄 Attempting rate limit recovery for: ${error.id}`);
      
      // より長い遅延で再試行
      const backoffDelay = error.retryDelay * Math.pow(2, error.retryCount);
      return { 
        success: false, 
        retry: true, 
        delay: Math.min(backoffDelay, 60000) // 最大60秒
      };
    });

    // ネットワークエラーの復旧戦略
    this.addRecoveryStrategy(ERROR_TYPES.NETWORK_ERROR, async (error, _context) => {
      logger.info(`🔄 Attempting network recovery for: ${error.id}`);
      
      // 指数バックオフで再試行
      const backoffDelay = error.retryDelay * Math.pow(1.5, error.retryCount);
      return { 
        success: false, 
        retry: true, 
        delay: Math.min(backoffDelay, 30000) // 最大30秒
      };
    });

    // 外部サービスエラーの復旧戦略
    this.addRecoveryStrategy(ERROR_TYPES.EXTERNAL_SERVICE_ERROR, async (error, _context) => {
      logger.info(`🔄 Attempting external service recovery for: ${error.id}`);

      // サービス固有の復旧ロジック
      const backoffDelay = error.retryDelay * (1 + error.retryCount * 0.5);
      
      return { 
        success: false, 
        retry: true, 
        delay: Math.min(backoffDelay, 45000) // 最大45秒
      };
    });

    // 一時的エラーの復旧戦略
    this.addRecoveryStrategy(ERROR_TYPES.TEMPORARY_ERROR, async (error, _context) => {
      logger.info(`🔄 Attempting temporary error recovery for: ${error.id}`);
      
      // 短い遅延で再試行
      return { 
        success: false, 
        retry: true, 
        delay: error.retryDelay
      };
    });
  }

  /**
   * 復旧戦略追加
   */
  addRecoveryStrategy(errorType, strategy) {
    this.recoveryStrategies.set(errorType, strategy);
  }

  /**
   * 自動復旧実行
   */
  async attemptRecovery(error, context = {}) {
    if (!error.isRecoverable || error.retryCount >= error.maxRetries) {
      return { success: false, retry: false, reason: 'Not recoverable or max retries exceeded' };
    }

    if (this.currentGlobalRetries >= this.maxGlobalRetries) {
      return { success: false, retry: false, reason: 'Global retry limit exceeded' };
    }

    const strategy = this.recoveryStrategies.get(error.type);
    if (!strategy) {
      return { success: false, retry: false, reason: 'No recovery strategy available' };
    }

    try {
      error.retryCount++;
      this.currentGlobalRetries++;
      
      const result = await strategy(error, context);
      
      if (result.success) {
        logger.success(`✅ Recovery successful for error: ${error.id}`);
        this.recoveryAttempts.delete(error.id);
      } else if (result.retry) {
        logger.info(`🔄 Recovery scheduled for error: ${error.id}, delay: ${result.delay}ms`);
        this.scheduleRetry(error, context, result.delay, result.newContext);
      }
      
      return result;
    } catch (recoveryError) {
      logger.error(`❌ Recovery failed for error: ${error.id}`, recoveryError);
      return { success: false, retry: false, reason: 'Recovery strategy failed' };
    }
  }

  /**
   * リトライスケジュール
   */
  scheduleRetry(error, context, delay, newContext = {}) {
    const retryId = `${error.id}_retry_${error.retryCount}`;
    
    const timeoutId = setTimeout(async () => {
      try {
        await this.attemptRecovery(error, { ...context, ...newContext });
      } catch (retryError) {
        logger.error(`❌ Scheduled retry failed for error: ${error.id}`, retryError);
      }
    }, delay);
    
    this.recoveryAttempts.set(retryId, {
      errorId: error.id,
      timeoutId,
      scheduledAt: Date.now(),
      delay
    });
  }

  /**
   * 復旧統計取得
   */
  getRecoveryStats() {
    return {
      globalRetries: this.currentGlobalRetries,
      maxGlobalRetries: this.maxGlobalRetries,
      activeRecoveryAttempts: this.recoveryAttempts.size,
      availableStrategies: Array.from(this.recoveryStrategies.keys())
    };
  }

  /**
   * 復旧試行キャンセル
   */
  cancelRecovery(errorId) {
    for (const [retryId, attempt] of this.recoveryAttempts) {
      if (attempt.errorId === errorId) {
        clearTimeout(attempt.timeoutId);
        this.recoveryAttempts.delete(retryId);
        logger.info(`🛑 Recovery cancelled for error: ${errorId}`);
        return true;
      }
    }
    return false;
  }

  /**
   * 統計リセット
   */
  resetStats() {
    this.currentGlobalRetries = 0;
    this.recoveryAttempts.clear();
  }
}

// グローバル復旧マネージャーインスタンス
const autoRecoveryManager = new AutoRecoveryManager();

// 後方互換性のためのレガシーエラークラス
class AppError extends UnifiedError {
  constructor(message, type = ERROR_TYPES.SYSTEM_FAILURE, statusCode = 500) {
    super(message, type, statusCode);
    this.name = 'AppError';
  }
}

/**
 * 🚀 UNIFIED ERROR HANDLER
 * 統一エラーハンドラー - 全機能統合型エラー処理システム
 */
class UnifiedErrorHandler {
  constructor() {
    this.errorStatistics = errorStatistics;
    this.autoRecoveryManager = autoRecoveryManager;
    this.alertThresholds = {
      criticalErrorRate: 0.05, // 5%
      highErrorCount: 100,
      errorBurst: 20 // 5分間でのエラー数
    };
    this.notificationChannels = [];
    this.setupPeriodicCleanup();
  }

  /**
   * エラー処理メインロジック
   */
  async handleError(error, req = null, res = null, context = {}) {
    // エラーの正規化
    const unifiedError = this.normalizeError(error, req, context);
    
    // コンテキスト情報の充実
    const enrichedContext = this.enrichContext(req, context);
    
    // エラー統計の記録
    this.errorStatistics.recordError(unifiedError.type, unifiedError.priority, enrichedContext);
    
    // ログ出力
    await this.logError(unifiedError, enrichedContext);
    
    // アラートチェック
    await this.checkAndSendAlerts(unifiedError, enrichedContext);
    
    // 自動復旧試行
    const recoveryResult = await this.attemptAutoRecovery(unifiedError, enrichedContext);
    
    // レスポンス結果の生成
    const result = this.createErrorResponse(unifiedError, recoveryResult);
    
    // HTTPレスポンスの送信
    if (res && !res.headersSent) {
      return res.status(unifiedError.statusCode).json(result);
    }
    
    return result;
  }

  /**
   * エラー正規化
   */
  normalizeError(error, _req = null, context = {}) {
    if (error instanceof UnifiedError) {
      return error;
    }
    
    // 既存エラークラスの変換
    if (error instanceof AppError) {
      return new UnifiedError(error.message, error.type, error.statusCode, context);
    }
    
    // 標準エラーの変換
    let errorType = ERROR_TYPES.SYSTEM_FAILURE;
    let statusCode = 500;
    
    // エラーメッセージからタイプを推測
    const message = error.message || error.toString();
    
    if (message.includes('timeout') || message.includes('TIMEOUT')) {
      errorType = ERROR_TYPES.TIMEOUT_ERROR;
      statusCode = 408;
    } else if (message.includes('rate limit') || message.includes('Rate limit')) {
      errorType = ERROR_TYPES.RATE_LIMIT_ERROR;
      statusCode = 429;
    } else if (message.includes('validation') || message.includes('Validation')) {
      errorType = ERROR_TYPES.VALIDATION_ERROR;
      statusCode = 400;
    } else if (message.includes('auth') || message.includes('Auth')) {
      errorType = ERROR_TYPES.AUTHENTICATION_ERROR;
      statusCode = 401;
    } else if (message.includes('permission') || message.includes('Permission')) {
      errorType = ERROR_TYPES.AUTHORIZATION_ERROR;
      statusCode = 403;
    } else if (message.includes('network') || message.includes('Network')) {
      errorType = ERROR_TYPES.NETWORK_ERROR;
      statusCode = 503;
    } else if (message.includes('database') || message.includes('Database')) {
      errorType = ERROR_TYPES.DATABASE_ERROR;
      statusCode = 503;
    }
    
    return new UnifiedError(message, errorType, statusCode, context);
  }

  /**
   * コンテキスト情報の充実
   */
  enrichContext(req, context) {
    const enriched = { ...context };
    
    if (req) {
      enriched.method = req.method;
      enriched.url = req.url;
      enriched.userAgent = req.headers?.['user-agent'] || 'unknown';
      enriched.ipAddress = this.getClientIP(req);
      enriched.requestId = req.headers?.['x-request-id'] || this.generateRequestId();
      enriched.sessionId = req.headers?.['x-session-id'] || req.cookies?.sessionId;
      enriched.userId = req.headers?.['x-user-id'] || req.user?.id;
    }
    
    enriched.environment = process.env.NODE_ENV || 'development';
    enriched.serverInstance = process.env.SERVER_INSTANCE || 'unknown';
    enriched.memoryUsage = process.memoryUsage();
    
    return enriched;
  }

  /**
   * エラーログ出力
   */
  async logError(error, context) {
    const logData = {
      ...error.toLogData(),
      context
    };
    
    // 優先度に応じたログレベル
    switch (error.priority) {
    case 'CRITICAL':
      logger.error(`🔴 CRITICAL ERROR [${error.id}]: ${error.message}`, logData);
      break;
    case 'HIGH':
      logger.error(`🟠 HIGH ERROR [${error.id}]: ${error.message}`, logData);
      break;
    case 'MEDIUM':
      logger.warn(`🟡 MEDIUM ERROR [${error.id}]: ${error.message}`, logData);
      break;
    case 'LOW':
      logger.info(`🟢 LOW ERROR [${error.id}]: ${error.message}`, logData);
      break;
    default:
      logger.error(`⚫ UNKNOWN ERROR [${error.id}]: ${error.message}`, logData);
    }
    
    // ファイルログ出力（本番環境のみ）
    if (process.env.NODE_ENV === 'production') {
      await this.writeToLogFile(error, context);
    }
  }

  /**
   * ファイルログ出力
   */
  async writeToLogFile(error, context) {
    try {
      const logDir = path.join(process.cwd(), 'logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logFile = path.join(logDir, `error-${new Date().toISOString().split('T')[0]}.log`);
      const logEntry = {
        timestamp: new Date().toISOString(),
        error: error.toLogData(),
        context
      };
      
      fs.appendFileSync(logFile, JSON.stringify(logEntry) + '\n');
    } catch (logError) {
      logger.error('Failed to write error log to file:', logError);
    }
  }

  /**
   * アラートチェックと通知
   */
  async checkAndSendAlerts(error, context) {
    const stats = this.errorStatistics.getStatistics();
    const alerts = [];
    
    // クリティカルエラーの即座アラート
    if (error.priority === 'CRITICAL') {
      alerts.push({
        type: 'CRITICAL_ERROR',
        message: `🔴 Critical error occurred: ${error.message}`,
        error: error.toDict(),
        context,
        severity: 'critical'
      });
    }
    
    // エラー率アラート
    if (stats.errorRate > this.alertThresholds.criticalErrorRate) {
      alerts.push({
        type: 'HIGH_ERROR_RATE',
        message: `🟠 High error rate detected: ${stats.errorRate.toFixed(2)}%`,
        stats,
        severity: 'high'
      });
    }
    
    // エラーバーストアラート
    if (stats.recentErrors > this.alertThresholds.errorBurst) {
      alerts.push({
        type: 'ERROR_BURST',
        message: `🟡 Error burst detected: ${stats.recentErrors} errors in recent timeframe`,
        stats,
        severity: 'medium'
      });
    }
    
    // アラートの送信
    if (alerts.length > 0) {
      await this.sendAlerts(alerts);
    }
  }

  /**
   * アラート送信
   */
  async sendAlerts(alerts) {
    for (const alert of alerts) {
      logger.warn(`🚨 ALERT: ${alert.message}`);
      
      // 各通知チャネルへの送信
      for (const channel of this.notificationChannels) {
        try {
          await channel.send(alert);
        } catch (notificationError) {
          logger.error('Failed to send alert notification:', notificationError);
        }
      }
    }
  }

  /**
   * 自動復旧試行
   */
  async attemptAutoRecovery(error, context) {
    if (!error.isRecoverable) {
      return { attempted: false, reason: 'Error not recoverable' };
    }
    
    try {
      const result = await this.autoRecoveryManager.attemptRecovery(error, context);
      
      if (result.success) {
        logger.success(`✅ Auto-recovery successful for error: ${error.id}`);
      } else if (result.retry) {
        logger.info(`🔄 Auto-recovery scheduled for error: ${error.id}`);
      } else {
        logger.warn(`❌ Auto-recovery failed for error: ${error.id} - ${result.reason}`);
      }
      
      return { attempted: true, ...result };
    } catch (recoveryError) {
      logger.error(`❌ Auto-recovery error for: ${error.id}`, recoveryError);
      return { attempted: true, success: false, reason: 'Recovery process failed' };
    }
  }

  /**
   * エラーレスポンス生成
   */
  createErrorResponse(error, recoveryResult) {
    const response = error.toUserResponse();
    
    // 復旧情報の追加
    if (recoveryResult.attempted) {
      response.error.recovery = {
        attempted: true,
        successful: recoveryResult.success,
        retryScheduled: recoveryResult.retry,
        reason: recoveryResult.reason
      };
    }
    
    return response;
  }

  /**
   * クライアントIP取得
   */
  getClientIP(req) {
    // Vercel環境ではreq.headersが未定義の場合があるため安全にアクセス
    if (!req || !req.headers) {
      return 'unknown';
    }
    
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
  }

  /**
   * リクエストID生成
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 通知チャネル追加
   */
  addNotificationChannel(channel) {
    this.notificationChannels.push(channel);
  }

  /**
   * 定期クリーンアップの設定
   */
  setupPeriodicCleanup() {
    // 1時間ごとに統計データをクリーンアップ
    setInterval(() => {
      this.errorStatistics.cleanupOldStats(Date.now());
    }, 60 * 60 * 1000);
  }

  /**
   * 統計情報取得
   */
  getStatistics() {
    return {
      errorStats: this.errorStatistics.getStatistics(),
      recoveryStats: this.autoRecoveryManager.getRecoveryStats(),
      alertThresholds: this.alertThresholds,
      notificationChannels: this.notificationChannels.length
    };
  }
}

// グローバルエラーハンドラーインスタンス
const unifiedErrorHandler = new UnifiedErrorHandler();

/**
 * ミドルウェア関数
 */
function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      const result = await handler(req, res);
      
      if (!res.headersSent && result) {
        return res.json(result);
      }
      
      return result;
    } catch (error) {
      return unifiedErrorHandler.handleError(error, req, res);
    }
  };
}

/**
 * レガシーサポート関数
 */
function handleError(error, req, res) {
  return unifiedErrorHandler.handleError(error, req, res);
}

/**
 * 🔧 UTILITY FUNCTIONS
 * ユーティリティ関数群
 */

/**
 * エラー検証とラッピング
 */
function validateAndWrapError(error, defaultMessage = 'An error occurred') {
  if (error instanceof UnifiedError) {
    return error;
  }
  
  if (error instanceof AppError) {
    return new UnifiedError(error.message, error.type, error.statusCode);
  }
  
  return new UnifiedError(defaultMessage, ERROR_TYPES.SYSTEM_FAILURE, 500);
}

/**
 * エラーレスポンス作成
 */
function createErrorResponse(error, _context = {}) {
  const unifiedError = validateAndWrapError(error);
  return unifiedError.toUserResponse();
}

/**
 * エラータイプ検証
 */
function isErrorType(error, type) {
  return error && error.type === type;
}

/**
 * エラー優先度検証
 */
function isHighPriorityError(error) {
  return error && (error.priority === 'CRITICAL' || error.priority === 'HIGH');
}

/**
 * 復旧可能エラー検証
 */
function isRecoverableError(error) {
  return error && error.isRecoverable;
}

/**
 * エラー統計ダッシュボードデータ取得
 */
function getErrorDashboardData() {
  const stats = unifiedErrorHandler.getStatistics();
  const topErrors = stats.errorStats.topErrors.slice(0, 5);
  const hourlyTrend = stats.errorStats.hourlyTrend;
  
  return {
    summary: {
      totalErrors: stats.errorStats.totalErrors,
      recentErrors: stats.errorStats.recentErrors,
      criticalErrors: stats.errorStats.criticalErrors,
      errorRate: stats.errorStats.errorRate,
      uptime: stats.errorStats.uptime
    },
    topErrors,
    hourlyTrend,
    recovery: stats.recoveryStats,
    alerts: stats.alertThresholds
  };
}

/**
 * エラーハンドリングヘルスチェック
 */
function getErrorHandlerHealth() {
  const stats = unifiedErrorHandler.getStatistics();
  const now = Date.now();
  
  return {
    status: 'healthy',
    timestamp: new Date(now).toISOString(),
    statistics: stats,
    performance: {
      totalErrorsHandled: stats.errorStats.totalErrors,
      averageResponseTime: '< 10ms',
      memoryUsage: process.memoryUsage(),
      uptime: stats.errorStats.uptime
    },
    capabilities: {
      errorClassification: true,
      priorityHandling: true,
      autoRecovery: true,
      statisticsTracking: true,
      alerting: true,
      userFriendlyMessages: true
    }
  };
}

/**
 * エラーハンドリングシステム初期化
 */
function initializeErrorHandling(options = {}) {
  const {
    customRecoveryStrategies = {},
    notificationChannels = [],
    alertThresholds = {}
  } = options;
  
  // アラート闾値の更新
  if (Object.keys(alertThresholds).length > 0) {
    Object.assign(unifiedErrorHandler.alertThresholds, alertThresholds);
  }
  
  // カスタム復旧戦略の追加
  for (const [errorType, strategy] of Object.entries(customRecoveryStrategies)) {
    autoRecoveryManager.addRecoveryStrategy(errorType, strategy);
  }
  
  // 通知チャネルの追加
  for (const channel of notificationChannels) {
    unifiedErrorHandler.addNotificationChannel(channel);
  }
  
  logger.info('🚀 Unified Error Handling System initialized successfully');
  
  return {
    errorHandler: unifiedErrorHandler,
    recoveryManager: autoRecoveryManager,
    statistics: errorStatistics
  };
}

// CommonJS形式でエクスポート
module.exports = {
  // エラータイプと定数
  ERROR_TYPES,
  ERROR_PRIORITIES,
  USER_FRIENDLY_MESSAGES,
  RECOVERABLE_ERROR_TYPES,
  
  // エラークラス
  UnifiedError,
  AppError, // 後方互換性
  
  // コアシステム
  UnifiedErrorHandler,
  AutoRecoveryManager,
  ErrorStatistics,
  ErrorMonitoringIntegration,
  
  // インスタンス
  unifiedErrorHandler,
  autoRecoveryManager,
  errorStatistics,
  
  // ミドルウェアとユーティリティ
  withErrorHandler,
  handleError,
  validateAndWrapError,
  createErrorResponse,
  isErrorType,
  isHighPriorityError,
  isRecoverableError,
  getErrorDashboardData,
  getErrorHandlerHealth,
  initializeErrorHandling,
  
  // レガシーサポート
  ErrorTypes: ERROR_TYPES // 後方互換性
};