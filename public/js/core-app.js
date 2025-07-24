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
    
    // デバウンス/スロットル用
    this._debounceTimers = new Map();
    this._throttleLastCall = new Map();
    
    this.init();
  }

  async init() {
    try {
      logger.info('🚀 Core App 初期化開始');
      
      // DOM要素取得
      this.elements = {
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
      
      // イベントリスナー設定
      this.setupEventListeners();
      
      logger.success('✅ Core App 初期化完了');
      
    } catch (error) {
      logger.error('初期化エラー:', error);
      this.showError('アプリケーションの初期化に失敗しました');
    }
  }

  setupEventListeners() {
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
    
    try {
      logger.info('🎯 シナリオ生成開始');
      
      // フォームデータ収集
      this.formData = this.collectFormData();
      
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
    
    // Vercel環境チェック
    const isVercel = window.location.hostname.includes('vercel.app') || 
                    window.location.hostname === 'murder-mystery-generator.vercel.app' ||
                    window.location.hostname.includes('murder-mystery-generator');
    
    if (isVercel) {
      // Vercel環境ではPolling方式を使用
      logger.info('Vercel環境検出 - Polling方式に切り替えます');
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
      (process.env.NODE_ENV !== "production" || true) && console.error('[EventSource Error]', {
        url: url,
        readyState: eventSource.readyState,
        readyStateText: ['CONNECTING', 'OPEN', 'CLOSED'][eventSource.readyState],
        event: event,
        retryCount: this.eventSourceRetryCount
      });
      
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
    // Polling用スクリプトの動的読み込み
    if (!window.PollingClient) {
      try {
        const script = document.createElement('script');
        script.src = '/js/polling-client.js';
        await new Promise((resolve, reject) => {
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      } catch (error) {
        logger.error('Polling client script load failed:', error);
        throw new Error('Pollingクライアントの読み込みに失敗しました');
      }
    }
    
    // Pollingクライアントの初期化
    this.pollingClient = new PollingClient();
    
    // イベントハンドラー設定
    this.pollingClient.onProgress = (data) => {
      this.handlePollingProgress(data);
    };
    
    this.pollingClient.onComplete = (result) => {
      this.handleComplete(result);
    };
    
    this.pollingClient.onError = (error) => {
      this.handleError(error.message || '生成中にエラーが発生しました');
    };
    
    // 生成開始
    try {
      this.formData.sessionId = sessionId;
      await this.pollingClient.start(this.formData);
    } catch (error) {
      logger.error('Polling start failed:', error);
      throw error;
    }
  }
  
  handlePollingProgress(data) {
    // 進捗更新
    this.generationProgress = {
      currentPhase: data.currentStep || 0,
      totalPhases: data.totalSteps || 9,
      status: 'generating'
    };
    
    const progress = data.progress || 0;
    this.updateProgressBar(progress);
    
    // 最新のメッセージを表示
    if (data.messages && data.messages.length > 0) {
      const latestMessage = data.messages[data.messages.length - 1];
      this.updateStatusText(latestMessage.message || '処理中...');
    }
    
    // フェーズ番号更新
    const phaseNumber = document.getElementById('current-phase-number');
    if (phaseNumber) {
      phaseNumber.textContent = `${data.currentStep}/${data.totalSteps}`;
    }
  }

  handleProgressUpdate(data) {
    logger.debug('進捗更新:', data);
    
    this.generationProgress = {
      currentPhase: data.step || 0,
      totalPhases: data.totalSteps || 9,
      status: 'generating'
    };
    
    this.updateProgressBar(data.progress || 0);
    this.updateStatusText(data.stepName || '処理中...');
  }

  handleComplete(data) {
    logger.success('🎉 生成完了:', data);
    
    this.sessionData = data.sessionData;
    this.isGenerating = false;
    
    // EventSource切断
    if (this.eventSource) {
      resourceManager.closeEventSource(this.sessionData.sessionId);
      this.eventSource = null;
    }
    
    // 結果表示
    this.showResults();
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
    
    // シンプルな結果表示
    this.createResultPresentation();
  }
  
  createResultPresentation() {
    const container = this.elements.resultContainer;
    const scenarioContent = container.querySelector('#scenario-content');
    
    if (!scenarioContent) return;
    
    // メインシナリオコンテンツ
    scenarioContent.innerHTML = `
      <div class="mystery-title-card">
        <h2 class="mystery-title">🔍 マーダーミステリーシナリオ</h2>
        <div class="mystery-subtitle">【事件解決】 【検証完了】</div>
      </div>
      
      <div class="scenario-details">
        <div class="detail-card">
          <h3>🎭 事件概要</h3>
          <p>セッションID: ${this.sessionData.sessionId || 'MYSTERY-' + Date.now()}</p>
          <p>生成日時: ${new Date().toLocaleString('ja-JP')}</p>
          <p>状態: 【解決済み】</p>
        </div>
        
        <div class="detail-card">
          <h3>🕵️ 捜査結果</h3>
          <p>全ての証拠が揃いました</p>
          <p>真犯人の特定に成功</p>
          <p>動機・手口・アリバイを解明</p>
        </div>
      </div>
    `;
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