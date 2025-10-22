'use strict';
/**
 * 🔧 Environment Variable Management System - TypeScript版
 * 限界突破: 型安全な環境変数管理とvalidation
 */
Object.defineProperty(exports, '__esModule', { value: true });
exports.debugEnvironmentVariables = exports.getAllEnvironmentVariables = exports.hasEnvironmentVariable = exports.getEnvironmentVariable = exports.initializeEnvVars = exports.envManager = void 0;
// Load environment variables from .env file with error handling
try {
  require('dotenv').config();
}
catch (e) {
  // Dotenv might not be available in some environments (like Vercel)
  console.warn('dotenv not loaded:', e.message);
}
/**
 * 必須環境変数の定義
 */
const REQUIRED_ENV_VARS = {
  // AI Provider Keys
  GROQ_API_KEY: {
    type: 'string',
    required: false, // Made optional to prevent 500 errors
    fallback: '', // Empty fallback to handle missing key gracefully
    description: 'Groq AI API key for primary AI generation'
  },
  OPENAI_API_KEY: {
    type: 'string',
    required: false,
    description: 'OpenAI API key for fallback AI generation'
  },
  // Database
  DATABASE_URL: {
    type: 'string',
    required: false,
    fallback: 'sqlite://./data/scenarios.db',
    description: 'Database connection URL'
  },
  // Application Settings
  NODE_ENV: {
    type: 'string',
    required: false,
    fallback: 'development',
    allowed: ['development', 'production', 'test', 'staging'],
    description: 'Application environment'
  },
  // Security
  RATE_LIMIT_WINDOW_MS: {
    type: 'number',
    required: false,
    fallback: 900000, // 15 minutes
    description: 'Rate limiting window in milliseconds'
  },
  RATE_LIMIT_MAX_REQUESTS: {
    type: 'number',
    required: false,
    fallback: 100,
    description: 'Maximum requests per window'
  },
  // Performance
  MAX_GENERATION_TIME: {
    type: 'number',
    required: false,
    fallback: 30000, // 30 seconds
    description: 'Maximum time for AI generation in milliseconds'
  },
  // Features
  ENABLE_LOGGING: {
    type: 'boolean',
    required: false,
    fallback: true,
    description: 'Enable application logging'
  },
  ENABLE_CACHE: {
    type: 'boolean',
    required: false,
    fallback: true,
    description: 'Enable response caching'
  },
  // Supabase
  SUPABASE_URL: {
    type: 'string',
    required: false,
    description: 'Supabase project URL'
  },
  SUPABASE_ANON_KEY: {
    type: 'string',
    required: false,
    description: 'Supabase anonymous key'
  },
  SUPABASE_SERVICE_KEY: {
    type: 'string',
    required: false,
    description: 'Supabase service role key'
  },
  // Vercel specific
  VERCEL: {
    type: 'string',
    required: false,
    description: 'Vercel deployment indicator'
  },
  VERCEL_ENV: {
    type: 'string',
    required: false,
    allowed: ['development', 'preview', 'production'],
    description: 'Vercel environment'
  },
  VERCEL_REGION: {
    type: 'string',
    required: false,
    description: 'Vercel deployment region'
  }
};
/**
 * 型安全な環境変数管理クラス
 */
