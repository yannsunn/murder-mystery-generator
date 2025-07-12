/**
 * 🛡️ Advanced Rate Limiting & Security Middleware
 * 高度なレート制限とセキュリティ強化システム
 */

import { envManager } from '../config/env-manager.js';

// レート制限設定（個人利用・コスト重視）
const RATE_LIMITS = {
  generation: {
    windowMs: 24 * 60 * 60 * 1000, // 24時間
    maxRequests: 10, // 1日10回まで（約500円制限）
    message: '1日の生成制限に達しました。明日再度お試しください。',
    skipSuccessfulRequests: false
  },
  api: {
    windowMs: 1 * 60 * 1000, // 1分
    maxRequests: 60, // 60回まで
    message: 'Too many API requests. Please slow down.',
    skipSuccessfulRequests: true
  },
  health: {
    windowMs: 1 * 60 * 1000, // 1分
    maxRequests: 120, // 120回まで（ヘルスチェックは高頻度OK）
    message: 'Health check rate limit exceeded.',
    skipSuccessfulRequests: true
  }
};

// IPベースの制限ストレージ（プロダクションではRedis推奨）
const rateLimitStore = new Map();

/**
 * レート制限の実装
 */
export class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || RATE_LIMITS.api.windowMs;
    this.maxRequests = options.maxRequests || RATE_LIMITS.api.maxRequests;
    this.message = options.message || RATE_LIMITS.api.message;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.keyGenerator = options.keyGenerator || this.defaultKeyGenerator;
  }

  /**
   * デフォルトキー生成（IP + User-Agent）
   */
  defaultKeyGenerator(req) {
    const ip = this.getClientIP(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    return `${ip}:${this.hashString(userAgent)}`;
  }

  /**
   * クライアントIP取得（プロキシ対応）
   */
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
  }

  /**
   * 文字列ハッシュ化
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * レート制限チェック
   */
  checkLimit(req) {
    const key = this.keyGenerator(req);
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // 古いエントリをクリーンアップ
    this.cleanupOldEntries(windowStart);

    // 現在のキーの履歴を取得
    const requests = rateLimitStore.get(key) || [];
    
    // ウィンドウ内のリクエストのみフィルタ
    const validRequests = requests.filter(timestamp => timestamp > windowStart);

    // 制限チェック
    if (validRequests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const resetTime = oldestRequest + this.windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: resetTime,
        retryAfter,
        message: this.message
      };
    }

    // リクエストを記録
    validRequests.push(now);
    rateLimitStore.set(key, validRequests);

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - validRequests.length,
      reset: now + this.windowMs,
      retryAfter: 0
    };
  }

  /**
   * 古いエントリのクリーンアップ
   */
  cleanupOldEntries(windowStart) {
    for (const [key, requests] of rateLimitStore.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length === 0) {
        rateLimitStore.delete(key);
      } else if (validRequests.length < requests.length) {
        rateLimitStore.set(key, validRequests);
      }
    }
  }

  /**
   * Express/Vercel ミドルウェア
   */
  middleware() {
    return (req, res, next) => {
      const result = this.checkLimit(req);

      // レスポンスヘッダーを設定
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.reset);

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfter);
        res.status(429).json({
          success: false,
          error: result.message,
          retryAfter: result.retryAfter,
          resetTime: result.reset
        });
        return;
      }

      // 成功時の処理
      if (this.skipSuccessfulRequests) {
        // 成功レスポンス時に記録を削除
        res.on('finish', () => {
          if (res.statusCode < 400) {
            const key = this.keyGenerator(req);
            const requests = rateLimitStore.get(key) || [];
            if (requests.length > 0) {
              requests.pop(); // 最新のリクエストを削除
              rateLimitStore.set(key, requests);
            }
          }
        });
      }

      next?.();
    };
  }
}

/**
 * 事前定義されたレート制限設定
 */
export const rateLimiters = {
  generation: new RateLimiter(RATE_LIMITS.generation),
  api: new RateLimiter(RATE_LIMITS.api),
  health: new RateLimiter(RATE_LIMITS.health)
};

/**
 * IP whitelist機能
 */
export class IPWhitelist {
  constructor() {
    this.whitelist = new Set([
      '127.0.0.1',
      '::1',
      'localhost'
    ]);
    
    // 環境変数から追加のホワイトリストを読み込み
    const envWhitelist = envManager.get('IP_WHITELIST');
    if (envWhitelist) {
      envWhitelist.split(',').forEach(ip => this.whitelist.add(ip.trim()));
    }
  }

  isWhitelisted(ip) {
    return this.whitelist.has(ip);
  }

  middleware() {
    return (req, res, next) => {
      const ip = new RateLimiter().getClientIP(req);
      
      if (this.isWhitelisted(ip)) {
        res.setHeader('X-IP-Whitelisted', 'true');
      }
      
      next?.();
    };
  }
}

/**
 * 不正アクセス検知
 */
export class SecurityMonitor {
  constructor() {
    this.suspiciousIPs = new Map();
    this.blockedIPs = new Set();
  }

  detectSuspiciousActivity(req, rateLimitResult) {
    const ip = new RateLimiter().getClientIP(req);
    
    if (!rateLimitResult.allowed) {
      const violations = this.suspiciousIPs.get(ip) || 0;
      this.suspiciousIPs.set(ip, violations + 1);

      // 5回以上の制限違反で自動ブロック
      if (violations >= 5) {
        this.blockedIPs.add(ip);
        
        // 管理者通知（実装予定）
        this.notifyAdmin(ip, violations + 1);
      }
    }
  }

  isBlocked(ip) {
    return this.blockedIPs.has(ip);
  }

  async notifyAdmin(ip, violations) {
    // Slack/Discord/Email通知の実装予定
  }

  middleware() {
    return (req, res, next) => {
      const ip = new RateLimiter().getClientIP(req);
      
      if (this.isBlocked(ip)) {
        res.status(403).json({
          success: false,
          error: 'IP address has been blocked due to suspicious activity'
        });
        return;
      }
      
      next?.();
    };
  }
}

// シングルトンインスタンス
export const ipWhitelist = new IPWhitelist();
export const securityMonitor = new SecurityMonitor();

/**
 * 統合セキュリティミドルウェア
 */
export function createSecurityMiddleware(type = 'api') {
  const rateLimiter = rateLimiters[type] || rateLimiters.api;
  
  return (req, res, next) => {
    // IPブロックチェック
    const ip = rateLimiter.getClientIP(req);
    if (securityMonitor.isBlocked(ip)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // ホワイトリストチェック
    if (ipWhitelist.isWhitelisted(ip)) {
      return next?.();
    }

    // レート制限チェック
    const rateLimitResult = rateLimiter.checkLimit(req);
    
    // レスポンスヘッダー設定
    res.setHeader('X-RateLimit-Limit', rateLimitResult.limit);
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.setHeader('X-RateLimit-Reset', rateLimitResult.reset);

    if (!rateLimitResult.allowed) {
      // 不正アクセス検知
      securityMonitor.detectSuspiciousActivity(req, rateLimitResult);
      
      res.setHeader('Retry-After', rateLimitResult.retryAfter);
      return res.status(429).json({
        success: false,
        error: rateLimitResult.message,
        retryAfter: rateLimitResult.retryAfter,
        resetTime: rateLimitResult.reset
      });
    }

    next?.();
  };
}