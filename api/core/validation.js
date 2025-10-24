/**
 * 🔒 UNIFIED INPUT VALIDATION - 統合検証システム
 * クライアント・サーバー共通の検証ロジック
 * XSS防止・入力検証・サニタイゼーション
 */

const { logger } = require('../utils/logger.js');

// 📋 統合検証ルール定義
const VALIDATION_RULES = {
  // フォームデータ検証
  formData: {
    participants: {
      type: 'number',
      min: 3,
      max: 10,
      required: true,
      description: '参加人数'
    },
    era: {
      type: 'string',
      enum: ['modern', 'showa', 'near-future', 'fantasy'],
      required: true,
      description: '時代背景'
    },
    setting: {
      type: 'string',
      enum: ['closed-space', 'mountain-villa', 'city', 'facility'],
      required: true,
      description: '舞台設定'
    },
    worldview: {
      type: 'string',
      maxLength: 500,
      required: false,
      description: '世界観設定'
    },
    tone: {
      type: 'string',
      enum: ['serious', 'light', 'horror', 'comedy'],
      required: true,
      description: 'トーン'
    },
    incident_type: {
      type: 'string',
      enum: ['murder', 'theft', 'disappearance', 'conspiracy'],
      required: true,
      description: '事件種類'
    },
    complexity: {
      type: 'string',
      enum: ['simple', 'medium', 'complex'],
      required: true,
      description: '複雑さ'
    },
    'custom-request': {
      type: 'string',
      maxLength: 500,
      required: false,
      description: 'カスタム要求'
    },
    red_herring: {
      type: 'boolean',
      required: false,
      description: 'レッドヘリング'
    },
    twist_ending: {
      type: 'boolean',
      required: false,
      description: 'どんでん返し'
    },
    secret_roles: {
      type: 'boolean',
      required: false,
      description: '秘密の役割'
    },
    'generate-images': {
      type: 'boolean',
      required: false,
      description: '画像生成'
    },
    'detailed-handouts': {
      type: 'boolean',
      required: false,
      description: '詳細ハンドアウト'
    },
    'gm-support': {
      type: 'boolean',
      required: false,
      description: 'GM支援'
    },
    generation_mode: {
      type: 'string',
      enum: ['normal', 'micro'],
      required: false,
      description: '生成モード'
    }
  },

  // API共通パラメータ
  common: {
    sessionId: {
      type: 'string',
      pattern: /^[a-zA-Z0-9_-]+$/,
      minLength: 5,
      maxLength: 100,
      required: false,
      description: 'セッションID'
    },
    action: {
      type: 'string',
      enum: ['generate_complete', 'get_progress', 'execute_task', 'get_next_tasks', 'create', 'save', 'get', 'delete'],
      required: false,
      description: 'アクション'
    },
    taskId: {
      type: 'string',
      pattern: /^[a-zA-Z0-9_]+$/,
      maxLength: 50,
      required: false,
      description: 'タスクID'
    },
    continueFrom: {
      type: 'number',
      min: 1,
      max: 8,
      required: false,
      description: '継続フェーズ'
    }
  }
};

/**
 * 🛡️ セキュリティパターン定義
 */
const SECURITY_PATTERNS = {
  xss: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /data:text\/html/gi
  ],
  sql: [
    /union\s+select/gi,
    /drop\s+table/gi,
    /delete\s+from/gi,
    /insert\s+into/gi,
    /update\s+.*set/gi
  ],
  cmd: [
    /;\s*cat\s+/gi,
    /;\s*rm\s+/gi,
    /;\s*ls\s+/gi,
    /&&\s*cat\s+/gi,
    /\|\s*curl\s+/gi
  ]
};

/**
 * 🔍 検証エラークラス
 */
class ValidationError extends Error {
  constructor(message, field = null, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
}

/**
 * 🛡️ 統合バリデーターメインクラス
 */
class UnifiedInputValidator {
  constructor() {
    this.rules = VALIDATION_RULES;
    this.maxTextLength = 1000;
    this.allowedTags = ['br', 'p', 'strong', 'em'];
    this.isServer = typeof window === 'undefined';
  }

