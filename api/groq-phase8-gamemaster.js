// Groq Phase 8: ゲームマスター資料超高速生成
// 処理時間: 6-10秒保証

export const config = {
  maxDuration: 90,
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;
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
    const { concept, characters, relationships, incident, clues, timeline, solution } = body;

    console.log('Groq Phase 8: Starting ultra-fast gamemaster guide generation...');

    const prompt = generateGamemasterPrompt(concept, characters, relationships, incident, clues, timeline, solution);
    
    // Groq優先実行
    try {
      if (GROQ_API_KEY) {
        const result = await callGroq(prompt);
        return new Response(
          JSON.stringify({
            success: true,
            phase: 'gamemaster',
            content: result.content,
            estimated_cost: '$0.002',
            progress: 100,
            provider: 'Groq (Ultra-Fast)',
            processing_time: result.time,
            completion_message: '🎉 完璧なマーダーミステリーシナリオが完成しました！'
          }),
          { status: 200, headers }
        );
      }
    } catch (groqError) {
      console.log('Groq failed, trying OpenAI fallback:', groqError.message);
    }

    // OpenAI フォールバック
    if (OPENAI_API_KEY) {
      const result = await callOpenAI(prompt);
      return new Response(
        JSON.stringify({
          success: true,
          phase: 'gamemaster',
          content: result.content,
          estimated_cost: '$0.006',
          progress: 100,
          provider: 'OpenAI (Fallback)',
          processing_time: result.time,
          completion_message: '🎉 マーダーミステリーシナリオが完成しました！'
        }),
        { status: 200, headers }
      );
    }

    throw new Error('APIキーが設定されていません');

  } catch (error) {
    console.error('Gamemaster generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `ゲームマスター資料生成エラー: ${error.message}` 
      }),
      { status: 500, headers }
    );
  }
}

async function callGroq(prompt) {
  const startTime = Date.now();
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: 'ゲーム運営専門家として効率的で実用的な進行資料を作成。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 1000,
    })
  });

  if (!response.ok) throw new Error(`Groq error: ${response.status}`);
  
  const data = await response.json();
  const endTime = Date.now();
  
  return {
    content: data.choices[0].message.content,
    time: `${endTime - startTime}ms (Groq超高速)`
  };
}

async function callOpenAI(prompt) {
  const startTime = Date.now();
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'ゲーム運営専門家として実用的な進行資料を作成。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
      max_tokens: 1000,
    })
  });

  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`);
  
  const data = await response.json();
  const endTime = Date.now();
  
  return {
    content: data.choices[0].message.content,
    time: `${endTime - startTime}ms (OpenAI標準)`
  };
}

function generateGamemasterPrompt(concept, characters, relationships, incident, clues, timeline, solution) {
  return `以下の完成シナリオの実用的なゲームマスター進行資料を効率的に作成：

【完成シナリオ概要】
コンセプト: ${concept}
キャラクター: ${characters}
関係性: ${relationships}
事件: ${incident}
証拠: ${clues}
タイムライン: ${timeline}
解決編: ${solution}

【ゲームマスター資料】
以下形式で進行ガイドを：

## ゲーム概要
- プレイ時間: 約○時間
- 推奨人数: ○名
- 難易度: ★★★☆☆

## 進行手順
### 1. 開始前準備
- 役割配布方法
- 初期情報提供

### 2. ゲーム進行
- フェーズ1: [時間・内容]
- フェーズ2: [時間・内容]
- フェーズ3: [時間・内容]

### 3. 解決フェーズ
- 推理発表順序
- 答え合わせ手順

## 重要ポイント
- 進行時の注意点
- よくある質問対応

800文字で効率的に実用的作成。`;
}