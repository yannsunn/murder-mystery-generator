/**
 * 🔧 Generation Utilities
 * 生成処理に関連するユーティリティ関数
 */

const { logger } = require('../utils/logger.js');

/**
 * 🔑 キャッシュキー生成
 */
function createCacheKey(stepName, formData) {
  const relevantFields = {
    participants: formData.participants,
    era: formData.era,
    setting: formData.setting,
    complexity: formData.complexity,
    tone: formData.tone,
    incident_type: formData.incident_type
  };
  
  const dataHash = createFormDataHash(relevantFields);
  return `${stepName}_${dataHash}`;
}

/**
 * 🔐 フォームデータハッシュ生成
 */
function createFormDataHash(formData) {
  try {
    // 簡単で確実なハッシュ生成
    const dataString = JSON.stringify(formData, Object.keys(formData).sort());
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit int
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  } catch (error) {
    logger.error('Hash generation error:', error);
    return Date.now().toString(16).substring(0, 8);
  }
}

/**
 * サロゲートペア不正除去ユーティリティ
 */
function removeInvalidSurrogates(str) {
  return typeof str === 'string'
    ? str.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
    : str;
}

/**
 * オブジェクトのサニタイズ
 */
function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return removeInvalidSurrogates(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = sanitizeObject(obj[key]);
    }
    return newObj;
  }
  return obj;
}

// CommonJS形式でエクスポート
module.exports = {
  createCacheKey,
  createFormDataHash,
  removeInvalidSurrogates,
  sanitizeObject
};