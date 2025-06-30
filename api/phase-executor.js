/**
 * フェーズ別実行API - 完全分離型（Ultra Sync修正版）
 * 各フェーズを個別に実行し、手動で次のステップへ
 */

import './startup.js'; // 環境変数初期化
import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 30, // 短時間制限
};

// フェーズ定義（直接実行版）
const PHASES = {
  1: { 
    name: 'コンセプト生成', 
    handler: async (formData, previousPhases) => {
      const systemPrompt = `あなたは経験豊富なマーダーミステリー作家です。与えられた設定に基づいて、魅力的なコンセプトを生成してください。`;
      const userPrompt = `設定: ${JSON.stringify(formData, null, 2)}\n\n魅力的なマーダーミステリーのコンセプトを日本語で生成してください。`;
      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { concept: result.content };
    }
  },
  2: { 
    name: 'キャラクター設定',
    handler: async (formData, previousPhases) => {
      const concept = previousPhases?.phase1?.concept || '基本設定';
      const systemPrompt = `マーダーミステリーのキャラクター設定を作成する専門家として、魅力的なキャラクターを生成してください。`;
      const userPrompt = `コンセプト: ${concept}\n参加者数: ${formData.participants}\n\nキャラクター設定を生成してください。`;
      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { characters: result.content };
    }
  },
  3: { 
    name: '人物関係',
    handler: async (formData, previousPhases) => {
      const characters = previousPhases?.phase2?.characters || '';
      const systemPrompt = `キャラクター間の複雑な関係性を設計する専門家として、魅力的な人間関係を構築してください。`;
      const userPrompt = `キャラクター: ${characters}\n\n人物関係図を生成してください。`;
      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { relationships: result.content };
    }
  },
  4: { 
    name: '事件詳細',
    handler: async (formData, previousPhases) => {
      const characters = previousPhases?.phase2?.characters || '';
      const relationships = previousPhases?.phase3?.relationships || '';
      const systemPrompt = `事件の詳細を設計する専門家として、論理的で魅力的な事件を構築してください。`;
      const userPrompt = `キャラクター: ${characters}\n関係性: ${relationships}\n\n事件詳細を生成してください。`;
      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { incident: result.content };
    }
  },
  5: { 
    name: '証拠・手がかり',
    handler: async (formData, previousPhases) => {
      const incident = previousPhases?.phase4?.incident || '';
      const systemPrompt = `推理ゲームの証拠と手がかりを設計する専門家として、適切な難易度の証拠を生成してください。`;
      const userPrompt = `事件: ${incident}\n\n証拠・手がかりを生成してください。`;
      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { clues: result.content };
    }
  },
  6: { 
    name: 'タイムライン',
    handler: async (formData, previousPhases) => {
      const incident = previousPhases?.phase4?.incident || '';
      const clues = previousPhases?.phase5?.clues || '';
      const systemPrompt = `事件のタイムラインを詳細に構築する専門家として、論理的な時系列を作成してください。`;
      const userPrompt = `事件: ${incident}\n証拠: ${clues}\n\nタイムラインを生成してください。`;
      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { timeline: result.content };
    }
  },
  7: { 
    name: '真相解決',
    handler: async (formData, previousPhases) => {
      const allData = JSON.stringify(previousPhases, null, 2);
      const systemPrompt = `マーダーミステリーの解決編を作成する専門家として、すべての伏線を回収した完璧な解決を生成してください。`;
      const userPrompt = `全データ: ${allData}\n\n真相と解決を生成してください。`;
      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { solution: result.content };
    }
  },
  8: { 
    name: 'GMガイド',
    handler: async (formData, previousPhases) => {
      const allData = JSON.stringify(previousPhases, null, 2);
      const systemPrompt = `ゲームマスター向けのガイドを作成する専門家として、進行しやすい実用的なガイドを生成してください。`;
      const userPrompt = `全データ: ${allData}\n\nGMガイドを生成してください。`;
      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { gamemaster: result.content };
    }
  }
};

/**
 * 単一フェーズ実行（直接実行版）
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

  try {
    // 前のフェーズの結果を取得
    const previousResults = await getFromStorageOptimized(sessionId, req);
    
    // フェーズを直接実行
    const phaseResult = await phase.handler(formData, previousResults?.phases || {});
    
    // 結果を保存
    await saveResultsOptimized(sessionId, phaseResult, phaseId, formData, previousResults, req);
    
    // 次のフェーズ情報
    const nextPhaseId = parseInt(phaseId) + 1;
    const nextPhase = PHASES[nextPhaseId];
    
    // レスポンス送信
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
    
    return res.status(200).json(response);

  } catch (error) {
    console.error(`❌ Phase ${phaseId} 実行エラー:`, error);
    throw new AppError(
      `Phase ${phaseId} 実行失敗: ${error.message}`,
      ErrorTypes.GENERATION,
      500
    );
  }
}

/**
 * ベースURL取得ユーティリティ
 */
function getBaseUrl(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host || 'localhost:3000';
  return `${protocol}://${host}`;
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