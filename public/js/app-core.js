/**
 * 🚀 ULTRA OPTIMIZED APP CORE - 統合コアモジュール
 * 11ファイル→3ファイル統合の中核
 */

// ログとリソース管理はグローバル変数として使用
// logger と resourceManager は既に読み込まれているはず

/**
 * 🎯 メインアプリケーションクラス
 */
class UltraOptimizedApp {
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
    
    // 必須DOM要素
    this.elements = {
      form: null,
      generateBtn: null,
      loadingContainer: null,
      resultContainer: null
    };
    
    // 初期化
    this.init();
  }

  /**
   * 初期化処理
   */
  async init() {
    try {
      logger.info('🚀 Ultra Optimized App 初期化開始');
      
      // DOM要素取得
      this.elements.form = document.getElementById('scenario-form');
      this.elements.generateBtn = document.getElementById('generate-btn');
      this.elements.randomGenerateBtn = document.getElementById('random-generate-btn');
      this.elements.loadingContainer = document.getElementById('loading-container');
      this.elements.resultContainer = document.getElementById('result-container');
      
      // 要素チェック（randomGenerateBtnは必須ではない）
      const missingElements = Object.entries(this.elements)
        .filter(([key, el]) => !el && key !== 'randomGenerateBtn')
        .map(([key]) => key);
        
      if (missingElements.length > 0) {
        throw new Error(`必須要素が見つかりません: ${missingElements.join(', ')}`);
      }
      
      // イベントリスナー設定
      this.setupEventListeners();
      
      // UI拡張機能の初期化
      await this.initializeUIEnhancements();
      
      logger.success('✅ Ultra Optimized App 初期化完了');
      
    } catch (error) {
      logger.error('初期化エラー:', error);
      this.showError('アプリケーションの初期化に失敗しました');
    }
  }

  /**
   * イベントリスナー設定
   */
  setupEventListeners() {
    // フォーム送信
    resourceManager.addEventListener(this.elements.form, 'submit', (e) => {
      e.preventDefault();
      this.handleGenerate();
    });
    
    // 生成ボタン
    resourceManager.addEventListener(this.elements.generateBtn, 'click', () => {
      this.handleGenerate();
    });
    
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

  /**
   * シナリオ生成処理
   */
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
        this.showError(validation.errors.join('\n'));
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

  /**
   * ランダム生成処理
   */
  async handleRandomGenerate() {
    if (this.isGenerating) {
      logger.warn('既に生成中です');
      return;
    }
    
    try {
      logger.info('🎲 ランダム生成開始');
      
      // ランダム生成用のデータを作成
      this.formData = this.createRandomFormData();
      
      // UI更新
      this.isGenerating = true;
      this.showLoading();
      
      // EventSource接続
      await this.connectEventSource();
      
    } catch (error) {
      logger.error('ランダム生成エラー:', error);
      this.showError('ランダム生成中にエラーが発生しました');
      this.resetUI();
    }
  }

  /**
   * EventSource接続
   */
  async connectEventSource() {
    const sessionId = `session_${Date.now()}`;
    const params = new URLSearchParams({
      formData: JSON.stringify(this.formData),
      sessionId: sessionId,
      stream: 'true'
    });
    
    const url = `/api/integrated-micro-generator?${params}`;
    
    // リソースマネージャー経由で作成
    const { eventSource, id } = resourceManager.createEventSource(url, {
      id: sessionId
    });
    
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

  /**
   * 進捗更新処理
   */
  handleProgressUpdate(data) {
    logger.debug('進捗更新:', data);
    
    this.generationProgress = {
      currentPhase: data.step || 0,
      totalPhases: data.totalSteps || 9,
      status: 'generating'
    };
    
    // プログレスバー更新
    this.updateProgressBar(data.progress || 0);
    
    // ステータステキスト更新
    this.updateStatusText(data.stepName || '処理中...');
  }

  /**
   * 生成完了処理
   */
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

  /**
   * エラー処理
   */
  handleError(message) {
    logger.error('エラー:', message);
    
    this.isGenerating = false;
    
    // EventSource切断
    if (this.eventSource) {
      resourceManager.closeEventSource(this.sessionData?.sessionId || 'unknown');
      this.eventSource = null;
    }
    
    this.showError(message);
    this.resetUI();
  }

  /**
   * フォームデータ収集
   */
  collectFormData() {
    const formData = new FormData(this.elements.form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        // 複数値の場合は配列に
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

  /**
   * ランダムフォームデータ作成
   */
  createRandomFormData() {
    const randomChoices = {
      participants: ['4', '5', '6', '7', '8'],
      era: ['modern', 'showa', 'near-future', 'fantasy'],
      setting: ['closed-space', 'mountain-villa', 'military-facility', 'underwater-facility', 'city'],
      worldview: ['realistic', 'occult', 'sci-fi', 'mystery'],
      tone: ['serious', 'light', 'horror', 'comedy'],
      complexity: ['simple', 'standard', 'complex'],
      motive: ['random', 'money', 'revenge', 'love', 'jealousy', 'secret'],
      'victim-type': ['random', 'wealthy', 'celebrity', 'businessman', 'ordinary'],
      weapon: ['random', 'knife', 'poison', 'blunt', 'unusual']
    };
    
    const data = {};
    
    // ランダム選択
    for (const [key, options] of Object.entries(randomChoices)) {
      data[key] = options[Math.floor(Math.random() * options.length)];
    }
    
    // チェックボックスはランダム
    data['generate-images'] = Math.random() > 0.5 ? 'true' : 'false';
    data['detailed-handouts'] = Math.random() > 0.3 ? 'true' : 'false';
    data['gm-support'] = Math.random() > 0.2 ? 'true' : 'false';
    
    // カスタム要求は空
    data['custom-request'] = '';
    
    logger.debug('ランダム生成されたフォームデータ:', data);
    return data;
  }

  /**
   * フォームバリデーション
   */
  validateFormData(data) {
    const errors = [];
    
    // 必須フィールドチェック
    const requiredFields = ['participants', 'era', 'setting', 'tone', 'complexity'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`${field}は必須項目です`);
      }
    }
    
    // 参加人数チェック
    const participants = parseInt(data.participants);
    if (isNaN(participants) || participants < 3 || participants > 8) {
      errors.push('参加人数は3〜8人の範囲で指定してください');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * UI更新メソッド
   */
  showLoading() {
    this.elements.loadingContainer.style.display = 'block';
    this.elements.resultContainer.style.display = 'none';
    this.elements.generateBtn.disabled = true;
    this.elements.generateBtn.textContent = '生成中...';
  }

  showResults() {
    this.elements.loadingContainer.style.display = 'none';
    this.elements.resultContainer.style.display = 'block';
    this.renderResults();
  }

  showError(message) {
    // エラー表示実装
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.textContent = message;
    
    const container = document.querySelector('.main-container');
    container.insertBefore(errorDiv, container.firstChild);
    
    // 5秒後に自動削除
    resourceManager.setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  resetUI() {
    this.elements.generateBtn.disabled = false;
    this.elements.generateBtn.textContent = 'シナリオを生成';
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
    const statusElement = document.querySelector('.loading-text');
    if (statusElement) {
      statusElement.textContent = text;
    }
  }

  /**
   * 結果レンダリング
   */
  renderResults() {
    if (!this.sessionData) return;
    
    const container = this.elements.resultContainer;
    container.innerHTML = '';
    
    // タイトル
    const title = this.extractTitle(this.sessionData);
    if (title) {
      const titleElement = document.createElement('h2');
      titleElement.className = 'scenario-title';
      titleElement.textContent = title;
      container.appendChild(titleElement);
    }
    
    // タブシステム作成
    const tabSystem = this.createTabSystem();
    container.appendChild(tabSystem);
    
    // ダウンロードボタン
    const downloadBtn = this.createDownloadButton();
    container.appendChild(downloadBtn);
  }

  /**
   * タブシステム作成
   */
  createTabSystem() {
    const tabContainer = document.createElement('div');
    tabContainer.className = 'tab-container';
    
    const tabNav = document.createElement('div');
    tabNav.className = 'tab-nav';
    
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content-container';
    
    // タブ定義
    const tabs = [
      { id: 'overview', label: 'シナリオ概要', content: this.getOverviewContent() },
      { id: 'characters', label: 'キャラクター', content: this.getCharactersContent() },
      { id: 'timeline', label: 'タイムライン', content: this.getTimelineContent() },
      { id: 'gm-guide', label: 'GMガイド', content: this.getGMGuideContent() }
    ];
    
    tabs.forEach((tab, index) => {
      // タブボタン
      const button = document.createElement('button');
      button.className = `tab-button ${index === 0 ? 'active' : ''}`;
      button.textContent = tab.label;
      button.dataset.tab = tab.id;
      
      resourceManager.addEventListener(button, 'click', () => {
        this.switchTab(tab.id);
      });
      
      tabNav.appendChild(button);
      
      // タブコンテンツ
      const content = document.createElement('div');
      content.className = `tab-content ${index === 0 ? 'active' : ''}`;
      content.id = `tab-${tab.id}`;
      content.innerHTML = tab.content;
      
      tabContent.appendChild(content);
    });
    
    tabContainer.appendChild(tabNav);
    tabContainer.appendChild(tabContent);
    
    return tabContainer;
  }

  /**
   * タブ切り替え
   */
  switchTab(tabId) {
    // ボタンの状態更新
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    // コンテンツの表示切り替え
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.id === `tab-${tabId}`);
    });
  }

  /**
   * コンテンツ取得メソッド
   */
  getOverviewContent() {
    const concept = this.sessionData?.phases?.step1?.content?.concept || '';
    return `<div class="scenario-overview">${this.formatContent(concept)}</div>`;
  }

  getCharactersContent() {
    const characters = this.sessionData?.phases?.step4?.content?.characters || '';
    return `<div class="characters-content">${this.formatContent(characters)}</div>`;
  }

  getTimelineContent() {
    const timeline = this.sessionData?.phases?.step3?.content?.incident_details || '';
    return `<div class="timeline-content">${this.formatContent(timeline)}</div>`;
  }

  getGMGuideContent() {
    const guide = this.sessionData?.phases?.step6?.content?.gamemaster_guide || '';
    return `<div class="gm-guide-content">${this.formatContent(guide)}</div>`;
  }

  /**
   * コンテンツフォーマット
   */
  formatContent(content) {
    if (!content) return '<p>コンテンツがありません</p>';
    
    // マークダウン風の変換
    return content
      .replace(/## (.+)/g, '<h3>$1</h3>')
      .replace(/### (.+)/g, '<h4>$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  /**
   * タイトル抽出
   */
  extractTitle(sessionData) {
    const concept = sessionData?.phases?.step1?.content?.concept || '';
    const titleMatch = concept.match(/\*\*作品タイトル\*\*:\s*(.+?)(\n|$)/);
    return titleMatch ? titleMatch[1] : 'マーダーミステリー';
  }

  /**
   * ダウンロードボタン作成
   */
  createDownloadButton() {
    const button = document.createElement('button');
    button.className = 'btn btn-primary';
    button.innerHTML = '📥 シナリオをダウンロード';
    
    resourceManager.addEventListener(button, 'click', () => {
      this.downloadScenario();
    });
    
    return button;
  }

  /**
   * シナリオダウンロード
   */
  async downloadScenario() {
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionData: this.sessionData,
          format: 'complete'
        })
      });
      
      if (!response.ok) throw new Error('ダウンロードに失敗しました');
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.extractTitle(this.sessionData)}.zip`;
      a.click();
      
      URL.revokeObjectURL(url);
      
    } catch (error) {
      logger.error('ダウンロードエラー:', error);
      this.showError('ダウンロードに失敗しました');
    }
  }

  /**
   * キーボードショートカット処理
   */
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

  /**
   * UI拡張機能の初期化
   */
  async initializeUIEnhancements() {
    // スムーススクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      resourceManager.addEventListener(anchor, 'click', (e) => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
    
    // フォーム要素のアニメーション
    this.elements.form.querySelectorAll('input, select, textarea').forEach(element => {
      resourceManager.addEventListener(element, 'focus', () => {
        element.parentElement.classList.add('focused');
      });
      
      resourceManager.addEventListener(element, 'blur', () => {
        element.parentElement.classList.remove('focused');
      });
    });
  }
}

// グローバルインスタンス作成
window.ultraApp = null;

// DOM読み込み完了後に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ultraApp = new UltraOptimizedApp();
  });
} else {
  window.ultraApp = new UltraOptimizedApp();
}

// グローバル公開
window.UltraOptimizedApp = UltraOptimizedApp;