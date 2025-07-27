/**
 * 🚀 CORE APP - 統合コアシステム
 * ログ・リソース管理・アプリケーション初期化統合
 */

// ========== LOGGER SYSTEM ==========
// グローバルスコープでの重複定義を防ぐ
if (typeof Logger === 'undefined') {
  class Logger {
    constructor() {
      this.isProduction = !['localhost', '127.0.0.1'].includes(window.location.hostname) && 
                         !window.location.hostname.includes('dev');
      this.debugMode = localStorage.getItem('debug_mode') === 'true';
    }

    debug() {}
    info() {}
    success() {}
    warn() {}
    error() {}
  }
  
  // グローバルに公開
  window.Logger = Logger;
}

// ========== RESOURCE MANAGER ==========
class ResourceManager {
  constructor() {
    this.eventSources = new Map();
    this.timers = new Set();
    this.intervals = new Set();
    this.eventListeners = new Map();
    this.isActive = true;
    
    // Auto cleanup on page unload
    window.addEventListener('beforeunload', () => this.cleanup());
    // unloadイベントは非推奨のため削除
    
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        this.resume();
      }
    });
  }

  addEventListener(element, event, handler, options = {}) {
    if (!element || !event || !handler) return null;
    
    const id = `${Date.now()}_${Math.random()}`;
    element.addEventListener(event, handler, options);
    
    this.eventListeners.set(id, {
      element,
      event,
      handler,
      options
    });
    
    return id;
  }

  removeEventListener(id) {
    const listener = this.eventListeners.get(id);
    if (listener) {
      listener.element.removeEventListener(listener.event, listener.handler);
      this.eventListeners.delete(id);
    }
  }

  setTimeout(callback, delay) {
    const id = window.setTimeout(() => {
      callback();
      this.timers.delete(id);
    }, delay);
    this.timers.add(id);
    return id;
  }

  setInterval(callback, delay) {
    const id = window.setInterval(callback, delay);
    this.intervals.add(id);
    return id;
  }

  createEventSource(url, options = {}) {
    const id = options.id || `es_${Date.now()}`;
    try {
      const eventSource = new EventSource(url);
      this.eventSources.set(id, eventSource);
      return { eventSource, id };
    } catch (error) {
      logger.error('EventSource creation failed:', error);
      return { eventSource: null, id: null };
    }
  }

  closeEventSource(id) {
    const eventSource = this.eventSources.get(id);
    if (eventSource) {
      eventSource.close();
      this.eventSources.delete(id);
    }
  }

  cleanup() {
    // Close all EventSources
    this.eventSources.forEach((es, id) => {
      es.close();
    });
    this.eventSources.clear();

    // Clear all timers
    this.timers.forEach(id => window.clearTimeout(id));
    this.timers.clear();

    // Clear all intervals
    this.intervals.forEach(id => window.clearInterval(id));
    this.intervals.clear();

    // Remove all event listeners
    this.eventListeners.forEach((listener, id) => {
      listener.element.removeEventListener(listener.event, listener.handler);
    });
    this.eventListeners.clear();

    this.isActive = false;
  }

  pause() {
    // Pause intervals (timers will continue)
    this.intervals.forEach(id => window.clearInterval(id));
  }

  resume() {
    // Resume functionality if needed
    this.isActive = true;
  }
}

// ========== API KEY MANAGER ==========
class ApiKeyManager {
  constructor() {
    this.apiKey = null;
    this.isValidated = false;
    this.storageKey = 'groq_api_key_encrypted';
  }

  // 簡易暗号化（本番環境では適切な暗号化ライブラリを使用推奨）
  encrypt(text) {
    // Base64エンコード + 簡易難読化
    const encoded = btoa(text);
    return encoded.split('').reverse().join('');
  }

  decrypt(encrypted) {
    try {
      const decoded = encrypted.split('').reverse().join('');
      return atob(decoded);
    } catch (e) {
      return null;
    }
  }

  setApiKey(key) {
    this.apiKey = key;
    // localStorageに暗号化して永続保存
    if (key) {
      try {
        const encrypted = this.encrypt(key);
        localStorage.setItem(this.storageKey, encrypted);
        // セッションストレージにも暗号化保存（セキュリティ強化）
        const encryptedBackup = this.encrypt(key + '_backup_' + Date.now());
        sessionStorage.setItem('groq_api_key_backup', encryptedBackup);
      } catch (e) {
        logger.warn('Failed to save API key:', e);
      }
    } else {
      localStorage.removeItem(this.storageKey);
      sessionStorage.removeItem('groq_api_key');
    }
  }

  getApiKey() {
    if (this.apiKey) return this.apiKey;
    
    // まずlocalStorageから復元を試みる
    try {
      const encrypted = localStorage.getItem(this.storageKey);
      if (encrypted) {
        const decrypted = this.decrypt(encrypted);
        if (decrypted) {
          this.apiKey = decrypted;
          return this.apiKey;
        }
      }
    } catch (e) {
      logger.warn('Failed to retrieve API key from localStorage:', e);
    }
    
    // フォールバック：暗号化セッションストレージから復元
    const encryptedBackup = sessionStorage.getItem('groq_api_key_backup');
    if (encryptedBackup) {
      try {
        const decryptedBackup = this.decrypt(encryptedBackup);
        if (decryptedBackup) {
          // バックアップフォーマットから元のキーを抽出
          const parts = decryptedBackup.split('_backup_');
          if (parts.length === 2 && parts[0].startsWith('gsk_')) {
            this.apiKey = parts[0];
            // localStorageにも保存
            this.setApiKey(this.apiKey);
            return this.apiKey;
          }
        }
      } catch (e) {
        logger.warn('Failed to decrypt API key from session backup:', e);
      }
    }
    
    // 古いフォーマットの削除（セキュリティ改善）
    const oldStored = sessionStorage.getItem('groq_api_key');
    if (oldStored) {
      sessionStorage.removeItem('groq_api_key');
      logger.info('古い平文APIキーを削除しました');
    }
    
    return null;
  }

