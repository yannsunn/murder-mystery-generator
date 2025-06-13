/**
 * セキュリティユーティリティ - 商業品質のセキュリティ機能
 * 入力検証、サニタイゼーション、レート制限
 */

// レート制限のためのメモリストア（本番環境ではRedisなどを使用）
const rateLimitStore = new Map();

/**
 * 入力データの検証とサニタイゼーション
 */
export function validateAndSanitizeInput(data) {
  const errors = [];
  const sanitized = {};

  // participants の検証
  if (data.participants) {
    const participants = parseInt(data.participants);
    if (isNaN(participants) || participants < 3 || participants > 10) {
      errors.push('参加者数は3-10人の範囲で指定してください');
    } else {
      sanitized.participants = participants;
    }
  }

  // era の検証（許可された値のみ）
  const allowedEras = ['ancient', 'medieval', 'modern', 'contemporary', 'future'];
  if (data.era && allowedEras.includes(data.era)) {
    sanitized.era = data.era;
  } else {
    sanitized.era = 'modern'; // デフォルト値
  }

  // setting の検証
  const allowedSettings = ['mansion', 'hotel', 'school', 'office', 'island', 'train', 'ship', 'closed-space'];
  if (data.setting && allowedSettings.includes(data.setting)) {
    sanitized.setting = data.setting;
  } else {
    sanitized.setting = 'closed-space'; // デフォルト値
  }

  // incident_type の検証
  const allowedIncidents = ['murder', 'theft', 'disappearance', 'fraud', 'blackmail'];
  if (data.incident_type && allowedIncidents.includes(data.incident_type)) {
    sanitized.incident_type = data.incident_type;
  } else {
    sanitized.incident_type = 'murder'; // デフォルト値
  }

  // worldview の検証
  const allowedWorldviews = ['realistic', 'fantasy', 'sci-fi', 'historical', 'supernatural'];
  if (data.worldview && allowedWorldviews.includes(data.worldview)) {
    sanitized.worldview = data.worldview;
  } else {
    sanitized.worldview = 'realistic'; // デフォルト値
  }

  // tone の検証
  const allowedTones = ['serious', 'light', 'dark', 'comedic', 'dramatic'];
  if (data.tone && allowedTones.includes(data.tone)) {
    sanitized.tone = data.tone;
  } else {
    sanitized.tone = 'serious'; // デフォルト値
  }

  return { errors, sanitized };
}

/**
 * テキストのサニタイゼーション
 */
export function sanitizeText(text) {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // script タグの削除
    .replace(/<[^>]+>/g, '') // HTMLタグの削除
    .replace(/[<>'"&]/g, (match) => { // 特殊文字のエスケープ
      const escapeMap = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match];
    })
    .substring(0, 10000); // 最大長制限
}

/**
 * レート制限チェック
 */
export function checkRateLimit(clientIP, endpoint) {
  const key = `${clientIP}:${endpoint}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分間
  const maxRequests = 10; // 1分間に10回まで

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  const record = rateLimitStore.get(key);
  
  if (now > record.resetTime) {
    // ウィンドウをリセット
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: record.resetTime
    };
  }

  record.count++;
  return { 
    allowed: true, 
    remaining: maxRequests - record.count 
  };
}

/**
 * セキュアなエラーレスポンス
 */
export function createErrorResponse(error, statusCode = 500) {
  // 本番環境では詳細なエラー情報を隠す
  const isProduction = process.env.NODE_ENV === 'production';
  
  const errorResponse = {
    success: false,
    error: isProduction ? 'An error occurred' : error.message,
    timestamp: new Date().toISOString()
  };

  // 開発環境でのみスタックトレースを含める
  if (!isProduction && error.stack) {
    errorResponse.stack = error.stack;
  }

  return { status: statusCode, body: errorResponse };
}

/**
 * セキュアなレスポンスヘッダーの設定
 */
export function setSecurityHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

/**
 * リクエストの検証
 */
export function validateRequest(req) {
  const errors = [];

  // Content-Type の検証
  if (req.method === 'POST' && !req.headers['content-type']?.includes('application/json')) {
    errors.push('Content-Type must be application/json');
  }

  // リクエストサイズの制限
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength) > 1024 * 1024) { // 1MB制限
    errors.push('Request body too large');
  }

  // User-Agent の検証（空の場合は疑わしい）
  if (!req.headers['user-agent']) {
    errors.push('User-Agent header is required');
  }

  return errors;
}

/**
 * IPアドレスの取得
 */
export function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
         '0.0.0.0';
}

/**
 * セキュアなAPI応答の作成
 */
export function createSecureResponse(data, statusCode = 200) {
  return {
    status: statusCode,
    body: {
      success: true,
      data: sanitizeText(JSON.stringify(data)),
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };
}

/**
 * 共通エラーハンドラー
 */
export async function handleSecureError(error, req, res, operation = 'unknown') {
  const clientIP = getClientIP(req);
  const timestamp = new Date().toISOString();
  
  // エラーログ記録（本番環境では適切なログサービスに送信）
  const errorLog = {
    timestamp,
    operation,
    clientIP,
    userAgent: req.headers['user-agent'],
    error: error.message,
    stack: error.stack
  };
  
  if (process.env.NODE_ENV !== 'production') {
    console.error('🚨 Security Error:', errorLog);
  }

  const { status, body } = createErrorResponse(error);
  return res.status(status).json(body);
}

/**
 * 共通のAPIハンドラーラッパー
 */
export function withSecurity(handler, endpoint = 'unknown') {
  return async (req, res) => {
    try {
      // セキュリティヘッダーの設定
      setSecurityHeaders(res);

      // OPTIONS リクエストの処理
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      // メソッドの検証
      if (req.method !== 'POST') {
        return res.status(405).json({
          success: false,
          error: 'Method not allowed'
        });
      }

      // リクエストの検証
      const requestErrors = validateRequest(req);
      if (requestErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          details: requestErrors
        });
      }

      // レート制限チェック
      const clientIP = getClientIP(req);
      const rateLimit = checkRateLimit(clientIP, endpoint);
      
      res.setHeader('X-RateLimit-Remaining', rateLimit.remaining.toString());
      
      if (!rateLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded',
          resetTime: rateLimit.resetTime
        });
      }

      // 実際のハンドラーを実行
      return await handler(req, res);

    } catch (error) {
      return await handleSecureError(error, req, res, endpoint);
    }
  };
}

// Netlify Functions handler export
export const handler = async (event, context) => {
  return createSecureResponse({
    message: 'Security utilities loaded',
    timestamp: new Date().toISOString()
  });
};