  /**
   * 🧹 HTMLエスケープ処理
   */
  escapeHtml(text) {
    if (typeof text !== 'string') {return '';}
    
    if (this.isServer) {
      // サーバー側: 手動エスケープ
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    } else {
      // クライアント側: DOM使用
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  }

  /**
   * 🔍 セキュリティチェック
   */
  performSecurityChecks(data) {
    const checkString = typeof data === 'string' ? data : JSON.stringify(data);
    const violations = [];

    // XSSチェック
    SECURITY_PATTERNS.xss.forEach(pattern => {
      if (pattern.test(checkString)) {
        violations.push('Potential XSS detected');
      }
    });

    // SQLインジェクションチェック
    SECURITY_PATTERNS.sql.forEach(pattern => {
      if (pattern.test(checkString)) {
        violations.push('Potential SQL injection detected');
      }
    });

    // コマンドインジェクションチェック
    SECURITY_PATTERNS.cmd.forEach(pattern => {
      if (pattern.test(checkString)) {
        violations.push('Potential command injection detected');
      }
    });

    if (violations.length > 0) {
      throw new ValidationError(
        `Security violations detected: ${violations.join(', ')}`,
        null,
        'SECURITY_VIOLATION'
      );
    }

    return true;
  }

  /**
   * 🧹 テキストサニタイゼーション
   */
  sanitizeText(input) {
    if (!input) {return '';}
    
    let sanitized = input.toString().trim();
    
    // 最大長制限
    if (sanitized.length > this.maxTextLength) {
      sanitized = sanitized.substring(0, this.maxTextLength);
    }
    
    // セキュリティチェック
    this.performSecurityChecks(sanitized);
    
    return this.escapeHtml(sanitized);
  }

  /**
   * 📏 型検証
   */
  validateType(value, rule, fieldName) {
    if (value === null || value === undefined) {
      if (rule.required) {
        throw new ValidationError(`${fieldName || rule.description} is required`, fieldName);
      }
      return null;
    }

    switch (rule.type) {
    case 'string':
      if (typeof value !== 'string') {
        throw new ValidationError(`${fieldName} must be a string`, fieldName);
      }
      return this.validateString(value, rule, fieldName);

    case 'number': {
      const num = Number(value);
      if (isNaN(num)) {
        throw new ValidationError(`${fieldName} must be a number`, fieldName);
      }
      return this.validateNumber(num, rule, fieldName);
    }

    case 'boolean':
      if (typeof value === 'boolean') {return value;}
      if (typeof value === 'string') {
        const lower = value.toLowerCase();
        if (lower === 'true' || lower === '1') {return true;}
        if (lower === 'false' || lower === '0' || lower === '') {return false;}
      }
      return Boolean(value);

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        throw new ValidationError(`${fieldName} must be an object`, fieldName);
      }
      return value;

    case 'array':
      if (!Array.isArray(value)) {
        throw new ValidationError(`${fieldName} must be an array`, fieldName);
      }
      return value;

    default:
      return value;
    }
  }

  /**
   * 📝 文字列検証
   */
  validateString(value, rule, fieldName) {
    // 長さ検証
    if (rule.minLength && value.length < rule.minLength) {
      throw new ValidationError(
        `${fieldName} must be at least ${rule.minLength} characters`,
        fieldName
      );
    }

    if (rule.maxLength && value.length > rule.maxLength) {
      throw new ValidationError(
        `${fieldName} must be no more than ${rule.maxLength} characters`,
        fieldName
      );
    }

    // パターン検証
    if (rule.pattern && !rule.pattern.test(value)) {
      throw new ValidationError(
        `${fieldName} format is invalid`,
        fieldName
      );
    }

    // 列挙値検証
    if (rule.enum && !rule.enum.includes(value)) {
      throw new ValidationError(
        `${fieldName} must be one of: ${rule.enum.join(', ')}`,
        fieldName
      );
    }

    // セキュリティチェック
    this.performSecurityChecks(value);

    return value.trim();
  }

