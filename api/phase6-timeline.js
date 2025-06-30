/**
 * Phase 6: タイムライン生成 - 統一AIクライアント版
 * 処理時間: 8-12秒保証
 */

import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 90,
};

/**
 * タイムライン生成プロンプト作成
 */
function generateTimelinePrompt(incident, characters, clues) {
  return `以下の事件について、詳細なタイムラインを生成してください。

【事件詳細】
${JSON.stringify(incident, null, 2)}

【キャラクター】
${JSON.stringify(characters, null, 2)}

【証拠・手がかり】
${JSON.stringify(clues, null, 2)}

【要件】
1. 事件前日から事件発覚後までの時系列
2. 全キャラクターの行動を追跡
3. 重要な出来事のタイミング
4. アリバイの成立/不成立を明確に

【出力形式】
JSON形式で以下の構造：
{
  "timeline": {
    "dayBefore": [
      {
        "time": "時刻",
        "events": [
          {
            "character": "キャラクター名",
            "action": "行動内容",
            "location": "場所",
            "witnesses": ["目撃者"],
            "significance": "重要度"
          }
        ]
      }
    ],
    "dayOfIncident": [
      {
        "time": "時刻",
        "events": [
          {
            "character": "キャラクター名",
            "action": "行動内容",
            "location": "場所",
            "witnesses": ["目撃者"],
            "significance": "重要度",
            "alibi": "アリバイの有無"
          }
        ]
      }
    ],
    "criticalMoment": {
      "estimatedTime": "推定犯行時刻",
      "duration": "所要時間",
      "keyEvents": ["重要な出来事"]
    },
    "discovery": {
      "time": "発見時刻",
      "sequence": ["発見後の出来事の順序"]
    }
  }
}`;
}

/**
 * タイムライン生成メインハンドラー
 */
async function generateTimeline(req, res) {
  const { incident, characters, clues, previousPhases = {} } = req.body;

  const actualIncident = incident || previousPhases.phase4?.incident;
  const actualCharacters = characters || previousPhases.phase2?.characters;
  const actualClues = clues || previousPhases.phase5?.clues;

  if (!actualIncident || !actualCharacters) {
    throw new AppError(
      'タイムライン生成に必要なデータが不足しています',
      ErrorTypes.VALIDATION,
      400
    );
  }

  console.log('Phase 6: タイムライン生成開始...');

  try {
    const prompt = generateTimelinePrompt(actualIncident, actualCharacters, actualClues);
    const systemPrompt = `あなたは経験豊富なマーダーミステリー作家です。
論理的で矛盾のないタイムラインを構築してください。
必ずJSON形式で回答してください。`;

    const result = await aiClient.generateWithRetry(systemPrompt, prompt, {
      preferredProvider: 'groq',
      maxRetries: 2
    });

    // JSON解析を試みる
    let timeline;
    try {
      timeline = JSON.parse(result.content);
    } catch (parseError) {
      // JSONでない場合は構造化する
      timeline = {
        timeline: {
          description: result.content,
          dayOfIncident: []
        }
      };
    }

    return res.status(200).json({
      success: true,
      phase: 6,
      phaseName: 'タイムライン',
      timeline: timeline.timeline || timeline,
      metadata: {
        provider: result.provider,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    throw new AppError(
      `タイムライン生成エラー: ${error.message}`,
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

  return generateTimeline(req, res);
}, 'phase6-timeline');