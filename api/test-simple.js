// 最もシンプルなテスト用エンドポイント

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const timestamp = new Date().toISOString();
    const groqKeyExists = !!process.env.GROQ_API_KEY;
    const openaiKeyExists = !!process.env.OPENAI_API_KEY;
    
    return res.status(200).json({
      status: 'SUCCESS',
      message: 'API endpoint is working perfectly!',
      timestamp,
      method: req.method,
      environment: {
        groq_key_configured: groqKeyExists,
        openai_key_configured: openaiKeyExists,
        node_version: process.version,
        platform: process.platform
      },
      test_data: {
        participants: '5',
        era: 'modern',
        setting: 'closed-space',
        incident_type: 'murder',
        worldview: 'realistic',
        tone: 'serious'
      }
    });
    
  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}