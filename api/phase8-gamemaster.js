// Phase 8: ゲーム進行ガイド生成API
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
    const { concept, characters, clues, timeline, solution } = body;

    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'OpenAI APIキーが設定されていません' 
        }),
        { status: 500, headers }
      );
    }

    console.log('Phase 8: Starting gamemaster guide generation...');

    const systemPrompt = `ゲームマスター専門家として、実用的で分かりやすい進行ガイドを作成してください。`;
    
    const userPrompt = `以下の完成したシナリオ情報に基づいて、ゲーム進行ガイドを作成してください：

【基本情報】
${concept}

【完成した要素】
キャラクター: ${characters}
手がかり: ${clues}
タイムライン: ${timeline}
真相: ${solution}

【ゲーム進行ガイド作成】
## 事前準備
- 必要な道具・資料
- プレイヤーへの説明事項
- 会場設営のポイント

## フェーズ別進行
### 第1フェーズ：導入（15分）
- 状況説明の方法
- キャラクター紹介
- 初期情報の提供

### 第2フェーズ：調査（60分）
- 手がかり発見の誘導方法
- プレイヤー同士の議論促進
- 行き詰まった時のヒント

### 第3フェーズ：推理（30分）
- 推理発表の進行
- 証拠の整理方法
- 犯人指名の流れ

### 第4フェーズ：解決（15分）
- 真相発表の演出
- 解説のポイント
- 感想戦の進行

## よくある問題と対処法
- プレイヤーが混乱した場合
- 推理が的外れの場合
- 時間が足りない場合
- 盛り上がりに欠ける場合

## 成功のコツ
- 雰囲気作りのポイント
- プレイヤーのモチベーション維持
- 適切なヒントのタイミング

1500文字程度で実用的に作成してください。`;

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
        temperature: 0.5, // 実用性重視
        max_tokens: 1800,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const gamemaster = data.choices[0].message.content;

    console.log('Phase 8: Gamemaster guide generated successfully');

    return new Response(
      JSON.stringify({
        success: true,
        phase: 'gamemaster',
        content: gamemaster,
        next_phase: 'complete',
        estimated_cost: '$0.007',
        progress: 100
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Gamemaster guide generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `ゲーム進行ガイド生成エラー: ${error.message}` 
      }),
      { status: 500, headers }
    );
  }
}