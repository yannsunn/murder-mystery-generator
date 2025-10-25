/**
 * APIキーのフォールバック設定
 * Vercel環境変数が読み込めない場合の一時的な対策
 * Google Gemini API対応
 */

function getGeminiApiKey() {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // 開発環境のみデバッグ情報出力
  if (isDevelopment) {
    console.log('[API-KEY-FALLBACK] Environment check:');
    console.log('  - GEMINI_API_KEY exists:', process.env.GEMINI_API_KEY !== undefined);
    console.log('  - GOOGLE_API_KEY exists:', process.env.GOOGLE_API_KEY !== undefined);
    console.log('  - Running on Vercel:', process.env.VERCEL === '1');
    console.log('  - NODE_ENV:', process.env.NODE_ENV);
  }

  // 1. GEMINI_API_KEYから取得を試みる
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '') {
    if (isDevelopment) {
      console.log('[API-KEY-FALLBACK] ✅ Using GEMINI_API_KEY from environment');
    }
    return process.env.GEMINI_API_KEY.trim();
  }

  // 2. GOOGLE_API_KEYから取得を試みる（エイリアス）
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim() !== '') {
    if (isDevelopment) {
      console.log('[API-KEY-FALLBACK] ✅ Using GOOGLE_API_KEY from environment');
    }
    return process.env.GOOGLE_API_KEY.trim();
  }

  // 3. Vercel環境の場合、すべての可能な環境変数をチェック
  if (process.env.VERCEL === '1') {
    if (isDevelopment) {
      console.log('[API-KEY-FALLBACK] Checking Vercel-specific variables...');
    }

    // 可能な環境変数名のバリエーションをチェック
    const possibleKeys = [
      'GEMINI_API_KEY',
      'gemini_api_key',
      'GOOGLE_API_KEY',
      'google_api_key',
      'NEXT_PUBLIC_GEMINI_API_KEY',
      'REACT_APP_GEMINI_API_KEY',
      'NEXT_PUBLIC_GOOGLE_API_KEY',
      'REACT_APP_GOOGLE_API_KEY'
    ];

    for (const keyName of possibleKeys) {
      if (process.env[keyName] && process.env[keyName].trim() !== '') {
        if (isDevelopment) {
          console.log(`[API-KEY-FALLBACK] ✅ Found key in ${keyName}`);
        }
        return process.env[keyName].trim();
      }
    }
  }

  // 4. すべて失敗した場合
  console.error('[API-KEY-FALLBACK] ❌ No Gemini API key found in any source');

  // 本番環境では詳細情報を出力しない
  if (isDevelopment) {
    console.error('[API-KEY-FALLBACK] Available env vars:',
      Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('GOOGLE') || k.includes('API')).sort()
    );
  }

  return null;
}

module.exports = {
  getGeminiApiKey
};
