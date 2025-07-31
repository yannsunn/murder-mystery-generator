/**
 * 環境変数初期化モジュール
 * Vercel環境で確実に環境変数を読み込む
 */

// Vercel環境での環境変数初期化
function initializeEnvironment() {
  const requiredVars = ['GROQ_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
  const missing = [];
  
  console.log('[INIT-ENV] Starting environment initialization...');
  console.log('[INIT-ENV] Current environment:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV
  });
  
  // 必要な環境変数をチェック
  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      // 大文字小文字の違いを考慮して再チェック
      const found = Object.keys(process.env).find(k => k.toUpperCase() === varName.toUpperCase());
      if (found) {
        process.env[varName] = process.env[found];
        console.log(`[INIT-ENV] Found ${varName} as ${found}`);
      } else {
        missing.push(varName);
      }
    } else {
      console.log(`[INIT-ENV] ✓ ${varName} is set`);
    }
  });
  
  if (missing.length > 0) {
    console.error('[INIT-ENV] Missing environment variables:', missing);
  }
  
  // GROQ APIキーの詳細確認
  if (process.env.GROQ_API_KEY) {
    console.log('[INIT-ENV] GROQ_API_KEY details:', {
      exists: true,
      length: process.env.GROQ_API_KEY.length,
      prefix: process.env.GROQ_API_KEY.substring(0, 8) + '...'
    });
  }
  
  return {
    initialized: true,
    missing,
    timestamp: new Date().toISOString()
  };
}

// 即座に実行
const initResult = initializeEnvironment();

module.exports = {
  initializeEnvironment,
  initResult
};