  async validateApiKey(key) {
    try {
      const response = await fetch('/api/validate-api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ apiKey: key })
      });

      if (!response.ok) {
        // HTTPエラーレスポンスの場合
        let errorMessage = 'APIキーの検証に失敗しました';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch (jsonError) {
          // JSONパースエラーの場合、HTTPステータスをチェック
          if (response.status === 400) {
            errorMessage = 'APIキーの形式が正しくありません';
          } else if (response.status === 500) {
            errorMessage = 'サーバーエラーが発生しました';
          }
        }
        
        this.isValidated = false;
        return { success: false, error: errorMessage };
      }

      const result = await response.json();
      
      if (result.success) {
        this.setApiKey(key);
        this.isValidated = true;
        return { success: true, message: result.message };
      } else {
        this.isValidated = false;
        return { success: false, error: result.error };
      }
    } catch (error) {
      // 本番環境では詳細なエラー情報を隠す
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.error('API validation error:', error);
      } else {
        console.warn('API validation failed');
      }
      this.isValidated = false;
      return { 
        success: false, 
        error: 'ネットワークエラーが発生しました。接続を確認してください。' 
      };
    }
  }

  clearApiKey() {
    this.apiKey = null;
    this.isValidated = false;
    localStorage.removeItem(this.storageKey);
    sessionStorage.removeItem('groq_api_key');
  }
}

// ========== MAIN APPLICATION ==========
class CoreApp {
  constructor() {
    this.formData = {};
    this.sessionData = null;
    this.isGenerating = false;
    this.eventSource = null;
    this.generationProgress = {
      currentPhase: 0,
      totalPhases: 9,
      status: 'waiting'
    };
    
    this.elements = {};
    this.apiKeyManager = new ApiKeyManager();
    
    // デバウンス/スロットル用
    this._debounceTimers = new Map();
    this._throttleLastCall = new Map();
    
    this.init();
  }

  async init() {
    try {
      // グローバルエラーハンドリング（ブラウザ拡張機能エラーを抑制）
      window.addEventListener('error', (event) => {
        if (event.message && event.message.includes('message channel closed')) {
          event.preventDefault();
          return false;
        }
      });

      window.addEventListener('unhandledrejection', (event) => {
        if (event.reason && event.reason.message && 
            event.reason.message.includes('message channel closed')) {
          event.preventDefault();
          return false;
        }
      });

      logger.info('🚀 Core App 初期化開始');
      
      // DOM要素取得
      this.elements = {
        // APIキー関連
        apiSetupCard: document.getElementById('api-setup-card'),
        apiSetupForm: document.getElementById('api-setup-form'),
        mainCard: document.getElementById('main-card'),
        groqApiKeyInput: document.getElementById('groq-api-key'),
        validateApiBtn: document.getElementById('validate-api-btn'),
        clearApiBtn: document.getElementById('clear-api-btn'),
        apiKeyError: document.getElementById('api-key-error'),
        apiValidationStatus: document.getElementById('api-validation-status'),
        changeApiBtn: document.getElementById('change-api-btn'),
        apiStatusText: document.getElementById('api-status-text'),
        
        // メインフォーム関連
        form: document.getElementById('scenario-form'),
        generateBtn: document.getElementById('generate-btn'),
        randomGenerateBtn: document.getElementById('random-generate-btn'),
        loadingContainer: document.getElementById('loading-container'),
        resultContainer: document.getElementById('result-container')
      };
      
      // 必須要素チェック
      const missingElements = Object.entries(this.elements)
        .filter(([key, el]) => !el && key !== 'randomGenerateBtn')
        .map(([key]) => key);
        
      if (missingElements.length > 0) {
        throw new Error(`必須要素が見つかりません: ${missingElements.join(', ')}`);
      }
      
      // APIキー初期化
      await this.initializeApiKey();
      
      // イベントリスナー設定
      this.setupEventListeners();
      
      logger.success('✅ Core App 初期化完了');
      
    } catch (error) {
      logger.error('初期化エラー:', error);
      this.showError('アプリケーションの初期化に失敗しました');
    }
  }

  async initializeApiKey() {
    // 保存されたAPIキーがあるかチェック
    const savedApiKey = this.apiKeyManager.getApiKey();
    
    if (savedApiKey) {
      // 削除ボタンを表示
      if (this.elements.clearApiBtn) {
        this.elements.clearApiBtn.style.display = 'inline-block';
      }
      
      // フォームに既存のキーを表示（マスク表示）
      if (this.elements.groqApiKeyInput) {
        const maskedKey = savedApiKey.substring(0, 8) + '...' + savedApiKey.substring(savedApiKey.length - 4);
        this.elements.groqApiKeyInput.placeholder = `保存済み: ${maskedKey}`;
      }
      
      // 保存されたキーを自動検証
      this.showValidationStatus('保存されたAPIキーを検証中...', 'info');
      const result = await this.apiKeyManager.validateApiKey(savedApiKey);
      if (result.success) {
        this.showValidationStatus('保存されたAPIキーで認証成功', 'success');
        setTimeout(() => {
          this.showMainInterface();
        }, 1000);
        return;
      } else {
        // 無効なキーは削除
        this.apiKeyManager.clearApiKey();
        this.showValidationStatus('保存されたAPIキーが無効です。新しいキーを入力してください。', 'error');
        if (this.elements.clearApiBtn) {
          this.elements.clearApiBtn.style.display = 'none';
        }
      }
    }
    
    // APIキー設定画面を表示
    this.showApiSetup();
  }

