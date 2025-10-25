/**
 * 🚀 統一レスポンスハンドラー - API一貫性の確保
 * 全APIで統一されたレスポンス形式とエラーハンドリング
 */

const { logger } = require('./logger.js');

/**
 * 統一レスポンス形式
 */
function createSuccessResponse(content, metadata = {}) {
  return {
    success: true,
    content,
    metadata: {
      timestamp: new Date().toISOString(),
      processingTime: metadata.processingTime || '0ms',
      provider: metadata.provider || 'unknown',
      model: metadata.model || 'unknown',
      ...metadata
    }
  };
}

/**
 * 統一エラーレスポンス
 */
function createErrorResponse(error, _statusCode = 500) {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    success: false,
    error: isProduction ? 'An error occurred' : error.message,
    timestamp: new Date().toISOString(),
    // 開発環境でのみスタックトレースを含める
    ...(isProduction ? {} : { stack: error.stack })
  };
}

/**
 * 統一CORSヘッダー設定
 */
function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
}

/**
 * 統一APIハンドラーラッパー
 */
function withStandardHandler(handler, endpointName = 'unknown') {
  return async (req, res) => {
    const startTime = Date.now();
    
    try {
      // CORS設定
      setCORSHeaders(res);

      // OPTIONS リクエストの処理
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      // メソッドの検証
      if (req.method !== 'POST') {
        const errorResponse = createErrorResponse(new Error('Method not allowed'), 405);
        return res.status(405).json(errorResponse);
      }

      // 実際のハンドラーを実行
      const result = await handler(req, res);
      
      // 既にレスポンスが送信されている場合はスキップ
      if (res.headersSent) {
        return result;
      }

      // 成功レスポンスの統一形式化
      if (result && !result.success && !result.error) {
        const successResponse = createSuccessResponse(result, {
          processingTime: `${Date.now() - startTime}ms`,
          endpoint: endpointName
        });
        return res.status(200).json(successResponse);
      }

      return result;

    } catch (error) {
      logger.error(`[${endpointName}] Error:`, error);
      
      const errorResponse = createErrorResponse(error);
      errorResponse.metadata = {
        endpoint: endpointName,
        processingTime: `${Date.now() - startTime}ms`
      };
      
      return res.status(500).json(errorResponse);
    }
  };
}

/**
 * 入力検証ヘルパー
 */
function validateRequiredFields(data, requiredFields) {
  const errors = [];
  
  for (const field of requiredFields) {
    if (!data || data[field] === undefined || data[field] === null) {
      errors.push(`${field} is required`);
    }
  }
  
  return errors;
}

/**
 * レスポンス送信ヘルパー
 */
function sendResponse(res, data, statusCode = 200) {
  if (res.headersSent) {
    return;
  }
  
  setCORSHeaders(res);
  return res.status(statusCode).json(data);
}

module.exports = {
  createSuccessResponse,
  createErrorResponse,
  setCORSHeaders,
  withStandardHandler,
  validateRequiredFields,
  sendResponse
};