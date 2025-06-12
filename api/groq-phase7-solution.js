// Groq Phase 7: 解決編超高速生成
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
    const { concept, characters, relationships, incident, clues, timeline } = body;

    console.log('Groq Phase 7: Starting ultra-fast solution generation...');

    const prompt = generateSolutionPrompt(concept, characters, relationships, incident, clues, timeline);
    
    // Groq優先実行
    try {
      if (GROQ_API_KEY) {
        const result = await callGroq(prompt);
        return new Response(
          JSON.stringify({
            success: true,
            phase: 'solution',
            content: result.content,
            next_phase: 'gamemaster',
            estimated_cost: '$0.003',
            progress: 87.5,
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
          phase: 'solution',
          content: result.content,
          next_phase: 'gamemaster',
          estimated_cost: '$0.008',
          progress: 87.5,
          provider: 'OpenAI (Fallback)',
          processing_time: result.time
        }),
        { status: 200, headers }
      );
    }

    throw new Error('APIキーが設定されていません');

  } catch (error) {
    console.error('Solution generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `解決編生成エラー: ${error.message}` 
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
        { role: 'system', content: '推理小説専門家として効率的で感動的な解決編を作成。' },
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
        { role: 'system', content: '推理小説専門家として感動的な解決編を作成。' },
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

function generateSolutionPrompt(concept, characters, relationships, incident, clues, timeline) {
  return `以下の全要素を統合した感動的な解決編を効率的に作成：

【コンセプト】
${concept}

【キャラクター】
${characters}

【関係性】
${relationships}

【事件詳細】
${incident}

【証拠・手がかり】
${clues}

【タイムライン】
${timeline}

【解決編作成】
以下形式で事件の完全解決を：

## 真相解明
- 犯人の正体と動機
- 完全な犯行手順
- トリックの解説

## 推理過程
- 重要手がかりの解釈
- 証拠の組み合わせ方
- 真実への道筋

## 感動の結末
- キャラクターの感情
- 事件の影響
- 物語の締めくくり

## 答え合わせ
- 各証拠の意味
- ミスリードの解説

1000文字で効率的に高品質作成。`;
}