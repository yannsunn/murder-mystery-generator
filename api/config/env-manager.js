/**
 * 🔧 Environment Variable Management System
 * 限界突破: 型安全な環境変数管理とvalidation
 */

// Load environment variables from .env file with error handling
try {
  require('dotenv').config();
} catch (e) {
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
    allowed: ['development', 'production', 'test', 'staging'], // Added staging support
    description: 'Application environment'
  },
  
  // Security
  RATE_LIMIT_WINDOW_MS: {
    type: 'number',
    required: false,
    fallback: 900000, // 15分
    description: 'Rate limiting window in milliseconds'
  },
  RATE_LIMIT_MAX_REQUESTS: {
    type: 'number',
    required: false,
    fallback: 10,
    description: 'Maximum requests per window'
  },
  
  // Performance
  MAX_GENERATION_TIME: {
    type: 'number',
    required: false,
    fallback: 90000, // 90秒
    description: 'Maximum generation time in milliseconds'
  },
  MAX_STORAGE_SIZE: {
    type: 'number',
    required: false,
    fallback: 1000,
    description: 'Maximum storage entries before cleanup'
  },

  // Vercel/Deployment
  VERCEL_URL: {
    type: 'string',
    required: false,
    description: 'Vercel deployment URL'
  },
  
  // Debug/Logging
  DEBUG_MODE: {
    type: 'boolean',
    required: false,
    fallback: false,
    description: 'Enable detailed debug logging'
  },

  // Supabase Database
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
    description: 'Supabase service role key (admin)'
  }
};

/**
 * 環境変数の型変換
 */
function convertValue(value, type) {
  if (value === undefined || value === null) {
    return null;
  }

  switch (type) {
    case 'string':
      return String(value);
    case 'number':
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Cannot convert "${value}" to number`);
      }
      return num;
    case 'boolean':
      if (typeof value === 'boolean') return value;
      const str = String(value).toLowerCase();
      return str === 'true' || str === '1' || str === 'yes';
    default:
      return value;
  }
}

/**
 * 環境変数の検証
 */
function validateEnvVar(key, config, value) {
  const errors = [];

  // 必須チェック
  if (config.required && (value === undefined || value === null || value === '')) {
    errors.push(`${key} is required but not provided`);
    return errors;
  }

  // 値が存在しない場合、フォールバック値を使用
  if ((value === undefined || value === null || value === '') && config.fallback !== undefined) {
    return errors; // フォールバック値は後で設定
  }

  // 値が存在しない場合でrequiredでもfallbackでもない場合はスキップ
  if (value === undefined || value === null || value === '') {
    return errors;
  }

  // 許可値チェック
  if (config.allowed && !config.allowed.includes(value)) {
    errors.push(`${key} must be one of: ${config.allowed.join(', ')}, got: ${value}`);
  }

  // 型チェック（変換を試みる）
  try {
    convertValue(value, config.type);
  } catch (error) {
    errors.push(`${key} type validation failed: ${error.message}`);
  }

  return errors;
}

/**
 * 環境変数管理クラス
 */
class EnvManager {
  constructor() {
    this.config = {};
    this.errors = [];
    this.warnings = [];
    this.initialized = false;
  }

  /**
   * 初期化と検証
   */
  initialize() {
    
    this.errors = [];
    this.warnings = [];
    
    // 各環境変数を検証
    for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
      const value = process.env[key];
      const validationErrors = validateEnvVar(key, config, value);
      
      if (validationErrors.length > 0) {
        this.errors.push(...validationErrors);
        continue;
      }

      // 値の設定（フォールバック値も含む）
      let finalValue = value;
      if ((value === undefined || value === null || value === '') && config.fallback !== undefined) {
        finalValue = config.fallback;
        this.warnings.push(`${key} using fallback value: ${config.fallback}`);
      }

      // 型変換
      if (finalValue !== undefined && finalValue !== null && finalValue !== '') {
        try {
          this.config[key] = convertValue(finalValue, config.type);
        } catch (error) {
          this.errors.push(`${key} conversion failed: ${error.message}`);
        }
      }
    }

    // 結果のレポート
    this.reportInitialization();
    
    this.initialized = true;
    return this.errors.length === 0;
  }

  /**
   * 初期化結果のレポート
   */
  reportInitialization() {

    if (this.warnings.length > 0) {
    }

    if (this.errors.length > 0) {
    }

    if (this.config.DEBUG_MODE) {
      for (const [key, value] of Object.entries(this.config)) {
        // APIキーなどの機密情報をマスク
        const maskedValue = key.includes('KEY') || key.includes('SECRET') 
          ? `${String(value).substring(0, 3)}***` 
          : value;
      }
    }
  }

  /**
   * 設定値の取得
   */
  get(key) {
    if (!this.initialized) {
      throw new Error('EnvManager not initialized. Call initialize() first.');
    }
    
    return this.config[key];
  }

  /**
   * 設定値の存在確認
   */
  has(key) {
    return this.config.hasOwnProperty(key) && this.config[key] !== undefined;
  }

  /**
   * 必須設定の確認
   */
  isValid() {
    return this.initialized && this.errors.length === 0;
  }

  /**
   * エラー一覧の取得
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * 警告一覧の取得
   */
  getWarnings() {
    return [...this.warnings];
  }

  /**
   * .env.example ファイルの生成
   */
  generateEnvExample() {
    const lines = [
      '# 🎭 Murder Mystery Generator - Environment Variables',
      '# 環境変数設定ファイル',
      '',
      '# ============================================',
      '# AI Provider Settings (必須)',
      '# ============================================',
      '',
    ];

    for (const [key, config] of Object.entries(REQUIRED_ENV_VARS)) {
      lines.push(`# ${config.description}`);
      
      if (config.required) {
        lines.push(`${key}=your_${key.toLowerCase()}_here`);
      } else {
        const example = config.fallback !== undefined ? config.fallback : `your_${key.toLowerCase()}_here`;
        lines.push(`# ${key}=${example}`);
      }
      
      if (config.allowed) {
        lines.push(`# Allowed values: ${config.allowed.join(', ')}`);
      }
      
      lines.push('');
    }

    lines.push('# ============================================');
    lines.push('# Additional Notes');
    lines.push('# ============================================');
    lines.push('# 1. GROQ_API_KEY is required for AI generation');
    lines.push('# 2. OPENAI_API_KEY is optional fallback');
    lines.push('# 3. Set DEBUG_MODE=true for detailed logging');
    lines.push('# 4. Production settings should use environment-specific values');

    return lines.join('\n');
  }
}

// シングルトンインスタンス
const envManager = new EnvManager();

// CommonJS形式でエクスポート
module.exports = {
  envManager,
  REQUIRED_ENV_VARS
};