/**
 * セキュリティユーティリティ - 商業品質のセキュリティ機能
 * 入力検証、サニタイゼーション、レート制限
 */

const { envManager } = require('./config/env-manager.js');
const { createErrorResponse } = require('./utils/error-handler.js');

// 環境変数マネージャーの初期化（エラーハンドリング付き）
try {
  if (!envManager.initialized) {
    envManager.initialize();
  }
} catch (error) {
  console.warn('⚠️ EnvManager initialization warning:', error.message);
  // エラーが発生しても続行
}

// レート制限のためのメモリストア（本番環境ではRedisなどを使用）
const rateLimitStore = new Map();
// 環境変数は動的に取得するように変更
const getMaxRateLimitEntries = () => {
  try {
    return envManager.initialized ? (envManager.get('MAX_STORAGE_SIZE') || 10000) : 10000;
  } catch (e) {
    return 10000;
  }
};

// 定期的なクリーンアップ（5分毎）
const cleanupInterval = setInterval(() => {
  cleanupExpiredRateLimits();
}, 5 * 60 * 1000);

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  clearInterval(cleanupInterval);
  process.exit(0);
});

process.on('SIGTERM', () => {
  clearInterval(cleanupInterval);
  process.exit(0);
});

/**
 * 入力データの検証とサニタイゼーション
 */
function validateAndSanitizeInput(data) {
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
function sanitizeText(text) {
  if (typeof text !== 'string') {return '';}
  
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // script タグの削除
    .replace(/<[^>]+>/g, '') // HTMLタグの削除
    .replace(/[<>'"&]/g, (match) => { // 特殊文字のエスケープ
      const escapeMap = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '\'': '&#x27;',
        '&': '&amp;'
      };
      return escapeMap[match];
    })
    .substring(0, 10000); // 最大長制限
}

/**
 * レート制限チェック
 */
function checkRateLimit(clientIP, endpoint) {
  // free-plan-generatorはレート制限を緩和
  if (endpoint === 'free-plan-generation') {
    return { allowed: true, remaining: 9999 };
  }
  
  const key = `${clientIP}:${endpoint}`;
  const now = Date.now();
  // 環境変数を動的に取得
  let windowMs = 60000; // デフォルト1分間に緩和
  let maxRequests = 100; // デフォルト100リクエストに緩和
  
  try {
    if (envManager.initialized) {
      windowMs = envManager.get('RATE_LIMIT_WINDOW_MS') || 60000;
      maxRequests = envManager.get('RATE_LIMIT_MAX_REQUESTS') || 100;
    }
  } catch (e) {
    // エラーが発生してもデフォルト値を使用
  }

  // ストレージ容量制限チェック
  const maxEntries = getMaxRateLimitEntries();
  if (rateLimitStore.size > maxEntries) {
    cleanupOldestRateLimits();
  }

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

// createErrorResponse は error-handler.js から import して使用

/**
 * 期限切れレート制限エントリのクリーンアップ
 */
function cleanupExpiredRateLimits() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * 最古のレート制限エントリを削除（容量制限対応）
 */
function cleanupOldestRateLimits() {
  const entries = Array.from(rateLimitStore.entries())
    .sort(([,a], [,b]) => a.resetTime - b.resetTime);
  
  // 上位20%を削除
  const deleteCount = Math.floor(entries.length * 0.2);
  for (let i = 0; i < deleteCount; i++) {
    const [key] = entries[i];
    rateLimitStore.delete(key);
  }
}

/**
 * セキュアなレスポンスヘッダーの設定 (Vercel最適化版)
 */
function setSecurityHeaders(res) {
  // Vercel環境のCORS設定
  const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
    process.env.ALLOWED_ORIGINS.split(',') : ['*'];
  
  res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Requested-With');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // CSP ヘッダーの追加
  res.setHeader('Content-Security-Policy', 
    'default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'');
}

/**
 * リクエストの検証
 */
function validateRequest(req) {
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

  // User-Agent の検証（オプショナルに変更）
  // if (!req.headers['user-agent']) {
  //   errors.push('User-Agent header is required');
  // }

  return errors;
}

/**
 * IPアドレスの取得
 */
function getClientIP(req) {
  // Vercel環境ではreq.headersが未定義の場合があるため安全にアクセス
  if (!req || !req.headers) {
    return '0.0.0.0';
  }
  
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
function createSecureResponse(data, statusCode = 200) {
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
async function handleSecureError(error, req, res, operation = 'unknown') {
  const clientIP = getClientIP(req);
  const timestamp = new Date().toISOString();
  
  // エラーログ記録（本番環境では適切なログサービスに送信）
  const errorLog = {
    timestamp,
    operation,
    clientIP,
    userAgent: req.headers?.['user-agent'] || 'unknown',
    error: error.message,
    stack: error.stack
  };
  
  if (process.env.NODE_ENV !== 'production') {
    console.error('[SECURITY-ERROR]', errorLog);
  }

  // createErrorResponseは内部で適切にエラーを変換する
  const errorResponse = createErrorResponse(error);
  return res.status(error.statusCode || 500).json(errorResponse);
}

/**
 * 共通のAPIハンドラーラッパー
 */
function withSecurity(handler, endpoint = 'unknown') {
  return async (req, res) => {
    try {
      // セキュリティヘッダーの設定
      setSecurityHeaders(res);

      // OPTIONS リクエストの処理
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      // メソッドの検証
      if (req.method !== 'POST' && req.method !== 'GET') {
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

// Vercel Functions handler export
const handler = async (_event, _context) => {
  return createSecureResponse({
    message: 'Security utilities loaded',
    timestamp: new Date().toISOString()
  });
};

// CommonJS形式でエクスポート
module.exports = {
  validateAndSanitizeInput,
  sanitizeText,
  checkRateLimit,
  setSecurityHeaders,
  validateRequest,
  getClientIP,
  createSecureResponse,
  handleSecureError,
  withSecurity,
  handler
};