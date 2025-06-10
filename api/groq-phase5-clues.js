// Groq Phase 5: 証拠・手がかり超高速生成
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
    const { concept, characters, relationships, incident } = body;

    console.log('Groq Phase 5: Starting ultra-fast clues generation...');

    const prompt = generateCluesPrompt(concept, characters, relationships, incident);
    
    // Groq優先実行
    try {
      if (GROQ_API_KEY) {
        const result = await callGroq(prompt);
        return new Response(
          JSON.stringify({
            success: true,
            phase: 'clues',
            content: result.content,
            next_phase: 'timeline',
            estimated_cost: '$0.003',
            progress: 62.5,
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
          phase: 'clues',
          content: result.content,
          next_phase: 'timeline',
          estimated_cost: '$0.008',
          progress: 62.5,
          provider: 'OpenAI (Fallback)',
          processing_time: result.time
        }),
        { status: 200, headers }
      );
    }

    throw new Error('APIキーが設定されていません');

  } catch (error) {
    console.error('Clues generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `証拠生成エラー: ${error.message}` 
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
        { role: 'system', content: '証拠分析専門家として効率的で巧妙な手がかりシステムを設計。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1200,
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
        { role: 'system', content: '証拠分析専門家として巧妙な手がかりシステムを設計。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1200,
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

function generateCluesPrompt(concept, characters, relationships, incident) {
  return `以下の事件で巧妙な証拠・手がかりシステムを効率的に設計：

【コンセプト】
${concept}

【キャラクター】
${characters}

【関係性】
${relationships}

【事件詳細】
${incident}

【証拠・手がかり設計】
以下形式で推理ゲームの核心を：

## 物的証拠
- 証拠1: [詳細]
- 証拠2: [詳細]
- 証拠3: [詳細]

## 証言・情報
- 重要証言リスト
- 矛盾する情報
- 隠された情報

## 推理手がかり
- 真実に導く手がかり
- ミスリード要素
- 決定的証拠

## 秘密情報
- キャラクター別の秘密
- 段階的開示情報

1000文字で効率的に高品質作成。`;
}