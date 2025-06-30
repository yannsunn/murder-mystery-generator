/**
 * 🚀 統一エラーハンドリングシステム - 限界突破
 * 全APIエンドポイントで使用する統一エラー処理
 */

/**
 * エラータイプ定義
 */
export const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  API: 'API_ERROR',
  TIMEOUT: 'TIMEOUT_ERROR',
  AUTH: 'AUTHENTICATION_ERROR',
  RATE_LIMIT: 'RATE_LIMIT_ERROR',
  STORAGE: 'STORAGE_ERROR',
  GENERATION: 'GENERATION_ERROR',
  NETWORK: 'NETWORK_ERROR',
  INTERNAL: 'INTERNAL_ERROR'
};

/**
 * カスタムエラークラス
 */
export class AppError extends Error {
  constructor(message, type = ErrorTypes.INTERNAL, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    // スタックトレースを適切に設定
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  toJSON() {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV !== 'production' && { stack: this.stack })
    };
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, ErrorTypes.VALIDATION, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * API エラー
 */
export class APIError extends AppError {
  constructor(message, provider = 'unknown', details = null) {
    super(message, ErrorTypes.API, 502, { provider, ...details });
    this.name = 'APIError';
  }
}

/**
 * タイムアウトエラー
 */
export class TimeoutError extends AppError {
  constructor(operation = 'unknown', timeout = 0) {
    super(`Operation timed out: ${operation}`, ErrorTypes.TIMEOUT, 504, { operation, timeout });
    this.name = 'TimeoutError';
  }
}

/**
 * レート制限エラー
 */
export class RateLimitError extends AppError {
  constructor(resetTime = null) {
    super('Rate limit exceeded', ErrorTypes.RATE_LIMIT, 429, { resetTime });
    this.name = 'RateLimitError';
  }
}

/**
 * ストレージエラー
 */
export class StorageError extends AppError {
  constructor(message, operation = 'unknown') {
    super(message, ErrorTypes.STORAGE, 500, { operation });
    this.name = 'StorageError';
  }
}

/**
 * 統一エラーレスポンス作成
 */
export function createErrorResponse(error, req = null) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // エラー情報の構築
  let errorInfo = {
    success: false,
    timestamp: new Date().toISOString(),
    requestId: req?.headers['x-request-id'] || generateRequestId()
  };

  // AppError または派生クラスの場合
  if (error instanceof AppError) {
    errorInfo = {
      ...errorInfo,
      error: {
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        ...(error.details && { details: error.details })
      }
    };
  } else {
    // 一般的なエラーの場合
    errorInfo.error = {
      type: ErrorTypes.INTERNAL,
      message: isProduction ? 'Internal server error' : error.message,
      statusCode: 500
    };
  }

  // 開発環境でのみスタックトレースを含める
  if (!isProduction && error.stack) {
    errorInfo.error.stack = error.stack;
  }

  return errorInfo;
}

/**
 * 統一エラーハンドラーミドルウェア
 */
export function withErrorHandler(handler, operation = 'unknown') {
  return async (req, res) => {
    try {
      // リクエストIDの生成
      req.requestId = req.headers['x-request-id'] || generateRequestId();
      
      // 実際のハンドラーを実行
      const result = await handler(req, res);
      
      // レスポンスが既に送信されていない場合
      if (!res.headersSent && result) {
        return res.json(result);
      }
      
      return result;

    } catch (error) {
      return handleError(error, req, res, operation);
    }
  };
}

/**
 * エラーハンドリング実行
 */
export function handleError(error, req, res, operation = 'unknown') {
  // エラーログの記録
  logError(error, req, operation);
  
  // エラーレスポンスの作成
  const errorResponse = createErrorResponse(error, req);
  
  // ステータスコードの決定
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  
  // レスポンスヘッダーが送信済みでない場合のみレスポンス
  if (!res.headersSent) {
    return res.status(statusCode).json(errorResponse);
  }
  
  return errorResponse;
}

/**
 * エラーログ記録
 */
function logError(error, req = null, operation = 'unknown') {
  const logEntry = {
    timestamp: new Date().toISOString(),
    operation,
    error: {
      name: error.name,
      message: error.message,
      type: error.type || 'UNKNOWN',
      statusCode: error.statusCode || 500
    },
    request: req ? {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
      ip: getClientIP(req),
      requestId: req.requestId
    } : null
  };

  // 開発環境ではコンソールに出力
  if (process.env.NODE_ENV !== 'production') {
    console.error('🚨 Error Log:', JSON.stringify(logEntry, null, 2));
    if (error.stack) {
      console.error('Stack Trace:', error.stack);
    }
  }

  // 本番環境では適切なログサービスに送信
  // TODO: 実際のログサービス（CloudWatch、DataDog等）との統合
}

/**
 * クライアントIP取得
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         '0.0.0.0';
}

/**
 * リクエストID生成
 */
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 非同期エラーキャッチャー
 */
export function asyncCatch(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * エラー検証とラッピング
 */
export function validateAndWrapError(error, defaultMessage = 'An error occurred') {
  if (error instanceof AppError) {
    return error;
  }
  
  // 一般的なエラーパターンの検出
  if (error.name === 'AbortError') {
    return new TimeoutError('Request timeout');
  }
  
  if (error.message?.includes('fetch failed') || error.code === 'ECONNRESET') {
    return new AppError('Network connection error', ErrorTypes.NETWORK, 503);
  }
  
  if (error.message?.includes('API')) {
    return new APIError(error.message);
  }
  
  // デフォルトの内部エラー
  return new AppError(defaultMessage, ErrorTypes.INTERNAL, 500, {
    originalError: error.message
  });
}

/**
 * 複数エラーの集約
 */
export function aggregateErrors(errors, message = 'Multiple errors occurred') {
  const details = errors.map(error => ({
    type: error.type || 'UNKNOWN',
    message: error.message,
    ...(error.details && { details: error.details })
  }));
  
  return new AppError(message, ErrorTypes.VALIDATION, 400, { errors: details });
}