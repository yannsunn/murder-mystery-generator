/**
 * Phase 5: 証拠・手がかり生成 - 統一AIクライアント版
 * 処理時間: 8-12秒保証
 */

import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 90,
};

/**
 * 証拠・手がかり生成プロンプト作成
 */
function generateCluesPrompt(incident, characters, relationships) {
  return `以下の事件に関する証拠と手がかりを生成してください。

【事件詳細】
${JSON.stringify(incident, null, 2)}

【キャラクター】
${JSON.stringify(characters, null, 2)}

【人間関係】
${JSON.stringify(relationships, null, 2)}

【要件】
1. 物理的証拠（5-7個）
2. 証言・目撃情報（4-6個）
3. 隠された手がかり（2-3個）
4. ミスディレクション要素（1-2個）

【出力形式】
JSON形式で以下の構造：
{
  "clues": {
    "physicalEvidence": [
      {
        "id": "evidence_1",
        "name": "証拠名",
        "description": "詳細な説明",
        "location": "発見場所",
        "discoveredBy": "発見者",
        "importance": "high/medium/low",
        "leadsTo": ["推理の方向性"]
      }
    ],
    "testimonies": [
      {
        "id": "testimony_1",
        "witness": "証言者",
        "content": "証言内容",
        "reliability": "high/medium/low",
        "contradictions": ["矛盾点"],
        "hiddenTruth": "隠された真実"
      }
    ],
    "hiddenClues": [
      {
        "id": "hidden_1",
        "nature": "手がかりの性質",
        "revealCondition": "発見条件",
        "impact": "判明時の影響"
      }
    ],
    "redHerrings": [
      {
        "id": "misdirection_1",
        "description": "誤導要素",
        "targetSuspect": "疑われる人物",
        "whyMisleading": "誤導の理由"
      }
    ]
  }
}`;
}

/**
 * 証拠・手がかり生成メインハンドラー
 */
async function generateClues(req, res) {
  const { incident, characters, relationships, previousPhases = {} } = req.body;

  const actualIncident = incident || previousPhases.phase4?.incident;
  const actualCharacters = characters || previousPhases.phase2?.characters;
  const actualRelationships = relationships || previousPhases.phase3?.relationships;

  if (!actualIncident) {
    throw new AppError(
      '証拠生成に必要な事件データが不足しています',
      ErrorTypes.VALIDATION,
      400
    );
  }

  console.log('Phase 5: 証拠・手がかり生成開始...');

  try {
    const prompt = generateCluesPrompt(actualIncident, actualCharacters, actualRelationships);
    const systemPrompt = `あなたは経験豊富なマーダーミステリー作家です。
推理に必要な証拠と手がかりを巧妙に配置してください。
必ずJSON形式で回答してください。`;

    const result = await aiClient.generateWithRetry(systemPrompt, prompt, {
      preferredProvider: 'groq',
      maxRetries: 2
    });

    // JSON解析を試みる
    let clues;
    try {
      clues = JSON.parse(result.content);
    } catch (parseError) {
      // JSONでない場合は構造化する
      clues = {
        clues: {
          description: result.content,
          physicalEvidence: [],
          testimonies: []
        }
      };
    }

    return res.status(200).json({
      success: true,
      phase: 5,
      phaseName: '証拠・手がかり',
      clues: clues.clues || clues,
      metadata: {
        provider: result.provider,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    throw new AppError(
      `証拠・手がかり生成エラー: ${error.message}`,
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

  return generateClues(req, res);
}, 'phase5-clues');