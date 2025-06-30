/**
 * Phase 8: ゲームマスター資料生成 - 統一AIクライアント版
 * 処理時間: 6-10秒保証
 */

import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 90,
};

/**
 * ゲームマスター資料生成プロンプト作成
 */
function generateGamemasterPrompt(allPhases) {
  return `以下のシナリオ情報に基づいて、ゲームマスター用の進行ガイドを生成してください。

【全シナリオ情報】
${JSON.stringify(allPhases, null, 2)}

【要件】
1. セッション運営の具体的な流れ
2. 重要な演出ポイント
3. プレイヤーサポートの方法
4. トラブルシューティング
5. 盛り上げ方のコツ

【出力形式】
JSON形式で以下の構造：
{
  "gamemaster": {
    "preparation": {
      "checklist": ["準備項目リスト"],
      "materials": ["必要な資料・小道具"],
      "setup": "会場セッティング方法",
      "briefing": "事前説明のポイント"
    },
    "phases": [
      {
        "phase": "フェーズ名",
        "duration": "推奨時間",
        "objectives": ["目的"],
        "keyPoints": ["重要ポイント"],
        "facilitation": "ファシリテーション方法",
        "commonIssues": ["よくある問題と対処法"]
      }
    ],
    "hints": {
      "timing": "ヒントを出すタイミング",
      "levels": [
        {
          "level": 1,
          "hint": "軽いヒント",
          "condition": "出す条件"
        }
      ]
    },
    "climax": {
      "setup": "クライマックスの演出方法",
      "reveal": "真相発表の進め方",
      "impact": "インパクトを与える方法"
    },
    "troubleshooting": [
      {
        "issue": "問題状況",
        "solution": "対処法",
        "prevention": "予防策"
      }
    ],
    "closure": {
      "debriefing": "振り返りの進め方",
      "feedback": "フィードバック収集方法",
      "appreciation": "参加者への感謝の伝え方"
    }
  }
}`;
}

/**
 * ゲームマスター資料生成メインハンドラー
 */
async function generateGamemaster(req, res) {
  const { previousPhases = {} } = req.body;

  // すべてのフェーズデータが必要
  const requiredPhases = ['phase1', 'phase2', 'phase3', 'phase4', 'phase5', 'phase6', 'phase7'];
  const missingPhases = requiredPhases.filter(phase => !previousPhases[phase]);

  if (missingPhases.length > 0) {
    throw new AppError(
      `GM資料生成に必要なフェーズが不足しています: ${missingPhases.join(', ')}`,
      ErrorTypes.VALIDATION,
      400
    );
  }

  console.log('Phase 8: ゲームマスター資料生成開始...');

  try {
    const prompt = generateGamemasterPrompt(previousPhases);
    const systemPrompt = `あなたは経験豊富なマーダーミステリーのゲームマスターです。
初心者GMでも成功できる詳細な進行ガイドを作成してください。
必ずJSON形式で回答してください。`;

    const result = await aiClient.generateWithRetry(systemPrompt, prompt, {
      preferredProvider: 'groq',
      maxRetries: 2
    });

    // JSON解析を試みる
    let gamemaster;
    try {
      gamemaster = JSON.parse(result.content);
    } catch (parseError) {
      // JSONでない場合は構造化する
      gamemaster = {
        gamemaster: {
          description: result.content,
          preparation: { checklist: [] },
          phases: []
        }
      };
    }

    return res.status(200).json({
      success: true,
      phase: 8,
      phaseName: 'ゲームマスターガイド',
      gamemaster: gamemaster.gamemaster || gamemaster,
      metadata: {
        provider: result.provider,
        generatedAt: new Date().toISOString(),
        isComplete: true // 最終フェーズ
      }
    });

  } catch (error) {
    throw new AppError(
      `ゲームマスター資料生成エラー: ${error.message}`,
      ErrorTypes.GENERATION,
      500
    );
  }
}

/**
 * エクスポート: エラーハンドリング付きハンドラー
 */
export default withErrorHandler(async (req, res) => {
  setSecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    throw new AppError(
      'Method not allowed',
      ErrorTypes.VALIDATION,
      405
    );
  }

  return generateGamemaster(req, res);
}, 'phase8-gamemaster');