// シンプルなマーダーミステリー生成API（CommonJS版）
module.exports = async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // 環境変数チェック
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'Service configuration error',
        message: 'AI service is temporarily unavailable'
      });
    }
    
    // リクエストパラメータ取得
    const { formData, sessionId } = req.method === 'GET' ? req.query : req.body;
    
    // EventSource対応
    if (req.headers.accept?.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      // 開始メッセージ送信
      res.write('data: {"type":"start","message":"生成を開始します"}\n\n');
      
      // ここで実際の生成処理を実行
      // 簡略化のため、サンプルレスポンスを返す
      setTimeout(() => {
        res.write('data: {"type":"progress","message":"ストーリー生成中...","progress":50}\n\n');
      }, 1000);
      
      setTimeout(() => {
        res.write('data: {"type":"complete","message":"生成完了","result":{"title":"テストシナリオ"}}\n\n');
        res.end();
      }, 2000);
      
      return;
    }
    
    // 通常のJSONレスポンス
    res.status(200).json({
      success: true,
      message: 'Generator API is ready',
      sessionId: sessionId || 'test-session',
      formData: formData || {},
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
};