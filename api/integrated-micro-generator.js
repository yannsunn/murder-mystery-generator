/**
 * Professional Murder Mystery Generator
 * 統合マイクロ生成システム
 */

const { aiClient } = require('./utils/ai-client.js');
const { withErrorHandler, AppError, ErrorTypes } = require('./utils/error-handler.js');
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
  sendProgressUpdate 
} = require('./core/event-source-handler.js');
const { processRandomMode } = require('./core/random-processor.js');
const { 
  createCacheKey, 
  createFormDataHash,
  sanitizeObject 
} = require('./core/generation-utils.js');

const config = {
  maxDuration: 300,
};


// メインハンドラー
async function handler(req, res) {
  try {
    // 初期ログ出力
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[INIT] Integrated Micro Generator called at:', new Date().toISOString());
      logger.debug('[INIT] Request method:', req.method);
      logger.debug('[INIT] Request headers:', req.headers);
    }
    
    // セキュリティヘッダーの設定
    setSecurityHeaders(res);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

    // OPTIONSリクエストの処理
    if (req.method === 'OPTIONS') {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[OPTIONS] Preflight request handled');
      }
      return res.status(200).end();
    }

    // パーソナルアクセスチェック
    const accessCheck = checkPersonalAccess(req);
    if (!accessCheck.allowed) {
      logger.warn('[AUTH] Personal access denied:', accessCheck.reason);
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: accessCheck.reason || 'このサービスは許可されたユーザーのみ利用可能です'
      });
    }

    // 1日の使用制限チェック
    const usageCheck = checkDailyUsage();
    if (!usageCheck.allowed) {
      logger.warn('[LIMIT] Daily usage limit exceeded');
      return res.status(429).json({
        success: false,
        error: 'Daily limit exceeded',
        message: usageCheck.reason || '本日の利用上限に達しました。明日再度お試しください。',
        resetTime: usageCheck.resetTime
      });
    }

    // リクエストデータの取得
    let formData = req.method === 'GET' ? req.query : req.body || {};
    
    // GETリクエストでformDataがJSON文字列の場合はパース
    if (req.method === 'GET' && formData.formData && typeof formData.formData === 'string') {
      try {
        formData = { ...formData, ...JSON.parse(formData.formData) };
      } catch (e) {
        logger.error('[ERROR] Failed to parse formData:', e);
      }
    }
    
    const sessionId = formData.sessionId || `session_${Date.now()}`;
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[REQUEST] Form data:', formData);
      logger.debug('[REQUEST] Session ID:', sessionId);
    }

    // GROQ APIキーの確認
    if (!process.env.GROQ_API_KEY) {
      logger.error('[ERROR] GROQ_API_KEY is not set in environment variables');
      return res.status(503).json({
        success: false,
        error: 'Service unavailable',
        message: 'AI service is not configured. Please set GROQ_API_KEY.'
      });
    }

    // EventSource対応チェック
    if (req.headers.accept?.includes('text/event-stream')) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[STREAM] EventSource connection requested');
      }
      setEventSourceHeaders(res);
      
      // ストリーミング処理
      await handleStreamingGeneration(req, res, formData, sessionId);
      return;
    }

    // 通常のJSON応答
    const result = await generateMysteryScenario(formData, sessionId);
    
    if (process.env.NODE_ENV === 'development') {
      logger.debug('[COMPLETE] Generation completed for session:', sessionId);
    }
    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    logger.error('[ERROR] Handler error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      error: error.type || 'GENERATION_ERROR',
      message: error.message || 'An error occurred during generation',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * ストリーミング生成処理
 */
async function handleStreamingGeneration(req, res, formData, sessionId) {
  try {
    // 開始メッセージ
    sendEventSourceMessage(res, 'message', {
      type: 'start',
      message: '🎬 マーダーミステリーの生成を開始します',
      sessionId
    });

    // ランダムモードのチェック
    if (formData.randomMode) {
      if (process.env.NODE_ENV === 'development') {
        logger.debug('[STREAM] Processing random mode');
      }
      await processRandomMode(res, sessionId);
      return;
    }

    // 生成フローの実行
    const stages = INTEGRATED_GENERATION_FLOW;
    let accumulatedData = { formData, sessionId };

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      if (process.env.NODE_ENV === 'development') {
      logger.debug(`[STAGE] Processing: ${stage.name}`);
    }
      
      // sendProgressUpdate(res, stepIndex, stepName, result, currentWeight, totalWeight, isComplete)
      const currentWeight = (i + 1) * 10;
      const totalWeight = stages.length * 10;
      sendProgressUpdate(res, i, stage.name, stage.message || '', currentWeight, totalWeight, false);

      try {
        const stageResult = await stage.handler(accumulatedData);
        accumulatedData = { ...accumulatedData, ...stageResult };
        
        if (stageResult.preview) {
          sendEventSourceMessage(res, 'preview', {
            type: 'preview',
            stage: stage.name,
            data: stageResult.preview
          });
        }
      } catch (error) {
        logger.error(`[ERROR] Stage ${stage.name} failed:`, error);
        sendEventSourceMessage(res, 'error', {
          type: 'error',
          stage: stage.name,
          error: error.message
        });
        
        if (stage.critical) {
          throw error;
        }
      }
    }

    // 完了メッセージ
    sendEventSourceMessage(res, 'complete', {
      type: 'complete',
      message: '✨ マーダーミステリーが完成しました！',
      data: accumulatedData
    });

    res.end();

  } catch (error) {
    logger.error('[STREAM ERROR]', error);
    sendEventSourceMessage(res, 'error', {
      type: 'error',
      error: error.message,
      critical: true
    });
    res.end();
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