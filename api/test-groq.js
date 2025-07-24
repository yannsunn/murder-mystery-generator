/**
 * GROQ APIキーのテストエンドポイント
 * Vercelで環境変数が正しく読み込めるかテスト
 */

// Vercel Serverless Function形式
module.exports = async (req, res) => {
  // 即座に環境変数をチェック
  const groqKey = process.env.GROQ_API_KEY;
  
  // すべての環境変数のキーをリスト（値は表示しない）
  const allKeys = Object.keys(process.env).sort();
  const groqRelatedKeys = allKeys.filter(key => key.toLowerCase().includes('groq'));
  
  // レスポンス
  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      VERCEL: process.env.VERCEL || 'not on Vercel',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
      VERCEL_URL: process.env.VERCEL_URL || 'not set'
    },
    groqKey: {
      exists: !!groqKey,
      length: groqKey ? groqKey.length : 0,
      prefix: groqKey ? groqKey.substring(0, 10) + '...' : 'NOT SET',
      type: typeof groqKey
    },
    envKeys: {
      total: allKeys.length,
      groqRelated: groqRelatedKeys,
      sample: allKeys.slice(0, 20) // 最初の20個のキーを表示
    },
    directAccess: {
      // 直接アクセスのテスト
      bracket: !!process.env['GROQ_API_KEY'],
      dot: !!process.env.GROQ_API_KEY,
      // 大文字小文字のテスト
      lowercase: !!process.env.groq_api_key,
      uppercase: !!process.env.GROQ_API_KEY
    }
  });
};