  showApiSetup() {
    this.elements.apiSetupCard.classList.remove('hidden');
    this.elements.mainCard.classList.add('hidden');
  }

  showMainInterface() {
    this.elements.apiSetupCard.classList.add('hidden');
    this.elements.mainCard.classList.remove('hidden');
  }

  async handleApiKeyValidation() {
    const apiKey = this.elements.groqApiKeyInput.value.trim();
    
    // エラー表示をクリア
    this.hideApiKeyError();
    this.hideValidationStatus();
    
    if (!apiKey) {
      this.showApiKeyError('❌ APIキーを入力してください');
      this.showValidationStatus('APIキーが入力されていません', 'error');
      return;
    }

    // キー形式の詳細チェック
    if (!apiKey.startsWith('gsk_')) {
      this.showApiKeyError('❌ GROQ APIキーは "gsk_" で始まる必要があります');
      this.showValidationStatus('無効なAPIキー形式', 'error');
      return;
    }

    if (apiKey.length < 56) {
      this.showApiKeyError('❌ APIキーが短すぎます。完全なキーを入力してください');
      this.showValidationStatus('APIキーの長さが不足しています', 'error');
      return;
    }

    // デバッグ情報
    logger.info('Validating API key format:', { 
      keyLength: apiKey.length, 
      prefix: apiKey.substring(0, 4) 
    });

    // 検証ボタンを無効化
    this.elements.validateApiBtn.disabled = true;
    this.elements.validateApiBtn.textContent = '🔍 検証中...';
    this.showValidationStatus('🔍 APIキーを検証しています...', 'info');

    try {
      const result = await this.apiKeyManager.validateApiKey(apiKey);
      
      if (result.success) {
        this.showValidationStatus('✅ ' + (result.message || 'APIキーの検証に成功しました'), 'success');
        this.hideApiKeyError();
        // 1秒後にメインインターフェースに移動
        setTimeout(() => {
          this.showMainInterface();
        }, 1000);
      } else {
        const errorMsg = result.error || 'APIキーの検証に失敗しました';
        this.showValidationStatus('❌ ' + errorMsg, 'error');
        this.showDetailedApiError(result);
        logger.warn('API key validation failed:', result.error);
      }
    } catch (error) {
      logger.error('API key validation error:', error);
      const errorMsg = `検証中にエラーが発生しました: ${error.message}`;
      this.showValidationStatus('❌ ' + errorMsg, 'error');
      this.showApiKeyError(`❌ ${errorMsg}\n\n対処方法:\n• ネットワーク接続を確認\n• しばらく待ってから再試行`);
    } finally {
      // 検証ボタンを再有効化
      this.elements.validateApiBtn.disabled = false;
      this.elements.validateApiBtn.textContent = '🔍 APIキー検証';
    }
  }
  
  showDetailedApiError(result) {
    let errorMessage = '❌ 検証に失敗しました\n\n';
    
    if (result.error && result.error.includes('unauthorized')) {
      errorMessage += '【認証エラー】\nAPIキーが無効または期限切れです。\n\n対処方法:\n• GROQ Console (console.groq.com) でAPIキーを確認\n• 新しいAPIキーを生成して再試行';
    } else if (result.error && result.error.includes('rate limit')) {
      errorMessage += '【レート制限エラー】\nAPI使用量の上限に達しました。\n\n対処方法:\n• しばらく待ってから再試行\n• アカウントのプランを確認';
    } else if (result.error && result.error.includes('network')) {
      errorMessage += '【ネットワークエラー】\nサーバーに接続できませんでした。\n\n対処方法:\n• インターネット接続を確認\n• VPNを無効にして再試行';
    } else {
      errorMessage += `【検証エラー】\n${result.error || '不明なエラー'}\n\n対処方法:\n• APIキーをコピー&ペーストで再入力\n• GROQ Consoleで新しいキーを生成`;
    }
    
    this.showApiKeyError(errorMessage);
  }

  handleChangeApiKey() {
    this.apiKeyManager.clearApiKey();
    this.elements.groqApiKeyInput.value = '';
    this.showApiSetup();
  }

  handleClearApiKey() {
    if (confirm('保存されたAPIキーを削除しますか？')) {
      this.apiKeyManager.clearApiKey();
      this.elements.groqApiKeyInput.value = '';
      this.elements.groqApiKeyInput.placeholder = 'gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      this.elements.clearApiBtn.style.display = 'none';
      this.showValidationStatus('保存されたAPIキーを削除しました', 'info');
      setTimeout(() => this.hideValidationStatus(), 3000);
    }
  }

  showApiKeyError(message) {
    this.elements.apiKeyError.textContent = message;
    this.elements.apiKeyError.classList.remove('hidden');
  }

  hideApiKeyError() {
    this.elements.apiKeyError.classList.add('hidden');
  }

  showValidationStatus(message, type) {
    this.elements.apiValidationStatus.textContent = message;
    this.elements.apiValidationStatus.className = `validation-status ${type}`;
    this.elements.apiValidationStatus.classList.remove('hidden');
  }

