/**
 * シナリオストレージAPI
 * 生成されたシナリオの一時保存と取得
 */

export const config = {
  maxDuration: 30,
};

// メモリ内ストレージ（本番環境ではRedis/DynamoDB等を使用）
const scenarioStorage = new Map();

// セッションタイムアウト（30分）
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * シナリオ保存エンドポイント
 */
export async function saveScenario(req, res) {
  try {
    const { sessionId, scenario, phase, isComplete } = req.body;
    
    if (!sessionId || !scenario) {
      return res.status(400).json({
        success: false,
        error: 'sessionIdとscenarioが必要です'
      });
    }

    // 既存のデータを取得または新規作成
    let storedData = scenarioStorage.get(sessionId) || {
      id: sessionId,
      createdAt: new Date().toISOString(),
      phases: {},
      metadata: {},
      isComplete: false
    };

    // フェーズ別に保存
    if (phase) {
      storedData.phases[phase] = scenario;
    } else {
      // 全体を保存
      storedData = {
        ...storedData,
        ...scenario,
        isComplete: isComplete || false
      };
    }

    storedData.updatedAt = new Date().toISOString();
    scenarioStorage.set(sessionId, storedData);

    // タイムアウト設定
    setTimeout(() => {
      scenarioStorage.delete(sessionId);
    }, SESSION_TIMEOUT);

    return res.status(200).json({
      success: true,
      sessionId,
      message: 'シナリオを保存しました',
      expiresAt: new Date(Date.now() + SESSION_TIMEOUT).toISOString()
    });

  } catch (error) {
    console.error('Save scenario error:', error);
    return res.status(500).json({
      success: false,
      error: `保存エラー: ${error.message}`
    });
  }
}

/**
 * シナリオ取得エンドポイント
 */
export async function getScenario(req, res) {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionIdが必要です'
      });
    }

    const storedData = scenarioStorage.get(sessionId);
    
    if (!storedData) {
      return res.status(404).json({
        success: false,
        error: 'シナリオが見つかりません'
      });
    }

    return res.status(200).json({
      success: true,
      scenario: storedData,
      remainingTime: SESSION_TIMEOUT - (Date.now() - new Date(storedData.createdAt).getTime())
    });

  } catch (error) {
    console.error('Get scenario error:', error);
    return res.status(500).json({
      success: false,
      error: `取得エラー: ${error.message}`
    });
  }
}

/**
 * セッション作成エンドポイント
 */
export async function createSession(req, res) {
  try {
    const sessionId = generateSessionId();
    const sessionData = {
      id: sessionId,
      createdAt: new Date().toISOString(),
      status: 'created',
      phases: {},
      metadata: req.body.metadata || {}
    };

    scenarioStorage.set(sessionId, sessionData);

    setTimeout(() => {
      scenarioStorage.delete(sessionId);
    }, SESSION_TIMEOUT);

    return res.status(200).json({
      success: true,
      sessionId,
      expiresAt: new Date(Date.now() + SESSION_TIMEOUT).toISOString()
    });

  } catch (error) {
    console.error('Create session error:', error);
    return res.status(500).json({
      success: false,
      error: `セッション作成エラー: ${error.message}`
    });
  }
}

/**
 * セッションID生成
 */
function generateSessionId() {
  return `mm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * ルーティング処理
 */
export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // エンドポイント振り分け
  const { action } = req.query;

  switch (action) {
    case 'create':
      return createSession(req, res);
    case 'save':
      return saveScenario(req, res);
    case 'get':
      return getScenario(req, res);
    default:
      return res.status(400).json({
        success: false,
        error: '無効なアクション'
      });
  }
}