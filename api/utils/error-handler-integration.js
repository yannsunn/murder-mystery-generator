/**
 * 🔧 ERROR HANDLER INTEGRATION
 * 統一エラーハンドリングシステムの既存モジュールへの統合サポート
 */

const { 
  UnifiedError, 
  ERROR_TYPES, 
  unifiedErrorHandler, 
  initializeErrorHandling,
  withErrorHandler
} = require('./error-handler.js');
const { logger } = require('./logger.js');

/**
 * 🚀 INTEGRATION UTILITIES
 * 統合ユーティリティ関数群
 */

/**
 * 既存のエラーハンドラーを統一エラーハンドリングに移行
 */
function migrateExistingErrorHandler(existingHandler) {
  return withErrorHandler(async (req, res) => {
    try {
      return await existingHandler(req, res);
    } catch (error) {
      // 既存エラーを統一エラーに変換
      const unifiedError = new UnifiedError(
        error.message,
        error.type || ERROR_TYPES.SYSTEM_FAILURE,
        error.statusCode || 500,
        {
          originalError: error,
          migrated: true
        }
      );
      
      throw unifiedError;
    }
  });
}

/**
 * AI API エラーの統一変換
 */
function convertAIError(error, context = {}) {
  let errorType = ERROR_TYPES.EXTERNAL_SERVICE_ERROR;
  let statusCode = 503;
  
  if (error.message.includes('rate limit')) {
    errorType = ERROR_TYPES.RATE_LIMIT_ERROR;
    statusCode = 429;
  } else if (error.message.includes('timeout')) {
    errorType = ERROR_TYPES.TIMEOUT_ERROR;
    statusCode = 408;
  } else if (error.message.includes('auth')) {
    errorType = ERROR_TYPES.AUTHENTICATION_ERROR;
    statusCode = 401;
  }
  
  return new UnifiedError(
    error.message,
    errorType,
    statusCode,
    {
      service: 'AI_API',
      provider: context.provider || 'unknown',
      model: context.model || 'unknown',
      ...context
    }
  );
}

/**
 * データベースエラーの統一変換
 */
function convertDatabaseError(error, context = {}) {
  let errorType = ERROR_TYPES.DATABASE_ERROR;
  let statusCode = 503;
  
  if (error.message.includes('connection')) {
    errorType = ERROR_TYPES.NETWORK_ERROR;
  } else if (error.message.includes('timeout')) {
    errorType = ERROR_TYPES.TIMEOUT_ERROR;
    statusCode = 408;
  }
  
  return new UnifiedError(
    error.message,
    errorType,
    statusCode,
    {
      service: 'DATABASE',
      operation: context.operation || 'unknown',
      table: context.table || 'unknown',
      ...context
    }
  );
}

/**
 * バリデーションエラーの統一変換
 */
function convertValidationError(error, context = {}) {
  return new UnifiedError(
    error.message,
    ERROR_TYPES.VALIDATION_ERROR,
    400,
    {
      field: context.field || 'unknown',
      value: context.value || 'unknown',
      validator: context.validator || 'unknown',
      ...context
    }
  );
}

/**
 * EventSource エラーの統一変換
 */
function convertEventSourceError(error, context = {}) {
  let errorType = ERROR_TYPES.NETWORK_ERROR;
  let statusCode = 503;
  
  if (error.message.includes('connection')) {
    errorType = ERROR_TYPES.NETWORK_ERROR;
  } else if (error.message.includes('timeout')) {
    errorType = ERROR_TYPES.TIMEOUT_ERROR;
    statusCode = 408;
  } else if (error.message.includes('write')) {
    errorType = ERROR_TYPES.SYSTEM_FAILURE;
    statusCode = 500;
  }
  
  return new UnifiedError(
    error.message,
    errorType,
    statusCode,
    {
      service: 'EVENT_SOURCE',
      connectionId: context.connectionId || 'unknown',
      ...context
    }
  );
}

/**
 * 統一エラーハンドリング初期化（プロジェクト向け設定）
 */
