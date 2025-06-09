// Phase 1: コンセプト生成API - 基本アイデアのみ
// 処理時間: 15-20秒

export const config = {
  maxDuration: 45, // さらに短縮
};

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI APIキーが設定されていません' 
        }),
        { status: 500, headers }
      );
    }

    console.log('Phase 1: Starting concept generation...');

    const systemPrompt = `マーダーミステリーのコンセプト作成専門家として、魅力的な基本アイデアを生成してください。`;
    
    const userPrompt = generateConceptPrompt({ participants, era, setting, incident_type, worldview, tone });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // 最高速モデル
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8, // バランス重視
        max_tokens: 1000, // 短時間保証
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const concept = data.choices[0].message.content;

    console.log('Phase 1: Concept generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        phase: 'concept',
        content: concept,
        next_phase: 'characters',
        estimated_cost: '$0.005',
        progress: 12.5
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Concept generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `コンセプト生成エラー: ${error.message}` 
      }),
      { status: 500, headers }
    );
  }
}

function generateConceptPrompt(params) {
  const { participants, era, setting, incident_type, worldview, tone } = params;
  
  return `${participants}人マーダーミステリー高品質コンセプト作成

設定：${era}/${setting}/${incident_type}/${worldview}/${tone}

以下を魅力的に生成：

## タイトル
印象的で覚えやすいタイトル

## コンセプト
独創的な魅力とプレイヤー体験（4行）

## 舞台設定
${era}${setting}の詳細な雰囲気描写（4行）

## 事件核心
${incident_type}の意外性ある設定（4行）

## テーマ
${tone}調の深い人間ドラマ（3行）

## 特徴
他にない特別なゲーム体験（3行）

1200文字程度で商業品質作成。`;
}