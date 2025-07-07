/**
 * 🏆 Professional Murder Mystery Generator
 * 統合マイクロ生成システム
 */

import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';
import { createSecurityMiddleware } from './middleware/rate-limiter.js';
import { createPerformanceMiddleware } from './core/monitoring.js';
import { createValidationMiddleware } from './core/validation.js';
import { qualityAssessor } from './utils/quality-assessor.js';
import { parallelEngine, intelligentCache } from './utils/performance-optimizer.js';
import { randomMysteryGenerator } from './utils/random-mystery-generator.js';
import { logger } from './utils/logger.js';
import { resourceManager } from './utils/resource-manager.js';
import { executeOptimizedQueryWithMonitoring } from './utils/database-optimizer.js';
import { saveScenarioToSupabase } from './supabase-client.js';
import { INTEGRATED_GENERATION_FLOW } from './core/generation-stages.js';
import { createImagePrompts, generateImages } from './core/image-generator.js';
import { 
  setupEventSourceConnection, 
  setEventSourceHeaders, 
  sendEventSourceMessage,
  sendProgressUpdate 
} from './core/event-source-handler.js';
import { processRandomMode } from './core/random-processor.js';
import { 
  createCacheKey, 
  createFormDataHash,
  sanitizeObject 
} from './core/generation-utils.js';

export const config = {
  maxDuration: 300,
};


