// フェイルセーフAPI - 複数プロバイダー自動切り替え
// 処理落ち完全回避システム

export const config = {
  maxDuration: 45, // 複数プロバイダーフォールバックに必要な時間
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
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
    const { participants, era, setting, incident_type, worldview, tone } = body;

    console.log('Failsafe: Starting multi-provider concept generation...');

    const prompt = generatePrompt({ participants, era, setting, incident_type, worldview, tone });
    
    // プロバイダー優先順位（速度重視）
    const providers = [
      { name: 'Groq', func: callGroq },
      { name: 'OpenAI', func: callOpenAI }  // Together除去（キー未設定のため）
    ];

    for (const provider of providers) {
      try {
        console.log(`Trying ${provider.name}...`);
        const result = await provider.func(prompt);
        
        console.log(`✅ ${provider.name} succeeded!`);
        return new Response(
          JSON.stringify({
            success: true,
            phase: 'concept',
            content: result.content,
            provider: provider.name,
            processing_time: result.time,
            estimated_cost: result.cost
          }),
          { status: 200, headers }
        );
        
      } catch (error) {
        console.log(`❌ ${provider.name} failed: ${error.message}`);
        continue; // 次のプロバイダーを試す
      }
    }

    throw new Error('全てのプロバイダーが失敗しました');

  } catch (error) {
    console.error('Failsafe concept generation error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `フェイルセーフ生成エラー: ${error.message}` 
      }),
      { status: 500, headers }
    );
  }
}

// Groq API呼び出し（最高速）
async function callGroq(prompt) {
  if (!GROQ_API_KEY) throw new Error('Groq API key not available');
  
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
        { role: 'system', content: 'マーダーミステリー専門作家として効率的に作成。' },
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
    time: `${endTime - startTime}ms (Groq超高速)`,
    cost: '$0.002'
  };
}

// Together AI呼び出し（高速+高品質）
async function callTogether(prompt) {
  if (!TOGETHER_API_KEY) throw new Error('Together API key not available');
  
  const startTime = Date.now();
  const response = await fetch('https://api.together.xyz/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/Llama-3-70b-chat-hf',
      messages: [
        { role: 'system', content: 'マーダーミステリー専門作家として高品質に作成。' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8,
      max_tokens: 1200,
    })
  });

  if (!response.ok) throw new Error(`Together error: ${response.status}`);
  
  const data = await response.json();
  const endTime = Date.now();
  
  return {
    content: data.choices[0].message.content,
    time: `${endTime - startTime}ms (Together高速)`,
    cost: '$0.005'
  };
}

// OpenAI フォールバック（標準速度）
async function callOpenAI(prompt) {
  if (!OPENAI_API_KEY) throw new Error('OpenAI API key not available');
  
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
        { role: 'system', content: 'マーダーミステリー専門作家として作成。' },
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
    time: `${endTime - startTime}ms (OpenAI標準)`,
    cost: '$0.008'
  };
}

function generatePrompt(params) {
  const { participants, era, setting, incident_type, worldview, tone } = params;
  
  return `${participants}人マーダーミステリー コンセプト生成

設定: ${era}/${setting}/${incident_type}/${worldview}/${tone}

## タイトル
## コンセプト (4行)
## 舞台設定 (4行)  
## 事件核心 (4行)
## テーマ (3行)
## 特徴 (3行)

1000文字で商業品質作成。`;
}