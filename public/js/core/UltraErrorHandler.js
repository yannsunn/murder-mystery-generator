/**
 * UltraErrorHandler - 完全エラーハンドリングシステム V3.0
 * あらゆるエラーを捕捉・分析・復旧する究極のエラー処理システム
 */
class UltraErrorHandler {
  constructor(options = {}) {
    this.errorLog = [];
    this.recoveryStrategies = new Map();
    this.errorPatterns = new Map();
    this.retryCounters = new Map();
    
    this.config = {
      maxErrorLog: options.maxErrorLog || 1000,
      maxRetryAttempts: options.maxRetryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      enableAutoRecovery: options.enableAutoRecovery !== false,
      enableUserNotification: options.enableUserNotification !== false,
      logLevel: options.logLevel || 'ERROR'
    };
    
    // Error categories
    this.errorTypes = {
      NETWORK: 'NETWORK_ERROR',
      API: 'API_ERROR', 
      VALIDATION: 'VALIDATION_ERROR',
      RENDERING: 'RENDERING_ERROR',
      MEMORY: 'MEMORY_ERROR',
      TIMEOUT: 'TIMEOUT_ERROR',
      PERMISSION: 'PERMISSION_ERROR',
      UNKNOWN: 'UNKNOWN_ERROR'
    };
    
    // Recovery strategies
    this.setupRecoveryStrategies();
    
    // Global error handlers
    this.setupGlobalHandlers();
    
    console.log('🛡️ Ultra Error Handler V3.0 initialized');
  }
  