  hideValidationStatus() {
    this.elements.apiValidationStatus.classList.add('hidden');
  }

  setupEventListeners() {
    // APIキー設定フォーム
    if (this.elements.apiSetupForm) {
      resourceManager.addEventListener(this.elements.apiSetupForm, 'submit', (e) => {
        e.preventDefault();
        this.handleApiKeyValidation();
      });
    }

    // APIキー検証ボタン
    if (this.elements.validateApiBtn) {
      resourceManager.addEventListener(this.elements.validateApiBtn, 'click', (e) => {
        e.preventDefault();
        this.handleApiKeyValidation();
      });
    }

    // APIキー変更ボタン
    if (this.elements.changeApiBtn) {
      resourceManager.addEventListener(this.elements.changeApiBtn, 'click', () => {
        this.handleChangeApiKey();
      });
    }

    // APIキー削除ボタン
    if (this.elements.clearApiBtn) {
      resourceManager.addEventListener(this.elements.clearApiBtn, 'click', () => {
        this.handleClearApiKey();
      });
    }

    // フォーム送信
    if (this.elements.form) {
      resourceManager.addEventListener(this.elements.form, 'submit', (e) => {
        e.preventDefault();
        this.handleGenerate();
      });
    }
    
    // 生成ボタン
    if (this.elements.generateBtn) {
      resourceManager.addEventListener(this.elements.generateBtn, 'click', () => {
        this.handleGenerate();
      });
    }
    
    // ランダム生成ボタン
    if (this.elements.randomGenerateBtn) {
      resourceManager.addEventListener(this.elements.randomGenerateBtn, 'click', () => {
        this.handleRandomGenerate();
      });
    }
    
    // キーボードショートカット
    resourceManager.addEventListener(document, 'keydown', (e) => {
      this.handleKeyboardShortcut(e);
    });
  }

  async handleGenerate() {
    if (this.isGenerating) {
      logger.warn('既に生成中です');
      return;
    }

    // APIキーの検証
    if (!this.apiKeyManager.isValidated || !this.apiKeyManager.getApiKey()) {
      this.showError('APIキーが設定されていません。設定画面に戻ります。');
      this.showApiSetup();
      return;
    }
    
    try {
      logger.info('🎯 シナリオ生成開始');
      
      // フォームデータ収集
      this.formData = this.collectFormData();
      
      // APIキーを追加
      this.formData.apiKey = this.apiKeyManager.getApiKey();
      
      // バリデーション
      const validation = this.validateFormData(this.formData);
      if (!validation.isValid) {
        this.showError(validation.errors.join('\\n'));
        return;
      }
      
      // UI更新
      this.isGenerating = true;
      this.showLoading();
      
      // EventSource接続
      await this.connectEventSource();
      
    } catch (error) {
      logger.error('生成エラー:', error);
      this.showError('シナリオ生成中にエラーが発生しました');
      this.resetUI();
    }
  }

  handleRandomGenerate() {
    // ランダムデータ生成
    const randomData = this.createRandomFormData();
    
    // フォームに設定
    this.setFormData(randomData);
    
    // 生成実行
    this.handleGenerate();
  }

  createRandomFormData() {
    const participants = [4, 5, 6, 7, 8];
    const eras = ['modern', 'showa', 'near-future', 'fantasy'];
    const settings = ['closed-space', 'mountain-villa', 'military-facility', 'underwater-facility', 'city'];
    const tones = ['serious', 'light', 'horror', 'comedy'];
    const complexities = ['simple', 'standard', 'complex'];
    
    return {
      participants: participants[Math.floor(Math.random() * participants.length)],
      era: eras[Math.floor(Math.random() * eras.length)],
      setting: settings[Math.floor(Math.random() * settings.length)],
      tone: tones[Math.floor(Math.random() * tones.length)],
      complexity: complexities[Math.floor(Math.random() * complexities.length)],
      generate_artwork: Math.random() > 0.3,  // 70%の確率で画像生成
      'detailed-handouts': Math.random() > 0.3,
      'gm-support': Math.random() > 0.2
    };
  }

