/**
 * Phase 7: 真相・解決編生成 - 統一AIクライアント版
 * 処理時間: 8-12秒保証
 */

import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 90,
};

/**
 * 真相・解決編生成プロンプト作成
 */
function generateSolutionPrompt(allPhases) {
  return `以下のすべての情報を統合して、事件の完全な真相と解決を生成してください。

【全フェーズ情報】
${JSON.stringify(allPhases, null, 2)}

【要件】
1. 論理的で矛盾のない真相
2. すべての証拠と整合する説明
3. 犯人の動機と心理の深い描写
4. トリックの詳細な説明
5. 推理の決定的ポイント

【出力形式】
JSON形式で以下の構造：
{
  "solution": {
    "culprit": {
      "name": "真犯人の名前",
      "motive": "動機の詳細",
      "psychology": "心理状態の分析",
      "triggerEvent": "犯行のきっかけ"
    },
    "method": {
      "preparation": "事前準備",
      "execution": "犯行の実行方法",
      "trick": "使用されたトリック",
      "alibiCreation": "アリバイ工作の方法"
    },
    "evidence": {
      "decisive": ["決定的証拠"],
      "supporting": ["補強証拠"],
      "overlooked": ["見落とされがちな証拠"]
    },
    "reasoning": {
      "keyPoints": ["推理の重要ポイント"],
      "logicalFlow": "論理的な推理の流れ",
      "revelationMoment": "真相判明の瞬間"
    },
    "epilogue": {
      "aftermath": "事件後の展開",
      "charactersEnd": "各キャラクターの結末",
      "moralMessage": "物語のメッセージ"
    }
  }
}`;
}

/**
 * 真相・解決編生成メインハンドラー
 */
async function generateSolution(req, res) {
  const { previousPhases = {} } = req.body;

  // すべてのフェーズデータが必要
  const requiredPhases = ['phase1', 'phase2', 'phase3', 'phase4', 'phase5', 'phase6'];
  const missingPhases = requiredPhases.filter(phase => !previousPhases[phase]);

  if (missingPhases.length > 0) {
    throw new AppError(
      `真相生成に必要なフェーズが不足しています: ${missingPhases.join(', ')}`,
      ErrorTypes.VALIDATION,
      400
    );
  }

  console.log('Phase 7: 真相・解決編生成開始...');

  try {
    const prompt = generateSolutionPrompt(previousPhases);
    const systemPrompt = `あなたは経験豊富なマーダーミステリー作家です。
すべての伏線を回収し、論理的で感動的な真相を創造してください。
必ずJSON形式で回答してください。`;

    const result = await aiClient.generateWithRetry(systemPrompt, prompt, {
      preferredProvider: 'groq',
      maxRetries: 2
    });

    // JSON解析を試みる
    let solution;
    try {
      solution = JSON.parse(result.content);
    } catch (parseError) {
      // JSONでない場合は構造化する
      solution = {
        solution: {
          description: result.content
        }
      };
    }

    return res.status(200).json({
      success: true,
      phase: 7,
      phaseName: '真相・解決',
      solution: solution.solution || solution,
      metadata: {
        provider: result.provider,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    throw new AppError(
      `真相・解決編生成エラー: ${error.message}`,
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

  return generateSolution(req, res);
}, 'phase7-solution');