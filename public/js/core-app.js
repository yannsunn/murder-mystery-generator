/**
 * 🚀 CORE APP - 統合コアシステム
 * ログ・リソース管理・アプリケーション初期化統合
 */

// ========== LOGGER SYSTEM ==========
class Logger {
  constructor() {
    this.isProduction = !['localhost', '127.0.0.1'].includes(window.location.hostname) && 
                       !window.location.hostname.includes('dev');
    this.debugMode = localStorage.getItem('debug_mode') === 'true';
  }

  debug(...args) {
    if (!this.isProduction || this.debugMode) {
    }
  }

  info(...args) {
    if (!this.isProduction || this.debugMode) {
    }
  }

  success(...args) {
    if (!this.isProduction || this.debugMode) {
    }
  }

  warn(...args) {
  }

  error(...args) {
  }
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
    window.addEventListener('unload', () => this.cleanup());
    
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
      'generate-images': Math.random() > 0.5,
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
    
    // イベントハンドラー設定
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleProgressUpdate(data);
    };
    
    eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      this.handleComplete(data);
    });
    
    eventSource.addEventListener('error', (event) => {
      logger.error('EventSource error:', event);
      this.handleError('接続エラーが発生しました');
    });
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
    errorDiv.style.cssText = `
      background: linear-gradient(135deg, rgba(220, 38, 38, 0.9) 0%, rgba(153, 27, 27, 0.9) 100%);
      color: #ffffff;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 12px;
      padding: 1.5rem;
      margin: 1rem 0;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
      box-shadow: 0 4px 20px rgba(220, 38, 38, 0.4);
    `;
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
  }

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
    
    // 🎪 ULTRA CINEMATIC RESULT PRESENTATION - 限界突破結果演出
    this.createCinematicResultPresentation();
  }
  
  createCinematicResultPresentation() {
    const container = this.elements.resultContainer;
    const scenarioContent = container.querySelector('#scenario-content');
    const evidenceCards = container.querySelector('#evidence-cards');
    const connectionLines = container.querySelector('#connection-lines');
    
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
          <h3>🕵️ 捕査結果</h3>
          <p>全ての証拠が揃いました</p>
          <p>真犯の特定に成功</p>
          <p>動機・手口・アリバイを解明</p>
        </div>
      </div>
    `;
    
    // 証拠カードの動的生成
    if (evidenceCards) {
      this.createEvidenceCards(evidenceCards);
    }
    
    // 接続線の描画
    if (connectionLines) {
      this.createConnectionLines(connectionLines);
    }
    
    // アニメーショントリガー
    this.triggerResultAnimations();
  }
  
  createEvidenceCards(container) {
    const evidenceData = [
      { title: '被害者情報', content: '身元・経歴・人間関係', icon: '👤', rotate: '-3deg' },
      { title: '犯行現場', content: '犯行現場の状況・物的証拠', icon: '🏠', rotate: '2deg' },
      { title: '時系列', content: '事件発生の経緯・タイムライン', icon: '⏰', rotate: '-1deg' },
      { title: '容疑者', content: '容疑者リスト・動機・アリバイ', icon: '🕵️', rotate: '3deg' },
      { title: '決定的証拠', content: '犯人特定に至った決定打', icon: '🔑', rotate: '-2deg' }
    ];
    
    evidenceData.forEach((evidence, index) => {
      const card = document.createElement('div');
      card.className = 'evidence-card';
      card.style.setProperty('--rotate', evidence.rotate);
      card.style.animationDelay = `${index * 0.3}s`;
      
      card.innerHTML = `
        <div class="evidence-header">
          <span class="evidence-icon">${evidence.icon}</span>
          <h4 class="evidence-title">${evidence.title}</h4>
        </div>
        <div class="evidence-content">
          <p>${evidence.content}</p>
          <div class="evidence-status">【確認済み】</div>
        </div>
      `;
      
      container.appendChild(card);
    });
  }
  
  createConnectionLines(container) {
    // 証拠カード間の糸でつなぐ線を描画
    const connections = [
      { from: 0, to: 1, delay: '1s' },
      { from: 1, to: 2, delay: '1.5s' },
      { from: 2, to: 3, delay: '2s' },
      { from: 3, to: 4, delay: '2.5s' }
    ];
    
    connections.forEach((conn, index) => {
      const line = document.createElement('div');
      line.className = 'connection-string';
      line.style.cssText = `
        width: 100px;
        top: ${150 + conn.from * 120}px;
        left: ${200 + index * 50}px;
        transform: rotate(${15 + index * 10}deg);
        animation-delay: ${conn.delay};
      `;
      container.appendChild(line);
    });
  }
  
  triggerResultAnimations() {
    // 結果コンテナにアニメーションクラスを追加
    const resultContainer = this.elements.resultContainer;
    if (resultContainer) {
      resultContainer.classList.add('result-reveal');
      
      // 段階的なアニメーション
      setTimeout(() => {
        const evidenceCards = resultContainer.querySelectorAll('.evidence-card');
        evidenceCards.forEach((card, index) => {
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = `rotate(${card.style.getPropertyValue('--rotate')}) translateY(0)`;
          }, index * 200);
        });
      }, 500);
      
      // サウンドエフェクトのシミュレーション（視覚的フィードバック）
      setTimeout(() => {
        this.createSuccessParticles();
      }, 1500);
    }
  }
  
  createSuccessParticles() {
    // 成功演出のパーティクルエフェクト
    const container = document.querySelector('.evidence-board');
    if (!container) return;
    
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.innerHTML = '✨';
      particle.style.cssText = `
        position: absolute;
        top: ${Math.random() * 100}%;
        left: ${Math.random() * 100}%;
        font-size: ${Math.random() * 20 + 10}px;
        animation: sparkle 2s ease-out forwards;
        pointer-events: none;
        z-index: 1000;
      `;
      
      container.appendChild(particle);
      
      // パーティクルを自動削除
      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
      }, 2000);
    }
  }

  handleKeyboardShortcut(e) {
    // Ctrl/Cmd + Enter で生成
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      this.handleGenerate();
    }
    
    // Escape でキャンセル
    if (e.key === 'Escape' && this.isGenerating) {
      this.handleError('ユーザーによってキャンセルされました');
    }
  }
}

// ========== GLOBAL INSTANCES ==========
const logger = new Logger();
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