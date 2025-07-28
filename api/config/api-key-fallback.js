/**
 * APIキーのフォールバック設定
 * Vercel環境変数が読み込めない場合の一時的な対策
 */

function getGroqApiKey() {
  // 1. 環境変数から取得を試みる
  if (process.env.GROQ_API_KEY) {
    console.log('[API-KEY-FALLBACK] Using GROQ_API_KEY from environment');
    return process.env.GROQ_API_KEY;
  }
  
  // 2. Vercel環境の場合、別の方法で試す
  if (process.env.VERCEL) {
    // Vercel Secretsを使用している場合
    const secretKey = process.env['GROQ_API_KEY'];
    if (secretKey) {
      console.log('[API-KEY-FALLBACK] Using GROQ_API_KEY from Vercel secrets');
      return secretKey;
    }
  }
  
  // 3. すべて失敗した場合
  console.error('[API-KEY-FALLBACK] No API key found in any source');
  return null;
}

module.exports = {
  getGroqApiKey
};