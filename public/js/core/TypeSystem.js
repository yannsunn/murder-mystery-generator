/**
 * TypeSystem - JavaScript用型検証システム
 * TypeScript風の型安全性をランタイムで提供
 */
class TypeSystem {
  constructor(options = {}) {
    this.strict = options.strict !== false;
    this.throwOnError = options.throwOnError !== false;
    this.logErrors = options.logErrors !== false;
    this.customTypes = new Map();
    this.typeCache = new Map();
    
    this.setupBuiltinTypes();
  }

  /**
   * 組み込み型の設定
   */
  setupBuiltinTypes() {
    // プリミティブ型
    this.addType('string', (value) => typeof value === 'string');
    this.addType('number', (value) => typeof value === 'number' && !isNaN(value));
    this.addType('boolean', (value) => typeof value === 'boolean');
    this.addType('undefined', (value) => value === undefined);
    this.addType('null', (value) => value === null);
    this.addType('symbol', (value) => typeof value === 'symbol');
    this.addType('bigint', (value) => typeof value === 'bigint');

    // オブジェクト型
    this.addType('object', (value) => value !== null && typeof value === 'object' && !Array.isArray(value));
    this.addType('array', (value) => Array.isArray(value));
    this.addType('function', (value) => typeof value === 'function');
    this.addType('date', (value) => value instanceof Date);
    this.addType('regexp', (value) => value instanceof RegExp);
    this.addType('map', (value) => value instanceof Map);
    this.addType('set', (value) => value instanceof Set);
    this.addType('promise', (value) => value instanceof Promise);

    // 特殊型
    this.addType('any', () => true);
    this.addType('unknown', () => true);
    this.addType('never', () => false);
    this.addType('void', (value) => value === undefined || value === null);

    // アプリケーション固有の型
    this.setupApplicationTypes();
  }

  /**
   * アプリケーション固有の型設定
   */
  setupApplicationTypes() {
    // FormData型
    this.addType('FormData', (value) => {
      return this.validateInterface(value, {
        participants: 'string',
        era: 'string', 
        setting: 'string',
        worldview: 'string',
        tone: 'string',
        incident_type: 'string',
        complexity: 'string',
        red_herring: 'boolean',
        twist_ending: 'boolean',
        secret_roles: 'boolean'
      });
    });

    // StepData型
    this.addType('StepData', (value) => {
      return this.validateInterface(value, {
        step: 'number',
        data: 'object',
        completed: 'boolean',
        timestamp: 'string'
      });
    });

    // GenerationResult型
    this.addType('GenerationResult', (value) => {
      return this.validateInterface(value, {
        scenario: 'string',
        metadata: 'object'
      });
    });

    // ApiResponse型
    this.addType('ApiResponse', (value) => {
      return this.validateInterface(value, {
        success: 'boolean',
        data: 'any',
        error: ['undefined', 'string']
      });
    });

    // EventData型
    this.addType('EventData', (value) => {
      return this.validateInterface(value, {
        type: 'string',
        timestamp: 'string',
        data: 'any'
      });
    });
  }

  /**
   * カスタム型の追加
   */
  addType(name, validator) {
    if (typeof validator !== 'function') {
      throw new Error('Type validator must be a function');
    }
    this.customTypes.set(name, validator);
  }

  /**
   * 型チェック
   */
  is(value, type) {
    try {
      return this.validateType(value, type);
    } catch {
      return false;
    }
  }

  /**
   * 型アサーション
   */
  assert(value, type, message = '') {
    if (!this.validateType(value, type)) {
      const error = new TypeError(
        `Type assertion failed${message ? ': ' + message : ''}. Expected ${type}, got ${this.getTypeName(value)}`
      );
      
      if (this.throwOnError) {
        throw error;
      }
      
      if (this.logErrors) {
        console.error(error);
      }
      
      return false;
    }
    return true;
  }

