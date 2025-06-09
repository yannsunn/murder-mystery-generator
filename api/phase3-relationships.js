// Phase 3: 人間関係構築API
// 処理時間: 15-20秒

export const config = {
  maxDuration: 45,
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
    const { concept, characters } = body;

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI APIキーが設定されていません' 
        }),
        { status: 500, headers }
      );
    }

    if (!concept || !characters) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'コンセプトまたはキャラクターデータが不足しています' 
        }),
        { status: 400, headers }
      );
    }

    console.log('Phase 3: Starting relationship building...');

    const systemPrompt = `人間関係設計専門家として、複雑で興味深い人間関係を構築してください。`;
    
    const userPrompt = `以下のコンセプトとキャラクターに基づいて、複雑な人間関係を構築してください：

【コンセプト】
${concept}

【キャラクター】
${characters}

【人間関係構築】
以下の形式で人間関係を詳細に設定：

## 主要な関係性
### [キャラクター名] ↔ [キャラクター名]
- 関係の種類（恋人、親子、ライバル等）
- 関係の歴史・経緯（3-4行）
- 現在の感情状態
- 隠された真実や秘密

（すべてのキャラクター間の重要な関係性について記述）

## 関係性マップ
視覚的に理解しやすい関係図の説明

1500文字程度で複雑かつ魅力的に作成してください。`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 1800,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const relationships = data.choices[0].message.content;

    console.log('Phase 3: Relationships built successfully');

    return new Response(
      JSON.stringify({
        success: true,
        phase: 'relationships',
        content: relationships,
        next_phase: 'incident',
        estimated_cost: '$0.007',
        progress: 37.5
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Relationship building error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `人間関係構築エラー: ${error.message}` 
      }),
      { status: 500, headers }
    );
  }
}