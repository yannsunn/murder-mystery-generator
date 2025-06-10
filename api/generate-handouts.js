// Vercel API Route - ハンドアウト生成

export const config = {
  maxDuration: 60,
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
    const { scenario, characters } = body;

    if (!scenario || !characters || characters.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'シナリオまたはキャラクター情報が不足しています' 
        }),
        { status: 400, headers }
      );
    }

    // 並列処理でハンドアウトを生成
    const handoutPromises = characters.map(character => 
      generateHandoutForCharacter(scenario, character)
    );

    const handouts = await Promise.all(handoutPromises);

    return new Response(
      JSON.stringify({
        success: true,
        handouts
      }),
      { status: 200, headers }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'ハンドアウト生成中にエラーが発生しました' 
      }),
      { status: 500, headers }
    );
  }
}

async function generateHandoutForCharacter(scenario, character) {
  try {
    const prompt = createHandoutPrompt(scenario, character);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'あなたはマーダーミステリーのキャラクターハンドアウト作成の専門家です。プレイヤーが楽しめる詳細なキャラクター設定を作成してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const handout = data.choices[0].message.content;

    return {
      character: character.name,
      content: handout
    };

  } catch (error) {
    console.error(`Error generating handout for ${character.name}:`, error);
    return {
      character: character.name,
      content: generateFallbackHandout(character)
    };
  }
}

function createHandoutPrompt(scenario, character) {
  // シナリオから重要な情報を抽出
  const scenarioSummary = scenario.substring(0, 1000);

  return `以下のマーダーミステリーシナリオにおける「${character.name}」のプレイヤー用ハンドアウトを作成してください。

シナリオ概要：
${scenarioSummary}...

キャラクター名: ${character.name}
役割: ${character.role || '参加者'}

以下の形式でハンドアウトを作成してください：

## あなたの役割
${character.name}としての基本情報

## 背景ストーリー
あなたの過去と現在の状況（5-7行）

## 他のキャラクターとの関係
各キャラクターとの関係性と印象

## あなたの秘密
他のプレイヤーには知られていない情報
- 個人的な秘密
- 事件に関連する秘密（ある場合）

## 事件当日の行動
タイムラインに沿った詳細な行動記録

## あなたの目標
ゲーム中に達成すべき目標（優先順位付き）
1. 最優先目標
2. 副次的目標
3. 可能であれば達成したい目標

## 初期情報
ゲーム開始時点で知っている情報

## プレイのヒント
キャラクターを演じる上でのアドバイス`;
}

function generateFallbackHandout(character) {
  return `## ${character.name}のハンドアウト

申し訳ございません。ハンドアウトの生成中にエラーが発生しました。

ゲームマスターにお問い合わせください。`;
}