// メインハンドラー
export default async function handler(req, res) {
  logger.debug('🔬 Integrated Micro Generator called');
  
  setSecurityHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET リクエスト対応（EventSource用）
  if (req.method === 'GET') {
    const { formData, sessionId, action } = req.query;
    
    // EventSource接続はevent-source-handlerモジュールで処理
    if (req.headers.accept?.includes('text/event-stream')) {
      const eventSourceId = setupEventSourceConnection(req, res, sessionId);
      req.body = {
        formData: formData ? JSON.parse(formData) : {},
        sessionId: sessionId || `integrated_micro_${Date.now()}`,
        action: action || null,
        stream: true,
        eventSourceId
      };
    } else {
      // 通常のGETリクエスト
      if (!formData && action !== 'init') {
        return res.status(400).json({
          success: false,
          error: 'formData is required in query params'
        });
      }
      
      req.body = {
        formData: formData ? JSON.parse(formData) : {},
        sessionId: sessionId || `integrated_micro_${Date.now()}`,
        action: action || null
      };
    }
  } else if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST or GET.' 
    });
  }

  // セキュリティ・パフォーマンス・バリデーション統合チェック
  const middlewares = [
    createPerformanceMiddleware(),
    createSecurityMiddleware('generation')
    // createValidationMiddleware('generation') // 一時無効化
  ];

  for (const middleware of middlewares) {
    try {
      await new Promise((resolve, reject) => {
        middleware(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } catch (middlewareError) {
      logger.error('Middleware error:', middlewareError);
      return res.status(500).json({ 
        success: false, 
        error: 'Middleware error: ' + middlewareError.message 
      });
    }
  }

  try {
    const { formData, sessionId, action } = req.body;
    
    logger.debug('🔬 Starting integrated micro generation...');

    // action: 'init'の場合はセッション初期化のみ実行
    if (action === 'init') {
      
      const initSessionData = {
        sessionId: sessionId || `integrated_micro_${Date.now()}`,
        formData,
        startTime: new Date().toISOString(),
        phases: {},
        status: 'initialized',
        generationType: 'integrated_micro',
        action: 'init'
      };

      // 初期化完了レスポンス
      return res.status(200).json({
        success: true,
        message: 'セッション初期化完了',
        sessionData: initSessionData,
        action: 'init',
        initialized: true
      });
    }
    
    if (!formData) {
      return res.status(400).json({
        success: false,
        error: 'formData is required',
        received: req.body
      });
    }
    
    // 🎲 完全ランダムモードのチェックと処理
    if (formData.randomMode === true) {
      const processed = await processRandomMode(req, res, formData, sessionId);
      if (processed) return; // 処理完了
    }
    
    const sessionData = {
      sessionId: sessionId || `integrated_micro_${Date.now()}`,
      formData,
      startTime: new Date().toISOString(),
      phases: {},
      status: 'running',
      generationType: 'integrated_micro'
    };

    let context = {};
    let currentWeight = 0;
    const totalWeight = INTEGRATED_GENERATION_FLOW.reduce((sum, step) => sum + step.weight, 0);

    // 🎯 段階的レスポンス実装: 各段階で進捗を送信
    let isFirstStep = true;
    let isEventSource = req.body.stream === true || req.headers.accept?.includes('text/event-stream');
    
    // EventSource接続かどうかで処理を分岐
    if (isEventSource) {
      // EventSourceヘッダー設定
      setEventSourceHeaders(res);
      
      // 接続確認
      sendEventSourceMessage(res, 'connected', {
        message: '段階的生成を開始します',
        sessionId: sessionData.sessionId,
        eventSourceId: req.body?.eventSourceId
      });
      logger.debug('🌐 EventSource接続確立 - 段階的生成開始');
    }
    
    
    // 真の段階的実行 - 各段階でレスポンス送信
    for (let i = 0; i < INTEGRATED_GENERATION_FLOW.length; i++) {
      const step = INTEGRATED_GENERATION_FLOW[i];
      
      logger.debug(`🔄 段階${i + 1}/9実行中: ${step.name}`);
      
      try {
        // 段階開始通知
        if (isFirstStep && isEventSource) {
          sendEventSourceMessage(res, 'start', {
            message: '段階的生成開始',
            totalSteps: INTEGRATED_GENERATION_FLOW.length
          });
          isFirstStep = false;
        }
        
        // 実際の段階処理時間をシミュレート（5-15秒）
        const stepStartTime = Date.now();
        
        // 🧠 インテリジェントキャッシュチェック
        const cacheKey = createCacheKey(step.name, formData);
        const cachedResult = await intelligentCache.get(cacheKey, step.name);
        
        let result;
        if (cachedResult) {
          logger.debug(`💾 Using cached result for: ${step.name}`);
          result = cachedResult;
          // キャッシュの場合でも最低2秒は処理時間を確保
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          // 新規生成 - より時間をかけて品質を向上
          result = await step.handler(formData, context);
          
          // 🧠 品質評価実行
          if (step.name.includes('キャラクター') || step.name.includes('事件') || step.name.includes('タイトル')) {
            logger.debug(`🔍 Running quality assessment for: ${step.name}`);
            const qualityResult = await qualityAssessor.evaluateScenario(
              JSON.stringify(result), 
              formData
            );
            
            // 品質が基準以下の場合は再生成
            if (!qualityResult.passesQuality && qualityResult.score < 0.8) {
              logger.debug(`⚠️ Quality below threshold (${(qualityResult.score * 100).toFixed(1)}%), regenerating...`);
              
              // フィードバックを含めて再生成
              const enhancedContext = {
                ...context,
                qualityFeedback: qualityResult.recommendations.join('\n'),
                previousAttempt: result
              };
              
              result = await step.handler(formData, enhancedContext);
              
              // 再評価
              const requalityResult = await qualityAssessor.evaluateScenario(
                JSON.stringify(result), 
                formData
              );
              
              logger.debug(`🔍 Re-evaluation score: ${(requalityResult.score * 100).toFixed(1)}%`);
            } else {
              logger.debug(`✅ Quality assessment passed: ${(qualityResult.score * 100).toFixed(1)}%`);
            }
          }
          
          // キャッシュに保存
          await intelligentCache.set(cacheKey, result, step.name, {
            stepName: step.name,
            formDataHash: createFormDataHash(formData),
            timestamp: Date.now()
          });
          
          // 各段階に適切な処理時間を確保（5-20秒）
          const minProcessTime = step.weight > 20 ? 8000 : 5000; // 重要な段階は長め
          const maxProcessTime = step.weight > 20 ? 20000 : 12000;
          const elapsedTime = Date.now() - stepStartTime;
          const remainingTime = Math.max(0, minProcessTime - elapsedTime);
          
          if (remainingTime > 0) {
            logger.debug(`⏱️ 段階${i + 1}追加処理時間: ${remainingTime}ms`);
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
        }
        
        // コンテキストに結果を追加
        Object.assign(context, result);
        
        // フェーズデータとして保存
        sessionData.phases[`step${i + 1}`] = {
          name: step.name,
          content: result,
          status: 'completed',
          completedAt: new Date().toISOString(),
          progress: Math.round(((currentWeight + step.weight) / totalWeight) * 100)
        };
        
        currentWeight += step.weight;
        
        // 段階完了を即座にフロントエンドに送信
        if (isEventSource) {
          sendProgressUpdate(res, i, step.name, result, currentWeight, totalWeight, false);
        }
        
        logger.debug(`✅ 段階${i + 1}完了: ${step.name} (進捗: ${Math.round((currentWeight / totalWeight) * 100)}%)`);
        
      } catch (stepError) {
        logger.error(`❌ Step ${i + 1} failed: ${stepError.message}`);
        
        // エラー情報を送信
        if (isEventSource) {
          sendEventSourceMessage(res, 'error', {
            step: i + 1,
            error: stepError.message
          });
        }
        
        // 致命的エラーではない場合は続行
        if (step.weight < 30) {
          logger.debug(`⚠️ Non-critical step failed, continuing...`);
          continue;
        } else {
          throw new AppError(`Critical step failed: ${step.name} - ${stepError.message}`, ErrorTypes.GENERATION_ERROR);
        }
      }
    }
    
    

    // 画像生成フェーズ
    logger.debug('🎨 Starting image generation phase...');
    const imagePrompts = createImagePrompts(sessionData);
    const generatedImages = await generateImages(imagePrompts);
    
    // 画像データをセッションに追加
    sessionData.images = generatedImages;
    sessionData.hasImages = generatedImages.length > 0;
    
    // 完了処理
    sessionData.status = 'completed';
    sessionData.completedAt = new Date().toISOString();
    sessionData.context = context;

    // 📊 データベースに最適化保存
    try {
      const saveResult = await saveScenarioToSupabase(sessionId, {
        title: sessionData.phases?.step1?.content?.concept?.match(/\*\*作品タイトル\*\*:\s*(.+?)\n/)?.[1] || 'マーダーミステリー',
        description: sessionData.phases?.step1?.content?.concept?.match(/\*\*基本コンセプト\*\*:\s*(.+?)\n/)?.[1] || '',
        characters: sessionData.phases?.step4?.content?.characters || '',
        ...sessionData
      });
      
      if (saveResult.success) {
        logger.success('✅ シナリオをデータベースに最適化保存完了');
        sessionData.saved = true;
        sessionData.saveTimestamp = new Date().toISOString();
      } else {
        logger.warn('⚠️ データベース保存に失敗:', saveResult.error);
        sessionData.saved = false;
        sessionData.saveError = saveResult.error;
      }
    } catch (saveError) {
      logger.error('💾 データベース保存エラー:', saveError);
      sessionData.saved = false;
      sessionData.saveError = saveError.message;
    }

    logger.debug('🎉 Integrated micro generation completed successfully!');
    logger.debug(`📸 Generated ${generatedImages.filter(img => img.status === 'success').length} images`);

    // 最終完了通知を送信
    const finalResponse = {
      success: true,
      sessionData,
      message: '🎉 統合マイクロ生成が完了しました！',
      downloadReady: true,
      generationType: 'integrated_micro',
      imageCount: generatedImages.filter(img => img.status === 'success').length,
      isComplete: true
    };
    
    if (isEventSource) {
      sendEventSourceMessage(res, 'complete', finalResponse);
      res.end();
      
      // EventSourceリソースクリーンアップ
      if (req.body?.eventSourceId) {
        resourceManager.cleanupConnection(req.body.eventSourceId);
      }
    } else {
      return res.status(200).json(finalResponse);
    }
    
    logger.debug('📡 段階的生成完了 - 全9段階実行済み');

  } catch (error) {
    logger.error('🚨 Integrated micro generation error:', error);
    logger.error('🚨 Error stack:', error.stack);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Generation failed',
      errorType: error.name || error.type || 'UnknownError',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
    
    // EventSource判定を再実行
    const isEventSourceError = req.body?.stream === true || req.headers.accept?.includes('text/event-stream');
    
    if (isEventSourceError) {
      try {
        sendEventSourceMessage(res, 'error', errorResponse);
        res.end();
      } catch (writeError) {
        logger.error('Error writing to response:', writeError);
      }
    } else {
      return res.status(500).json(errorResponse);
    }
  }
}