  setFormData(data) {
    Object.entries(data).forEach(([key, value]) => {
      const element = document.querySelector(`[name="${key}"]`);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = value;
        } else {
          element.value = value;
        }
      }
    });
  }

  async connectEventSource() {
    const sessionId = `session_${Date.now()}`;
    
    // 環境チェックと初期化を並列実行
    const initPromises = [
      this.checkEnvironment(),
      this.prepareSession(sessionId)
    ];
    
    try {
      const [envResult, sessionResult] = await Promise.allSettled(initPromises);
      
      const isVercel = envResult.status === 'fulfilled' ? envResult.value : this.detectVercelFallback();
      
      // Vercel環境または本番環境では常にPolling方式を使用
      if (isVercel || window.location.hostname !== 'localhost') {
        logger.info('🔄 Production/Vercel環境検出 - Polling方式を使用します');
        console.log('🚀 Switching to Polling mode for production environment');
        await this.connectPolling(sessionId);
        return;
      }
    } catch (error) {
      logger.warn('環境チェック失敗、Polling方式にフォールバック:', error);
      console.log('⚠️ Environment check failed, falling back to polling');
      await this.connectPolling(sessionId);
      return;
    }
    
    // ローカル環境ではEventSource使用
    const params = new URLSearchParams({
      formData: JSON.stringify(this.formData),
      sessionId: sessionId,
      stream: 'true'
    });
    
    const url = `/api/integrated-micro-generator?${params}`;
    
    const { eventSource, id } = resourceManager.createEventSource(url, {
      id: sessionId
    });
    
    if (!eventSource) {
      throw new Error('EventSource作成に失敗しました');
    }
    
    this.eventSource = eventSource;
    this.eventSourceRetryCount = 0;
    this.maxEventSourceRetries = 3;
    
    // イベントハンドラー設定
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleProgressUpdate(data);
      this.eventSourceRetryCount = 0; // 成功したらリセット
    };
    
    eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      this.handleComplete(data);
    });
    
    // EventSourceのエラーハンドリング（1つに統合）
    eventSource.onerror = (event) => {
      // 本番環境では詳細なエラー情報を隠す
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        console.error('[EventSource Error]', {
          url: url,
          readyState: eventSource.readyState,
          readyStateText: ['CONNECTING', 'OPEN', 'CLOSED'][eventSource.readyState],
          event: event,
          retryCount: this.eventSourceRetryCount
        });
      } else {
        console.warn('EventSource接続エラーが発生しました');
      }
      
      this.eventSourceRetryCount++;
      
      // 最大リトライ回数を超えたらPollingに切り替え
      if (this.eventSourceRetryCount > this.maxEventSourceRetries) {
        logger.warn('EventSource max retries exceeded, switching to polling');
        eventSource.close();
        resourceManager.closeEventSource(id);
        this.connectPolling(sessionId);
        return;
      }
      
      if (eventSource.readyState === EventSource.CLOSED) {
        logger.error('EventSource connection closed');
        this.handleError('サーバーとの接続が切断されました。再度お試しください。');
      } else if (eventSource.readyState === EventSource.CONNECTING) {
        logger.warn(`EventSource reconnecting... (${this.eventSourceRetryCount}/${this.maxEventSourceRetries})`);
        // 接続試行中は何もしない（自動リトライ）
      } else {
        this.handleError('接続エラーが発生しました');
      }
    };
  }
  
  async connectPolling(sessionId) {
    logger.info('🆓 Free Plan Mode: 段階別Function分離システムを使用');
    
    try {
      // 無料プラン用の生成開始
      const startResponse = await this.startFreePlanGeneration();
      
      if (!startResponse.success) {
        throw new Error(startResponse.error || '生成開始に失敗しました');
      }
      
      this.sessionId = startResponse.sessionId;
      logger.success(`✅ Free Plan Session Started: ${this.sessionId}`);
      
      // ポーリング開始
      await this.startFreePlanPolling(startResponse.sessionId, startResponse.nextPollIn || 2000);
      
    } catch (error) {
      logger.error('Free Plan Polling start failed:', error);
      throw error;
    }
  }
  
  /**
   * 無料プラン用生成開始
   */
  async startFreePlanGeneration() {
    try {
      console.log('🚀 Starting Free Plan Generation with formData:', this.formData);
      
      const response = await fetch('/api/free-plan-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'start',
          formData: this.formData
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Free Plan Generation start failed:', response.status, errorText);
        throw new Error(`Server error: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Free Plan Generation started:', result);
      return result;
    } catch (error) {
      console.error('❌ Free Plan Generation error:', error);
      throw error;
    }
  }
  
  /**
   * 無料プラン用ポーリング
   */
  async startFreePlanPolling(sessionId, pollInterval = 3000) {
    console.log(`📊 Starting polling for session: ${sessionId}, interval: ${pollInterval}ms`);
    
    // 既存のポーリングをクリア
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    
    let retryCount = 0;
    const maxRetries = 3;
    
    this.pollInterval = setInterval(async () => {
      try {
        console.log(`🔄 Polling attempt for session: ${sessionId}`);
        
        const response = await fetch('/api/free-plan-generator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            action: 'poll',
            sessionId: sessionId
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Polling response error:', response.status, errorText);
          throw new Error(`Polling failed: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📈 Polling response:', data);
        
        if (!data.success) {
          throw new Error(data.error || 'ポーリング失敗');
        }
        
        // リトライカウントをリセット
        retryCount = 0;
        
        // 進捗更新
        this.handleFreePlanProgress(data);
        
        // 完了チェック
        if (data.status === 'completed') {
          console.log('🎉 Generation completed!');
          clearInterval(this.pollInterval);
          this.pollInterval = null;
          this.handleFreePlanComplete(data);
        } else if (data.nextPollIn && data.nextPollIn !== pollInterval) {
          // 動的ポーリング間隔調整
          console.log(`⏱️ Adjusting poll interval to: ${data.nextPollIn}ms`);
          clearInterval(this.pollInterval);
          this.startFreePlanPolling(sessionId, data.nextPollIn);
        }
        
      } catch (error) {
        retryCount++;
        console.error(`❌ Polling error (retry ${retryCount}/${maxRetries}):`, error);
        
        if (retryCount >= maxRetries) {
          logger.error('Max polling retries exceeded:', error);
          clearInterval(this.pollInterval);
          this.pollInterval = null;
          this.handleError(error.message || 'ポーリング中にエラーが発生しました');
        }
      }
    }, pollInterval);
  }
  
  /**
   * 無料プラン進捗処理
   */
  handleFreePlanProgress(data) {
    console.log('📊 Handling Free Plan Progress:', data);
    
    const normalizedData = {
      currentStep: data.currentStage || 0,
      totalSteps: data.totalStages || 9,
      progress: data.progress || 0,
      statusMessage: data.message || data.stageName || '処理中...',
      estimatedTimeRemaining: 0,
      source: 'free-plan'
    };
    
    console.log('📈 Normalized progress data:', normalizedData);
    logger.info(`🔄 Free Plan Progress [${data.currentStage}/${data.totalStages}]: ${data.progress}%`);
    this.updateProgressDisplay(normalizedData);
  }
  
  /**
   * 無料プラン完了処理
   */
  handleFreePlanComplete(data) {
    logger.success('🎉 Free Plan Generation Complete!');
    
    this.sessionData = {
      sessionId: data.sessionId,
      scenario: data.result,
      freePlanOptimized: true
    };
    
    this.isGenerating = false;
    this.showResults();
  }
  
  handlePollingProgress(data) {
    // 統一された進捗データ構造を使用
    const normalizedData = this.normalizeProgressData(data, 'polling');
    this.updateProgressDisplay(normalizedData);
  }

  handleProgressUpdate(data) {
    logger.debug('進捗更新:', data);
    
    // 統一された進捗データ構造を使用
    const normalizedData = this.normalizeProgressData(data, 'eventsource');
    this.updateProgressDisplay(normalizedData);
  }

  /**
   * 進捗データの正規化（EventSourceとPolling両方に対応）
   */
  normalizeProgressData(data, source) {
    const currentStep = source === 'polling' ? (data.currentStep || 0) : (data.step || 0);
    const totalSteps = data.totalSteps || 9;
    const progress = data.progress || 0;
    
    // より正確な進捗計算（1/10で止まる問題の修正）
    let adjustedProgress = progress;
    
    // 進捗が異常に低い場合の修正
    if (progress <= 10 && currentStep > 0) {
      // 段階0完了後は最低15%を保証
      const minimumProgress = Math.max(15, (currentStep / totalSteps) * 100);
      adjustedProgress = Math.max(progress, minimumProgress);
      
      logger.warn(`🔧 Progress Adjustment: ${progress}% -> ${adjustedProgress}% (Step ${currentStep})`);
    }
    
    // 段階が進んでいるのに進捗が戻る問題を防ぐ
    if (this.generationProgress && this.generationProgress.progress) {
      const lastProgress = this.generationProgress.progress;
      if (adjustedProgress < lastProgress && currentStep >= this.generationProgress.currentPhase) {
        adjustedProgress = Math.max(adjustedProgress, lastProgress + 1);
        logger.warn(`🔧 Progress Regression Fix: Kept at ${adjustedProgress}%`);
      }
    }
    
    const statusMessage = source === 'polling' 
      ? (data.messages && data.messages.length > 0 ? data.messages[data.messages.length - 1].message : '処理中...')
      : (data.stepName || data.message || '処理中...');
    
    return {
      currentStep: currentStep,
      totalSteps: totalSteps,
      progress: Math.min(Math.max(adjustedProgress, 0), 100),
      statusMessage: statusMessage,
      estimatedTimeRemaining: data.estimatedTimeRemaining || 0,
      source: source
    };
  }

  /**
   * 統一された進捗表示更新
   */
  updateProgressDisplay(normalizedData) {
    // デバッグログを追加
    logger.info(`🔄 Progress Update [${normalizedData.source}]:`, {
      step: normalizedData.currentStep,
      total: normalizedData.totalSteps,
      progress: normalizedData.progress,
      message: normalizedData.statusMessage
    });
    
    // 進捗状態の更新
    this.generationProgress = {
      currentPhase: normalizedData.currentStep,
      totalPhases: normalizedData.totalSteps,
      status: 'generating',
      progress: normalizedData.progress
    };
    
    // UI要素の更新
    this.updateProgressBar(normalizedData.progress);
    this.updateStatusText(normalizedData.statusMessage);
    
    // フェーズ番号の更新
    const phaseNumber = document.getElementById('current-phase-number');
    if (phaseNumber) {
      phaseNumber.textContent = `${normalizedData.currentStep}/${normalizedData.totalSteps}`;
    }
    
    // 残り時間の表示（存在する場合）
    const timeRemaining = document.getElementById('time-remaining');
    if (timeRemaining && normalizedData.estimatedTimeRemaining > 0) {
      timeRemaining.textContent = `残り約${normalizedData.estimatedTimeRemaining}秒`;
    }
    
    // デバッグ情報
    logger.debug(`進捗表示更新: ${normalizedData.progress}% (段階${normalizedData.currentStep}/${normalizedData.totalSteps}) - ${normalizedData.source}`);
  }

  handleComplete(data) {
    logger.success('🎉 生成完了:', data);
    
    this.sessionData = data.sessionData || data;
    this.isGenerating = false;
    
    // EventSource切断
    if (this.eventSource) {
      resourceManager.closeEventSource(this.sessionData.sessionId);
      this.eventSource = null;
    }
    
    // 成功メッセージを表示
    this.showSuccessMessage();
    
    // 結果表示
    this.showResults();
  }
  
  showSuccessMessage() {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.innerHTML = `
      <strong>🎉 シナリオ生成完了！</strong><br>
      生成されたシナリオが下に表示されています。
      ダウンロードボタンからZIPファイルとして保存できます。
    `;
    
    const container = document.querySelector('.main-container');
    if (container) {
      // 既存のアラートを削除
      const existingAlerts = container.querySelectorAll('.alert');
      existingAlerts.forEach(alert => alert.remove());
      
      container.insertBefore(successDiv, container.firstChild);
      
      // 5秒後に自動的に削除
      resourceManager.setTimeout(() => {
        if (successDiv.parentNode) {
          successDiv.remove();
        }
      }, 5000);
    }
  }

  handleError(message) {
    logger.error('エラー:', message);
    
    this.isGenerating = false;
    
    if (this.eventSource) {
      resourceManager.closeEventSource(this.sessionData?.sessionId || 'unknown');
      this.eventSource = null;
    }
    
    this.showError(message);
    this.resetUI();
  }

  collectFormData() {
    if (!this.elements.form) return {};
    
    const formData = new FormData(this.elements.form);
    const data = {};
    
    // 通常のフォームデータ収集
    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        if (!Array.isArray(data[key])) {
          data[key] = [data[key]];
        }
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }
    
    // チェックボックスの特別処理（チェックされていない場合はfalse）
    const checkboxes = ['generate_artwork', 'detailed-handouts', 'gm-support'];
    checkboxes.forEach(name => {
      const checkbox = this.elements.form.querySelector(`[name="${name}"]`);
      if (checkbox && checkbox.type === 'checkbox') {
        data[name] = checkbox.checked;
      }
    });
    
    logger.debug('収集されたフォームデータ:', data);
    return data;
  }

  validateFormData(data) {
    const errors = [];
    const requiredFields = ['participants', 'era', 'setting', 'tone', 'complexity'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`${field}は必須項目です`);
      }
    }
    
    const participants = parseInt(data.participants);
    if (isNaN(participants) || participants < 3 || participants > 8) {
      errors.push('参加人数は3〜8人の範囲で指定してください');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  showLoading() {
    if (this.elements.loadingContainer) {
      this.elements.loadingContainer.classList.remove('hidden');
    }
    if (this.elements.resultContainer) {
      this.elements.resultContainer.classList.add('hidden');
    }
    if (this.elements.generateBtn) {
      this.elements.generateBtn.disabled = true;
      this.elements.generateBtn.textContent = '生成中...';
    }
  }

  showResults() {
    if (this.elements.loadingContainer) {
      this.elements.loadingContainer.classList.add('hidden');
    }
    if (this.elements.resultContainer) {
      this.elements.resultContainer.classList.remove('hidden');
    }
    
    this.renderResults();
    this.resetUI();
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.main-container');
    if (container) {
      container.insertBefore(errorDiv, container.firstChild);
      
      resourceManager.setTimeout(() => {
        if (errorDiv.parentNode) {
          errorDiv.remove();
        }
      }, 5000);
    }
    
    this.resetUI();
  }

  resetUI() {
    // EventSource/Pollingのクリーンアップ
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.pollingClient) {
      this.pollingClient.cancel();
      this.pollingClient = null;
    }
    
    if (this.elements.generateBtn) {
      this.elements.generateBtn.disabled = false;
      this.elements.generateBtn.textContent = '🚀 シナリオ生成開始';
    }
    this.isGenerating = false;
    this.generationProgress = {
      currentPhase: 0,
      totalPhases: 9,
      status: 'waiting'
    };
    this.eventSourceRetryCount = 0;
  }

  // シンプルな進捗バー更新
  updateProgressBar(progress) {
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  updateStatusText(text) {
    const statusElement = document.querySelector('.current-phase');
    if (statusElement) {
      statusElement.textContent = text;
    }
  }

  renderResults() {
    if (!this.sessionData || !this.elements.resultContainer) return;
    
    // 詳細な結果表示
    this.createDetailedResultPresentation();
  }
  
  createDetailedResultPresentation() {
    const container = this.elements.resultContainer;
    const scenarioContent = container.querySelector('#scenario-content');
    
    if (!scenarioContent) return;
    
    const scenario = this.sessionData.scenario || this.sessionData;
    
    // メインシナリオコンテンツ
    scenarioContent.innerHTML = `
      <div class="mystery-title-card">
        <h2 class="mystery-title">🔍 ${scenario.title || 'マーダーミステリーシナリオ'}</h2>
        <div class="mystery-subtitle">${scenario.subtitle || '【生成完了】'}</div>
      </div>
      
      <div class="scenario-meta-info">
        <span class="meta-item">📅 ${scenario.era || '現代'}</span>
        <span class="meta-item">🏠 ${scenario.setting || '洋館'}</span>
        <span class="meta-item">👥 ${scenario.participants || 6}人</span>
        <span class="meta-item">⏱️ ${scenario.playtime || '2-3時間'}</span>
      </div>
      
      <div class="scenario-sections">
        ${this.renderScenarioSection('📖 シナリオ概要', scenario.overview || scenario.concept)}
        ${this.renderScenarioSection('🎭 キャラクター', this.formatCharacters(scenario.characters))}
        ${this.renderScenarioSection('📅 タイムライン', this.formatTimeline(scenario.timeline))}
        ${this.renderScenarioSection('🔍 手がかり・証拠', this.formatClues(scenario.clues || scenario.evidence))}
        ${this.renderScenarioSection('🎯 真相', scenario.truth || scenario.solution, 'truth-section')}
      </div>
      
      <div class="action-buttons">
        <button class="btn btn-primary download-btn" onclick="app.downloadScenario()">
          📥 シナリオをダウンロード (ZIP)
        </button>
        <button class="btn btn-secondary" onclick="app.generateNew()">
          🔄 新しいシナリオを生成
        </button>
      </div>
    `;
  }
  
  renderScenarioSection(title, content, className = '') {
    if (!content) return '';
    
    const contentHtml = typeof content === 'string' 
      ? `<p>${content.replace(/\n/g, '<br>')}</p>`
      : content;
    
    return `
      <div class="scenario-section ${className}">
        <h3>${title}</h3>
        <div class="section-content">
          ${contentHtml}
        </div>
      </div>
    `;
  }
  
  formatCharacters(characters) {
    if (!characters || !Array.isArray(characters)) return '<p>キャラクター情報なし</p>';
    
    return characters.map(char => `
      <div class="character-card">
        <h4>${char.name || '名前未設定'}</h4>
        <p class="character-role">${char.role || '役職未設定'}</p>
        <p>${char.description || char.background || '説明なし'}</p>
        ${char.secret ? `<p class="character-secret">秘密: ${char.secret}</p>` : ''}
      </div>
    `).join('');
  }
  
  formatTimeline(timeline) {
    if (!timeline) return '<p>タイムライン情報なし</p>';
    
    if (Array.isArray(timeline)) {
      return timeline.map(event => `
        <div class="timeline-event">
          <span class="time">${event.time || '時刻不明'}</span>
          <span class="event">${event.event || event.description || ''}</span>
        </div>
      `).join('');
    }
    
    return `<p>${timeline.replace(/\n/g, '<br>')}</p>`;
  }
  
  formatClues(clues) {
    if (!clues) return '<p>手がかり情報なし</p>';
    
    if (Array.isArray(clues)) {
      return clues.map(clue => `
        <div class="clue-item">
          <h4>${clue.name || clue.title || '手がかり'}</h4>
          <p>${clue.description || clue.content || ''}</p>
          ${clue.location ? `<p class="clue-location">場所: ${clue.location}</p>` : ''}
        </div>
      `).join('');
    }
    
    return `<p>${clues.replace(/\n/g, '<br>')}</p>`;
  }
  
  async downloadScenario() {
    if (!this.sessionData) {
      this.showError('ダウンロードするシナリオがありません');
      return;
    }
    
    try {
      const sessionId = this.sessionData.sessionId || this.sessionData.id;
      const response = await fetch(`/api/export?sessionId=${sessionId}`);
      
      if (!response.ok) {
        throw new Error('ダウンロードに失敗しました');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `murder-mystery-${sessionId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      logger.success('シナリオをダウンロードしました');
    } catch (error) {
      logger.error('ダウンロードエラー:', error);
      this.showError('ダウンロードに失敗しました');
    }
  }
  
  // 環境チェックメソッド（並列処理用）
  async checkEnvironment() {
    return new Promise((resolve) => {
      console.log('🔍 Checking environment - hostname:', window.location.hostname);
      const isVercel = window.location.hostname.includes('vercel.app') || 
                      window.location.hostname === 'murder-mystery-generator.vercel.app' ||
                      window.location.hostname.includes('murder-mystery-generator') ||
                      window.location.hostname !== 'localhost';
      console.log('📍 Environment detected:', isVercel ? 'Production/Vercel' : 'Local');
      resolve(isVercel);
    });
  }
  
  // セッション準備メソッド（並列処理用）
  async prepareSession(sessionId) {
    return new Promise((resolve) => {
      // セッション固有の準備処理
      this.sessionId = sessionId;
      resolve({ sessionId, prepared: true });
    });
  }
  
  // フォールバック環境チェック
  detectVercelFallback() {
    return window.location.hostname.includes('vercel.app') || 
           window.location.hostname === 'murder-mystery-generator.vercel.app';
  }

  generateNew() {
    // 結果をクリアして新規生成画面に戻る
    this.hideResults();
    this.elements.form.reset();
    window.scrollTo(0, 0);
  }

  handleKeyboardShortcut(e) {
    // Ctrl/Cmd + Enter で生成（スロットル付き）
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      this.throttle(() => this.handleGenerate(), 1000, 'generate');
    }
    
    // Escape でキャンセル
    if (e.key === 'Escape' && this.isGenerating) {
      this.handleError('ユーザーによってキャンセルされました');
    }
  }
  
  // スロットル関数
  throttle(func, wait, key) {
    const now = Date.now();
    const lastCall = this._throttleLastCall.get(key) || 0;
    
    if (now - lastCall >= wait) {
      this._throttleLastCall.set(key, now);
      func();
    }
  }
  
  // デバウンス関数
  debounce(func, wait, key) {
    clearTimeout(this._debounceTimers.get(key));
    
    const timeoutId = setTimeout(() => {
      func();
      this._debounceTimers.delete(key);
    }, wait);
    
    this._debounceTimers.set(key, timeoutId);
  }
}

// ========== GLOBAL INSTANCES ==========
// Loggerインスタンスを安全に作成
const logger = window.Logger ? new window.Logger() : (window.logger || { debug: () => {}, info: () => {}, success: () => {}, warn: () => {}, error: () => {} });

// グローバルAppインスタンス（HTML内から参照可能）
let app;
// グローバルに公開
window.logger = logger;

const resourceManager = new ResourceManager();
let coreApp = null;

// ========== INITIALIZATION ==========
function initializeApp() {
  // Check if any app is already initialized
  if (window.coreApp || window.app || coreApp) {
    logger.warn('App already initialized, skipping duplicate initialization');
    return;
  }
  
  try {
    coreApp = new CoreApp();
    window.coreApp = coreApp; // Global access
    window.app = coreApp; // Compatibility alias
    app = coreApp; // グローバル変数にも設定
    
    // Prevent UltraIntegratedApp initialization
    window.ultraAppInitialized = true;
    
    logger.success('🚀 Core App ready! (UltraIntegratedApp integration complete)');
  } catch (error) {
    logger.error('App initialization failed:', error);
  }
}

// DOM Ready initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Logger, ResourceManager, CoreApp };
}