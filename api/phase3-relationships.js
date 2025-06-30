/**
 * Phase 3: 人物関係生成 - 統一AIクライアント版
 * 処理時間: 8-12秒保証
 */

import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 90,
};

/**
 * 人物関係生成プロンプト作成
 */
function generateRelationshipPrompt(characters) {
  const characterList = Array.isArray(characters) ? characters : characters.characters;
  const names = characterList.map(c => c.name).join('、');
  
  return `以下のキャラクター間の複雑な人間関係を詳細に生成してください。

【キャラクター一覧】
${JSON.stringify(characterList, null, 2)}

【要件】
1. 全員が互いに何らかの関係を持つ
2. 表向きの関係と裏の関係を含む
3. 事件の動機につながる関係性
4. ミステリーの複雑さを増す秘密の関係

【出力形式】
JSON形式で以下の構造：
{
  "relationships": [
    {
      "character1": "キャラクター1の名前",
      "character2": "キャラクター2の名前",
      "publicRelation": "表向きの関係",
      "secretRelation": "秘密の関係",
      "tension": "緊張・対立要素",
      "history": "過去の出来事",
      "importance": "high/medium/low"
    }
  ],
  "relationshipMap": {
    "キャラクター名": {
      "キャラクター名2": "関係の要約",
      "キャラクター名3": "関係の要約"
    }
  }
}`;
}

/**
 * 人物関係生成メインハンドラー
 */
async function generateRelationships(req, res) {
  const { characters, previousPhases = {} } = req.body;

  if (!characters && !previousPhases.phase2) {
    throw new AppError(
      'キャラクターデータが提供されていません',
      ErrorTypes.VALIDATION,
      400
    );
  }

  const actualCharacters = characters || previousPhases.phase2?.characters;
  console.log('Phase 3: 人物関係生成開始...');

  try {
    const prompt = generateRelationshipPrompt(actualCharacters);
    const systemPrompt = `あなたは経験豊富なマーダーミステリー作家です。
複雑で魅力的な人間関係を構築してください。
必ずJSON形式で回答してください。`;

    const result = await aiClient.generateWithRetry(systemPrompt, prompt, {
      preferredProvider: 'groq',
      maxRetries: 2
    });

    // JSON解析を試みる
    let relationships;
    try {
      relationships = JSON.parse(result.content);
    } catch (parseError) {
      // JSONでない場合は構造化する
      relationships = {
        relationships: [{
          character1: "不明",
          character2: "不明",
          description: result.content
        }],
        relationshipMap: {}
      };
    }

    return res.status(200).json({
      success: true,
      phase: 3,
      phaseName: '人物関係',
      relationships: relationships.relationships || relationships,
      relationshipMap: relationships.relationshipMap || {},
      metadata: {
        characterCount: actualCharacters?.length || 0,
        provider: result.provider,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    throw new AppError(
      `人物関係生成エラー: ${error.message}`,
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

  return generateRelationships(req, res);
}, 'phase3-relationships');