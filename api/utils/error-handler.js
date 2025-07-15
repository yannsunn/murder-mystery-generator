/**
 * シンプルなエラーハンドリングシステム
 */

/**
 * エラータイプ定義
 */
const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  API: 'API_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  INTERNAL: 'INTERNAL_ERROR'
};

/**
 * シンプルなエラークラス
 */
class AppError extends Error {
  constructor(message, type = ErrorTypes.INTERNAL, statusCode = 500) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

/**
 * エラーハンドラーミドルウェア
 */
function withErrorHandler(handler) {
  return async (req, res) => {
    try {
      const result = await handler(req, res);
      
      if (!res.headersSent && result) {
        return res.json(result);
      }
      
      return result;
    } catch (error) {
      return handleError(error, req, res);
    }
  };
}

/**
 * エラーハンドリング
 */
function handleError(error, req, res) {
  console.error('Error:', error.message);
  
  const statusCode = error.statusCode || 500;
  const errorResponse = {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      type: error.type || ErrorTypes.INTERNAL
    }
  };
  
  if (!res.headersSent) {
    return res.status(statusCode).json(errorResponse);
  }
  
  return errorResponse;
}

/**
 * エラー検証とラッピング
 */
function validateAndWrapError(error, defaultMessage = 'An error occurred') {
  if (error instanceof AppError) {
    return error;
  }
  
  return new AppError(defaultMessage, ErrorTypes.INTERNAL, 500);
}

// CommonJS形式でエクスポート
module.exports = {
  ErrorTypes,
  AppError,
  withErrorHandler,
  handleError,
  validateAndWrapError,
  createErrorResponse: validateAndWrapError
};