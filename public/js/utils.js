/**
 * 🛠️ UTILS - ユーティリティ関数集
 * ヘルパー関数、バリデーション、フォーマット等を統合
 */

/**
 * DOM操作ヘルパー
 */
const DOM = {
  /**
   * 要素取得（nullチェック付き）
   */
  get(selector) {
    const element = document.querySelector(selector);
    if (!element) {
      logger.warn(`Element not found: ${selector}`);
    }
    return element;
  },

  /**
   * 複数要素取得
   */
  getAll(selector) {
    return Array.from(document.querySelectorAll(selector));
  },

  /**
   * 要素作成
   */
  create(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'textContent') {
        element.textContent = value;
      } else if (key === 'innerHTML') {
        element.innerHTML = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    
    return element;
  },

  /**
   * 要素の表示/非表示
   */
  show(element, display = 'block') {
    if (element) element.style.display = display;
  },

  hide(element) {
    if (element) element.style.display = 'none';
  },

  /**
   * クラス操作
   */
  addClass(element, ...classes) {
    if (element) element.classList.add(...classes);
  },

  removeClass(element, ...classes) {
    if (element) element.classList.remove(...classes);
  },

  toggleClass(element, className) {
    if (element) element.classList.toggle(className);
  }
};

/**
 * フォーマットヘルパー
 */
const Format = {
  /**
   * 日付フォーマット
   */
  date(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  /**
   * 時間フォーマット（秒を分:秒に）
   */
  duration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  },

  /**
   * ファイルサイズフォーマット
   */
  fileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  },

  /**
   * 数値の3桁カンマ区切り
   */
  number(num) {
    return num.toLocaleString('ja-JP');
  },

  /**
   * パーセント表示
   */
  percent(value, decimals = 0) {
    return `${(value * 100).toFixed(decimals)}%`;
  }
};

/**
 * バリデーションヘルパー
 */
const Validate = {
  /**
   * 必須チェック
   */
  required(value, fieldName) {
    if (!value || value.trim() === '') {
      return `${fieldName}は必須項目です`;
    }
    return null;
  },

  /**
   * 文字数チェック
   */
  length(value, min, max, fieldName) {
    const len = value.length;
    if (min && len < min) {
      return `${fieldName}は${min}文字以上入力してください`;
    }
    if (max && len > max) {
      return `${fieldName}は${max}文字以下で入力してください`;
    }
    return null;
  },

  /**
   * 数値範囲チェック
   */
  range(value, min, max, fieldName) {
    const num = Number(value);
    if (isNaN(num)) {
      return `${fieldName}は数値で入力してください`;
    }
    if (min !== undefined && num < min) {
      return `${fieldName}は${min}以上の値を入力してください`;
    }
    if (max !== undefined && num > max) {
      return `${fieldName}は${max}以下の値を入力してください`;
    }
    return null;
  },

  /**
   * メールアドレスチェック
   */
  email(value) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(value)) {
      return '有効なメールアドレスを入力してください';
    }
    return null;
  },

  /**
   * URL チェック
   */
  url(value) {
    try {
      new URL(value);
      return null;
    } catch {
      return '有効なURLを入力してください';
    }
  }
};

/**
 * ストレージヘルパー
 */
const Storage = {
  /**
   * LocalStorage 保存
   */
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Storage set error:', error);
      return false;
    }
  },

  /**
   * LocalStorage 取得
   */
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      logger.error('Storage get error:', error);
      return defaultValue;
    }
  },

  /**
   * LocalStorage 削除
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      logger.error('Storage remove error:', error);
      return false;
    }
  },

  /**
   * SessionStorage 操作
   */
  session: {
    set(key, value) {
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        logger.error('Session storage set error:', error);
        return false;
      }
    },

    get(key, defaultValue = null) {
      try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch (error) {
        logger.error('Session storage get error:', error);
        return defaultValue;
      }
    },

    remove(key) {
      try {
        sessionStorage.removeItem(key);
        return true;
      } catch (error) {
        logger.error('Session storage remove error:', error);
        return false;
      }
    }
  }
};

/**
 * API通信ヘルパー
 */
const API = {
  /**
   * 基本的なfetchラッパー
   */
  async request(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    try {
      const response = await fetch(url, mergedOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
      
    } catch (error) {
      logger.error('API request error:', error);
      throw error;
    }
  },

  /**
   * GET リクエスト
   */
  get(url, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    return this.request(fullUrl, { method: 'GET' });
  },

  /**
   * POST リクエスト
   */
  post(url, data = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  /**
   * PUT リクエスト
   */
  put(url, data = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  /**
   * DELETE リクエスト
   */
  delete(url) {
    return this.request(url, { method: 'DELETE' });
  }
};

/**
 * ユーティリティ関数
 */
const Utils = {
  /**
   * デバウンス
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = resourceManager.setTimeout(later, wait);
    };
  },

  /**
   * スロットル
   */
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        resourceManager.setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * ディープコピー
   */
  deepCopy(obj) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => this.deepCopy(item));
    if (obj instanceof Object) {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepCopy(obj[key]);
        }
      }
      return clonedObj;
    }
  },

  /**
   * UUID生成
   */
  generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  /**
   * クエリパラメータ取得
   */
  getQueryParams() {
    const params = new URLSearchParams(window.location.search);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  },

  /**
   * スムーススクロール
   */
  smoothScroll(target, duration = 800) {
    const targetElement = typeof target === 'string' ? document.querySelector(target) : target;
    if (!targetElement) return;
    
    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;
    
    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = ease(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }
    
    function ease(t, b, c, d) {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    }
    
    requestAnimationFrame(animation);
  },

  /**
   * クリップボードコピー
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      logger.error('Clipboard copy error:', error);
      return false;
    }
  }
};

// グローバルに公開
window.utils = {
  DOM,
  Format,
  Validate,
  Storage,
  API,
  Utils
};

// グローバル公開
window.DOM = DOM;
window.Format = Format;
window.Validate = Validate;
window.Storage = Storage;
window.API = API;
window.Utils = Utils;