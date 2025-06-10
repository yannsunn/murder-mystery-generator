// Phase 6: タイムライン構築API
// 処理時間: 15-20秒

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
    const { characters, incident, clues } = body;

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI APIキーが設定されていません' 
        }),
        { status: 500, headers }
      );
    }

    console.log('Phase 6: Starting timeline construction...');

    const systemPrompt = `タイムライン設計専門家として、論理的で一貫したタイムラインを構築してください。`;
    
    const userPrompt = `以下の情報に基づいて、詳細なタイムラインを構築してください：

【キャラクター情報】
${characters}

【事件情報】
${incident}

【手がかり情報】
${clues}

【タイムライン構築】
## 事件当日のタイムライン
時刻順に以下を記録：

### [時刻] - [重要な出来事]
- 関与者：[誰が]
- 行動：[何をしたか]
- 場所：[どこで]
- 証拠：[関連する手がかり]
- 目撃者：[誰が見ていたか]

（事件前3-4時間から事件発見まで、30分刻み程度で詳細に）

## 各キャラクターの行動記録
各キャラクターの当日の行動を時系列で：
- アリバイの有無
- 重要な行動
- 他キャラクターとの接触
- 証言できる内容

## 矛盾点・疑問点
タイムライン上の重要な矛盾や疑問

1500文字程度で詳細に作成してください。`;

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
        max_tokens: 1800,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const timeline = data.choices[0].message.content;

    console.log('Phase 6: Timeline constructed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        phase: 'timeline',
        content: timeline,
        next_phase: 'solution',
        estimated_cost: '$0.007',
        progress: 75
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Timeline construction error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `タイムライン構築エラー: ${error.message}` 
      }),
      { status: 500, headers }
    );
  }
}