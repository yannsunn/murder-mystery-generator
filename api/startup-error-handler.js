/**
 * 🚀 ERROR HANDLER STARTUP
 * 統一エラーハンドリングシステムの初期化スクリプト
 */

const { initializeProjectErrorHandling } = require('./utils/error-handler-integration.js');
const { logger } = require('./utils/logger.js');

/**
 * エラーハンドリングシステムの初期化
 */
async function initializeErrorHandling() {
  try {
    logger.info('🚀 Initializing Unified Error Handling System...');
    
    // プロジェクト向けエラーハンドリング設定
    const errorSystem = initializeProjectErrorHandling();
    
    // 初期化完了ログ
    logger.success('✅ Unified Error Handling System initialized successfully');
    logger.info('📊 Error Handler Stats:', errorSystem.errorHandler.getStatistics());
    
    return errorSystem;
    
  } catch (error) {
    logger.critical('❌ Failed to initialize error handling system:', error);
    throw error;
  }
}

// 自動初期化（モジュール読み込み時）
let errorSystem = null;
(async () => {
  try {
    errorSystem = await initializeErrorHandling();
  } catch (error) {
    console.error('Critical: Error handling system initialization failed:', error);
    process.exit(1);
  }
})();

module.exports = {
  initializeErrorHandling,
  getErrorSystem: () => errorSystem
};