  /**
   * 型検証の実行
   */
  validateType(value, type) {
    // キャッシュチェック
    const cacheKey = `${this.getTypeName(value)}_${type}`;
    if (this.typeCache.has(cacheKey)) {
      return this.typeCache.get(cacheKey);
    }

    let result;

    if (typeof type === 'string') {
      result = this.validateStringType(value, type);
    } else if (Array.isArray(type)) {
      result = this.validateUnionType(value, type);
    } else if (typeof type === 'object') {
      result = this.validateInterface(value, type);
    } else if (typeof type === 'function') {
      result = type(value);
    } else {
      throw new Error(`Invalid type specification: ${type}`);
    }

    // キャッシュに保存
    this.typeCache.set(cacheKey, result);
    return result;
  }

  /**
   * 文字列型の検証
   */
  validateStringType(value, type) {
    // 基本型
    const validator = this.customTypes.get(type);
    if (validator) {
      return validator(value);
    }

    // 配列型 (Array<T>)
    const arrayMatch = type.match(/^Array<(.+)>$/);
    if (arrayMatch) {
      if (!Array.isArray(value)) return false;
      const elementType = arrayMatch[1];
      return value.every(item => this.validateType(item, elementType));
    }

    // オプショナル型 (T?)
    if (type.endsWith('?')) {
      const baseType = type.slice(0, -1);
      return value === undefined || this.validateType(value, baseType);
    }

    // リテラル型
    if (type.startsWith('"') && type.endsWith('"')) {
      return value === type.slice(1, -1);
    }

    if (type.startsWith("'") && type.endsWith("'")) {
      return value === type.slice(1, -1);
    }

    throw new Error(`Unknown type: ${type}`);
  }

  /**
   * ユニオン型の検証
   */
  validateUnionType(value, types) {
    return types.some(type => {
      try {
        return this.validateType(value, type);
      } catch {
        return false;
      }
    });
  }

