/**
 * Professional Murder Mystery Generator
 * 統合マイクロ生成システム
 */

const { aiClient } = require('./utils/ai-client.js');
const { 
  withErrorHandler, 
  UnifiedError, 
  ERROR_TYPES, 
  unifiedErrorHandler 
} = require('./utils/error-handler.js');
const { 
  withApiErrorHandling, 
  convertAIError, 
  convertDatabaseError,
  convertValidationError
} = require('./utils/error-handler-integration.js');
const { setSecurityHeaders } = require('./security-utils.js');
const { createSecurityMiddleware } = require('./middleware/rate-limiter.js');
const { checkPersonalAccess, checkDailyUsage } = require('./utils/simple-auth.js');
// const { createPerformanceMiddleware } = require('./core/monitoring.js'); // Removed for simplicity
const { createValidationMiddleware } = require('./core/validation.js');
// const { qualityAssessor } = require('./utils/quality-assessor.js'); // Removed for simplicity
const { executeParallel, SimpleCache } = require('./utils/performance-optimizer.js');

// キャッシュインスタンスの作成
const cache = new SimpleCache();
const intelligentCache = cache;
const { randomMysteryGenerator } = require('./utils/random-mystery-generator.js');
const { logger } = require('./utils/logger.js');
// const { resourceManager } = require('./utils/resource-manager.js'); // Removed for simplicity
// const { executeOptimizedQueryWithMonitoring } = require('./utils/database-optimizer.js'); // Removed for simplicity
const { saveScenarioToSupabase } = require('./supabase-client.js');
const { INTEGRATED_GENERATION_FLOW } = require('./core/generation-stages.js');
const { createImagePrompts, generateImages } = require('./core/image-generator.js');
const { 
  setupEventSourceConnection, 
  setEventSourceHeaders, 
  sendEventSourceMessage,
  sendProgressUpdate,
  integratedEventSourceManager
} = require('./core/event-source-handler.js');
const { 
  EventSourceError, 
  EVENT_SOURCE_ERROR_TYPES, 
  eventSourceErrorHandler 
} = require('./core/event-source-error-handler.js');
const { processRandomMode } = require('./core/random-processor.js');
const { 
  createCacheKey, 
  createFormDataHash,
  sanitizeObject 
} = require('./core/generation-utils.js');

const config = {
  maxDuration: 300,
};


