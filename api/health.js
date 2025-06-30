// 🏥 詳細ヘルスチェックAPI - 環境変数診断機能付き

import { setSecurityHeaders } from './security-utils.js';
import { createSecurityMiddleware } from './middleware/rate-limiter.js';

export default async function handler(req, res) {
  setSecurityHeaders(res);
  res.setHeader('Content-Type', 'application/json');

  // レート制限チェック（ヘルスチェック用 - 高頻度OK）
  const securityMiddleware = createSecurityMiddleware('health');
  try {
    await new Promise((resolve, reject) => {
      securityMiddleware(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  } catch (securityError) {
    // Rate limiter already sent response
    return;
  }
  
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
    groqKeyPrefix: envChecks.groqKey ? process.env.GROQ_API_KEY.substring(0, 7) + '***' : 'NOT_SET',
    openaiKeyPresent: envChecks.openaiKey,
    openaiKeyPrefix: envChecks.openaiKey ? process.env.OPENAI_API_KEY.substring(0, 7) + '***' : 'NOT_SET',
    nodeEnv: envChecks.nodeEnv,
    deployment: envChecks.vercelUrl ? 'Vercel' : 'Local'
  };
  
  const allCriticalEnvReady = envChecks.groqKey;
  
  res.status(200).json({
    status: allCriticalEnvReady ? "OK" : "WARNING",
    timestamp: new Date().toISOString(),
    message: allCriticalEnvReady ? "All systems operational" : "Missing critical environment variables",
    environment: envStatus,
    readyForProduction: allCriticalEnvReady,
    issues: allCriticalEnvReady ? [] : [
      !envChecks.groqKey ? "GROQ_API_KEY is required" : null
    ].filter(Boolean)
  });
}