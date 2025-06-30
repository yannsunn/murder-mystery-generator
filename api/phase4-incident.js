/**
 * Phase 4: 事件詳細生成 - 統一AIクライアント版
 * 処理時間: 8-12秒保証
 */

import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 90,
};

/**
 * 事件詳細生成プロンプト作成
 */
function generateIncidentPrompt(concept, characters, relationships) {
  return `以下の設定に基づいて、マーダーミステリーの事件詳細を生成してください。

【コンセプト】
${JSON.stringify(concept, null, 2)}

【キャラクター】
${JSON.stringify(characters, null, 2)}

【人間関係】
${JSON.stringify(relationships, null, 2)}

【要件】
1. 衝撃的で記憶に残る事件
2. 全キャラクターが関与する可能性
3. 複数の解釈が可能な状況証拠
4. 推理の手がかりを含む現場描写

【出力形式】
JSON形式で以下の構造：
{
  "incident": {
    "victim": {
      "name": "被害者名",
      "age": 年齢,
      "occupation": "職業",
      "deathTime": "死亡推定時刻",
      "causeOfDeath": "死因",
      "location": "発見場所"
    },
    "discovery": {
      "discoverer": "第一発見者",
      "time": "発見時刻",
      "circumstances": "発見時の状況",
      "initialReaction": "初期の反応"
    },
    "scene": {
      "description": "現場の詳細描写",
      "evidence": ["証拠1", "証拠2", "証拠3"],
      "atmosphere": "現場の雰囲気",
      "peculiarities": ["特異な点1", "特異な点2"]
    },
    "initialSuspicions": ["初期の疑惑1", "初期の疑惑2"]
  }
}`;
}

/**
 * 事件詳細生成メインハンドラー
 */
async function generateIncident(req, res) {
  const { concept, characters, relationships, previousPhases = {} } = req.body;

  const actualConcept = concept || previousPhases.phase1?.concept;
  const actualCharacters = characters || previousPhases.phase2?.characters;
  const actualRelationships = relationships || previousPhases.phase3?.relationships;

  if (!actualConcept || !actualCharacters) {
    throw new AppError(
      '事件生成に必要なデータが不足しています',
      ErrorTypes.VALIDATION,
      400
    );
  }

  console.log('Phase 4: 事件詳細生成開始...');

  try {
    const prompt = generateIncidentPrompt(actualConcept, actualCharacters, actualRelationships);
    const systemPrompt = `あなたは経験豊富なマーダーミステリー作家です。
衝撃的で魅力的な事件を創造してください。
必ずJSON形式で回答してください。`;

    const result = await aiClient.generateWithRetry(systemPrompt, prompt, {
      preferredProvider: 'groq',
      maxRetries: 2
    });

    // JSON解析を試みる
    let incident;
    try {
      incident = JSON.parse(result.content);
    } catch (parseError) {
      // JSONでない場合は構造化する
      incident = {
        incident: {
          description: result.content
        }
      };
    }

    return res.status(200).json({
      success: true,
      phase: 4,
      phaseName: '事件詳細',
      incident: incident.incident || incident,
      metadata: {
        provider: result.provider,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    throw new AppError(
      `事件詳細生成エラー: ${error.message}`,
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

  return generateIncident(req, res);
}, 'phase4-incident');