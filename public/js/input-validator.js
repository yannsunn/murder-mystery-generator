/**
 * 🔒 Input Validator - LEGACY (統合版に移行済み)
 * @deprecated 統合検証システム (/api/core/validation.js) を使用してください
 * 
 * このファイルは後方互換性のため残されていますが、
 * 新しい統合バリデーターを使用することを推奨します。
 */

// 統合バリデーターのクライアント版を読み込み
// 実際の実装は /api/core/validation.js にあります

class LegacyInputValidator {
  constructor() {
    this.maxTextLength = 1000;
    this.allowedTags = ['br', 'p', 'strong', 'em'];
  }

  /**
   * 🛡️ HTMLエスケープ - XSS防止
   */
  escapeHtml(text) {
    if (typeof text !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 🧹 テキストサニタイゼーション
   */
  sanitizeText(input) {
    if (!input) return '';
    
    // 基本的なサニタイゼーション
    let sanitized = input.toString().trim();
    
    // 最大長制限
    if (sanitized.length > this.maxTextLength) {
      sanitized = sanitized.substring(0, this.maxTextLength);
    }
    
    // 危険な文字列を除去
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:text\/html/gi
    ];
    
    dangerousPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });
    
    return this.escapeHtml(sanitized);
  }

  /**
   * 📝 フォーム入力検証
   */
  validateFormData(formData) {
    const errors = [];
    const sanitizedData = {};

    // 参加人数検証
    const participants = parseInt(formData.participants);
    if (!participants || participants < 4 || participants > 8) {
      errors.push('参加人数は4-8人の範囲で選択してください');
    } else {
      sanitizedData.participants = participants;
    }

    // 必須フィールド検証
    const requiredFields = ['era', 'setting', 'tone', 'complexity'];
    requiredFields.forEach(field => {
      if (!formData[field]) {
        errors.push(`${this.getFieldDisplayName(field)}は必須です`);
      } else {
        sanitizedData[field] = this.sanitizeText(formData[field]);
      }
    });

    // カスタム要求検証（オプション）
    if (formData['custom-request']) {
      const customRequest = this.sanitizeText(formData['custom-request']);
      if (customRequest.length > 500) {
        errors.push('カスタム要求は500文字以内で入力してください');
      } else {
        sanitizedData['custom-request'] = customRequest;
      }
    }

    // チェックボックス検証
    const checkboxFields = ['generate-images', 'detailed-handouts', 'gm-support'];
    checkboxFields.forEach(field => {
      sanitizedData[field] = formData[field] === 'true' || formData[field] === true;
    });

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData
    };
  }

  /**
   * 🏷️ フィールド表示名取得
   */
  getFieldDisplayName(field) {
    const displayNames = {
      'participants': '参加人数',
      'era': '時代背景',
      'setting': '舞台設定',
      'worldview': '世界観',
      'tone': '雰囲気',
      'complexity': '難易度',
      'motive': '犯行動機',
      'victim-type': '被害者タイプ',
      'weapon': '凶器'
    };
    return displayNames[field] || field;
  }

  /**
   * 🚨 エラー表示
   */
  displayErrors(errors) {
    if (!errors.length) return;

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
      
      // スムーズスクロール
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
   * ✅ エラーメッセージクリア
   */
  clearErrors() {
    const errorContainer = document.querySelector('.validation-errors');
    if (errorContainer) {
      errorContainer.remove();
    }
  }

  /**
   * 🔍 リアルタイム検証
   */
  setupRealtimeValidation() {
    const form = document.getElementById('scenario-form');
    if (!form) return;

    // カスタム要求フィールドの文字数制限
    const customRequest = form.querySelector('#custom-request');
    if (customRequest) {
      customRequest.addEventListener('input', (e) => {
        const length = e.target.value.length;
        const maxLength = 500;
        
        // 文字数表示を更新
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
      
      const validation = this.validateFormData(formObject);
      
      if (!validation.isValid) {
        this.displayErrors(validation.errors);
        return false;
      }
      
      this.clearErrors();
      return validation.sanitizedData;
    });
  }
}

// グローバルに公開
window.InputValidator = InputValidator;