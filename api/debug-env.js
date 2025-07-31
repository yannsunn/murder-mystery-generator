/**
 * 環境変数デバッグエンドポイント
 * Vercelでの環境変数の状態を確認するため
 */

const { withSecurity } = require('./security-utils.js');

async function debugEnv(req, res) {
  // セキュリティのため、特定の条件でのみ実行
  const { debug_token } = req.query;
  
  if (debug_token !== 'check-env-2025') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  const envInfo = {
    timestamp: new Date().toISOString(),
    runtime: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_REGION: process.env.VERCEL_REGION
    },
    groqApiKey: {
      exists: process.env.GROQ_API_KEY !== undefined,
      empty: process.env.GROQ_API_KEY === '',
      length: process.env.GROQ_API_KEY?.length || 0,
      validPrefix: process.env.GROQ_API_KEY?.startsWith('gsk_') || false,
      firstChars: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 8) + '***' : 'NOT_SET'
    },
    supabaseKeys: {
      url: process.env.SUPABASE_URL ? 'SET' : 'NOT_SET',
      anonKey: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET',
      serviceKey: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT_SET'
    },
    allEnvVarNames: Object.keys(process.env).filter(k => 
      k.includes('GROQ') || 
      k.includes('SUPABASE') || 
      k.includes('API') ||
      k.includes('KEY')
    ).sort()
  };
  
  res.status(200).json(envInfo);
}

module.exports = withSecurity(debugEnv);