class EnvironmentManager {
  envVars = new Map();
  validationErrors = [];
  initialized = false;
  /**
     * 環境変数の初期化
     */
  initialize() {
    console.log('🔧 Initializing Environment Manager...');
    this.envVars.clear();
    this.validationErrors = [];
    // 各環境変数の検証と設定
    for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
      try {
        const value = this.validateAndGetEnvVar(key, config);
        this.envVars.set(key, value);
      }
      catch (error) {
        this.validationErrors.push(`${key}: ${error.message}`);
        // フォールバック値がある場合は使用
        if (config.fallback !== undefined) {
          this.envVars.set(key, config.fallback);
          console.warn(`⚠️  Using fallback for ${key}: ${config.fallback}`);
        }
      }
    }
    // 検証結果の出力
    if (this.validationErrors.length > 0) {
      console.warn('⚠️  Environment validation warnings:');
      this.validationErrors.forEach(error => console.warn(`  - ${error}`));
    }
    this.initialized = true;
    console.log(`✅ Environment Manager initialized with ${this.envVars.size} variables`);
  }
  /**
     * 環境変数の検証と取得
     */
  validateAndGetEnvVar(key, config) {
    const rawValue = process.env[key];
    // 必須チェック
    if (config.required && !rawValue) {
      throw new Error(`Required environment variable ${key} is missing`);
    }
    // 値が存在しない場合の処理
    if (!rawValue) {
      if (config.fallback !== undefined) {
        return config.fallback;
      }
      return null;
    }
    // 型変換
    let value = rawValue;
    switch (config.type) {
    case 'number':
      value = parseInt(rawValue, 10);
      if (isNaN(value)) {
        throw new Error(`Environment variable ${key} must be a number, got: ${rawValue}`);
      }
      break;
    case 'boolean':
      value = rawValue.toLowerCase() === 'true';
      break;
    case 'string':
      // そのまま使用
      break;
    }
    // 許可値チェック
    if (config.allowed && !config.allowed.includes(value)) {
      throw new Error(`Environment variable ${key} must be one of: ${config.allowed.join(', ')}, got: ${value}`);
    }
    return value;
  }
  get(key) {
    if (!this.initialized) {
      console.warn('⚠️  Environment Manager not initialized, calling initialize()');
      this.initialize();
    }
    const value = this.envVars.get(key);
    return value !== undefined ? value : null;
  }
  /**
     * 環境変数の存在確認
     */
  has(key) {
    if (!this.initialized) {
      this.initialize();
    }
    return this.envVars.has(key);
  }
  /**
     * すべての環境変数を取得
     */
  getAll() {
    if (!this.initialized) {
      this.initialize();
    }
    const result = {};
    for (const [key, value] of this.envVars) {
      result[key] = value;
    }
    return result;
  }
  /**
     * 環境変数の検証状態を取得
     */
  getValidationStatus() {
    return {
      isValid: this.validationErrors.length === 0,
      errors: [...this.validationErrors],
      totalVars: Object.keys(REQUIRED_ENV_VARS).length,
      validVars: this.envVars.size
    };
  }
  /**
     * デバッグ情報の生成
     */
  generateDebugInfo() {
    const groqKey = this.get('GROQ_API_KEY') || '';
    return {
      timestamp: new Date().toISOString(),
      runtime: {
        NODE_ENV: this.get('NODE_ENV') || 'unknown',
        VERCEL: this.get('VERCEL') || undefined,
        VERCEL_ENV: this.get('VERCEL_ENV') || undefined,
        VERCEL_REGION: this.get('VERCEL_REGION') || undefined
      },
      groqApiKey: {
        exists: !!groqKey,
        empty: !groqKey || groqKey.length === 0,
        length: groqKey.length,
        validPrefix: groqKey.startsWith('gsk_'),
        firstChars: groqKey ? groqKey.substring(0, 8) + '***' : 'none'
      },
      supabaseKeys: {
        url: this.has('SUPABASE_URL') ? 'SET' : 'NOT_SET',
        anonKey: this.has('SUPABASE_ANON_KEY') ? 'SET' : 'NOT_SET',
        serviceKey: this.has('SUPABASE_SERVICE_KEY') ? 'SET' : 'NOT_SET'
      },
      allEnvVarNames: Object.keys(process.env).sort()
    };
  }
  /**
     * 環境変数設定例の生成
     */
  generateEnvExample() {
    let example = '# 🚀 Murder Mystery Generator - Environment Variables\n';
    example += '# Copy this file to .env and fill in your values\n\n';
    const categories = {
      'AI Providers': ['GROQ_API_KEY', 'OPENAI_API_KEY'],
      'Database': ['DATABASE_URL'],
      'Application': ['NODE_ENV'],
      'Security': ['RATE_LIMIT_WINDOW_MS', 'RATE_LIMIT_MAX_REQUESTS'],
      'Performance': ['MAX_GENERATION_TIME'],
      'Features': ['ENABLE_LOGGING', 'ENABLE_CACHE'],
      'Supabase': ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_KEY']
    };
    for (const [category, keys] of Object.entries(categories)) {
      example += `# ${category}\n`;
      for (const key of keys) {
        const config = REQUIRED_ENV_VARS[key];
        if (config) {
          example += `# ${config.description}\n`;
          if (config.fallback !== undefined) {
            example += `${key}=${config.fallback}\n`;
          }
          else {
            example += `${key}=\n`;
          }
          example += '\n';
        }
      }
    }
    return example;
  }
  /**
     * 環境変数のリセット（テスト用）
     */
  reset() {
    this.envVars.clear();
    this.validationErrors = [];
    this.initialized = false;
  }
}
// シングルトンインスタンス
exports.envManager = new EnvironmentManager();
// 後方互換性のための関数エクスポート
const initializeEnvVars = () => exports.envManager.initialize();
exports.initializeEnvVars = initializeEnvVars;
const getEnvironmentVariable = (key) => exports.envManager.get(key);
exports.getEnvironmentVariable = getEnvironmentVariable;
const hasEnvironmentVariable = (key) => exports.envManager.has(key);
exports.hasEnvironmentVariable = hasEnvironmentVariable;
const getAllEnvironmentVariables = () => exports.envManager.getAll();
exports.getAllEnvironmentVariables = getAllEnvironmentVariables;
const debugEnvironmentVariables = () => exports.envManager.generateDebugInfo();
exports.debugEnvironmentVariables = debugEnvironmentVariables;
// TypeScript用のデフォルトエクスポート
exports.default = exports.envManager;
//# sourceMappingURL=env-manager.js.map