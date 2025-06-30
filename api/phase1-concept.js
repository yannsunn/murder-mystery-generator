/**
 * 🎭 Phase 1: コンセプト生成 - 統一化リファクタリング済み
 * 重複コード削除、統一AI クライアント使用
 */

import './startup.js'; // 環境変数初期化
import { aiClient, AI_CONFIG } from './utils/ai-client.js';
import { withStandardHandler, createSuccessResponse, sendResponse, validateRequiredFields } from './utils/response-handler.js';
import { validateAndSanitizeInput } from './security-utils.js';

export const config = AI_CONFIG;

async function handler(req, res) {
  const startTime = Date.now();

  // 入力検証
  const { errors, sanitized } = validateAndSanitizeInput(req.body);
  if (errors.length > 0) {
    return sendResponse(res, { success: false, error: errors.join(', ') }, 400);
  }

  const { participants, era, setting, incident_type, worldview, tone } = sanitized;

  // プロンプト生成
  const systemPrompt = `あなたは経験豊富なマーダーミステリー作家です。魅力的で完成度の高いシナリオコンセプトを作成してください。

【出力フォーマット】
## 🏆 タイトル
《魅力的なタイトル》

## 🎭 シナリオ概要
${participants}人のプレイヤーが楽しめる詳細なストーリー概要。登場人物の関係性と事件の背景を含む。

## 📋 基本設定
- 時代: ${era}
- 舞台: ${setting}
- 世界観: ${worldview}
- 雰囲気: ${tone}

## 🕵️ 事件概要
- 被害者: 名前、年齢、職業を具体的に
- 死因: 具体的な殺害方法
- 発生時刻: 正確な時間
- 発見状況: 詳細な状況

## 👥 キャラクター概要
${participants}人のプレイヤーキャラクター:
1. [キャラ名] - [職業] - [秘密・動機]
2. [キャラ名] - [職業] - [秘密・動機]
（以下${participants}人分）

## 🔍 核心的謎
プレイヤーが解決すべき中心的な謎と手がかり

## 🎯 ゲームの目標
プレイヤーが達成すべき明確な目標

具体的で魅力的に作成してください。`;
  
  const userPrompt = `${participants}人参加の${era}時代、${setting}を舞台とした${incident_type}のマーダーミステリーシナリオを作成してください。

世界観: ${worldview}
雰囲気: ${tone}

プレイヤーが楽しめる高品質なシナリオコンセプトを作成してください。`;

  console.log('📡 Calling AI (unified client)...');

  // 統一AIクライアント使用
  const result = await aiClient.generateContent(systemPrompt, userPrompt);
  
  console.log('✅ Phase 1: Concept generated successfully');

  const response = createSuccessResponse(result.content, {
    processingTime: `${Date.now() - startTime}ms`,
    provider: result.provider,
    model: result.model,
    phase: 'concept'
  });

  return sendResponse(res, response);
}

export default withStandardHandler(handler, 'phase1-concept');