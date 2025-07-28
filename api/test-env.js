/**
 * 環境変数テスト用エンドポイント
 */

module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const envInfo = {
      GROQ_API_KEY: {
        exists: process.env.GROQ_API_KEY !== undefined,
        empty: process.env.GROQ_API_KEY === '',
        length: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0,
        prefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 10) + '...' : 'NOT SET'
      },
      VERCEL: process.env.VERCEL || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      allEnvKeys: Object.keys(process.env).filter(k => 
        k.includes('API') || 
        k.includes('KEY') || 
        k.includes('VERCEL') || 
        k.includes('NODE')
      ).sort(),
      timestamp: new Date().toISOString()
    };

    console.log('[TEST-ENV] Environment check:', envInfo);

    return res.status(200).json({
      success: true,
      message: 'Environment variables checked',
      env: envInfo
    });

  } catch (error) {
    console.error('[TEST-ENV] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};