  /**
   * 🔢 数値検証
   */
  validateNumber(value, rule, fieldName) {
    if (rule.min && value < rule.min) {
      throw new ValidationError(
        `${fieldName} must be at least ${rule.min}`,
        fieldName
      );
    }

    if (rule.max && value > rule.max) {
      throw new ValidationError(
        `${fieldName} must be no more than ${rule.max}`,
        fieldName
      );
    }

    if (rule.integer && !Number.isInteger(value)) {
      throw new ValidationError(
        `${fieldName} must be an integer`,
        fieldName
      );
    }

    return value;
  }

  /**
   * 📋 オブジェクト検証
   */
  validateObject(data, ruleset, prefix = '') {
    if (!data || typeof data !== 'object') {
      throw new ValidationError('Invalid data format');
    }

    const validated = {};
    const errors = [];

    // 定義されたフィールドを検証
    for (const [fieldName, rule] of Object.entries(ruleset)) {
      const fullFieldName = prefix ? `${prefix}.${fieldName}` : fieldName;
      
      try {
        const value = data[fieldName];
        const validatedValue = this.validateType(value, rule, fullFieldName);
        if (validatedValue !== null && validatedValue !== undefined) {
          validated[fieldName] = validatedValue;
        }
      } catch (error) {
        if (rule.required) {
          errors.push(error.message);
        } else if (this.isServer) {
          logger.warn(`⚠️ Validation warning for ${fullFieldName}: ${error.message}`);
        }
      }
    }

    // 未定義フィールドも通す（柔軟性のため）
    const allowedFields = Object.keys(ruleset);
    const extraFields = Object.keys(data).filter(key => !allowedFields.includes(key));
    
    if (extraFields.length > 0 && this.isServer) {
      logger.warn(`⚠️ Unknown fields passed through: ${extraFields.join(', ')}`);
    }
    
    // 未定義フィールドもそのまま通す
    extraFields.forEach(field => {
      validated[field] = data[field];
    });

    if (errors.length > 0) {
      throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
    }

    return validated;
  }

  /**
   * 📝 フォームデータ検証
   */
  validateFormData(data) {
    return this.validateObject(data, this.rules.formData, 'formData');
  }

  /**
   * 🔧 共通パラメータ検証
   */
  validateCommon(data) {
    return this.validateObject(data, this.rules.common, 'common');
  }

  /**
   * 🎯 API別総合検証
   */
  validateApiRequest(apiType, data) {
    const validated = {};

    try {
      switch (apiType) {
      case 'generation': {
        if (data.formData) {
          validated.formData = this.validateFormData(data.formData);
        }

        const commonData = {
          sessionId: data.sessionId,
          action: data.action,
          continueFrom: data.continueFrom
        };
        Object.assign(validated, this.validateCommon(commonData));
        break;
      }

      case 'micro': {
        const microData = {
          action: data.action,
          taskId: data.taskId,
          sessionId: data.sessionId
        };
        Object.assign(validated, this.validateCommon(microData));
        if (data.formData) {
          validated.formData = this.validateFormData(data.formData);
        }
        break;
      }

      case 'storage': {
        const storageData = { action: data.action, sessionId: data.sessionId };
        Object.assign(validated, this.validateCommon(storageData));
        break;
      }

      default:
        throw new ValidationError(`Unknown API type: ${apiType}`);
      }
    } catch (error) {
      throw new ValidationError(`API validation failed: ${error.message}`);
    }

    return validated;
  }

  /**
   * 🌐 クライアント用フォーム検証
   */
  validateClientForm(formData) {
    try {
      const validation = this.validateFormData(formData);
      return {
        isValid: true,
        errors: [],
        sanitizedData: validation
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        sanitizedData: {}
      };
    }
  }

