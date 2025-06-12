// Groq Phase 3: 関係性超高速生成
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
    const { concept, characters } = body;

    console.log('Groq Phase 3: Starting ultra-fast relationship generation...');

    const prompt = generateRelationshipPrompt(concept, characters);
    
    // Groq優先実行
    try {
      if (GROQ_API_KEY) {
        const result = await callGroq(prompt);
        return new Response(
          JSON.stringify({
            success: true,
            phase: 'relationships',
            content: result.content,
            next_phase: 'incident',
            estimated_cost: '$0.002',
            progress: 37.5,
            provider: 'Groq (Ultra-Fast)',
            processing_time: result.time
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
          phase: 'relationships',
          content: result.content,
          next_phase: 'incident',
          estimated_cost: '$0.006',
          progress: 37.5,
          provider: 'OpenAI (Fallback)',
          processing_time: result.time
        }),
        { status: 200, headers }
      );
    }

    throw new Error('APIキーが設定されていません');

  } catch (error) {
    console.error('Relationship generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `関係性生成エラー: ${error.message}` 
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
        { role: 'system', content: '人間関係設計専門家として効率的で複雑な関係網を作成。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
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
        { role: 'system', content: '人間関係設計専門家として複雑な関係網を作成。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
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

function generateRelationshipPrompt(concept, characters) {
  return `以下のキャラクターたちの複雑で魅力的な関係性を効率的に設計：

【コンセプト】
${concept}

【キャラクター】
${characters}

【関係性設計】
以下形式で各キャラクター間の関係を：

## 関係性マップ
- [名前A] ↔ [名前B]: 関係性の詳細
- [名前A] ↔ [名前C]: 関係性の詳細
（全ての重要な関係性）

## 秘密の関係
- 隠された関係性や秘密
- 過去の出来事

## 動機構造
- 各キャラクターの主要動機
- 対立要素

800文字で効率的に高品質作成。`;
}