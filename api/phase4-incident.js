// Phase 4: 事件詳細構築API
// 処理時間: 20-25秒

export const config = {
  maxDuration: 50,
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
    const { concept, characters, relationships } = body;

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI APIキーが設定されていません' 
        }),
        { status: 500, headers }
      );
    }

    if (!concept || !characters || !relationships) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: '必要なデータが不足しています' 
        }),
        { status: 400, headers }
      );
    }

    console.log('Phase 4: Starting incident construction...');

    const systemPrompt = `事件構築専門家として、論理的で興味深い事件の詳細を設計してください。`;
    
    const userPrompt = `以下の情報に基づいて、事件の詳細を構築してください：

【コンセプト】
${concept}

【キャラクター】
${characters}

【人間関係】
${relationships}

【事件詳細構築】
## 事件の発生
- 正確な発生時刻
- 発生場所の詳細
- 発生状況の詳細描写（5-6行）

## 被害者情報
- 被害者の特定
- 被害者の状況
- 発見時の詳細

## 現場状況
- 現場の物理的状況
- 重要な物証
- 現場の雰囲気・状態

## 犯行手法
- 使用された方法
- 必要な道具・知識
- 実行の難易度

## 発見の経緯
- 誰がいつ発見したか
- 発見者の反応
- その後の対応

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
    const incident = data.choices[0].message.content;

    console.log('Phase 4: Incident constructed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        phase: 'incident',
        content: incident,
        next_phase: 'clues',
        estimated_cost: '$0.009',
        progress: 50
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Incident construction error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `事件構築エラー: ${error.message}` 
      }),
      { status: 500, headers }
    );
  }
}