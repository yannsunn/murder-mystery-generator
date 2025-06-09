// Groq Phase 6: タイムライン超高速生成
// 処理時間: 6-10秒保証

export const config = {
  maxDuration: 8,
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
    const { concept, characters, relationships, incident, clues } = body;

    console.log('Groq Phase 6: Starting ultra-fast timeline generation...');

    const prompt = generateTimelinePrompt(concept, characters, relationships, incident, clues);
    
    // Groq優先実行
    try {
      if (GROQ_API_KEY) {
        const result = await callGroq(prompt);
        return new Response(
          JSON.stringify({
            success: true,
            phase: 'timeline',
            content: result.content,
            next_phase: 'solution',
            estimated_cost: '$0.002',
            progress: 75,
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
          phase: 'timeline',
          content: result.content,
          next_phase: 'solution',
          estimated_cost: '$0.006',
          progress: 75,
          provider: 'OpenAI (Fallback)',
          processing_time: result.time
        }),
        { status: 200, headers }
      );
    }

    throw new Error('APIキーが設定されていません');

  } catch (error) {
    console.error('Timeline generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `タイムライン生成エラー: ${error.message}` 
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
        { role: 'system', content: 'タイムライン構築専門家として効率的で正確な時系列を作成。' },
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
        { role: 'system', content: 'タイムライン構築専門家として正確な時系列を作成。' },
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

function generateTimelinePrompt(concept, characters, relationships, incident, clues) {
  return `以下の事件の詳細なタイムラインを効率的に構築：

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

【タイムライン構築】
以下形式で事件当日の詳細時系列を：

## 事件前（数日前〜前日）
- 重要な出来事
- 各キャラクターの動向

## 事件当日
### 午前
- 00:00 [詳細]
- 00:00 [詳細]

### 午後
- 00:00 [詳細]
- 00:00 [詳細]

### 夜間
- 00:00 [詳細]
- 00:00 [詳細]

## 事件発覚後
- 発見から調査開始まで

800文字で効率的に高品質作成。`;
}