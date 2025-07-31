/**
 * 環境変数デバッグユーティリティ
 * Vercel環境での環境変数の問題を特定するため
 */

function debugEnvironmentVariables() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      CI: process.env.CI
    },
    groqApiKey: {
      exists: process.env.GROQ_API_KEY !== undefined,
      empty: process.env.GROQ_API_KEY === '',
      length: process.env.GROQ_API_KEY?.length || 0,
      prefix: process.env.GROQ_API_KEY?.substring(0, 8) || 'NOT_SET',
      isValidFormat: process.env.GROQ_API_KEY?.startsWith('gsk_') || false
    },
    allEnvVars: {
      groqRelated: Object.keys(process.env).filter(k => k.includes('GROQ')),
      apiRelated: Object.keys(process.env).filter(k => k.includes('API')),
      keyRelated: Object.keys(process.env).filter(k => k.includes('KEY')),
      supabaseRelated: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
    }
  };

  console.log('[ENV-DEBUG] Full environment analysis:', JSON.stringify(debugInfo, null, 2));
  
  return debugInfo;
}

/**
 * 環境変数の安全な取得
 */
function getEnvironmentVariable(key, fallback = null) {
  // 直接アクセス
  if (process.env[key]) {
    console.log(`[ENV-DEBUG] ✅ Found ${key} directly`);
    return process.env[key];
  }
  
  // 大文字小文字の違いを無視して検索
  const envKeys = Object.keys(process.env);
  const matchingKey = envKeys.find(k => k.toLowerCase() === key.toLowerCase());
  
  if (matchingKey && process.env[matchingKey]) {
    console.log(`[ENV-DEBUG] ✅ Found ${key} as ${matchingKey}`);
    return process.env[matchingKey];
  }
  
  // フォールバック
  console.log(`[ENV-DEBUG] ❌ ${key} not found, using fallback`);
  return fallback;
}

module.exports = {
  debugEnvironmentVariables,
  getEnvironmentVariable
};