/**
 * シナリオストレージAPI
 * 生成されたシナリオの一時保存と取得
 */

import { envManager } from './config/env-manager.js';
import { setSecurityHeaders } from './security-utils.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';

export const config = {
  maxDuration: 30,
};

// メモリ内ストレージ（本番環境ではRedis/DynamoDB等を使用）
const scenarioStorage = new Map();
const timeoutHandlers = new Map(); // タイムアウトハンドラを管理

// セッションタイムアウト（30分）
const SESSION_TIMEOUT = 30 * 60 * 1000;
const MAX_STORAGE_SIZE = envManager.get('MAX_STORAGE_SIZE') || 1000;

// 定期的なクリーンアップ（5分毎）
setInterval(() => {
  cleanupExpiredSessions();
}, 5 * 60 * 1000);

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

    // 既存のタイムアウトをクリア
    if (timeoutHandlers.has(sessionId)) {
      clearTimeout(timeoutHandlers.get(sessionId));
    }

    // 新しいタイムアウト設定
    const timeoutId = setTimeout(() => {
      scenarioStorage.delete(sessionId);
      timeoutHandlers.delete(sessionId);
    }, SESSION_TIMEOUT);
    
    timeoutHandlers.set(sessionId, timeoutId);

    // ストレージサイズ制限チェック
    if (scenarioStorage.size > MAX_STORAGE_SIZE) {
      cleanupOldestSessions();
    }

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

    // タイムアウト設定
    const timeoutId = setTimeout(() => {
      scenarioStorage.delete(sessionId);
      timeoutHandlers.delete(sessionId);
    }, SESSION_TIMEOUT);
    
    timeoutHandlers.set(sessionId, timeoutId);

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
 * 期限切れセッションのクリーンアップ
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, data] of scenarioStorage.entries()) {
    const createdAt = new Date(data.createdAt).getTime();
    if (now - createdAt > SESSION_TIMEOUT) {
      scenarioStorage.delete(sessionId);
      if (timeoutHandlers.has(sessionId)) {
        clearTimeout(timeoutHandlers.get(sessionId));
        timeoutHandlers.delete(sessionId);
      }
    }
  }
}

/**
 * 最古のセッションを削除（容量制限対応）
 */
function cleanupOldestSessions() {
  const sessions = Array.from(scenarioStorage.entries())
    .sort(([,a], [,b]) => new Date(a.createdAt) - new Date(b.createdAt));
  
  // 上位10%を削除
  const deleteCount = Math.floor(sessions.length * 0.1);
  for (let i = 0; i < deleteCount; i++) {
    const [sessionId] = sessions[i];
    scenarioStorage.delete(sessionId);
    if (timeoutHandlers.has(sessionId)) {
      clearTimeout(timeoutHandlers.get(sessionId));
      timeoutHandlers.delete(sessionId);
    }
  }
}

/**
 * ルーティング処理
 */
export default async function handler(req, res) {
  // 統一セキュリティヘッダー設定
  setSecurityHeaders(res);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

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