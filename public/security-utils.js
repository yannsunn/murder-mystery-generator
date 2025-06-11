// Security Utilities for Murder Mystery Generator
// XSS防止とセキュリティ強化のためのユーティリティ

/**
 * HTMLサニタイゼーション関数
 * XSS攻撃を防ぐためにユーザー入力をサニタイズ
 */
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * フォーム入力値の検証
 */
function validateFormInput(value, type) {
  if (!value || typeof value !== 'string') return false;
  
  const validators = {
    participants: (val) => /^[4-8]$/.test(val),
    text: (val) => val.length > 0 && val.length <= 100,
    select: (val) => /^[a-zA-Z0-9_-]+$/.test(val)
  };
  
  const validator = validators[type] || validators.text;
  return validator(value);
}

/**
 * セキュアなDOM要素作成
 */
function createSecureElement(tag, textContent, className = '') {
  const element = document.createElement(tag);
  if (textContent) element.textContent = textContent;
  if (className) element.className = className;
  return element;
}

/**
 * CSP（Content Security Policy）違反の検出
 */
function setupCSPReporting() {
  document.addEventListener('securitypolicyviolation', (e) => {
    console.warn('CSP Violation:', {
      directive: e.violatedDirective,
      blockedURI: e.blockedURI,
      lineNumber: e.lineNumber,
      columnNumber: e.columnNumber
    });
  });
}

/**
 * 入力フィールドの最大長制限
 */
function enforceInputLimits() {
  document.querySelectorAll('input, select, textarea').forEach(input => {
    const maxLength = input.getAttribute('maxlength') || 200;
    
    input.addEventListener('input', (e) => {
      if (e.target.value.length > maxLength) {
        e.target.value = e.target.value.substring(0, maxLength);
      }
    });
  });
}

// エクスポート（モジュール使用時）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeHTML,
    validateFormInput,
    createSecureElement,
    setupCSPReporting,
    enforceInputLimits
  };
}