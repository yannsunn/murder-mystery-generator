/**
 * APIキーのフォールバック設定
 * Vercel環境変数が読み込めない場合の一時的な対策
 */

function getGroqApiKey() {
  // デバッグ情報を詳細に出力
  console.log('[API-KEY-FALLBACK] Environment check:');
  console.log('  - GROQ_API_KEY exists:', process.env.GROQ_API_KEY !== undefined);
  console.log('  - GROQ_API_KEY empty:', process.env.GROQ_API_KEY === '');
  console.log('  - GROQ_API_KEY length:', process.env.GROQ_API_KEY?.length || 0);
  console.log('  - Running on Vercel:', process.env.VERCEL === '1');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  
  // 1. 環境変数から取得を試みる
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim() !== '') {
    console.log('[API-KEY-FALLBACK] ✅ Using GROQ_API_KEY from environment');
    return process.env.GROQ_API_KEY.trim();
  }
  
  // 2. Vercel環境の場合、すべての可能な環境変数をチェック
  if (process.env.VERCEL === '1') {
    console.log('[API-KEY-FALLBACK] Checking Vercel-specific variables...');
    
    // 可能な環境変数名のバリエーションをチェック
    const possibleKeys = [
      'GROQ_API_KEY',
      'groq_api_key',
      'NEXT_PUBLIC_GROQ_API_KEY',
      'REACT_APP_GROQ_API_KEY'
    ];
    
    for (const keyName of possibleKeys) {
      if (process.env[keyName] && process.env[keyName].trim() !== '') {
        console.log(`[API-KEY-FALLBACK] ✅ Found key in ${keyName}`);
        return process.env[keyName].trim();
      }
    }
  }
  
  // 3. すべて失敗した場合
  console.error('[API-KEY-FALLBACK] ❌ No API key found in any source');
  console.error('[API-KEY-FALLBACK] Available env vars:', Object.keys(process.env).filter(k => k.includes('GROQ') || k.includes('API')).sort());
  return null;
}

module.exports = {
  getGroqApiKey
};