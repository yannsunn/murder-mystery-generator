import EventEmitter from './EventEmitter.js';

/**
 * ApiClient - 統一APIクライアント
 * 自動リトライ、キャッシュ、レート制限、エラーハンドリング
 */
class ApiClient extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.baseURL = options.baseURL || '/api';
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.rateLimitDelay = options.rateLimitDelay || 100;
    
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 300000; // 5分
    this.requestQueue = [];
    this.activeRequests = new Set();
    this.maxConcurrentRequests = options.maxConcurrentRequests || 6;
    
    this.interceptors = {
      request: [],
      response: []
    };

    this.setupDefaultHeaders();
    this.setupHealthCheck();
  }

  /**
   * デフォルトヘッダー設定
   */
  setupDefaultHeaders() {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-Client-Version': '1.0.0'
    };
  }

  /**
   * ヘルスチェック設定
   */
  setupHealthCheck() {
    this.healthStatus = {
      isHealthy: true,
      lastCheck: null,
      failureCount: 0,
      maxFailures: 3
    };

    // 定期的なヘルスチェック
    setInterval(() => {
      this.checkHealth();
    }, 60000); // 1分毎
  }

  /**
   * インターセプター追加
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
    return this;
  }

  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
    return this;
  }

  /**
   * メインのリクエストメソッド
   */
  async request(config) {
    // 設定の正規化
    const normalizedConfig = this.normalizeConfig(config);
    
    // キャッシュチェック
    if (normalizedConfig.method === 'GET' && normalizedConfig.cache !== false) {
      const cached = this.getFromCache(normalizedConfig);
      if (cached) {
        this.emit('cache:hit', { config: normalizedConfig, data: cached });
        return cached;
      }
    }

    // レート制限チェック
    await this.enforceRateLimit();

    // リクエストの実行
    return this.executeRequest(normalizedConfig);
  }

  /**
   * 設定の正規化
   */
  normalizeConfig(config) {
    if (typeof config === 'string') {
      config = { url: config };
    }

    return {
      method: 'GET',
      headers: { ...this.defaultHeaders },
      timeout: this.timeout,
      retries: 0,
      maxRetries: this.maxRetries,
      cache: true,
      ...config,
      url: this.resolveURL(config.url)
    };
  }

  /**
   * URL解決
   */
  resolveURL(url) {
    if (url.startsWith('http')) {
      return url;
    }
    return `${this.baseURL}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  /**
   * レート制限実行
   */
  async enforceRateLimit() {
    while (this.activeRequests.size >= this.maxConcurrentRequests) {
      await this.sleep(this.rateLimitDelay);
    }
  }

  /**
   * リクエスト実行
   */
  async executeRequest(config) {
    const requestId = this.generateRequestId();
    this.activeRequests.add(requestId);

    try {
      // リクエストインターセプター適用
      for (const interceptor of this.interceptors.request) {
        config = await interceptor(config) || config;
      }

      this.emit('request:start', { requestId, config });

      const response = await this.performRequest(config);
      
      // レスポンスインターセプター適用
      let processedResponse = response;
      for (const interceptor of this.interceptors.response) {
        processedResponse = await interceptor(processedResponse, config) || processedResponse;
      }

      // キャッシュに保存
      if (config.method === 'GET' && config.cache !== false) {
        this.setCache(config, processedResponse);
      }

      this.emit('request:success', { requestId, config, response: processedResponse });
      this.updateHealthStatus(true);

      return processedResponse;

    } catch (error) {
      this.emit('request:error', { requestId, config, error });
      this.updateHealthStatus(false);

      // リトライ処理
      if (config.retries < config.maxRetries && this.shouldRetry(error)) {
        config.retries++;
        
        const delay = this.calculateRetryDelay(config.retries);
        await this.sleep(delay);
        
        this.emit('request:retry', { requestId, config, attempt: config.retries });
        return this.executeRequest(config);
      }

      throw this.enhanceError(error, config);

    } finally {
      this.activeRequests.delete(requestId);
      this.emit('request:end', { requestId });
    }
  }

  /**
   * 実際のHTTPリクエスト実行
   */
  async performRequest(config) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.data ? JSON.stringify(config.data) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response
        );
      }

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else if (contentType?.includes('text/')) {
        data = await response.text();
      } else {
        data = await response.blob();
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        config
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, null, 'TIMEOUT');
      }
      
      throw error;
    }
  }

  /**
   * リトライ判定
   */
  shouldRetry(error) {
    if (error.code === 'TIMEOUT') return true;
    if (error.status >= 500) return true;
    if (error.status === 429) return true; // Too Many Requests
    if (!error.status) return true; // Network error
    return false;
  }

  /**
   * リトライ遅延計算（指数バックオフ）
   */
  calculateRetryDelay(attempt) {
    return this.retryDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
  }

  /**
   * エラー拡張
   */
  enhanceError(error, config) {
    return {
      ...error,
      config,
      timestamp: new Date().toISOString(),
      requestId: this.generateRequestId()
    };
  }

  /**
   * キャッシュ管理
   */
  getFromCache(config) {
    const key = this.getCacheKey(config);
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  setCache(config, data) {
    const key = this.getCacheKey(config);
    this.cache.set(key, {
      data: this.deepClone(data),
      timestamp: Date.now()
    });

    // キャッシュサイズ制限
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  getCacheKey(config) {
    return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
  }

  /**
   * ヘルスチェック
   */
  async checkHealth() {
    try {
      const response = await this.performRequest({
        url: `${this.baseURL}/health`,
        method: 'GET',
        timeout: 5000,
        cache: false
      });

      this.updateHealthStatus(true);
      this.emit('health:check', { healthy: true, response });

    } catch (error) {
      this.updateHealthStatus(false);
      this.emit('health:check', { healthy: false, error });
    }
  }

  /**
   * ヘルス状態更新
   */
  updateHealthStatus(success) {
    this.healthStatus.lastCheck = new Date();
    
    if (success) {
      this.healthStatus.failureCount = 0;
      if (!this.healthStatus.isHealthy) {
        this.healthStatus.isHealthy = true;
        this.emit('health:recovered');
      }
    } else {
      this.healthStatus.failureCount++;
      if (this.healthStatus.failureCount >= this.healthStatus.maxFailures) {
        if (this.healthStatus.isHealthy) {
          this.healthStatus.isHealthy = false;
          this.emit('health:degraded');
        }
      }
    }
  }

  /**
   * 便利メソッド
   */
  async get(url, config = {}) {
    console.log(`🌐 GET Request: ${url}`, config);
    try {
      const result = await this.request({ ...config, method: 'GET', url });
      console.log(`✅ GET Success: ${url}`, result);
      return result;
    } catch (error) {
      console.error(`❌ GET Failed: ${url}`, error);
      throw error;
    }
  }

  async post(url, data, config = {}) {
    console.log(`🌐 POST Request: ${url}`, { data, config });
    try {
      const result = await this.request({ ...config, method: 'POST', url, data });
      console.log(`✅ POST Success: ${url}`, result);
      return result;
    } catch (error) {
      console.error(`❌ POST Failed: ${url}`, error);
      throw error;
    }
  }

  async put(url, data, config = {}) {
    return this.request({ ...config, method: 'PUT', url, data });
  }

  async delete(url, config = {}) {
    return this.request({ ...config, method: 'DELETE', url });
  }

  /**
   * ユーティリティ
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * 統計情報
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      activeRequests: this.activeRequests.size,
      queueSize: this.requestQueue.length,
      healthStatus: { ...this.healthStatus },
      interceptors: {
        request: this.interceptors.request.length,
        response: this.interceptors.response.length
      }
    };
  }

  /**
   * キャッシュクリア
   */
  clearCache() {
    this.cache.clear();
    this.emit('cache:cleared');
  }
}

/**
 * カスタムAPIエラークラス
 */
class ApiError extends Error {
  constructor(message, status = null, response = null, code = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

export default ApiClient;
export { ApiError };