function initializeProjectErrorHandling() {
  const customRecoveryStrategies = {
    [ERROR_TYPES.EXTERNAL_SERVICE_ERROR]: async (error, context) => {
      logger.info(`🔄 Attempting AI service recovery for: ${error.id}`);
      
      // AI APIの場合は異なるプロバイダーに切り替え
      if (context.service === 'AI_API') {
        const providers = ['groq', 'openai', 'anthropic'];
        const currentProvider = context.provider || 'groq';
        const nextProvider = providers[(providers.indexOf(currentProvider) + 1) % providers.length];
        
        return {
          success: false,
          retry: true,
          delay: error.retryDelay,
          newContext: { ...context, provider: nextProvider, fallback: true }
        };
      }
      
      return {
        success: false,
        retry: true,
        delay: error.retryDelay * 2 // 通常の2倍の遅延
      };
    },
    
    [ERROR_TYPES.DATABASE_ERROR]: async (error, context) => {
      logger.info(`🔄 Attempting database recovery for: ${error.id}`);
      
      // データベース接続プールのリセット
      if (context.service === 'DATABASE') {
        // 実際のプールリセット処理はここで実装
        return {
          success: false,
          retry: true,
          delay: error.retryDelay * 3,
          newContext: { ...context, poolReset: true }
        };
      }
      
      return {
        success: false,
        retry: true,
        delay: error.retryDelay * 2
      };
    }
  };
  
  const alertThresholds = {
    criticalErrorRate: 0.03, // 3%
    highErrorCount: 50,
    errorBurst: 15
  };
  
  // Slack通知チャンネル（例）
  const slackNotificationChannel = {
    send: async (alert) => {
      if (process.env.SLACK_WEBHOOK_URL) {
        try {
          const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🚨 Murder Mystery App Alert: ${alert.message}`,
              attachments: [{
                color: alert.severity === 'critical' ? 'danger' : 'warning',
                title: alert.type,
                text: alert.message,
                timestamp: Math.floor(Date.now() / 1000)
              }]
            })
          });
          
          if (!response.ok) {
            throw new Error(`Slack notification failed: ${response.status}`);
          }
        } catch (error) {
          logger.error('Failed to send Slack notification:', error);
        }
      }
    }
  };
  
  const notificationChannels = [];
  if (process.env.SLACK_WEBHOOK_URL) {
    notificationChannels.push(slackNotificationChannel);
  }
  
  return initializeErrorHandling({
    customRecoveryStrategies,
    alertThresholds,
    notificationChannels,
    enableFileLogging: process.env.NODE_ENV === 'production'
  });
}

/**
 * API エンドポイント用のエラーハンドリングデコレーター
 */
function withApiErrorHandling(endpoint, options = {}) {
  return withErrorHandler(async (req, res) => {
    try {
      const result = await endpoint(req, res);
      
      // 成功時の統一レスポンス形式
      if (result && !result.success && !result.error) {
        return {
          success: true,
          data: result,
          timestamp: new Date().toISOString(),
          processingTime: options.processingTime || 'N/A'
        };
      }
      
      return result;
    } catch (error) {
      // エラータイプに応じた変換
      let unifiedError;
      
      if (error.name === 'ValidationError') {
        unifiedError = convertValidationError(error, options.context);
      } else if (error.message.includes('database') || error.message.includes('supabase')) {
        unifiedError = convertDatabaseError(error, options.context);
      } else if (error.message.includes('AI') || error.message.includes('groq') || error.message.includes('openai')) {
        unifiedError = convertAIError(error, options.context);
      } else if (error.message.includes('EventSource') || error.message.includes('SSE')) {
        unifiedError = convertEventSourceError(error, options.context);
      } else {
        unifiedError = new UnifiedError(
          error.message,
          ERROR_TYPES.SYSTEM_FAILURE,
          500,
          { originalError: error, ...options.context }
        );
      }
      
      throw unifiedError;
    }
  });
}

/**
 * エラーハンドリングヘルスチェック
 */
async function performErrorHandlingHealthCheck() {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    components: {}
  };
  
  try {
    // 統一エラーハンドラーのチェック
    const errorHandlerStats = unifiedErrorHandler.getStatistics();
    healthCheck.components.errorHandler = {
      status: 'healthy',
      stats: errorHandlerStats
    };
    
    // ログシステムのチェック
    const loggerStats = logger.getStats();
    healthCheck.components.logger = {
      status: 'healthy',
      stats: loggerStats
    };
    
    // 各種エラー変換機能のテスト
    const testError = new Error('Test error');
    const convertedError = convertAIError(testError, { provider: 'test' });
    
    healthCheck.components.errorConversion = {
      status: convertedError instanceof UnifiedError ? 'healthy' : 'unhealthy',
      testPassed: convertedError instanceof UnifiedError
    };
    
  } catch (error) {
    healthCheck.status = 'unhealthy';
    healthCheck.error = error.message;
  }
  
  return healthCheck;
}

module.exports = {
  migrateExistingErrorHandler,
  convertAIError,
  convertDatabaseError,
  convertValidationError,
  convertEventSourceError,
  initializeProjectErrorHandling,
  withApiErrorHandling,
  performErrorHandlingHealthCheck
};