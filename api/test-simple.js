/**
 * 🧪 Simple Test API - 緊急テスト用エンドポイント
 * UI動作確認のための最小限のテストAPI
 */

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // OPTIONS リクエストの処理
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🧪 Test API called:', {
      method: req.method,
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent']
    });

    // 基本的なレスポンス
    const response = {
      success: true,
      status: 'API_ONLINE',
      message: 'Test API is working correctly',
      timestamp: new Date().toISOString(),
      method: req.method,
      endpoint: '/api/test-simple',
      data: {
        serverTime: new Date().toLocaleString('ja-JP'),
        environment: process.env.NODE_ENV || 'development',
        platform: process.platform || 'unknown'
      }
    };

    // POSTリクエストの場合、送信されたデータをエコーバック
    if (req.method === 'POST' && req.body) {
      response.receivedData = req.body;
      response.message = 'POST data received successfully';
    }

    console.log('✅ Test API response:', response);
    
    res.status(200).json(response);

  } catch (error) {
    console.error('❌ Test API error:', error);
    
    res.status(500).json({
      success: false,
      status: 'API_ERROR',
      message: 'Test API encountered an error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}