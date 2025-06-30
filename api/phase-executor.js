/**
 * フェーズ別実行API - 完全分離型
 * 各フェーズを個別に実行し、手動で次のステップへ
 */

import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

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
 * 単一フェーズ実行（最適化版）
 */
export async function executeSinglePhase(req, res) {
  const startTime = Date.now();
  
  // バリデーション
  const { phaseId, sessionId, formData } = req.body;
  
  if (!phaseId || !sessionId) {
    throw new AppError(
      'phaseIdとsessionIdが必要です',
      ErrorTypes.VALIDATION,
      400
    );
  }

  const phase = PHASES[phaseId];
  if (!phase) {
    throw new AppError(
      `無効なフェーズID: ${phaseId}`,
      ErrorTypes.VALIDATION,
      400
    );
  }

  console.log(`🚀 Phase ${phaseId} 実行開始: ${phase.name}`);

  // 前のフェーズの結果を並列で取得
  const [previousResults] = await Promise.all([
    getFromStorageOptimized(sessionId, req)
  ]);
  
  // 並列でフェーズ実行とタイムアウト管理
  const phaseResult = await executePhaseWithTimeout(phase, formData, previousResults, req);
  
  // 結果の非同期保存（レスポンス速度向上）
  const savePromise = saveResultsOptimized(sessionId, phaseResult, phaseId, formData, previousResults, req);
  
  // 次のフェーズ情報
  const nextPhaseId = parseInt(phaseId) + 1;
  const nextPhase = PHASES[nextPhaseId];
  
  // レスポンス送信（保存完了を待たない）
  const response = {
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
    executionTime: Date.now() - startTime,
    timestamp: new Date().toISOString()
  };
  
  // 保存完了を確認（エラーのみログ）
  savePromise.catch(error => {
    console.error(`🚨 Phase ${phaseId} 保存エラー:`, error);
  });
  
  return res.status(200).json(response);
}

/**
 * 最適化されたフェーズ実行
 */
async function executePhaseWithTimeout(phase, formData, previousResults, req) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), phase.maxTime * 1000);

  try {
    // 並列でベースURL取得と内部API呼び出し
    const baseUrl = getBaseUrl(req);
    
    const response = await fetch(`${baseUrl}${phase.endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Phase-Executor/1.0'
      },
      body: JSON.stringify({
        ...formData,
        previousPhases: previousResults?.phases || {}
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new AppError(
        `Phase ${phase.name} failed: ${response.status} - ${errorText}`,
        ErrorTypes.API,
        response.status
      );
    }

    return await response.json();

  } catch (error) {
    if (error.name === 'AbortError') {
      throw new AppError(
        `Phase ${phase.name} タイムアウト (${phase.maxTime}秒)`,
        ErrorTypes.TIMEOUT,
        504
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 最適化されたストレージ取得
 */
async function getFromStorageOptimized(sessionId, req) {
  try {
    const baseUrl = getBaseUrl(req);
    const response = await fetch(`${baseUrl}/api/scenario-storage?action=get&sessionId=${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Phase-Executor/1.0'
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.success ? data.scenario : null;
    }
    
    return null;
  } catch (error) {
    console.warn('Storage取得エラー:', error.message);
    return null;
  }
}

/**
 * 最適化された結果保存
 */
async function saveResultsOptimized(sessionId, phaseResult, phaseId, formData, previousResults, req) {
  const updatedResults = previousResults || {
    metadata: { ...formData, sessionId, createdAt: new Date().toISOString() },
    phases: {}
  };
  
  updatedResults.phases[`phase${phaseId}`] = phaseResult;
  updatedResults.lastPhase = phaseId;
  updatedResults.updatedAt = new Date().toISOString();
  
  const baseUrl = getBaseUrl(req);
  
  const response = await fetch(`${baseUrl}/api/scenario-storage?action=save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Phase-Executor/1.0'
    },
    body: JSON.stringify({
      sessionId,
      scenario: updatedResults,
      phase: `phase${phaseId}`,
      isComplete: phaseId == 8
    })
  });

  if (!response.ok) {
    throw new AppError(
      'ストレージ保存エラー',
      ErrorTypes.STORAGE,
      500
    );
  }
  
  return response.json();
}

/**
 * ベースURL取得
 */
function getBaseUrl(req) {
  return req.headers.host ? 
    `https://${req.headers.host}` : 
    'http://localhost:3000';
}

/**
 * フェーズ一覧取得
 */
export async function getPhaseList(req, res) {
  const phaseList = Object.entries(PHASES).map(([id, phase]) => ({
    id: parseInt(id),
    name: phase.name,
    maxTime: phase.maxTime,
    endpoint: phase.endpoint
  }));

  return res.status(200).json({
    success: true,
    phases: phaseList,
    totalPhases: Object.keys(PHASES).length
  });
}

/**
 * フェーズ状況確認（最適化版）
 */
export async function getPhaseStatus(req, res) {
  const { sessionId } = req.query;
  
  if (!sessionId) {
    throw new AppError(
      'sessionIdが必要です',
      ErrorTypes.VALIDATION,
      400
    );
  }

  const results = await getFromStorageOptimized(sessionId, req);
  
  if (!results) {
    throw new AppError(
      'セッションが見つかりません',
      ErrorTypes.STORAGE,
      404
    );
  }

  const completedPhases = Object.keys(results.phases || {}).length;
  const progress = Math.round((completedPhases / 8) * 100);

  return res.status(200).json({
    success: true,
    sessionId,
    completedPhases,
    totalPhases: 8,
    progress,
    lastPhase: results.lastPhase || 0,
    isComplete: completedPhases === 8,
    metadata: results.metadata,
    timestamp: new Date().toISOString()
  });
}

/**
 * メインハンドラー（統一エラーハンドリング付き）
 */
export default withErrorHandler(async (req, res) => {
  // セキュリティヘッダー設定
  setSecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  switch (action) {
    case 'execute':
      return await executeSinglePhase(req, res);
    case 'status':
      return await getPhaseStatus(req, res);
    case 'list':
      return await getPhaseList(req, res);
    default:
      throw new AppError(
        '無効なアクション',
        ErrorTypes.VALIDATION,
        400
      );
  }
}, 'phase-executor');