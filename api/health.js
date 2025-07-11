// 🏥 詳細ヘルスチェックAPI - 環境変数診断機能付き
// Vercel Edge Runtime対応版

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Edge RuntimeではRequestオブジェクトを使用
  const url = new URL(request.url);
  
  // 環境変数チェック
  const envChecks = {
    groqKey: !!process.env.GROQ_API_KEY,
    openaiKey: !!process.env.OPENAI_API_KEY,
    nodeEnv: process.env.NODE_ENV || 'unknown',
    vercelUrl: !!process.env.VERCEL_URL
  };
  
  // 環境変数の部分表示（セキュリティ考慮）
  const envStatus = {
    groqKeyPresent: envChecks.groqKey,
    groqKeyPrefix: envChecks.groqKey && process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 7) + '***' : 'NOT_SET',
    openaiKeyPresent: envChecks.openaiKey,
    openaiKeyPrefix: envChecks.openaiKey && process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '***' : 'NOT_SET',
    nodeEnv: envChecks.nodeEnv,
    deployment: envChecks.vercelUrl ? 'Vercel' : 'Local',
    runtime: 'edge'
  };
  
  const allCriticalEnvReady = envChecks.groqKey;
  
  const responseData = {
    status: allCriticalEnvReady ? "OK" : "WARNING",
    timestamp: new Date().toISOString(),
    message: allCriticalEnvReady ? "All systems operational" : "Missing critical environment variables",
    environment: envStatus,
    readyForProduction: allCriticalEnvReady,
    issues: allCriticalEnvReady ? [] : [
      !envChecks.groqKey ? "GROQ_API_KEY is required" : null
    ].filter(Boolean),
    performance: {
      runtime: 'edge',
      region: process.env.VERCEL_REGION || 'unknown'
    }
  };
  
  return new Response(JSON.stringify(responseData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    },
  });
}