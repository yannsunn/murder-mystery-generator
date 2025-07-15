// 🏥 詳細ヘルスチェックAPI - 環境変数診断機能付き
// CommonJS版（Vercel対応）

module.exports = function handler(req, res) {
  try {
  
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
  
    // 通常のNode.jsレスポンス
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}