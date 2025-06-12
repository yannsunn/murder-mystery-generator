// ULTRA FALLBACK SYSTEM - 品質保証二重システム
// メイン失敗時の緊急高品質生成

export const config = {
  maxDuration: 60,
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { participants, era, setting, incident_type, worldview, tone } = req.body;

    // フォールバック用超シンプル高品質プロンプト
    const fallbackPrompt = `商業レベルのマーダーミステリーを作成。

${participants}人、${era}時代、${setting}、${incident_type}、${worldview}、${tone}

以下の形式で出力：

## 🏆 タイトル
《具体的で魅力的なタイトル》

## 🎭 シナリオ概要
${participants}人のプレイヤーが楽しめる詳細なストーリー。具体的な人名、場所、時間を含む。

## 📋 基本設定
- 時代: 具体的な年代
- 場所: 詳細な地名
- 状況: 明確な設定

## 🕵️ 事件概要
- 被害者: 名前、年齢、職業
- 死因: 具体的方法
- 時刻: 正確な時間
- 場所: 詳細な発見場所

## 👥 キャラクター（${participants}人）
1. [名前] - [職業] - [秘密]
2. [名前] - [職業] - [秘密]
（${participants}人分続ける）

## 🔍 謎
解決すべき中心的謎と手がかり

## 🎯 目標
プレイヤーの明確な目標

商業品質で作成。`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: fallbackPrompt }],
        temperature: 0.9,
        max_tokens: 2000,
        top_p: 0.95,
        frequency_penalty: 0.2,
        presence_penalty: 0.6,
      }),
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    return res.status(200).json({
      success: true,
      content,
      provider: 'groq-fallback-quality',
      model: 'llama-3.1-8b-instant',
      processing_time: `${Date.now() - startTime}ms`,
      quality_type: 'fallback_commercial'
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}