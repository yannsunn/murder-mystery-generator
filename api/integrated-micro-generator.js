/**
 * Professional Murder Mystery Generator
 * 統合マイクロ生成システム
 */

// Vercel環境では環境変数は直接process.envから読む必要がある
const isVercel = process.env.VERCEL === '1';
const { envManager } = !isVercel ? require('./config/env-manager.js') : { get: (key) => process.env[key], initialized: true };
// 未使用importを削除（ESLint no-unused-vars対策）
const {
  UnifiedError,
  ERROR_TYPES
} = require('./utils/error-handler.js');
const {
  withApiErrorHandling,
  convertValidationError
} = require('./utils/error-handler-integration.js');
const { setSecurityHeaders } = require('./security-utils.js');
const { checkPersonalAccess, checkDailyUsage } = require('./utils/simple-auth.js');
const { SimpleCache } = require('./utils/performance-optimizer.js');

// キャッシュインスタンスの作成
const cache = new SimpleCache();
const { logger } = require('./utils/logger.js');
const { INTEGRATED_GENERATION_FLOW } = require('./core/generation-stages.js');
const {
  createCacheKey
} = require('./core/generation-utils.js');

const config = {
  maxDuration: 300,
  // Vercel Edge Runtime設定
  runtime: 'nodejs',
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    responseLimit: false // ストリーミングレスポンスのため無制限に
  }
};


// メインハンドラー - 統一エラーハンドリング適用
const handler = withApiErrorHandling(async (req, res) => {
  const startTime = Date.now();

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

    // GROQ APIキーの確認（フロントエンドから送信されたキーを優先）
    const groqKey = formData.apiKey || 
                   process.env.GROQ_API_KEY || 
                   envManager.get('GROQ_API_KEY') || 
                   process.env['GROQ_API_KEY']; // 文字列アクセスも試行
    
    if (!groqKey) {
      logger.warn('[DEMO MODE] No GROQ_API_KEY found, running in demo mode');
      logger.info('[DEMO MODE] Demo mode allows full functionality with mock data');
      
      // デモモードフラグを設定
      formData.demoMode = true;
      formData.mockGenerated = true;
      
      // デモモード通知メッセージ
      logger.info('🎭 Demo Mode Activated - Using mock data generator for all content');
    }

    // EventSource is disabled - using polling mode instead
    if (req.headers.accept?.includes('text/event-stream')) {
      logger.info('[STREAM] EventSource requested but disabled - use polling instead');
      return res.status(400).json({
        success: false,
        error: 'EventSource is not supported. Please use polling mode.',
        usePolling: true
      });
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
}, {
  context: { 
    service: 'INTEGRATED_MICRO_GENERATOR',
    version: '1.0.0'
  }
});

/**
 * ストリーミング生成処理 (DISABLED)
 */
/* eslint-disable */
// This function is disabled as EventSource is not supported
/*
async function handleStreamingGeneration(req, res, formData, connectionId) {
  try {
    // 開始メッセージ（デモモードチェック）
    // AIプロバイダーの設定状態を確認
    const hasAIProvider = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || formData.apiKey;
    const isDemoMode = !hasAIProvider;
    const startMessage = isDemoMode 
      ? '🎭 デモモード: マーダーミステリーのサンプル生成を開始します'
      : '🎬 マーダーミステリーの生成を開始します';
    
    integratedEventSourceManager.sendEventSourceMessage(connectionId, 'message', {
      type: 'start',
      message: startMessage,
      sessionId: connectionId,
      demoMode: isDemoMode
    });
    
    // デモモード通知
    if (isDemoMode) {
      integratedEventSourceManager.sendEventSourceMessage(connectionId, 'message', {
        type: 'info',
        message: '💡 環境変数が設定されていないため、デモモードで動作しています。実際のAI生成では、より詳細で独創的なコンテンツが作成されます。',
        demoMode: true
      });
    }

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
      
      // 重み付き進捗計算システムを使用
      const progressData = getStageProgressData(i, 0); // 段階開始時は0%
      const progressSent = integratedEventSourceManager.sendEventSourceMessage(
        connectionId, 'progress', {
          step: progressData.step,
          totalSteps: progressData.totalSteps,
          stepName: stage.name,
          message: stage.message || `${stage.name}を処理中...`,
          progress: progressData.progress,
          weight: progressData.weight,
          estimatedTimeRemaining: progressData.estimatedTimeRemaining,
          timestamp: new Date().toISOString()
        }
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
        
        // 段階完了時の進捗更新（100%）
        const completedProgressData = getStageProgressData(i, 100);
        integratedEventSourceManager.sendEventSourceMessage(connectionId, 'progress', {
          step: completedProgressData.step,
          totalSteps: completedProgressData.totalSteps,
          stepName: stage.name,
          message: `${stage.name}が完了しました`,
          progress: completedProgressData.progress,
          weight: completedProgressData.weight,
          estimatedTimeRemaining: completedProgressData.estimatedTimeRemaining,
          completed: true,
          timestamp: new Date().toISOString()
        });
        
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
    const completeMessage = isDemoMode 
      ? '✨ デモシナリオが完成しました！（実際のAI生成ではより詳細なコンテンツが生成されます）'
      : '✨ マーダーミステリーが完成しました！';
    
    integratedEventSourceManager.sendEventSourceMessage(connectionId, 'complete', {
      type: 'complete',
      message: completeMessage,
      data: accumulatedData,
      demoMode: isDemoMode
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
*/

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

// CommonJS形式でエクスポート（Vercelもこの形式をサポート）
module.exports = handler;
module.exports.config = config;
module.exports.handler = handler; // 明示的にhandlerもエクスポート