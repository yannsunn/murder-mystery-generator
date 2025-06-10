// デバッグテストAPI - 環境変数とAPIキー検証

export const config = {
  maxDuration: 10,
};

export default async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  console.log('🔍 Debug test starting...');

  // 環境変数の存在確認
  const envCheck = {
    GROQ_API_KEY: !!process.env.GROQ_API_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    TIMEOUT_PREVENTION_MODE: process.env.TIMEOUT_PREVENTION_MODE,
    ENABLE_GROQ_ULTRA_FAST: process.env.ENABLE_GROQ_ULTRA_FAST,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
  };

  // APIキーの形式確認（最初の数文字のみ）
  const keyFormats = {
    GROQ_KEY_FORMAT: process.env.GROQ_API_KEY ? 
      `${process.env.GROQ_API_KEY.substring(0, 7)}...` : 'NOT_SET',
    OPENAI_KEY_FORMAT: process.env.OPENAI_API_KEY ? 
      `${process.env.OPENAI_API_KEY.substring(0, 7)}...` : 'NOT_SET',
  };

  // APIテスト結果
  const apiTests = {
    groq: { status: 'pending', message: '', time: 0 },
    openai: { status: 'pending', message: '', time: 0 }
  };

  // Groq APIテスト
  if (process.env.GROQ_API_KEY) {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 1,
        })
      });

      apiTests.groq.time = Date.now() - startTime;
      
      if (response.ok) {
        apiTests.groq.status = '✅ SUCCESS';
        apiTests.groq.message = 'API key is valid';
      } else {
        const error = await response.text();
        apiTests.groq.status = '❌ FAILED';
        apiTests.groq.message = `Status ${response.status}: ${error.substring(0, 100)}`;
      }
    } catch (error) {
      apiTests.groq.status = '❌ ERROR';
      apiTests.groq.message = error.message;
      apiTests.groq.time = Date.now() - startTime;
    }
  } else {
    apiTests.groq.status = '⚠️ NO KEY';
    apiTests.groq.message = 'GROQ_API_KEY not set';
  }

  // OpenAI APIテスト
  if (process.env.OPENAI_API_KEY) {
    const startTime = Date.now();
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        }
      });

      apiTests.openai.time = Date.now() - startTime;
      
      if (response.ok) {
        apiTests.openai.status = '✅ SUCCESS';
        apiTests.openai.message = 'API key is valid';
      } else {
        const error = await response.text();
        apiTests.openai.status = '❌ FAILED';
        apiTests.openai.message = `Status ${response.status}: ${error.substring(0, 100)}`;
      }
    } catch (error) {
      apiTests.openai.status = '❌ ERROR';
      apiTests.openai.message = error.message;
      apiTests.openai.time = Date.now() - startTime;
    }
  } else {
    apiTests.openai.status = '⚠️ NO KEY';
    apiTests.openai.message = 'OPENAI_API_KEY not set';
  }

  // Vercel環境情報
  const vercelInfo = {
    region: process.env.VERCEL_REGION || 'unknown',
    url: process.env.VERCEL_URL || 'unknown',
    deployment: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  };

  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: envCheck,
    keyFormats,
    apiTests,
    vercelInfo,
    recommendations: generateRecommendations(envCheck, apiTests),
  };

  return new Response(
    JSON.stringify(debugInfo, null, 2),
    { status: 200, headers }
  );
}

function generateRecommendations(envCheck, apiTests) {
  const recommendations = [];

  if (!envCheck.GROQ_API_KEY) {
    recommendations.push('🔴 GROQ_API_KEY is not set. Add it in Vercel dashboard.');
  } else if (apiTests.groq.status.includes('FAILED')) {
    recommendations.push('🔴 GROQ_API_KEY is invalid or expired. Get a new key from https://console.groq.com');
  }

  if (!envCheck.OPENAI_API_KEY) {
    recommendations.push('🔴 OPENAI_API_KEY is not set. Add it in Vercel dashboard.');
  } else if (apiTests.openai.status.includes('FAILED')) {
    recommendations.push('🔴 OPENAI_API_KEY is invalid or expired. Get a new key from https://platform.openai.com');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ All API keys are properly configured and working!');
  }

  return recommendations;
}