  /**
   * グローバルエラーハンドラー設定
   */
  setupGlobalHandlers() {
    // Unhandled Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: this.errorTypes.UNKNOWN,
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        source: 'unhandledrejection',
        critical: true
      });
      
      event.preventDefault();
    });
    
    // Global errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: this.errorTypes.UNKNOWN,
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        source: 'global',
        critical: false
      });
    });
    
    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target !== window) {
        this.handleError({
          type: this.errorTypes.NETWORK,
          message: `Failed to load resource: ${event.target.src || event.target.href}`,
          element: event.target.tagName,
          source: 'resource',
          critical: false
        });
      }
    }, true);
  }
  
  /**
   * 復旧戦略設定
   */
  setupRecoveryStrategies() {
    // Network error recovery
    this.recoveryStrategies.set(this.errorTypes.NETWORK, async (error, context) => {
      if (navigator.onLine) {
        // Retry with exponential backoff
        const retryCount = this.getRetryCount(error.id);
        if (retryCount < this.config.maxRetryAttempts) {
          const delay = this.config.retryDelay * Math.pow(2, retryCount);
          
          await this.wait(delay);
          this.incrementRetryCount(error.id);
          
          return await this.retryOperation(context);
        }
      } else {
        // Offline mode - queue for later
        this.queueForRetry(context);
        this.showUserMessage('オフラインモードです。接続が復旧したら自動的に再試行します。', 'info');
      }
      
      return false;
    });
    
    // API error recovery
    this.recoveryStrategies.set(this.errorTypes.API, async (error, context) => {
      if (error.status === 429) {
        // Rate limit - wait and retry
        await this.wait(5000);
        return await this.retryOperation(context);
      } else if (error.status >= 500) {
        // Server error - try alternative endpoint
        return await this.tryAlternativeEndpoint(context);
      } else if (error.status === 401) {
        // Authentication error - refresh token
        return await this.refreshAuthentication(context);
      }
      
      return false;
    });
    
    // Memory error recovery
    this.recoveryStrategies.set(this.errorTypes.MEMORY, async (error, context) => {
      // Clear caches
      this.clearCaches();
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
      
      // Reduce memory usage
      await this.reduceMemoryUsage();
      
      return true;
    });
    
    // Timeout error recovery
    this.recoveryStrategies.set(this.errorTypes.TIMEOUT, async (error, context) => {
      // Increase timeout and retry
      if (context.timeout) {
        context.timeout *= 1.5;
      }
      
      return await this.retryOperation(context);
    });
  }
  
  /**
   * メインエラーハンドリング
   */
  async handleError(error, context = {}) {
    // Error ID for tracking
    error.id = this.generateErrorId();
    error.timestamp = new Date().toISOString();
    error.userAgent = navigator.userAgent;
    error.url = window.location.href;
    
    // Classify error
    const errorType = this.classifyError(error);
    error.type = errorType;
    
    // Log error
    this.logError(error);
    
    // Pattern detection
    this.detectErrorPattern(error);
    
    // Attempt recovery
    let recovered = false;
    if (this.config.enableAutoRecovery) {
      try {
        recovered = await this.attemptRecovery(error, context);
      } catch (recoveryError) {
        console.error('❌ Recovery failed:', recoveryError);
      }
    }
    
    // User notification
    if (this.config.enableUserNotification && !recovered) {
      this.notifyUser(error);
    }
    
    // Critical error handling
    if (error.critical && !recovered) {
      this.handleCriticalError(error);
    }
    
    return recovered;
  }
  
  /**
   * エラー分類
   */
  classifyError(error) {
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      return this.errorTypes.NETWORK;
    }
    
    if (error.status || error.message?.includes('API')) {
      return this.errorTypes.API;
    }
    
    if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
      return this.errorTypes.TIMEOUT;
    }
    
    if (error.message?.includes('memory') || error.name === 'RangeError') {
      return this.errorTypes.MEMORY;
    }
    
    if (error.message?.includes('permission') || error.name === 'NotAllowedError') {
      return this.errorTypes.PERMISSION;
    }
    
    if (error.message?.includes('validation') || error.name === 'ValidationError') {
      return this.errorTypes.VALIDATION;
    }
    
    return this.errorTypes.UNKNOWN;
  }
  
  /**
   * エラー復旧試行
   */
  async attemptRecovery(error, context) {
    const strategy = this.recoveryStrategies.get(error.type);
    
    if (strategy) {
      console.log(`🔧 Attempting recovery for ${error.type}...`);
      
      try {
        const result = await strategy(error, context);
        
        if (result) {
          console.log(`✅ Recovery successful for ${error.type}`);
          this.showUserMessage('問題が自動的に解決されました。', 'success');
          return true;
        }
      } catch (recoveryError) {
        console.error(`❌ Recovery strategy failed:`, recoveryError);
      }
    }
    
    return false;
  }
  
  /**
   * ユーザー通知
   */
  notifyUser(error) {
    const userFriendlyMessages = {
      [this.errorTypes.NETWORK]: 'ネットワーク接続に問題があります。インターネット接続を確認してください。',
      [this.errorTypes.API]: 'サーバーとの通信中にエラーが発生しました。しばらく待ってから再試行してください。',
      [this.errorTypes.TIMEOUT]: '処理に時間がかかりすぎています。再試行してください。',
      [this.errorTypes.MEMORY]: 'メモリ不足が発生しました。不要なタブを閉じて再試行してください。',
      [this.errorTypes.PERMISSION]: '必要な権限がありません。ブラウザの設定を確認してください。',
      [this.errorTypes.VALIDATION]: '入力データに問題があります。内容を確認してください。',
      [this.errorTypes.UNKNOWN]: '予期しないエラーが発生しました。ページを再読み込みしてください。'
    };
    
    const message = userFriendlyMessages[error.type] || userFriendlyMessages[this.errorTypes.UNKNOWN];
    this.showUserMessage(message, 'error');
  }
  
  /**
   * ユーザーメッセージ表示
   */
  showUserMessage(message, type = 'info') {
    // Create or update message container
    let messageContainer = document.getElementById('ultra-error-messages');
    
    if (!messageContainer) {
      messageContainer = document.createElement('div');
      messageContainer.id = 'ultra-error-messages';
      messageContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      `;
      document.body.appendChild(messageContainer);
    }
    
    // Create message element
    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
      padding: 12px 16px;
      margin-bottom: 8px;
      border-radius: 8px;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
      background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
    `;
    
    messageElement.textContent = message;
    messageContainer.appendChild(messageElement);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
          messageElement.remove();
        }, 300);
      }
    }, 5000);
  }
  
  /**
   * 操作リトライ
   */
  async retryOperation(context) {
    if (context.operation && typeof context.operation === 'function') {
      try {
        return await context.operation();
      } catch (error) {
        console.error('❌ Retry operation failed:', error);
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * エラーパターン検出
   */
  detectErrorPattern(error) {
    const pattern = `${error.type}-${error.message?.substring(0, 50)}`;
    
    if (this.errorPatterns.has(pattern)) {
      const count = this.errorPatterns.get(pattern) + 1;
      this.errorPatterns.set(pattern, count);
      
      // Pattern threshold reached
      if (count >= 3) {
        console.warn(`⚠️ Error pattern detected: ${pattern} (${count} times)`);
        this.handleErrorPattern(pattern, count);
      }
    } else {
      this.errorPatterns.set(pattern, 1);
    }
  }
  
  /**
   * エラーログ記録
   */
  logError(error) {
    this.errorLog.unshift(error);
    
    // Limit log size
    if (this.errorLog.length > this.config.maxErrorLog) {
      this.errorLog = this.errorLog.slice(0, this.config.maxErrorLog);
    }
    
    // Console output based on level
    if (this.config.logLevel === 'ERROR' || error.critical) {
      console.error('🚨 Ultra Error Handler:', error);
    }
  }
  
  /**
   * ユーティリティメソッド
   */
  generateErrorId() {
    return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getRetryCount(errorId) {
    return this.retryCounters.get(errorId) || 0;
  }
  
  incrementRetryCount(errorId) {
    const current = this.getRetryCount(errorId);
    this.retryCounters.set(errorId, current + 1);
  }
  
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  clearCaches() {
    // Clear various caches
    if (window.caches) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
  }
  
  async reduceMemoryUsage() {
    // Remove unused DOM elements
    const unusedElements = document.querySelectorAll('.hidden, .removed, .temp');
    unusedElements.forEach(el => el.remove());
    
    // Clear large objects from memory
    if (window.quantumProcessor) {
      window.quantumProcessor.clearCache?.();
    }
  }
  
  /**
   * エラー統計取得
   */
  getErrorStats() {
    const stats = {
      totalErrors: this.errorLog.length,
      errorsByType: {},
      recentErrors: this.errorLog.slice(0, 10),
      patterns: Array.from(this.errorPatterns.entries())
    };
    
    // Count by type
    this.errorLog.forEach(error => {
      stats.errorsByType[error.type] = (stats.errorsByType[error.type] || 0) + 1;
    });
    
    return stats;
  }
}

// CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Global error handler instance
window.ultraErrorHandler = new UltraErrorHandler();

export default UltraErrorHandler;