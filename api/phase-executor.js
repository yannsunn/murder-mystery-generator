/**
 * フェーズ別実行API - 完全分離型
 * 各フェーズを個別に実行し、手動で次のステップへ
 */

export const config = {
  maxDuration: 30, // 短時間制限
};

// フェーズ定義
const PHASES = {
  1: { name: 'コンセプト生成', endpoint: '/api/phase1-concept', maxTime: 25 },
  2: { name: 'キャラクター設定', endpoint: '/api/phase2-characters', maxTime: 25 },
  3: { name: '人物関係', endpoint: '/api/phase3-relationships', maxTime: 25 },
  4: { name: '事件詳細', endpoint: '/api/phase4-incident', maxTime: 25 },
  5: { name: '証拠・手がかり', endpoint: '/api/phase5-clues', maxTime: 25 },
  6: { name: 'タイムライン', endpoint: '/api/phase6-timeline', maxTime: 25 },
  7: { name: '真相解決', endpoint: '/api/phase7-solution', maxTime: 25 },
  8: { name: 'GMガイド', endpoint: '/api/phase8-gamemaster', maxTime: 25 }
};

/**
 * 単一フェーズ実行
 */
export async function executeSinglePhase(req, res) {
  const startTime = Date.now();
  
  try {
    const { phaseId, sessionId, formData } = req.body;
    
    if (!phaseId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'phaseIdとsessionIdが必要です'
      });
    }

    const phase = PHASES[phaseId];
    if (!phase) {
      return res.status(400).json({
        success: false,
        error: `無効なフェーズID: ${phaseId}`
      });
    }

    console.log(`🚀 Phase ${phaseId} 実行開始: ${phase.name}`);

    // 前のフェーズの結果を取得
    const previousResults = await getFromStorage(sessionId, req);
    
    // タイムアウト設定
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), phase.maxTime * 1000);

    try {
      const baseUrl = req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000';
      const response = await fetch(`${baseUrl}${phase.endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          previousPhases: previousResults?.phases || {}
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Phase ${phaseId} failed: ${response.status}`);
      }

      const phaseResult = await response.json();
      
      // 結果を保存
      const updatedResults = previousResults || {
        metadata: { ...formData, sessionId, createdAt: new Date().toISOString() },
        phases: {}
      };
      
      updatedResults.phases[`phase${phaseId}`] = phaseResult;
      updatedResults.lastPhase = phaseId;
      updatedResults.updatedAt = new Date().toISOString();
      
      await saveToStorage(sessionId, updatedResults, `phase${phaseId}`, req);

      // 次のフェーズ情報
      const nextPhaseId = parseInt(phaseId) + 1;
      const nextPhase = PHASES[nextPhaseId];

      return res.status(200).json({
        success: true,
        phaseId: parseInt(phaseId),
        phaseName: phase.name,
        sessionId,
        result: phaseResult,
        nextPhase: nextPhase ? {
          id: nextPhaseId,
          name: nextPhase.name
        } : null,
        isComplete: !nextPhase,
        progress: Math.round((parseInt(phaseId) / 8) * 100),
        processingTime: `${Date.now() - startTime}ms`
      });

    } catch (fetchError) {
      clearTimeout(timeout);
      
      if (fetchError.name === 'AbortError') {
        throw new Error(`Phase ${phaseId} timeout after ${phase.maxTime} seconds`);
      }
      throw fetchError;
    }

  } catch (error) {
    console.error(`Phase ${req.body.phaseId} error:`, error);
    return res.status(500).json({
      success: false,
      error: `Phase ${req.body.phaseId} エラー: ${error.message}`,
      processingTime: `${Date.now() - startTime}ms`
    });
  }
}

/**
 * フェーズ状況確認
 */
export async function getPhaseStatus(req, res) {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionIdが必要です'
      });
    }

    const results = await getFromStorage(sessionId, req);
    
    if (!results) {
      return res.status(404).json({
        success: false,
        error: 'セッションが見つかりません'
      });
    }

    // 完了フェーズの確認
    const completedPhases = Object.keys(results.phases || {}).map(key => 
      parseInt(key.replace('phase', ''))
    ).sort((a, b) => a - b);

    const lastCompletedPhase = Math.max(...completedPhases, 0);
    const nextPhaseId = lastCompletedPhase + 1;
    const nextPhase = PHASES[nextPhaseId];

    return res.status(200).json({
      success: true,
      sessionId,
      completedPhases,
      lastCompletedPhase,
      nextPhase: nextPhase ? {
        id: nextPhaseId,
        name: nextPhase.name
      } : null,
      isComplete: lastCompletedPhase >= 8,
      progress: Math.round((lastCompletedPhase / 8) * 100),
      totalPhases: 8
    });

  } catch (error) {
    console.error('Get phase status error:', error);
    return res.status(500).json({
      success: false,
      error: `状況確認エラー: ${error.message}`
    });
  }
}

/**
 * ストレージヘルパー関数
 */
async function saveToStorage(sessionId, data, phase, req) {
  const baseUrl = req ? (req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000') : 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/scenario-storage?action=save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId,
      scenario: data,
      phase
    })
  });
  
  if (!response.ok) {
    throw new Error('ストレージ保存エラー');
  }
}

async function getFromStorage(sessionId, req) {
  const baseUrl = req ? (req.headers.host ? `https://${req.headers.host}` : 'http://localhost:3000') : 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/scenario-storage?action=get&sessionId=${sessionId}`);
  
  if (!response.ok) {
    return null;
  }
  
  const result = await response.json();
  return result.scenario;
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

  const { action } = req.query;

  switch (action) {
    case 'execute':
      return executeSinglePhase(req, res);
    case 'status':
      return getPhaseStatus(req, res);
    default:
      return res.status(400).json({
        success: false,
        error: '無効なアクション'
      });
  }
}