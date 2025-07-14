// シンプルなテスト生成API（CommonJS形式）
module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // 環境変数チェック
  if (!process.env.GROQ_API_KEY) {
    res.status(503).json({
      success: false,
      error: 'GROQ_API_KEY not configured',
      message: 'Please set GROQ_API_KEY in Vercel environment variables'
    });
    return;
  }
  
  res.status(200).json({
    success: true,
    message: 'Generator API is ready',
    groqKeyPresent: true,
    timestamp: new Date().toISOString()
  });
};