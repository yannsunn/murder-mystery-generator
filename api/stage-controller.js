/**
 * 🎯 段階別Function制御システム
 * Vercel無料プラン対応（10秒制限）- セッション管理・進行制御
 */

const { withSecurity } = require('./security-utils.js');
const { logger } = require('./utils/logger.js');
const { saveScenarioToSupabase, getScenarioFromSupabase } = require('./supabase-client.js');

// メモリストレージ（Supabase未設定時のフォールバック）
const memoryStorage = new Map();

/**
 * セッションデータを保存（Supabaseまたはメモリ）
 */
async function saveSessionData(sessionId, data) {
  try {
    const result = await saveScenarioToSupabase(sessionId, data);
    if (!result || !result.success) {
      throw new Error('Supabase save failed');
    }
  } catch (error) {
    logger.warn(`⚠️ Using memory storage for session ${sessionId}`);
    memoryStorage.set(sessionId, data);
  }
}

/**
 * セッションデータを取得（Supabaseまたはメモリ）
 */
async function getSessionData(sessionId) {
  try {
    const result = await getScenarioFromSupabase(sessionId);
    if (result && result.success && result.data) {
      return result.data.scenario_data || result.data;
    }
  } catch (error) {
    logger.warn(`⚠️ Supabase read failed, checking memory for ${sessionId}`);
  }
  
  // メモリから取得
  return memoryStorage.get(sessionId);
}

/**
 * 段階制御の核となるハンドラー
 */
