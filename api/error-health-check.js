/**
 * 🩺 ERROR HANDLING HEALTH CHECK
 * エラーハンドリングシステムのヘルスチェックエンドポイント
 */

const { withApiErrorHandling, performErrorHandlingHealthCheck } = require('./utils/error-handler-integration.js');
const { 
  unifiedErrorHandler, 
  getErrorDashboardData,
  getErrorHandlerHealth 
} = require('./utils/error-handler.js');
const { logger } = require('./utils/logger.js');

/**
 * エラーハンドリングシステムのヘルスチェック
 */
const handler = withApiErrorHandling(async (req, res) => {
  const startTime = Date.now();
  
  try {
    logger.info('🩺 Error handling health check requested');
    
    // 詳細なヘルスチェック実行
    const healthCheck = await performErrorHandlingHealthCheck();
    
    // ダッシュボードデータ取得
    const dashboardData = getErrorDashboardData();
    
    // エラーハンドラーのヘルス情報取得
    const errorHandlerHealth = getErrorHandlerHealth();
    
    // 統合ヘルスレポート
    const healthReport = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      processingTime: `${Date.now() - startTime}ms`,
      version: '1.0.0',
      
      // システム全体のヘルス
      systemHealth: healthCheck,
      
      // エラーハンドラーのヘルス
      errorHandlerHealth,
      
      // ダッシュボードデータ
      dashboard: dashboardData,
      
      // 追加メトリクス
      metrics: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    // 問題があれば overall status を更新
    if (healthCheck.status !== 'healthy' || errorHandlerHealth.status !== 'healthy') {
      healthReport.status = 'unhealthy';
    }
    
    logger.info('✅ Error handling health check completed');
    
    return {
      success: true,
      data: healthReport,
      metadata: {
        endpoint: 'error-health-check',
        processingTime: `${Date.now() - startTime}ms`,
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    logger.error('❌ Error handling health check failed:', error);
    throw error;
  }
}, {
  context: { 
    service: 'ERROR_HEALTH_CHECK',
    version: '1.0.0'
  }
});

module.exports = handler;