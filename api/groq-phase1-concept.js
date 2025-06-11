// Groq超高速API - タイムアウト完全回避
// 処理時間: 5-10秒保証

export const config = {
  maxDuration: 90, // タイムアウト回避のため90秒に設定
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { participants, era, setting, incident_type, worldview, tone } = req.body;

    if (!GROQ_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Groq APIキーが設定されていません' 
      });
    }

    console.log('Groq Phase 1: Starting ultra-fast concept generation...');

    const systemPrompt = `マーダーミステリー専門作家として、高品質なコンセプトを効率的に作成してください。`;
    
    const userPrompt = generateOptimizedPrompt({ participants, era, setting, incident_type, worldview, tone });

    // Groq API呼び出し - タイムアウト対応版
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45秒タイムアウト

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', // 最高速モデル
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 1000, // トークン数を最適化
          top_p: 0.9,
          stream: false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const concept = data.choices[0].message.content;

      console.log('Groq Phase 1: Ultra-fast concept generated successfully');

      return res.status(200).json({
        success: true,
        content: concept,
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        processing_time: `${Date.now() - startTime}ms`
      });

    } catch (fetchError) {
      clearTimeout(timeout);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Groq API request timeout after 45 seconds');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Groq concept generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Groq生成エラー: ${error.message}`,
      processing_time: `${Date.now() - startTime}ms`
    });
  }
}

function generateOptimizedPrompt(params) {
  const { participants, era, setting, incident_type, worldview, tone } = params;
  
  return `${participants}人マーダーミステリー高速コンセプト生成

設定: ${era}/${setting}/${incident_type}/${worldview}/${tone}

高品質で以下を作成:

## タイトル
印象的で記憶に残るタイトル

## コンセプト  
独創的な魅力とプレイ体験 (4行)

## 舞台
${era}の${setting}、詳細な雰囲気 (4行)

## 事件
${incident_type}の意外性ある設定 (4行)

## テーマ
${tone}調の深い人間ドラマ (3行)

## 特徴
他にない特別体験 (3行)

1000文字で商業品質、効率的に作成。`;
}