  /**
   * 🎨 エラー表示（クライアント専用）
   */
  displayErrors(errors) {
    if (this.isServer || !errors.length) {return;}

    const errorContainer = document.createElement('div');
    errorContainer.className = 'validation-errors';
    errorContainer.innerHTML = `
      <div class="alert alert-danger">
        <h4>⚠️ 入力エラー</h4>
        <ul>
          ${errors.map(error => `<li>${this.escapeHtml(error)}</li>`).join('')}
        </ul>
      </div>
    `;

    // 既存のエラーを削除
    const existingErrors = document.querySelector('.validation-errors');
    if (existingErrors) {
      existingErrors.remove();
    }

    // フォームの前にエラーを表示
    const form = document.getElementById('scenario-form');
    if (form) {
      form.parentNode.insertBefore(errorContainer, form);
      errorContainer.scrollIntoView({ behavior: 'smooth' });
      
      // 5秒後に自動削除
      setTimeout(() => {
        if (errorContainer.parentNode) {
          errorContainer.remove();
        }
      }, 5000);
    }
  }

  /**
   * 🧽 エラーメッセージクリア（クライアント専用）
   */
  clearErrors() {
    if (this.isServer) {return;}
    
    const errorContainer = document.querySelector('.validation-errors');
    if (errorContainer) {
      errorContainer.remove();
    }
  }

  /**
   * ⚡ リアルタイム検証設定（クライアント専用）
   */
  setupRealtimeValidation() {
    if (this.isServer) {return;}

    const form = document.getElementById('scenario-form');
    if (!form) {return;}

    // カスタム要求フィールドの文字数制限
    const customRequest = form.querySelector('#custom-request');
    if (customRequest) {
      customRequest.addEventListener('input', (e) => {
        const length = e.target.value.length;
        const maxLength = 500;
        
        let counter = form.querySelector('.char-counter');
        if (!counter) {
          counter = document.createElement('div');
          counter.className = 'char-counter';
          customRequest.parentNode.appendChild(counter);
        }
        
        counter.textContent = `${length}/${maxLength}文字`;
        counter.className = `char-counter ${length > maxLength ? 'over-limit' : ''}`;
        
        if (length > maxLength) {
          e.target.value = e.target.value.substring(0, maxLength);
        }
      });
    }

    // フォーム送信時の検証
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const formObject = Object.fromEntries(formData.entries());
      
      const validation = this.validateClientForm(formObject);
      
      if (!validation.isValid) {
        this.displayErrors(validation.errors);
        return false;
      }
      
      this.clearErrors();
      return validation.sanitizedData;
    });
  }

  /**
   * 🔧 Express/Vercel ミドルウェア作成
   */
  middleware(apiType) {
    return (req, res, next) => {
      try {
        // セキュリティチェック
        this.performSecurityChecks(req.body);

        // API別検証
        const validatedData = this.validateApiRequest(apiType, req.body);
        
        // 検証済みデータを設定
        req.validated = validatedData;
        
        next?.();
        
      } catch (error) {
        logger.error(`❌ Input validation failed for ${apiType} API:`, {
          error: error.message,
          field: error.field,
          code: error.code
        });
        
        const statusCode = error.code === 'SECURITY_VIOLATION' ? 403 : 400;
        
        res.status(statusCode).json({
          success: false,
          error: 'Input validation failed',
          message: error.message,
          field: error.field,
          code: error.code
        });
      }
    };
  }
}

// シングルトンインスタンス
const unifiedValidator = new UnifiedInputValidator();

// ES6モジュールエクスポート
const createValidationMiddleware = (apiType) => unifiedValidator.middleware(apiType);
const getValidationRules = () => VALIDATION_RULES;

// CommonJS形式でエクスポート
module.exports = {
  UnifiedInputValidator,
  ValidationError,
  unifiedValidator,
  createValidationMiddleware,
  getValidationRules
};

// ブラウザ環境での対応
if (typeof window !== 'undefined') {
  window.UnifiedInputValidator = UnifiedInputValidator;
  window.ValidationError = ValidationError;
  window.unifiedValidator = unifiedValidator;
}