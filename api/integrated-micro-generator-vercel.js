/**
 * Vercel用の統合マイクロ生成システム
 * ES Modules形式でexport
 */

export default async function handler(req, res) {
  // 環境変数の直接確認
  console.log('[VERCEL] Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    GROQ_KEY_EXISTS: !!process.env.GROQ_API_KEY,
    GROQ_KEY_LENGTH: process.env.GROQ_API_KEY?.length || 0,
    GROQ_KEY_PREFIX: process.env.GROQ_API_KEY?.substring(0, 10) || 'NOT_SET'
  });

  // CORSヘッダーの設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-access-key');

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 環境変数の確認
    const groqKey = process.env.GROQ_API_KEY;
    
    if (!groqKey) {
      return res.status(503).json({
        success: false,
        error: {
          message: 'GROQ_API_KEY is not configured in Vercel environment variables',
          code: 'CONFIGURATION_ERROR',
          details: {
            vercel: !!process.env.VERCEL,
            nodeEnv: process.env.NODE_ENV,
            hint: 'Please check your Vercel dashboard environment variables settings'
          }
        }
      });
    }

    // CommonJSモジュールを動的にインポート
    const mainHandler = await import('./integrated-micro-generator.js');
    
    // handlerが存在するか確認
    if (mainHandler.default) {
      return await mainHandler.default(req, res);
    } else if (mainHandler.handler) {
      return await mainHandler.handler(req, res);
    } else {
      // 直接実行
      return await mainHandler(req, res);
    }
    
  } catch (error) {
    console.error('[VERCEL ERROR]', error);
    
    return res.status(500).json({
      success: false,
      error: {
        message: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
        stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
      }
    });
  }
}

// Vercelの設定
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
  },
  maxDuration: 120, // 2分のタイムアウト
};