  /**
   * インターフェース型の検証
   */
  validateInterface(value, schema) {
    if (value === null || typeof value !== 'object') {
      return false;
    }

    for (const [key, expectedType] of Object.entries(schema)) {
      const actualValue = value[key];
      
      if (!this.validateType(actualValue, expectedType)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 関数の型注釈デコレータ
   */
  typed(paramTypes = [], returnType = 'any') {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = function(...args) {
        // 引数の型チェック
        for (let i = 0; i < paramTypes.length; i++) {
          if (i < args.length) {
            this.assert(
              args[i], 
              paramTypes[i], 
              `Parameter ${i} of ${propertyKey}`
            );
          }
        }

        // メソッド実行
        const result = originalMethod.apply(this, args);

        // 戻り値の型チェック
        if (returnType !== 'any') {
          this.assert(
            result, 
            returnType, 
            `Return value of ${propertyKey}`
          );
        }

        return result;
      };

      return descriptor;
    };
  }

  /**
   * クラスのプロパティ型チェック
   */
  validateClass(instance, schema) {
    const results = {};
    
    for (const [property, expectedType] of Object.entries(schema)) {
      const value = instance[property];
      const isValid = this.validateType(value, expectedType);
      
      results[property] = {
        value,
        expectedType,
        actualType: this.getTypeName(value),
        valid: isValid
      };

      if (!isValid && this.strict) {
        console.warn(
          `Type mismatch in ${instance.constructor.name}.${property}: ` +
          `expected ${expectedType}, got ${this.getTypeName(value)}`
        );
      }
    }

    return results;
  }

  /**
   * 型名の取得
   */
  getTypeName(value) {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (value instanceof RegExp) return 'regexp';
    if (value instanceof Map) return 'map';
    if (value instanceof Set) return 'set';
    if (value instanceof Promise) return 'promise';
    
    const type = typeof value;
    if (type === 'object') {
      return value.constructor?.name?.toLowerCase() || 'object';
    }
    
    return type;
  }

  /**
   * 型ガード関数の生成
   */
  createGuard(type) {
    return (value) => this.is(value, type);
  }

  /**
   * ランタイム型情報の生成
   */
  createTypeInfo(value) {
    const info = {
      type: this.getTypeName(value),
      value: value,
      isNull: value === null,
      isUndefined: value === undefined,
      isPrimitive: this.isPrimitive(value),
      isObject: typeof value === 'object' && value !== null,
      isArray: Array.isArray(value),
      isFunction: typeof value === 'function'
    };

    if (info.isObject && !info.isArray) {
      info.properties = Object.keys(value);
      info.propertyTypes = {};
      
      for (const key of info.properties) {
        info.propertyTypes[key] = this.getTypeName(value[key]);
      }
    }

    if (info.isArray) {
      info.length = value.length;
      info.elementTypes = [...new Set(value.map(item => this.getTypeName(item)))];
    }

    if (info.isFunction) {
      info.name = value.name;
      info.length = value.length; // 引数の数
    }

    return info;
  }

  /**
   * プリミティブ型かどうかの判定
   */
  isPrimitive(value) {
    const type = typeof value;
    return type === 'string' || 
           type === 'number' || 
           type === 'boolean' || 
           type === 'symbol' || 
           type === 'bigint' || 
           value === null || 
           value === undefined;
  }

  /**
   * 型の互換性チェック
   */
  isAssignable(fromType, toType) {
    // 同じ型
    if (fromType === toType) return true;

    // any型への代入
    if (toType === 'any') return true;

    // null/undefined の特殊ケース
    if (fromType === 'null' || fromType === 'undefined') {
      return toType.endsWith('?') || toType === 'any' || toType === 'unknown';
    }

    // オブジェクト型の構造的型付け
    if (this.customTypes.has(fromType) && this.customTypes.has(toType)) {
      // より詳細なチェックが必要な場合はここで実装
      return false;
    }

    return false;
  }

  /**
   * 型変換
   */
  convert(value, targetType) {
    if (this.is(value, targetType)) {
      return value;
    }

    switch (targetType) {
      case 'string':
        return String(value);
      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;
      case 'boolean':
        return Boolean(value);
      case 'array':
        return Array.isArray(value) ? value : [value];
      default:
        return null;
    }
  }

  /**
   * 型スキーマの検証
   */
  validateSchema(data, schema) {
    const errors = [];
    
    const validate = (obj, sch, path = '') => {
      for (const [key, expectedType] of Object.entries(sch)) {
        const fullPath = path ? `${path}.${key}` : key;
        const value = obj?.[key];
        
        if (!this.validateType(value, expectedType)) {
          errors.push({
            path: fullPath,
            expected: expectedType,
            actual: this.getTypeName(value),
            value
          });
        }
      }
    };

    validate(data, schema);
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * パフォーマンス統計
   */
  getPerformanceStats() {
    return {
      cacheSize: this.typeCache.size,
      customTypesCount: this.customTypes.size,
      strictMode: this.strict,
      throwOnError: this.throwOnError
    };
  }

  /**
   * キャッシュクリア
   */
  clearCache() {
    this.typeCache.clear();
  }

  /**
   * 設定更新
   */
  configure(options) {
    if (options.strict !== undefined) this.strict = options.strict;
    if (options.throwOnError !== undefined) this.throwOnError = options.throwOnError;
    if (options.logErrors !== undefined) this.logErrors = options.logErrors;
  }
}

// グローバルインスタンス作成
const Types = new TypeSystem({
  strict: true,
  throwOnError: false,
  logErrors: true
});

// 便利なヘルパー関数
window.is = (value, type) => Types.is(value, type);
window.assert = (value, type, message) => Types.assert(value, type, message);
window.typed = (paramTypes, returnType) => Types.typed(paramTypes, returnType);

export { TypeSystem, Types };