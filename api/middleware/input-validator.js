/**
 * 🛡️ Input Validation System - LEGACY (統合版に移行済み)
 * @deprecated 統合検証システム (/api/core/validation.js) を使用してください
 */

const { unifiedValidator, createValidationMiddleware } = require('../core/validation');

// レガシー互換性のため、新しい統合システムを再エクスポート
module.exports = {
  inputValidator: unifiedValidator,
  createValidationMiddleware,
  ValidationError: require('../core/validation').ValidationError,
  getValidationRules: require('../core/validation').getValidationRules
};

// 従来のルール定義（参考用・削除予定）
const LEGACY_VALIDATION_RULES = {
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
      required: false, // actionは必須ではない場合もある
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
  },

  // セッションデータ検証
  sessionData: {
    sessionId: {
      type: 'string',
      required: true,
      description: 'セッションID'
    },
    phases: {
      type: 'object',
      required: false,
      description: 'フェーズデータ'
    },
    formData: {
      type: 'object',
      required: false,
      description: 'フォームデータ'
    }
  }
};

/**
 * 検証エラークラス
 */
export class ValidationError extends Error {
  constructor(message, field = null, code = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
  }
}

/**
 * 入力値検証クラス
 */
export class InputValidator {
  constructor() {
    this.rules = VALIDATION_RULES;
  }

  /**
   * 値の型検証
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

      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw new ValidationError(`${fieldName} must be a number`, fieldName);
        }
        return this.validateNumber(num, rule, fieldName);

      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (lower === 'true' || lower === '1') return true;
          if (lower === 'false' || lower === '0') return false;
        }
        throw new ValidationError(`${fieldName} must be a boolean`, fieldName);

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
   * 文字列検証
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

    // XSS対策 - 危険なタグをチェック
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(value)) {
        throw new ValidationError(
          `${fieldName} contains potentially dangerous content`,
          fieldName,
          'SECURITY_VIOLATION'
        );
      }
    }

    return value.trim();
  }

  /**
   * 数値検証
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
   * オブジェクト検証
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
        // 必須フィールドのエラーのみ致命的とする
        if (rule.required) {
          errors.push(error.message);
        } else {
        }
      }
    }

    // 未定義フィールドも通す（柔軟性のため）
    const allowedFields = Object.keys(ruleset);
    const extraFields = Object.keys(data).filter(key => !allowedFields.includes(key));
    
    if (extraFields.length > 0) {
      // 未定義フィールドもそのまま通す
      extraFields.forEach(field => {
        validated[field] = data[field];
      });
    }

    if (errors.length > 0) {
      throw new ValidationError(`Validation failed: ${errors.join(', ')}`);
    }

    return validated;
  }

  /**
   * フォームデータ検証
   */
  validateFormData(data) {
    return this.validateObject(data, this.rules.formData, 'formData');
  }

  /**
   * 共通パラメータ検証
   */
  validateCommon(data) {
    return this.validateObject(data, this.rules.common, 'common');
  }

  /**
   * セッションデータ検証
   */
  validateSessionData(data) {
    const validated = this.validateObject(data, this.rules.sessionData, 'sessionData');
    
    // フォームデータが含まれている場合は追加検証
    if (validated.formData) {
      validated.formData = this.validateFormData(validated.formData);
    }
    
    return validated;
  }

  /**
   * 総合検証（API別）
   */
  validateApiRequest(apiType, data) {
    const errors = [];
    const validated = {};

    try {
      switch (apiType) {
        case 'generation':
          // フォームデータ検証（必須）
          if (data.formData) {
            validated.formData = this.validateFormData(data.formData);
          }
          
          // 共通パラメータ検証（action, sessionId, continueFromなど）
          const commonData = { 
            sessionId: data.sessionId, 
            action: data.action,
            continueFrom: data.continueFrom
          };
          Object.assign(validated, this.validateCommon(commonData));
          break;

        case 'micro':
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

        case 'export':
          if (data.sessionData) {
            validated.sessionData = this.validateSessionData(data.sessionData);
          }
          break;

        case 'storage':
          const storageData = { action: data.action, sessionId: data.sessionId };
          Object.assign(validated, this.validateCommon(storageData));
          break;

        default:
          throw new ValidationError(`Unknown API type: ${apiType}`);
      }
    } catch (error) {
      throw new ValidationError(`API validation failed: ${error.message}`);
    }

    return validated;
  }

  /**
   * セキュリティチェック
   */
  performSecurityChecks(data) {
    const checks = [];

    // SQLインジェクション検出
    const sqlPatterns = [
      /union\s+select/gi,
      /drop\s+table/gi,
      /delete\s+from/gi,
      /insert\s+into/gi,
      /update\s+.*set/gi
    ];

    // コマンドインジェクション検出
    const cmdPatterns = [
      /;\s*cat\s+/gi,
      /;\s*rm\s+/gi,
      /;\s*ls\s+/gi,
      /&&\s*cat\s+/gi,
      /\|\s*curl\s+/gi
    ];

    const checkString = JSON.stringify(data);

    sqlPatterns.forEach(pattern => {
      if (pattern.test(checkString)) {
        checks.push('Potential SQL injection detected');
      }
    });

    cmdPatterns.forEach(pattern => {
      if (pattern.test(checkString)) {
        checks.push('Potential command injection detected');
      }
    });

    if (checks.length > 0) {
      throw new ValidationError(
        `Security violations detected: ${checks.join(', ')}`,
        null,
        'SECURITY_VIOLATION'
      );
    }

    return true;
  }

  /**
   * Express/Vercel ミドルウェア
   */
  middleware(apiType) {
    return (req, res, next) => {
      try {
        // セキュリティチェック
        this.performSecurityChecks(req.body);

        // API別検証（エラーを詳細にログ出力）
        
        const validatedData = this.validateApiRequest(apiType, req.body);
        
        // 検証済みデータを req.validated に設定
        req.validated = validatedData;
        
        next?.();
        
      } catch (error) {
          error: error.message,
          field: error.field,
          code: error.code,
          requestBody: req.body
        });
        
        const statusCode = error.code === 'SECURITY_VIOLATION' ? 403 : 400;
        
        res.status(statusCode).json({
          success: false,
          error: 'Input validation failed',
          message: error.message,
          field: error.field,
          code: error.code,
          details: process.env.NODE_ENV === 'development' ? req.body : undefined
        });
      }
    };
  }
}

// シングルトンインスタンス
export const inputValidator = new InputValidator();

/**
 * API別検証ミドルウェア作成
 */
export function createValidationMiddleware(apiType) {
  return inputValidator.middleware(apiType);
}

/**
 * 検証ルール取得
 */
export function getValidationRules() {
  return VALIDATION_RULES;
}