/**
 * 🌐 EventSource Handler Module
 * EventSource接続管理とストリーミングレスポンス処理
 */

import { logger } from '../utils/logger.js';

/**
 * EventSource接続の初期化と管理
 */
export function setupEventSourceConnection(req, res, sessionId) {
  logger.debug('🌐 EventSource接続検出');
  
  const eventSourceId = sessionId || `eventsource_${Date.now()}`;
  
  // クライアント切断時のクリーンアップ
  req.on('close', () => {
    logger.debug(`Client disconnected: ${eventSourceId}`);
    if (!res.headersSent) {
      res.end();
    }
  });
  
  req.on('error', (error) => {
    logger.warn(`EventSource error: ${error.message}`);
    if (!res.headersSent) {
      res.end();
    }
  });
  
  return eventSourceId;
}

/**
 * EventSourceヘッダーの設定
 */
export function setEventSourceHeaders(res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  });
}

/**
 * EventSourceへのメッセージ送信
 */
export function sendEventSourceMessage(res, event, data) {
  try {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    return true;
  } catch (error) {
    logger.error(`EventSource write error: ${error.message}`);
    return false;
  }
}

/**
 * 進捗更新の送信
 */
export function sendProgressUpdate(res, stepIndex, stepName, result, currentWeight, totalWeight, isComplete = false) {
  const progressData = {
    step: stepIndex + 1,
    totalSteps: 9, // INTEGRATED_GENERATION_FLOW.length
    stepName: stepName,
    content: result,
    progress: Math.round((currentWeight / totalWeight) * 100),
    isComplete,
    timestamp: new Date().toISOString(),
    estimatedTimeRemaining: Math.max(0, Math.floor((totalWeight - currentWeight) * 2 / totalWeight))
  };
  
  try {
    res.write(`event: progress\ndata: ${JSON.stringify(progressData)}\n\n`);
    logger.debug(`📡 Progress sent: ${stepName} (${progressData.progress}%)`);
    return true;
  } catch (writeError) {
    logger.error('❌ Progress write error:', writeError);
    return false;
  }
}

/**
 * ランダムモード用の進捗シミュレーション
 */
export async function simulateRandomProgress(res) {
  const mockSteps = [
    { name: '段階0: ランダム全体構造・アウトライン', weight: 15 },
    { name: '段階1: コンセプト精密化・世界観詳細化', weight: 10 },
    { name: '段階2: 事件核心・犯人設定', weight: 12 },
    { name: '段階3: 事件詳細・状況設定', weight: 13 },
    { name: '段階4: キャラクター生成・関係性', weight: 15 },
    { name: '段階5: 証拠配置・手がかり体系化', weight: 18 },
    { name: '段階6: GM進行・セッション管理', weight: 8 },
    { name: '段階7: 統合・品質確認', weight: 5 },
    { name: '段階8: 最終品質保証・完成', weight: 4 }
  ];
  
  let cumulativeProgress = 0;
  
  // 各段階の進捗を順次送信
  for (let i = 0; i < mockSteps.length; i++) {
    const step = mockSteps[i];
    cumulativeProgress += step.weight;
    
    // 進捗更新を送信
    res.write(`event: progress\ndata: ${JSON.stringify({
      step: i + 1,
      totalSteps: mockSteps.length,
      stepName: step.name,
      progress: Math.min(cumulativeProgress, 100),
      estimatedTimeRemaining: Math.max(0, Math.floor((100 - cumulativeProgress) * 2 / 100)),
      message: `${step.name} 完了`
    })}\n\n`);
    
    // 少し待機してリアルな進捗感を演出
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}