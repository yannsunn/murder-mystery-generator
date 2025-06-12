// Groq Phase 4: 事件詳細超高速生成
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
    const { concept, characters, relationships } = body;

    console.log('Groq Phase 4: Starting ultra-fast incident generation...');

    const prompt = generateIncidentPrompt(concept, characters, relationships);
    
    // Groq優先実行
    try {
      if (GROQ_API_KEY) {
        const result = await callGroq(prompt);
        return new Response(
          JSON.stringify({
            success: true,
            phase: 'incident',
            content: result.content,
            next_phase: 'clues',
            estimated_cost: '$0.003',
            progress: 50,
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
          phase: 'incident',
          content: result.content,
          next_phase: 'clues',
          estimated_cost: '$0.008',
          progress: 50,
          provider: 'OpenAI (Fallback)',
          processing_time: result.time
        }),
        { status: 200, headers }
      );
    }

    throw new Error('APIキーが設定されていません');

  } catch (error) {
    console.error('Incident generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `事件生成エラー: ${error.message}` 
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
        { role: 'system', content: '事件構築専門家として効率的で意外性ある事件を設計。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
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
        { role: 'system', content: '事件構築専門家として意外性ある事件を設計。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
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

function generateIncidentPrompt(concept, characters, relationships) {
  return `以下の設定で意外性ある事件詳細を効率的に構築：

【コンセプト】
${concept}

【キャラクター】
${characters}

【関係性】
${relationships}

【事件詳細設計】
以下形式で事件の全貌を：

## 事件概要
- 何が起きたか
- いつ・どこで
- 発見状況

## 被害者情報
- 被害者の詳細
- 事件直前の行動

## 現場状況
- 現場の詳細描写
- 重要な物的証拠

## 真犯人
- 犯人の正体
- 犯行動機
- 犯行手段

## トリック
- 使用されたトリック
- ミスリード要素

1000文字で効率的に高品質作成。`;
}