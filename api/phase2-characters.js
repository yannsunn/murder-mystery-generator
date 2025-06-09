// Phase 2: キャラクター基盤生成API
// 処理時間: 20-25秒

export const config = {
  maxDuration: 50, // 短縮
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
    const { concept, participants } = body;

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI APIキーが設定されていません' 
        }),
        { status: 500, headers }
      );
    }

    if (!concept) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'コンセプトデータが提供されていません' 
        }),
        { status: 400, headers }
      );
    }

    console.log('Phase 2: Starting character foundation generation...');

    const systemPrompt = `キャラクター設計専門家として、魅力的で個性豊かなキャラクターの基盤を作成してください。`;
    
    const userPrompt = `以下のコンセプトに基づいて、${participants}人のキャラクター基盤を作成してください：

【コンセプト】
${concept}

【キャラクター基盤作成】
${participants}名の魅力的なキャラクターを以下の形式で：

## キャラクター1: [名前]
- 年齢・性別
- 職業・立場
- 基本性格（3-4行）
- 外見的特徴
- 話し方・癖

## キャラクター2: [名前]
（以下同様に${participants}名分）

各キャラクターが個性的で魅力的になるよう、2000文字程度で作成してください。`;

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
        temperature: 0.7,
        max_tokens: 1500, // 短時間保証
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const characters = data.choices[0].message.content;

    console.log('Phase 2: Character foundation generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        phase: 'characters',
        content: characters,
        next_phase: 'relationships',
        estimated_cost: '$0.008',
        progress: 25
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Character foundation generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `キャラクター基盤生成エラー: ${error.message}` 
      }),
      { status: 500, headers }
    );
  }
}