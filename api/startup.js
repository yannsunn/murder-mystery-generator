/**
 * 🚀 Application Startup & Environment Validation
 * アプリケーション起動時の環境変数検証
 */

const { envManager } = require('./config/env-manager.js');

/**
 * アプリケーション起動時の初期化
 */
function initializeApplication() {
  
  // 環境変数マネージャーの初期化
  const isValid = envManager.initialize();
  
  if (!isValid) {
    envManager.getErrors().forEach(error => {
    });
    
    
    // 開発環境では警告のみ、本番環境では停止
    if (envManager.get('NODE_ENV') === 'production') {
      process.exit(1);
    } else {
    }
  }
  
  return true;
}

/**
 * 起動時ヘルスチェック
 */
function healthCheck() {
  const checks = {
    envManager: envManager.isValid(),
    groqKey: envManager.has('GROQ_API_KEY'),
    nodeEnv: envManager.has('NODE_ENV')
  };
  
  const allHealthy = Object.values(checks).every(check => check);
  
  Object.entries(checks).forEach(([service, status]) => {
  });
  
  return allHealthy;
}

// 自動初期化（requireされた時に実行）
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  initializeApplication();
}

module.exports = {
  initializeApplication,
  healthCheck
};