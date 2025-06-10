// Phase 5: 手がかり生成API
// 処理時間: 20-25秒

export const config = {
  maxDuration: 120,
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
    const { concept, characters, relationships, incident } = body;

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI APIキーが設定されていません' 
        }),
        { status: 500, headers }
      );
    }

    console.log('Phase 5: Starting clue generation...');

    const systemPrompt = `手がかり設計専門家として、論理的で発見可能な手がかりシステムを構築してください。`;
    
    const userPrompt = `以下の情報に基づいて、手がかりシステムを構築してください：

【事件情報】
${incident}

【キャラクター・関係性情報】
${characters}
${relationships}

【手がかりシステム構築】
## 物理的証拠（3-4個）
各証拠について：
- 発見場所
- 具体的な内容
- 推理への意味
- 発見の難易度

## 証言・情報（4-5個）
各情報について：
- 情報源（誰から得られるか）
- 内容詳細
- 信頼性
- 隠された意味

## 状況証拠（2-3個）
各状況について：
- 観察できる状況
- 推理への手がかり
- 見落としやすいポイント

## 手がかりの関連性
- 手がかり同士の繋がり
- 推理の進行順序
- 重要度の階層

2000文字程度で詳細に作成してください。`;

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
        max_tokens: 2200,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const clues = data.choices[0].message.content;

    console.log('Phase 5: Clues generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        phase: 'clues',
        content: clues,
        next_phase: 'timeline',
        estimated_cost: '$0.009',
        progress: 62.5
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Clue generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `手がかり生成エラー: ${error.message}` 
      }),
      { status: 500, headers }
    );
  }
}