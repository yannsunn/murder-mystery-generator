/**
 * 🆓 Vercel無料プラン専用生成システム
 * 段階別Function分離によるマーダーミステリー生成
 */

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
    const initResponse = await callStageController({
      action: 'initialize',
      formData: parsedFormData
    });

    if (!initResponse.success) {
      throw new Error('Session initialization failed');
    }

    const sessionId = initResponse.sessionId;
    logger.info(`🚀 Free Plan Generation Started: ${sessionId}`);

    // 段階0を即座に開始
    const stage0Response = await callStageController({
      action: 'execute_stage',
      sessionId: sessionId,
      stageIndex: 0
    });

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

    if (!statusResponse.success) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    const { currentStageIndex, totalStages, status, stages_completed } = statusResponse;

    // 完了チェック
    if (status === 'completed' || currentStageIndex >= totalStages) {
      const finalResult = await callStageController({
        action: 'get_result',
        sessionId: sessionId
      });

      return res.status(200).json({
        success: true,
        sessionId: sessionId,
        status: 'completed',
        progress: 100,
        currentStage: totalStages,
        totalStages: totalStages,
        result: finalResult.success ? finalResult.scenario : null,
        message: 'Generation completed successfully!',
        freePlanOptimized: true
      });
    }

    // 次の段階実行
    if (currentStageIndex < totalStages && !stages_completed.includes(currentStageIndex)) {
      const stageResponse = await callStageController({
        action: 'execute_stage',
        sessionId: sessionId,
        stageIndex: currentStageIndex
      });

      const newProgress = calculateProgress(currentStageIndex + 1);
      
      return res.status(200).json({
        success: true,
        sessionId: sessionId,
        status: 'generating',
        progress: newProgress,
        currentStage: currentStageIndex + 1,
        totalStages: totalStages,
        stageName: `段階${currentStageIndex}`,
        stageResult: stageResponse.success,
        message: getStageMessage(currentStageIndex),
        nextPollIn: getNextPollInterval(currentStageIndex),
        freePlanOptimized: true
      });
    }

    // 進行中の場合
    return res.status(200).json({
      success: true,
      sessionId: sessionId,
      status: 'processing',
      progress: calculateProgress(currentStageIndex),
      currentStage: currentStageIndex,
      totalStages: totalStages,
      message: 'Processing...',
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
    // Stage Controller の直接関数を使用（セキュリティラップをバイパス）
    const { stageControllerDirect } = require('./stage-controller.js');
    
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

    await stageControllerDirect(mockReq, mockRes);
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