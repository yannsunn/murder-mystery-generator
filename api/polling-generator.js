/**
 * Polling方式の生成API
 * VercelのServerless Functions制限を回避
 */

const { envManager } = require('./config/env-manager.js');
const { aiClient } = require('./utils/ai-client.js');
const { logger } = require('./utils/logger.js');
const { INTEGRATED_GENERATION_FLOW } = require('./core/generation-stages.js');

// セッション状態を保存（本番環境ではRedis等を使用すべき）
const sessions = new Map();

// セッションクリーンアップ（30分後）
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastUpdate > 30 * 60 * 1000) {
      sessions.delete(sessionId);
    }
  }
}, 5 * 60 * 1000); // 5分ごとにチェック

module.exports = async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, sessionId, formData } = req.body || req.query || {};

  try {
    switch (action) {
      case 'start':
        return handleStart(sessionId, formData, res);
      
      case 'poll':
        return handlePoll(sessionId, res);
      
      case 'cancel':
        return handleCancel(sessionId, res);
      
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action'
        });
    }
  } catch (error) {
    logger.error('Polling API error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * 生成開始
 */
async function handleStart(sessionId, formData, res) {
  if (!sessionId || !formData) {
    return res.status(400).json({
      success: false,
      error: 'Missing sessionId or formData'
    });
  }

  // 既存セッションチェック
  if (sessions.has(sessionId)) {
    return res.status(409).json({
      success: false,
      error: 'Session already exists'
    });
  }

  // セッション作成
  const session = {
    id: sessionId,
    formData: typeof formData === 'string' ? JSON.parse(formData) : formData,
    status: 'starting',
    progress: 0,
    currentStep: 0,
    totalSteps: INTEGRATED_GENERATION_FLOW.length,
    messages: [],
    result: null,
    error: null,
    startTime: Date.now(),
    lastUpdate: Date.now()
  };

  sessions.set(sessionId, session);

  // 非同期で生成処理を開始
  processGeneration(session).catch(error => {
    session.status = 'error';
    session.error = error.message;
    logger.error('Generation process error:', error);
  });

  return res.status(200).json({
    success: true,
    sessionId: sessionId,
    status: 'started',
    message: 'Generation process started'
  });
}

/**
 * 状態ポーリング
 */
async function handlePoll(sessionId, res) {
  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'Missing sessionId'
    });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  // 最新の状態を返す
  const response = {
    success: true,
    sessionId: sessionId,
    status: session.status,
    progress: session.progress,
    currentStep: session.currentStep,
    totalSteps: session.totalSteps,
    messages: session.messages.slice(-10), // 最新10件のメッセージ
    elapsedTime: Date.now() - session.startTime
  };

  // 完了または エラーの場合は結果も含める
  if (session.status === 'completed') {
    response.result = session.result;
    // セッションをクリーンアップ（5分後）
    setTimeout(() => sessions.delete(sessionId), 5 * 60 * 1000);
  } else if (session.status === 'error') {
    response.error = session.error;
  }

  return res.status(200).json(response);
}

/**
 * キャンセル処理
 */
async function handleCancel(sessionId, res) {
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found'
    });
  }

  session.status = 'cancelled';
  sessions.delete(sessionId);

  return res.status(200).json({
    success: true,
    message: 'Generation cancelled'
  });
}

/**
 * 生成処理の実行
 */
async function processGeneration(session) {
  session.status = 'processing';
  const accumulatedData = { formData: session.formData };

  try {
    // 各ステージを順番に実行
    for (let i = 0; i < INTEGRATED_GENERATION_FLOW.length; i++) {
      const stage = INTEGRATED_GENERATION_FLOW[i];
      
      // キャンセルチェック
      if (session.status === 'cancelled') {
        break;
      }

      session.currentStep = i + 1;
      session.progress = Math.round((i / INTEGRATED_GENERATION_FLOW.length) * 100);
      session.messages.push({
        timestamp: new Date().toISOString(),
        step: stage.name,
        message: `${stage.name}を処理中...`
      });
      session.lastUpdate = Date.now();

      logger.info(`[Session ${session.id}] Processing stage: ${stage.name}`);

      try {
        const result = await stage.handler(accumulatedData);
        accumulatedData = { ...accumulatedData, ...result };
        
        session.messages.push({
          timestamp: new Date().toISOString(),
          step: stage.name,
          message: `${stage.name}が完了しました`
        });
      } catch (stageError) {
        logger.error(`Stage ${stage.name} failed:`, stageError);
        throw stageError;
      }
    }

    // 生成完了
    session.status = 'completed';
    session.progress = 100;
    session.result = accumulatedData;
    session.messages.push({
      timestamp: new Date().toISOString(),
      message: 'すべての生成処理が完了しました！'
    });

  } catch (error) {
    session.status = 'error';
    session.error = error.message;
    session.messages.push({
      timestamp: new Date().toISOString(),
      message: `エラーが発生しました: ${error.message}`,
      type: 'error'
    });
    throw error;
  }
}