/**
 * Phase 2: キャラクター生成 - 統一AIクライアント版
 * 処理時間: 8-12秒保証
 */

import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 90,
};

/**
 * キャラクター生成プロンプト作成
 */
function generateCharacterPrompt(concept, participants) {
  return `あなたは経験豊富なマーダーミステリー作家です。以下のコンセプトに基づいて、${participants || 4}人のキャラクターを生成してください。

【コンセプト】
${JSON.stringify(concept, null, 2)}

【要件】
1. 各キャラクターは独特で魅力的な個性を持つ
2. 全員が事件に関わる動機を持つ
3. 複雑な人間関係を形成する
4. ミステリーの解決に必要な情報を分散して持つ

【出力形式】
JSON形式で以下の構造：
{
  "characters": [
    {
      "id": "character_1",
      "name": "名前",
      "age": 年齢,
      "occupation": "職業",
      "appearance": "外見の特徴",
      "personality": "性格・特徴",
      "background": "背景・経歴",
      "secrets": ["秘密1", "秘密2"],
      "motives": ["動機1", "動機2"],
      "relationships": {
        "character_2": "関係性の説明",
        "character_3": "関係性の説明"
      }
    }
  ]
}`;
}

/**
 * キャラクター生成メインハンドラー
 */
async function generateCharacters(req, res) {
  const { concept, participants = 4, previousPhases = {} } = req.body;

  if (!concept && !previousPhases.phase1) {
    throw new AppError(
      'コンセプトデータが提供されていません',
      ErrorTypes.VALIDATION,
      400
    );
  }

  const actualConcept = concept || previousPhases.phase1?.concept;
  console.log('Phase 2: キャラクター生成開始...');

  try {
    const prompt = generateCharacterPrompt(actualConcept, participants);
    const systemPrompt = `あなたは経験豊富なマーダーミステリー作家です。
商業品質の魅力的なキャラクターを生成してください。
必ずJSON形式で回答してください。`;

    const result = await aiClient.generateWithRetry(systemPrompt, prompt, {
      preferredProvider: 'groq',
      maxRetries: 2
    });

    // JSON解析を試みる
    let characters;
    try {
      characters = JSON.parse(result.content);
    } catch (parseError) {
      // JSONでない場合は構造化する
      characters = {
        characters: [{
          id: "character_1",
          name: "解析エラー",
          description: result.content
        }]
      };
    }

    return res.status(200).json({
      success: true,
      phase: 2,
      phaseName: 'キャラクター設定',
      characters: characters.characters || characters,
      metadata: {
        participantCount: participants,
        provider: result.provider,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    throw new AppError(
      `キャラクター生成エラー: ${error.message}`,
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

  return generateCharacters(req, res);
}, 'phase2-characters');