// デバッグ用タイムアウト診断API
// Vercel Pro環境での処理時間とAPI接続性を検証

export const config = {
  maxDuration: 30,
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

  const startTime = Date.now();

  try {
    // 環境変数確認
    const envCheck = {
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      ENABLE_GROQ_ULTRA_FAST: process.env.ENABLE_GROQ_ULTRA_FAST,
      TIMEOUT_PREVENTION_MODE: process.env.TIMEOUT_PREVENTION_MODE,
    };

    // Groq API接続テスト
    let groqStatus = 'untested';
    let groqResponseTime = 0;
    
    if (process.env.GROQ_API_KEY) {
      try {
        const groqStartTime = Date.now();
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 10,
          }),
        });
        groqResponseTime = Date.now() - groqStartTime;
        groqStatus = groqResponse.ok ? 'success' : `error_${groqResponse.status}`;
      } catch (error) {
        groqStatus = `connection_error: ${error.message}`;
      }
    } else {
      groqStatus = 'no_api_key';
    }

    // OpenAI API接続テスト
    let openaiStatus = 'untested';
    let openaiResponseTime = 0;
    
    if (process.env.OPENAI_API_KEY) {
      try {
        const openaiStartTime = Date.now();
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 10,
          }),
        });
        openaiResponseTime = Date.now() - openaiStartTime;
        openaiStatus = openaiResponse.ok ? 'success' : `error_${openaiResponse.status}`;
      } catch (error) {
        openaiStatus = `connection_error: ${error.message}`;
      }
    } else {
      openaiStatus = 'no_api_key';
    }

    const totalTime = Date.now() - startTime;

    const report = {
      success: true,
      timestamp: new Date().toISOString(),
      vercel_info: {
        region: process.env.VERCEL_REGION || 'unknown',
        environment: process.env.NODE_ENV || 'unknown',
        runtime: 'nodejs18.x',
      },
      environment_variables: envCheck,
      api_connectivity: {
        groq: {
          status: groqStatus,
          response_time_ms: groqResponseTime,
        },
        openai: {
          status: openaiStatus,
          response_time_ms: openaiResponseTime,
        },
      },
      performance: {
        total_execution_time_ms: totalTime,
        memory_usage: process.memoryUsage(),
      },
      recommendations: generateRecommendations(groqStatus, openaiStatus, groqResponseTime, openaiResponseTime),
    };

    return new Response(JSON.stringify(report, null, 2), {
      status: 200,
      headers,
    });

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        execution_time_ms: Date.now() - startTime,
      }),
      { status: 500, headers }
    );
  }
}

function generateRecommendations(groqStatus, openaiStatus, groqTime, openaiTime) {
  const recommendations = [];

  if (groqStatus === 'success' && groqTime < 2000) {
    recommendations.push('✅ Groq API is fast and responsive - recommended for production');
  } else if (groqStatus !== 'success') {
    recommendations.push('⚠️ Groq API connection failed - check API key and network');
  }

  if (openaiStatus === 'success' && openaiTime < 5000) {
    recommendations.push('✅ OpenAI API is responsive - good fallback option');
  } else if (openaiStatus !== 'success') {
    recommendations.push('⚠️ OpenAI API connection failed - check API key and network');
  }

  if (groqStatus === 'success' && openaiStatus === 'success') {
    if (groqTime < openaiTime) {
      recommendations.push('🚀 Use Groq as primary API for best performance');
    } else {
      recommendations.push('🔄 Consider OpenAI as primary if Groq is slow');
    }
  }

  return recommendations;
}