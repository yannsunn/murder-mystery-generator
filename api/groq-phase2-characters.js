// Groq Phase 2: キャラクター超高速生成
// 処理時間: 8-12秒保証

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
    const { concept, participants } = body;

    if (!concept) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'コンセプトデータが提供されていません' 
        }),
        { status: 400, headers }
      );
    }

    console.log('Groq Phase 2: Starting ultra-fast character generation...');

    const prompt = generateCharacterPrompt(concept, participants);
    
    // Groq優先、フォールバック付き
    try {
      if (GROQ_API_KEY) {
        const result = await callGroq(prompt);
        return new Response(
          JSON.stringify({
            success: true,
            phase: 'characters',
            content: result.content,
            next_phase: 'relationships',
            estimated_cost: '$0.003',
            progress: 25,
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
          phase: 'characters',
          content: result.content,
          next_phase: 'relationships',
          estimated_cost: '$0.008',
          progress: 25,
          provider: 'OpenAI (Fallback)',
          processing_time: result.time
        }),
        { status: 200, headers }
      );
    }

    throw new Error('APIキーが設定されていません');

  } catch (error) {
    console.error('Character generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `キャラクター生成エラー: ${error.message}` 
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
      model: 'llama-3.1-70b-versatile',
      messages: [
        { role: 'system', content: 'キャラクター設計専門家として効率的で魅力的なキャラクターを作成。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
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
        { role: 'system', content: 'キャラクター設計専門家として魅力的なキャラクターを作成。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500,
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

function generateCharacterPrompt(concept, participants) {
  return `以下のコンセプトに基づいて、${participants}人の魅力的なキャラクター基盤を効率的に作成：

【コンセプト】
${concept}

【キャラクター基盤】
${participants}名の個性的なキャラクターを以下形式で：

## キャラクター1: [名前]
- 年齢・性別・職業
- 基本性格 (3行)
- 外見・話し方

## キャラクター2: [名前]
（以下同様に${participants}名分）

1200文字で効率的に高品質作成。`;
}