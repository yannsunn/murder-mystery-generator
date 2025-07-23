/**
 * 環境変数チェックエンドポイント
 * Vercelでの環境変数の状態を確認
 */

export default function handler(req, res) {
  const envStatus = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'not set',
    vercel: process.env.VERCEL || 'not running on Vercel',
    
    // API Keys (最初の10文字のみ表示)
    groqKey: {
      exists: !!process.env.GROQ_API_KEY,
      preview: process.env.GROQ_API_KEY ? 
        process.env.GROQ_API_KEY.substring(0, 10) + '...' : 
        'NOT SET',
      length: process.env.GROQ_API_KEY ? 
        process.env.GROQ_API_KEY.length : 0
    },
    
    openaiKey: {
      exists: !!process.env.OPENAI_API_KEY,
      preview: process.env.OPENAI_API_KEY ? 
        process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 
        'NOT SET'
    },
    
    supabase: {
      url: !!process.env.SUPABASE_URL,
      anonKey: !!process.env.SUPABASE_ANON_KEY
    },
    
    // すべての環境変数のキー（値は表示しない）
    allEnvKeys: Object.keys(process.env).filter(key => 
      !key.includes('SECRET') && 
      !key.includes('PRIVATE') &&
      !key.includes('PASSWORD')
    ).sort(),
    
    // Vercel特有の環境変数
    vercelEnv: {
      VERCEL_ENV: process.env.VERCEL_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
      VERCEL_REGION: process.env.VERCEL_REGION,
      VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA
    }
  };
  
  res.status(200).json(envStatus);
}