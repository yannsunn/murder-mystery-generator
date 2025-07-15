// デバッグ用エンドポイント
module.exports = function handler(req, res) {
  try {
    // 環境変数チェック
    const envCheck = {
      GROQ_API_KEY: !!process.env.GROQ_API_KEY,
      GROQ_KEY_PREFIX: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 10) + '...' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'not set',
      VERCEL: !!process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set'
    };

    // モジュールローディングテスト
    let moduleTests = {};
    
    try {
      require('./utils/logger.js');
      moduleTests.logger = 'OK';
    } catch (e) {
      moduleTests.logger = `ERROR: ${e.message}`;
    }

    try {
      require('./utils/ai-client.js');
      moduleTests.aiClient = 'OK';
    } catch (e) {
      moduleTests.aiClient = `ERROR: ${e.message}`;
    }

    try {
      require('./utils/simple-auth.js');
      moduleTests.simpleAuth = 'OK';
    } catch (e) {
      moduleTests.simpleAuth = `ERROR: ${e.message}`;
    }

    try {
      require('./utils/error-handler.js');
      moduleTests.errorHandler = 'OK';
    } catch (e) {
      moduleTests.errorHandler = `ERROR: ${e.message}`;
    }

    try {
      require('./middleware/rate-limiter.js');
      moduleTests.rateLimiter = 'OK';
    } catch (e) {
      moduleTests.rateLimiter = `ERROR: ${e.message}`;
    }

    try {
      require('./config/env-manager.js');
      moduleTests.envManager = 'OK';
    } catch (e) {
      moduleTests.envManager = `ERROR: ${e.message}`;
    }

    try {
      require('./core/validation.js');
      moduleTests.validation = 'OK';
    } catch (e) {
      moduleTests.validation = `ERROR: ${e.message}`;
    }

    res.status(200).json({
      status: 'Debug info collected',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      moduleLoading: moduleTests,
      headers: req.headers,
      url: req.url,
      method: req.method
    });

  } catch (error) {
    res.status(500).json({
      error: 'Debug endpoint error',
      message: error.message,
      stack: error.stack
    });
  }
};