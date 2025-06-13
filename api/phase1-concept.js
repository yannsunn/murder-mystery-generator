// Groq STABLE API - 緊急安定化版 + セキュリティ強化
// 確実動作保証、8Bモデル使用、商業品質セキュリティ

import { withSecurity, validateAndSanitizeInput, createErrorResponse } from './security-utils.js';

export const config = {
  maxDuration: 60,
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;

async function handler(req, res) {
  const startTime = Date.now();

  try {
    // 入力検証とサニタイゼーション
    const { errors, sanitized } = validateAndSanitizeInput(req.body);
    
    if (errors.length > 0) {
      const { status, body } = createErrorResponse(new Error(errors.join(', ')), 400);
      return res.status(status).json(body);
    }

    const { participants, era, setting, incident_type, worldview, tone } = sanitized;

    if (!GROQ_API_KEY) {
      const { status, body } = createErrorResponse(new Error('API configuration error'), 500);
      return res.status(status).json(body);
    }

    // 安定動作プロンプト（8Bモデル用最適化）
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

    console.log('📡 Calling Groq API (8B stable model)...');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', // 安定した8Bモデル
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 1800, // 安定動作範囲
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.4,
          stream: false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Groq API Error:', response.status, errorText);
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const concept = data.choices[0]?.message?.content;

      if (!concept) {
        throw new Error('No content returned from Groq API');
      }

      console.log('✅ STABLE: Concept generated successfully');

      return res.status(200).json({
        success: true,
        content: concept,
        provider: 'groq-stable',
        model: 'llama-3.1-8b-instant',
        processing_time: `${Date.now() - startTime}ms`,
        status: 'stable_generation'
      });

    } catch (fetchError) {
      clearTimeout(timeout);
      
      console.error('❌ Fetch Error:', fetchError.message);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Groq API request timeout after 30 seconds');
      }
      throw fetchError;
    }

  } catch (error) {
    const { status, body } = createErrorResponse(error);
    return res.status(status).json({
      ...body,
      processing_time: `${Date.now() - startTime}ms`
    });
  }
}

// セキュリティラッパーでエクスポート
export default withSecurity(handler, 'phase1-concept');