/**
 * 🆓 Vercel無料プラン専用生成システム
 * 段階別Function分離によるマーダーミステリー生成
 */

// 環境変数の初期化を最初に実行
require('./init-env.js');

const { withSecurity } = require('./security-utils.js');
const { logger } = require('./utils/logger.js');

/**
 * 無料プラン対応の統合エンドポイント
 */
async function freePlanGenerator(req, res) {
  const startTime = Date.now();
  console.log('[FREE-PLAN-GENERATOR] Request received:', req.method, req.body?.action);

  try {
    // CORS設定
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { action, sessionId, stageIndex, formData, method } = req.method === 'GET' ? req.query : req.body;

    // ルーティング処理
    switch (action) {
      case 'start':
        return await startGeneration(req, res);
      
      case 'poll':
        return await pollProgress(req, res);
      
      case 'status':
        return await getStatus(req, res);
      
      case 'download':
        return await downloadResult(req, res);
      
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}`,
          availableActions: ['start', 'poll', 'status', 'download']
        });
    }

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error('[FREE-PLAN-GENERATOR] Error:', error);
    console.error('[FREE-PLAN-GENERATOR] Stack:', error.stack);
    logger.error(`Free Plan Generator Error [${executionTime}ms]:`, error);

    return res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      executionTime: executionTime,
      freePlanOptimized: true
    });
  }
}

/**
 * 生成開始
 */
async function startGeneration(req, res) {
  const { formData } = req.method === 'GET' ? req.query : req.body;
  
  let parsedFormData;
  try {
    parsedFormData = typeof formData === 'string' ? JSON.parse(formData) : formData;
  } catch (e) {
    return res.status(400).json({
      success: false,
      error: 'Invalid formData format'
    });
  }

  try {
    // Stage Controller経由でセッション初期化
    console.log('[START-GENERATION] Initializing session with formData:', parsedFormData);
    const initResponse = await callStageController({
      action: 'initialize',
      formData: parsedFormData
    });

    console.log('[START-GENERATION] initResponse:', JSON.stringify(initResponse, null, 2));
    
    if (!initResponse || !initResponse.success) {
      console.error('[START-GENERATION] Init failed:', initResponse);
      throw new Error('Session initialization failed: ' + (initResponse?.error || 'Unknown error'));
    }

    const sessionId = initResponse.sessionId;
    logger.info(`🚀 Free Plan Generation Started: ${sessionId}`);

    // 段階0を即座に開始
    let stage0Response;
    try {
      stage0Response = await callStageController({
        action: 'execute_stage',
        sessionId: sessionId,
        stageIndex: 0
      });
      
      console.log('[START-GENERATION] stage0Response:', stage0Response);
      
      // エラーレスポンスの詳細をログ出力
      if (!stage0Response.success && stage0Response.debug) {
        console.error('[START-GENERATION] Stage 0 failed with debug info:', stage0Response.debug);
        console.error('[START-GENERATION] API Key Status in Stage 0:', stage0Response.debug.apiKeyStatus);
      }
    } catch (stageError) {
      console.error('[START-GENERATION] Stage 0 execution error:', stageError);
      // より詳細なエラーメッセージを含める
      const errorMessage = stageError.message || 'Unknown error';
      if (errorMessage.includes('GROQ') || errorMessage.includes('API')) {
        throw new Error(`${errorMessage}\n\nPlease set GROQ_API_KEY in Vercel Dashboard: Settings → Environment Variables`);
      }
      throw stageError;
    }

    return res.status(200).json({
      success: true,
      message: 'Generation started on Free Plan',
      sessionId: sessionId,
      freePlanMode: true,
      totalStages: 9,
      currentStage: stage0Response.success ? 1 : 0,
      progress: stage0Response.success ? calculateProgress(1) : 0,
      estimatedTotalTime: '5-8 minutes',
      nextPollIn: 2000 // 2秒後にポーリング開始
    });

  } catch (error) {
    logger.error('Generation start failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Generation start failed: ' + error.message
    });
  }
}

/**
 * 進捗ポーリング
 */
async function pollProgress(req, res) {
  const { sessionId } = req.method === 'GET' ? req.query : req.body;
  
  console.log('[POLL-PROGRESS] Request for sessionId:', sessionId);

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'sessionId is required'
    });
  }

  try {
    // セッション状態取得
    const statusResponse = await callStageController({
      action: 'get_status',
      sessionId: sessionId
    });
    
    console.log('[POLL-PROGRESS] statusResponse:', statusResponse);

    if (!statusResponse.success) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const { currentStageIndex, totalStages, status, stages_completed } = statusResponse;

    // 完了チェック（強制完了も含む）
    if (status === 'completed' || currentStageIndex >= totalStages || 
        (currentStageIndex >= 8 && stages_completed && stages_completed.length >= 7)) {
      console.log('[POLL-PROGRESS] Generation completed, fetching final result');
      
      let finalResult;
      try {
        finalResult = await callStageController({
          action: 'get_result',
          sessionId: sessionId
        });
      } catch (error) {
        console.error('[POLL-PROGRESS] Failed to get final result:', error);
        // エラー時は失敗を返す
        return res.status(500).json({
          success: false,
          error: '最終結果の取得に失敗しました',
          sessionId: sessionId
        });
      }

      return res.status(200).json({
        success: true,
        sessionId: sessionId,
        status: 'completed',
        progress: 100,
        currentStage: totalStages,
        totalStages: totalStages,
        result: finalResult.scenario || finalResult,
        message: '生成が完了しました！',
        freePlanOptimized: true
      });
    }

    // 次の段階実行（実際は現在のインデックスのステージを実行）
    const stageToExecute = currentStageIndex < totalStages ? currentStageIndex : totalStages - 1;
    
    // 無限ループ防止: 同じステージが何度も実行されていないかチェック
    const maxRetries = 3;
    const stageRetryCount = (stages_completed || []).filter(s => s === stageToExecute).length;
    
    if (stageToExecute < totalStages && stageRetryCount < maxRetries) {
      console.log(`[POLL-PROGRESS] Executing stage ${stageToExecute} for session ${sessionId} (attempt ${stageRetryCount + 1})`);
      
      let stageResponse;
      try {
        stageResponse = await callStageController({
          action: 'execute_stage',
          sessionId: sessionId,
          stageIndex: stageToExecute
        });
        console.log(`[POLL-PROGRESS] Stage ${stageToExecute} execution result:`, stageResponse.success);
        
        // ステージ実行が失敗した場合
        if (!stageResponse.success) {
          console.error(`[POLL-PROGRESS] Stage ${stageToExecute} failed:`, stageResponse);
          if (stageResponse.debug) {
            console.error(`[POLL-PROGRESS] Debug info:`, stageResponse.debug);
            console.error(`[POLL-PROGRESS] API Key Status:`, stageResponse.debug.apiKeyStatus);
          }
          
          // エラーを返す
          return res.status(500).json({
            success: false,
            error: `Stage ${stageToExecute} execution failed: ${stageResponse.error || 'Unknown error'}`,
            sessionId: sessionId,
            currentStage: stageToExecute,
            debug: stageResponse.debug,
            help: 'Please ensure GROQ_API_KEY is set in Vercel Environment Variables. See: https://vercel.com/docs/environment-variables'
          });
        }
      } catch (error) {
        console.error(`[POLL-PROGRESS] Stage ${stageToExecute} execution error:`, error);
        
        // ステージ実行失敗
        return res.status(500).json({
          success: false,
          error: `ステージ${stageToExecute}の実行に失敗しました: ${error.message}`,
          sessionId: sessionId,
          currentStage: stageToExecute
        });
      }

      // ステージ実行後、最新のステータスを再取得
      let updatedStatus;
      try {
        updatedStatus = await callStageController({
          action: 'get_status',
          sessionId: sessionId
        });
      } catch (error) {
        console.error(`[POLL-PROGRESS] Status update failed:`, error);
        // ステータス取得失敗
        return res.status(500).json({
          success: false,
          error: 'ステータスの更新に失敗しました',
          sessionId: sessionId
        });
      }

      // 進行チェック
      let newCurrentStage = updatedStatus.currentStageIndex;
      if (newCurrentStage === currentStageIndex && stageRetryCount >= 2) {
        // 最大リトライ回数に達した
        return res.status(500).json({
          success: false,
          error: `ステージ${currentStageIndex}が進行しません。APIキーを確認してください。`,
          sessionId: sessionId,
          currentStage: currentStageIndex
        });
      }
      
      const newProgress = calculateProgress(newCurrentStage);
      
      return res.status(200).json({
        success: true,
        sessionId: sessionId,
        status: 'generating',
        progress: newProgress,
        currentStage: newCurrentStage,
        totalStages: totalStages,
        stageName: `段階${stageToExecute}`,
        stageResult: stageResponse.success,
        message: getStageMessage(stageToExecute),
        nextPollIn: getNextPollInterval(stageToExecute),
        freePlanOptimized: true
      });
    }

    // 進行中の場合（すでにステージが実行されている、または最大リトライ回数に達した）
    console.log(`[POLL-PROGRESS] Stage ${currentStageIndex} status:`);
    console.log(`[POLL-PROGRESS] - stageToExecute: ${stageToExecute}`);
    console.log(`[POLL-PROGRESS] - stageRetryCount: ${stageRetryCount}`);
    console.log(`[POLL-PROGRESS] - stages_completed:`, stages_completed);
    
    // 最大リトライ回数に達した場合はエラー
    if (stageRetryCount >= maxRetries) {
      console.error(`[POLL-PROGRESS] Max retries reached for stage ${stageToExecute}`);
      
      return res.status(500).json({
        success: false,
        error: `ステージ${stageToExecute}の最大リトライ回数に達しました。APIキーを確認してください。`,
        sessionId: sessionId,
        currentStage: stageToExecute
      });
    }
    
    return res.status(200).json({
      success: true,
      sessionId: sessionId,
      status: 'generating',
      progress: calculateProgress(currentStageIndex),
      currentStage: currentStageIndex,
      totalStages: totalStages,
      message: getStageMessage(currentStageIndex - 1) || 'シナリオ生成中...',
      nextPollIn: 3000,
      freePlanOptimized: true
    });

  } catch (error) {
    logger.error('Poll progress failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Poll failed: ' + error.message
    });
  }
}

/**
 * ステータス取得
 */
async function getStatus(req, res) {
  const { sessionId } = req.method === 'GET' ? req.query : req.body;

  try {
    const statusResponse = await callStageController({
      action: 'get_status',
      sessionId: sessionId
    });

    return res.status(200).json({
      ...statusResponse,
      freePlanOptimized: true
    });

  } catch (error) {
    logger.error('Status retrieval failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Status retrieval failed: ' + error.message
    });
  }
}

/**
 * 結果ダウンロード
 */
async function downloadResult(req, res) {
  const { sessionId } = req.method === 'GET' ? req.query : req.body;

  try {
    const resultResponse = await callStageController({
      action: 'get_result',
      sessionId: sessionId
    });

    if (!resultResponse.success) {
      return res.status(404).json({
        success: false,
        error: 'Result not found or generation not completed'
      });
    }

    return res.status(200).json({
      success: true,
      sessionId: sessionId,
      scenario: resultResponse.scenario,
      downloadReady: true,
      freePlanOptimized: true
    });

  } catch (error) {
    logger.error('Download failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Download failed: ' + error.message
    });
  }
}

/**
 * ヘルパー関数群
 */

async function callStageController(payload) {
  try {
    console.log('[CALL-STAGE-CONTROLLER] Calling with action:', payload.action, 'sessionId:', payload.sessionId);
    
    // Stage Controller の直接関数を使用（セキュリティラップをバイパス）
    const { stageControllerDirect } = require('./stage-controller.js');
    
    const mockReq = {
      method: 'POST',
      body: payload
    };
    
    let result = null;
    let responsePromiseResolve;
    
    // Promiseを使って非同期にレスポンスを待つ
    const responsePromise = new Promise((resolve) => {
      responsePromiseResolve = resolve;
    });
    
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          result = { statusCode: code, ...data };
          console.log('[CALL-STAGE-CONTROLLER] Response:', code, data.success ? 'SUCCESS' : 'FAIL');
          if (!data.success) {
            console.error('[CALL-STAGE-CONTROLLER] Error response data:', JSON.stringify(data, null, 2));
          }
          responsePromiseResolve(result);
          return result;
        }
      })
    };

    // 非同期で実行
    stageControllerDirect(mockReq, mockRes);
    
    // レスポンスを待つ（タイムアウト付き）
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Stage controller timeout')), 10000)
    );
    
    result = await Promise.race([responsePromise, timeoutPromise]);
    
    if (!result) {
      throw new Error('No response from stage controller');
    }
    
    return result;
  } catch (error) {
    console.error('[CALL-STAGE-CONTROLLER] Error:', error);
    throw error;
  }
}

function calculateProgress(currentStage) {
  const stageWeights = [15, 10, 12, 13, 35, 18, 8, 5, 4];
  const totalWeight = stageWeights.reduce((sum, weight) => sum + weight, 0);
  
  let completedWeight = 0;
  for (let i = 0; i < currentStage; i++) {
    completedWeight += stageWeights[i] || 10;
  }
  
  return Math.round((completedWeight / totalWeight) * 100);
}

function getStageMessage(stageIndex) {
  const messages = [
    '基本構想を生成中...',
    'コンセプトを詳細化中...',
    '事件の核心を設定中...',
    '状況を詳細化中...',
    'キャラクターを生成中...',
    '証拠を配置中...',
    'GM進行を設計中...',
    '品質を確認中...',
    '最終調整中...'
  ];
  
  return messages[stageIndex] || '処理中...';
}

function getNextPollInterval(stageIndex) {
  // 段階4（キャラクター生成）は時間がかかるため少し長めに
  if (stageIndex === 4) {
    return 4000; // 4秒
  } else if (stageIndex >= 6) {
    return 2000; // 2秒（後半は高速）
  } else {
    return 3000; // 3秒（標準）
  }
}

module.exports = withSecurity(freePlanGenerator, 'free-plan-generation');