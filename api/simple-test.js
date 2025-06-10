// 最もシンプルなテストAPI - APIキー診断専用

export const config = {
  maxDuration: 5,
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

  try {
    // 環境変数の存在確認
    const envCheck = {
      GROQ_API_KEY_EXISTS: !!process.env.GROQ_API_KEY,
      GROQ_API_KEY_FORMAT: process.env.GROQ_API_KEY ? 
        `${process.env.GROQ_API_KEY.substring(0, 8)}...` : 'NOT_SET',
      OPENAI_API_KEY_EXISTS: !!process.env.OPENAI_API_KEY,
      OPENAI_API_KEY_FORMAT: process.env.OPENAI_API_KEY ? 
        `${process.env.OPENAI_API_KEY.substring(0, 8)}...` : 'NOT_SET',
      TIMEOUT_PREVENTION_MODE: process.env.TIMEOUT_PREVENTION_MODE,
      ENABLE_GROQ_ULTRA_FAST: process.env.ENABLE_GROQ_ULTRA_FAST,
    };

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        environment: envCheck,
        message: "Simple test successful - no API calls made"
      }, null, 2),
      { status: 200, headers }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers }
    );
  }
}