async function stageController(req, res) {
  const startTime = Date.now();

  try {
    const { action, sessionId, stageIndex, formData } = req.body;

    switch (action) {
      case 'initialize':
        return await initializeSession(req, res);
      
      case 'get_status':
        return await getSessionStatus(req, res);
      
      case 'execute_stage':
        return await executeStage(req, res);
      
      case 'get_result':
        return await getFinalResult(req, res);
      
      case 'cleanup':
        return await cleanupSession(req, res);
      
      case 'force_advance':
        return await forceAdvanceStage(req, res);
      
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`
        });
    }

  } catch (error) {
    const executionTime = Date.now() - startTime;
    logger.error(`Stage Controller Error [${executionTime}ms]:`, error);

    return res.status(500).json({
      success: false,
      error: error.message,
      executionTime: executionTime
    });
  }
}

/**
 * セッション初期化
 */
async function initializeSession(req, res) {
  const { formData } = req.body;
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  const sessionData = {
    sessionId: sessionId,
    formData: formData,
    currentStageIndex: 0,
    totalStages: 9,
    status: 'initialized',
    createdAt: new Date().toISOString(),
    lastUpdate: new Date().toISOString(),
    stages_completed: [],
    free_plan_optimized: true,
    // APIキーを最上位レベルにも保存
    apiKey: formData.apiKey || null
  };

  try {
    // セッションデータを保存
    await saveSessionData(sessionId, sessionData);
    logger.info(`✅ Session initialized: ${sessionId}`);

    return res.status(200).json({
      success: true,
      sessionId: sessionId,
      status: 'initialized',
      totalStages: 9,
      currentStage: 0,
      nextAction: 'execute_stage',
      nextStageIndex: 0
    });

  } catch (error) {
    logger.error('Session initialization failed:', error);
    return res.status(500).json({
      success: false,
      error: 'セッション初期化に失敗しました'
    });
  }
}

/**
 * セッション状態取得
 */
async function getSessionStatus(req, res) {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'sessionIdが必要です'
    });
  }

  try {
    const sessionData = await getSessionData(sessionId);
    
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        error: 'セッションが見つかりません'
      });
    }

    const progress = calculateProgress(sessionData.currentStageIndex, sessionData.totalStages);

    return res.status(200).json({
      success: true,
      sessionId: sessionId,
      status: sessionData.status,
      currentStageIndex: sessionData.currentStageIndex,
      totalStages: sessionData.totalStages,
      progress: progress,
      stages_completed: sessionData.stages_completed || [],
      lastUpdate: sessionData.lastUpdate,
      nextAction: getNextAction(sessionData)
    });

  } catch (error) {
    logger.error('Status retrieval failed:', error);
    return res.status(500).json({
      success: false,
      error: 'ステータス取得に失敗しました'
    });
  }
}

/**
 * 段階実行
 */
async function executeStage(req, res) {
  const { sessionId, stageIndex } = req.body;

  if (!sessionId || stageIndex === undefined) {
    return res.status(400).json({
      success: false,
      error: 'sessionIdとstageIndexが必要です'
    });
  }

  try {
    // セッションデータ取得
    const sessionData = await getSessionData(sessionId);
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        error: 'セッションが見つかりません'
      });
    }

    // 段階実行準備（APIキーを確実に含める）
    const stageUrl = getStageUrl(stageIndex);
    const stagePayload = {
      sessionId: sessionId,
      stageIndex: stageIndex,
      ...sessionData,
      // APIキーが複数の場所にある可能性があるため確実に渡す
      apiKey: sessionData.apiKey || sessionData.formData?.apiKey || null
    };

    logger.info(`🎯 Executing stage ${stageIndex} for session ${sessionId}`);

    // 段階Function呼び出し（内部API呼び出し）
    const stageResponse = await callStageFunction(stageUrl, stagePayload);

    if (!stageResponse.success) {
      console.error(`[STAGE-CONTROLLER] Stage ${stageIndex} failed:`, stageResponse);
      const errorMessage = typeof stageResponse.error === 'object' 
        ? JSON.stringify(stageResponse.error) 
        : stageResponse.error || 'Unknown error';
      
      // エラーの詳細情報を返す
      const errorDetails = {
        stage: stageIndex,
        error: errorMessage,
        debug: stageResponse.debug || {},
        timestamp: new Date().toISOString()
      };
      
      throw new Error(`Stage ${stageIndex} execution failed: ${errorMessage}`);
    }

    // セッションデータを更新
    sessionData.currentStageIndex = stageIndex + 1;
    sessionData.stages_completed = sessionData.stages_completed || [];
    if (!sessionData.stages_completed.includes(stageIndex)) {
      sessionData.stages_completed.push(stageIndex);
    }
    sessionData[`stage${stageIndex}_result`] = stageResponse.result;
    sessionData.lastUpdate = new Date().toISOString();
    
    // 全ステージ完了チェック
    if (stageIndex >= 8) {
      sessionData.status = 'completed';
      sessionData.scenario_completed = true;
      sessionData.completion_timestamp = new Date().toISOString();
    } else {
      sessionData.status = 'generating';
    }
    
    // 更新したセッションデータを保存
    await saveSessionData(sessionId, sessionData);
    logger.info(`✅ Stage ${stageIndex} completed and session updated for ${sessionId}`);

    // 進捗計算
    const progress = calculateProgress(stageIndex + 1, sessionData.totalStages);

    return res.status(200).json({
      success: true,
      sessionId: sessionId,
      stageIndex: stageIndex,
      stageName: `stage${stageIndex}`,
      result: stageResponse.result,
      progress: progress,
      executionTime: stageResponse.executionTime,
      nextAction: getNextActionForStage(stageIndex + 1),
      completed: stageIndex >= 8
    });

  } catch (error) {
    logger.error(`Stage ${stageIndex} execution failed:`, error);
    console.error(`[EXECUTE-STAGE] Full error for stage ${stageIndex}:`, {
      message: error.message,
      stack: error.stack,
      type: error.constructor.name
    });
    
    // エラーメッセージを適切に文字列化
    const errorMessage = typeof error === 'object' && error.message 
      ? error.message 
      : String(error);
    
    return res.status(500).json({
      success: false,
      error: `Stage ${stageIndex} execution failed: ${errorMessage}`,
      stageIndex: stageIndex,
      debug: {
        errorType: error.constructor.name,
        errorStack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      }
    });
  }
}

/**
 * 最終結果取得
 */
async function getFinalResult(req, res) {
  const { sessionId } = req.body;

  try {
    const sessionData = await getSessionData(sessionId);
    
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        error: 'セッションが見つかりません'
      });
    }

    if (!sessionData.scenario_completed) {
      return res.status(400).json({
        success: false,
        error: 'シナリオ生成が完了していません'
      });
    }

    return res.status(200).json({
      success: true,
      sessionId: sessionId,
      scenario: formatFinalScenario(sessionData),
      completed: true,
      completedAt: sessionData.completion_timestamp
    });

  } catch (error) {
    logger.error('Final result retrieval failed:', error);
    return res.status(500).json({
      success: false,
      error: '最終結果取得に失敗しました'
    });
  }
}

/**
 * セッションクリーンアップ
 */
async function cleanupSession(req, res) {
  const { sessionId } = req.body;

  try {
    // セッションデータの削除は実装に応じて
    logger.info(`🧹 Session cleanup: ${sessionId}`);

    return res.status(200).json({
      success: true,
      message: 'セッションをクリーンアップしました'
    });

  } catch (error) {
    logger.error('Session cleanup failed:', error);
    return res.status(500).json({
      success: false,
      error: 'クリーンアップに失敗しました'
    });
  }
}

/**
 * 強制的にステージを進める
 */
async function forceAdvanceStage(req, res) {
  const { sessionId, targetStage } = req.body;

  try {
    const sessionData = await getSessionData(sessionId);
    if (!sessionData) {
      return res.status(404).json({
        success: false,
        error: 'セッションが見つかりません'
      });
    }

    // 強制的にステージを進める
    sessionData.currentStageIndex = targetStage;
    sessionData.status = targetStage >= 9 ? 'completed' : 'generating';
    sessionData.lastUpdate = new Date().toISOString();
    
    // 強制進行は行わない - エラーを返す
    if (!sessionData[`stage${targetStage - 1}_result`]) {
      return res.status(400).json({
        success: false,
        error: `ステージ${targetStage - 1}のデータが存在しません`,
        sessionId: sessionId
      });
    }

    await saveSessionData(sessionId, sessionData);
    logger.warn(`⚠️ Force advanced session ${sessionId} to stage ${targetStage}`);

    return res.status(200).json({
      success: true,
      sessionId: sessionId,
      currentStageIndex: targetStage,
      message: `強制的にステージ${targetStage}へ進めました`
    });

  } catch (error) {
    logger.error('Force advance failed:', error);
    return res.status(500).json({
      success: false,
      error: '強制進行に失敗しました'
    });
  }
}

/**
 * ヘルパー関数群
 */

function getStageUrl(stageIndex) {
  return `/api/stage-generator/stage${stageIndex}`;
}

async function callStageFunction(url, payload) {
  try {
    // 内部API呼び出しの実装
    // 実際の環境では fetch または直接関数呼び出し
    logger.info(`📞 Calling stage${payload.stageIndex} function`);
    const stageModule = require(`./stage-generator/stage${payload.stageIndex}.js`);
    
    // モックリクエスト・レスポンスオブジェクト作成
    const mockReq = {
      method: 'POST',
      body: payload
    };
    
    let result = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          result = { statusCode: code, ...data };
          return result;
        }
      })
    };

    await stageModule(mockReq, mockRes);
    
    if (!result) {
      throw new Error('No response from stage function');
    }
    
    logger.info(`✅ Stage${payload.stageIndex} completed with status: ${result.statusCode}`);
    return result;
  } catch (error) {
    logger.error(`❌ Stage${payload.stageIndex} function error:`, error);
    console.error(`[CALL-STAGE-FUNCTION] Full error details:`, {
      stage: payload.stageIndex,
      error: error.message,
      stack: error.stack,
      payload: {
        sessionId: payload.sessionId,
        hasApiKey: !!payload.apiKey
      }
    });
    
    // エラーをより詳細な形式で返す
    return {
      success: false,
      error: error.message || 'Unknown error',
      debug: {
        stage: payload.stageIndex,
        errorType: error.constructor.name,
        hasApiKey: !!payload.apiKey,
        timestamp: new Date().toISOString()
      }
    };
  }
}

function calculateProgress(currentStage, totalStages) {
  const stageWeights = [15, 10, 12, 13, 35, 18, 8, 5, 4];
  const totalWeight = stageWeights.reduce((sum, weight) => sum + weight, 0);
  
  let completedWeight = 0;
  for (let i = 0; i < currentStage; i++) {
    completedWeight += stageWeights[i] || 10;
  }
  
  return Math.round((completedWeight / totalWeight) * 100);
}

function getNextAction(sessionData) {
  if (sessionData.scenario_completed) {
    return 'get_result';
  } else if (sessionData.currentStageIndex < sessionData.totalStages) {
    return 'execute_stage';
  } else {
    return 'finalize';
  }
}

function getNextActionForStage(nextStageIndex) {
  if (nextStageIndex >= 9) {
    return 'get_result';
  } else {
    return 'execute_stage';
  }
}

function formatFinalScenario(sessionData) {
  // 各ステージの結果を取得
  const getStageContent = (stageName, fallbackContent) => {
    const stageResult = sessionData[`${stageName}_result`];
    if (stageResult) {
      return typeof stageResult === 'object' ? stageResult.content : stageResult;
    }
    return sessionData[stageName] || fallbackContent || '';
  };

  return {
    title: extractTitle(sessionData.random_outline || sessionData.stage0_result?.content),
    outline: getStageContent('stage0', null),
    concept: getStageContent('stage1', null),
    incident: getStageContent('stage2', null),
    details: getStageContent('stage3', null),
    characters: getStageContent('stage4', null),
    evidence: getStageContent('stage5', null),
    gmGuide: getStageContent('stage6', null),
    integration: getStageContent('stage7', null),
    qualityCheck: getStageContent('stage8', null),
    completedAt: sessionData.completion_timestamp || new Date().toISOString(),
    isGeneratedByAI: true
  };
}

function extractTitle(outline) {
  if (!outline) return 'マーダーミステリー';
  const match = outline.match(/タイトル[:：]?\s*(.+)|title[:：]?\s*(.+)/i);
  return match ? (match[1] || match[2]).trim() : 'マーダーミステリー';
}

function getNextActionForStage(nextStageIndex) {
  if (nextStageIndex >= 9) {
    return 'complete';
  }
  return `execute_stage_${nextStageIndex}`;
}


// 内部呼び出し用に生の関数もエクスポート
module.exports = withSecurity(stageController, 'stage-control');
module.exports.stageControllerDirect = stageController; // セキュリティラップなし版