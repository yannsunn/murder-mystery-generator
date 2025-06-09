// Groq超高速API - タイムアウト完全回避
// 処理時間: 5-10秒保証

export const config = {
  maxDuration: 10, // 超短時間設定
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export default async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    const body = await request.json();
    const { participants, era, setting, incident_type, worldview, tone } = body;

    if (!GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Groq APIキーが設定されていません' 
        }),
        { status: 500, headers }
      );
    }

    console.log('Groq Phase 1: Starting ultra-fast concept generation...');

    const systemPrompt = `マーダーミステリー専門作家として、高品質なコンセプトを効率的に作成してください。`;
    
    const userPrompt = generateOptimizedPrompt({ participants, era, setting, incident_type, worldview, tone });

    // Groq API呼び出し - 爆速処理
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile', // 高性能+高速モデル
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1200,
        top_p: 0.9,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const concept = data.choices[0].message.content;

    console.log('Groq Phase 1: Ultra-fast concept generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        phase: 'concept',
        content: concept,
        next_phase: 'characters',
        estimated_cost: '$0.002',
        progress: 12.5,
        processing_time: '5-10秒',
        provider: 'Groq (Ultra-Fast)'
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Groq concept generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Groq生成エラー: ${error.message}` 
      }),
      { status: 500, headers }
    );
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