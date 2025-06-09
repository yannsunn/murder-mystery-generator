// Phase 7: 真相解明API
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
    const { characters, relationships, incident, clues, timeline } = body;

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI APIキーが設定されていません' 
        }),
        { status: 500, headers }
      );
    }

    console.log('Phase 7: Starting solution construction...');

    const systemPrompt = `推理小説の真相構築専門家として、論理的で納得できる解決を設計してください。`;
    
    const userPrompt = `以下のすべての情報を統合して、事件の完全な真相を構築してください：

【キャラクター・関係性】
${characters}
${relationships}

【事件・手がかり】
${incident}
${clues}

【タイムライン】
${timeline}

【真相構築】
## 犯人の特定
- 真犯人とその理由
- 犯行の動機（詳細な背景）
- 犯行の機会（アリバイの破綻）
- 犯行の手段（具体的方法）

## 犯行の詳細再現
- 事件前の準備
- 犯行の実行過程
- 証拠隠滅の試み
- 発覚までの行動

## 手がかりの意味
各手がかりが真相にどう繋がるか：
- 物理的証拠の解釈
- 証言の真偽
- 状況証拠の意味

## 推理のポイント
- 決定的な証拠
- 見破るべき嘘
- 論理的な推理過程

## 犯人の心理
- 犯行に至った心理状態
- 犯行後の心境変化
- 露見への恐怖

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
        temperature: 0.6, // 論理性重視
        max_tokens: 2200,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const solution = data.choices[0].message.content;

    console.log('Phase 7: Solution constructed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        phase: 'solution',
        content: solution,
        next_phase: 'gamemaster',
        estimated_cost: '$0.009',
        progress: 87.5
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Solution construction error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `真相構築エラー: ${error.message}` 
      }),
      { status: 500, headers }
    );
  }
}