// メインハンドラー - 統一エラーハンドリング適用
const handler = withApiErrorHandling(async (req, res) => {
  const startTime = Date.now();
  
  try {
    // 初期ログ出力
    logger.debug('[INIT] Integrated Micro Generator called at:', new Date().toISOString());
    logger.debug('[INIT] Request method:', req.method);
    
    // セキュリティヘッダーの設定
    setSecurityHeaders(res);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    // OPTIONSリクエストの処理
    if (req.method === 'OPTIONS') {
      logger.debug('[OPTIONS] Preflight request handled');
      res.status(200).end();
      return { success: true, message: 'CORS preflight handled' };
    }

    // パーソナルアクセスチェック
    const accessCheck = checkPersonalAccess(req);
    if (!accessCheck.allowed) {
      logger.warn('[AUTH] Personal access denied:', accessCheck.reason);
      throw new UnifiedError(
        accessCheck.reason || 'このサービスは許可されたユーザーのみ利用可能です',
        ERROR_TYPES.AUTHORIZATION_ERROR,
        401,
        { service: 'AUTH', check: 'personal_access' }
      );
    }

    // 1日の使用制限チェック
    const usageCheck = checkDailyUsage();
    if (!usageCheck.allowed) {
      logger.warn('[LIMIT] Daily usage limit exceeded');
      throw new UnifiedError(
        usageCheck.reason || '本日の利用上限に達しました。明日再度お試しください。',
        ERROR_TYPES.RATE_LIMIT_ERROR,
        429,
        { 
          service: 'RATE_LIMIT', 
          resetTime: usageCheck.resetTime,
          check: 'daily_usage' 
        }
      );
    }

    // リクエストデータの取得
    let formData = req.method === 'GET' ? req.query : req.body || {};
    
    // GETリクエストでformDataがJSON文字列の場合はパース
    if (req.method === 'GET' && formData.formData && typeof formData.formData === 'string') {
      try {
        formData = { ...formData, ...JSON.parse(formData.formData) };
      } catch (e) {
        logger.error('[ERROR] Failed to parse formData:', e);
        throw convertValidationError(e, { 
          field: 'formData', 
          value: formData.formData,
          validator: 'JSON.parse' 
        });
      }
    }
    
    const sessionId = formData.sessionId || `session_${Date.now()}`;
    
    logger.debug('[REQUEST] Form data:', formData);
    logger.debug('[REQUEST] Session ID:', sessionId);

    // GROQ APIキーの確認
    if (!process.env.GROQ_API_KEY) {
      logger.error('[ERROR] GROQ_API_KEY is not set in environment variables');
      // 開発環境の場合は詳細なエラーメッセージを表示
      const isDev = process.env.NODE_ENV !== 'production';
      const errorMessage = isDev 
        ? 'GROQ_API_KEY is not set. Please create a .env file with GROQ_API_KEY=your_key_here or set it in your deployment environment.'
        : 'AI service is temporarily unavailable.';
      
      throw new UnifiedError(
        errorMessage,
        ERROR_TYPES.CONFIGURATION_ERROR,
        503,
        { service: 'AI_API', provider: 'GROQ', missing: 'API_KEY', isDev }
      );
    }

    // EventSource対応チェック
    if (req.headers.accept?.includes('text/event-stream')) {
      logger.info('[STREAM] EventSource connection requested');
      logger.info('[STREAM] FormData:', formData);
      logger.info('[STREAM] SessionId:', sessionId);
      
      try {
        // 統合EventSourceManagerで接続管理
        const connectionId = integratedEventSourceManager.setupEventSourceConnection(req, res, sessionId);
        integratedEventSourceManager.setEventSourceHeaders(res);
        
        // ストリーミング処理
        await handleStreamingGeneration(req, res, formData, connectionId);
        return;
      } catch (error) {
        logger.error('[STREAM ERROR] EventSource setup failed:', error);
        throw new UnifiedError(
          error.message,
          ERROR_TYPES.NETWORK_ERROR,
          500,
          { 
            service: 'EVENT_SOURCE', 
            sessionId, 
            connectionType: 'streaming',
            originalError: error 
          }
        );
      }
    }

    // 通常のJSON応答
    const result = await generateMysteryScenario(formData, sessionId);
    
    logger.debug('[COMPLETE] Generation completed for session:', sessionId);
    
    // 統一レスポンス形式
    return {
      success: true,
      data: result,
      metadata: {
        sessionId,
        processingTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

  } catch (error) {
    // エラーは統一エラーハンドリングシステムで処理
    throw error;
  }
}, {
  context: { 
    service: 'INTEGRATED_MICRO_GENERATOR',
    version: '1.0.0'
  }
});

/**
 * ストリーミング生成処理
 */
async function handleStreamingGeneration(req, res, formData, connectionId) {
  try {
    // 開始メッセージ
    integratedEventSourceManager.sendEventSourceMessage(connectionId, 'message', {
      type: 'start',
      message: '🎬 マーダーミステリーの生成を開始します',
      sessionId: connectionId
    });

    // ランダムモードのチェック
    if (formData.randomMode) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[STREAM] Processing random mode');
      }
      await processRandomMode(res, connectionId);
      return;
    }

    // 生成フローの実行
    const stages = INTEGRATED_GENERATION_FLOW;
    let accumulatedData = { formData, sessionId: connectionId };

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`[STAGE] Processing: ${stage.name}`);
      }
      
      // 進捗更新を統合EventSourceManagerで送信
      const currentWeight = (i + 1) * 10;
      const totalWeight = stages.length * 10;
      const progressSent = integratedEventSourceManager.sendProgressUpdate(
        connectionId, i, stage.name, stage.message || '', currentWeight, totalWeight, false
      );
      
      // 進捗送信失敗時のエラーハンドリング
      if (!progressSent) {
        const error = new EventSourceError(
          `Progress update failed for stage: ${stage.name}`,
          EVENT_SOURCE_ERROR_TYPES.WRITE_FAILED,
          connectionId
        );
        
        const errorResult = eventSourceErrorHandler.handleError(error, connectionId);
        if (errorResult.shouldTerminate) {
          integratedEventSourceManager.closeConnection(connectionId);
          return;
        }
      }

      try {
        const stageResult = await stage.handler(accumulatedData);
        accumulatedData = { ...accumulatedData, ...stageResult };
        
        if (stageResult.preview) {
          integratedEventSourceManager.sendEventSourceMessage(connectionId, 'preview', {
            type: 'preview',
            stage: stage.name,
            data: stageResult.preview
          });
        }
      } catch (error) {
        logger.error(`[ERROR] Stage ${stage.name} failed:`, error);
        
        const stageError = new EventSourceError(
          `Stage ${stage.name} failed: ${error.message}`,
          EVENT_SOURCE_ERROR_TYPES.VALIDATION_ERROR,
          connectionId
        );
        
        const errorResult = eventSourceErrorHandler.handleError(stageError, connectionId);
        
        integratedEventSourceManager.sendEventSourceMessage(connectionId, 'error', {
          type: 'error',
          stage: stage.name,
          error: error.message
        });
        
        if (stage.critical || errorResult.shouldTerminate) {
          integratedEventSourceManager.closeConnection(connectionId);
          return;
        }
      }
    }

    // 完了メッセージ
    integratedEventSourceManager.sendEventSourceMessage(connectionId, 'complete', {
      type: 'complete',
      message: '✨ マーダーミステリーが完成しました！',
      data: accumulatedData
    });

    // 統合EventSourceManagerで接続を適切に終了
    integratedEventSourceManager.closeConnection(connectionId);

  } catch (error) {
    logger.error('[STREAM ERROR]', error);
    
    const streamError = new EventSourceError(
      `Streaming generation failed: ${error.message}`,
      EVENT_SOURCE_ERROR_TYPES.CONNECTION_FAILED,
      connectionId
    );
    
    eventSourceErrorHandler.handleError(streamError, connectionId);
    
    integratedEventSourceManager.sendEventSourceMessage(connectionId, 'error', {
      type: 'error',
      error: error.message,
      critical: true
    });
    
    integratedEventSourceManager.closeConnection(connectionId);
  }
}

/**
 * 非ストリーミング生成処理
 */
async function generateMysteryScenario(formData, sessionId) {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('[GENERATE] Starting mystery generation');
  }
  
  const cacheKey = createCacheKey(formData);
  
  // キャッシュチェック
  const cached = cache.get(cacheKey);
  if (cached) {
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[CACHE] Returning cached result');
    }
    return cached;
  }

  // 生成フローの実行
  const stages = INTEGRATED_GENERATION_FLOW;
  let accumulatedData = { formData, sessionId };

  for (const stage of stages) {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(`[STAGE] Processing: ${stage.name}`);
    }
    
    try {
      const stageResult = await stage.handler(accumulatedData);
      accumulatedData = { ...accumulatedData, ...stageResult };
    } catch (error) {
      logger.error(`[ERROR] Stage ${stage.name} failed:`, error);
      if (stage.critical) {
        throw error;
      }
    }
  }

  // 結果をキャッシュ
  cache.set(cacheKey, accumulatedData);

  return accumulatedData;
}

// CommonJS形式でエクスポート
module.exports = handler;
module.exports.config = config;