/**
 * MurderMysteryApp - メインアプリケーションクラス
 * アプリケーション全体の統合とライフサイクル管理
 */
class MurderMysteryApp extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.version = '2.0.0';
    this.environment = options.environment || this.detectEnvironment();
    this.config = this.loadConfig(options);
    
    // コアシステム
    this.state = null;
    this.logger = null;
    this.apiClient = null;
    this.uiController = null;
    this.stepManager = null;
    this.scenarioGenerator = null;
    
    // アプリケーション状態
    this.isInitialized = false;
    this.isGenerating = false;
    this.currentScenario = null;
    this.startTime = Date.now();
    
    this.initializeApp();
  }

  /**
   * 設定の読み込み
   */
  loadConfig(options) {
    const defaultConfig = {
      // API設定
      api: {
        baseURL: '/api',
        timeout: 30000,
        maxRetries: 3,
        rateLimitDelay: 100
      },
      
      // UI設定
      ui: {
        animationDuration: 300,
        debounceDelay: 300,
        autoSave: true,
        autoSaveInterval: 30000
      },
      
      // ステップ設定
      steps: {
        totalSteps: 5,
        validateOnChange: true,
        allowStepSkipping: false
      },
      
      // 生成設定
      generation: {
        defaultStrategy: 'ultra_phases',
        maxGenerationTime: 300000, // 5分
        enableFallback: true,
        qualityThreshold: 80
      },
      
      // ログ設定
      logging: {
        level: this.environment === 'development' ? 'DEBUG' : 'INFO',
        enableColors: true,
        enableTimestamp: true,
        maxLogSize: 1000
      },
      
      // セキュリティ設定
      security: {
        enableInputValidation: true,
        enableXSSProtection: true,
        enableCSRFProtection: true
      }
    };

    return this.deepMerge(defaultConfig, options);
  }

  /**
   * 環境検出
   */
  detectEnvironment() {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || 
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.includes('dev')) {
        return 'development';
      }
    }
    return 'production';
  }

  /**
   * アプリケーション初期化
   */
  async initializeApp() {
    try {
      this.emit('app:init:start');
      
      // 1. コアシステム初期化
      await this.initializeCoreSystem();
      
      // 2. 状態管理システム初期化
      await this.initializeStateManagement();
      
      // 3. UI システム初期化
      await this.initializeUISystem();
      
      // 4. ビジネスロジック初期化
      await this.initializeBusinessLogic();
      
      // 5. イベントバインディング
      await this.setupEventBindings();
      
      // 6. 初期状態設定
      await this.setupInitialState();
      
      // 7. 自動保存設定
      await this.setupAutoSave();
      
      // 8. エラーハンドリング設定
      await this.setupGlobalErrorHandling();
      
      this.isInitialized = true;
      this.logger.info('🚀 Murder Mystery App initialized successfully');
      
      this.emit('app:init:complete', {
        version: this.version,
        environment: this.environment,
        initTime: Date.now() - this.startTime
      });

    } catch (error) {
      this.logger?.error('App initialization failed:', error) || console.error('App initialization failed:', error);
      this.emit('app:init:error', { error });
      throw error;
    }
  }

  /**
   * コアシステム初期化
   */
  async initializeCoreSystem() {
    // ロガー初期化
    this.logger = new Logger({
      ...this.config.logging,
      namespace: 'MurderMystery'
    });

    // APIクライアント初期化
    this.apiClient = new ApiClient(this.config.api);
    
    // APIクライアントイベント監視
    this.apiClient.on('health:degraded', () => {
      this.logger.warn('API health degraded, switching to fallback mode');
      this.emit('api:degraded');
    });

    this.apiClient.on('health:recovered', () => {
      this.logger.info('API health recovered');
      this.emit('api:recovered');
    });

    this.logger.info('Core systems initialized');
  }

  /**
   * 状態管理システム初期化
   */
  async initializeStateManagement() {
    // 初期状態定義
    const initialState = {
      app: {
        version: this.version,
        environment: this.environment,
        isInitialized: false,
        currentView: 'steps'
      },
      steps: {
        current: 1,
        total: this.config.steps.totalSteps,
        completed: [],
        data: {}
      },
      form: {
        participants: '5',
        era: 'modern',
        setting: 'closed-space',
        worldview: 'realistic',
        tone: 'serious',
        incident_type: 'murder',
        complexity: 'standard',
        red_herring: false,
        twist_ending: false,
        secret_roles: false
      },
      generation: {
        isGenerating: false,
        strategy: null,
        progress: 0,
        phase: '',
        estimatedTime: '',
        result: null,
        error: null
      },
      ui: {
        loadingVisible: false,
        errorVisible: false,
        resultVisible: false,
        currentFocus: null
      }
    };

    this.state = new StateManager(initialState);

    // リデューサー登録
    this.setupReducers();

    // 状態変更監視
    this.state.on('state:change', (changeInfo) => {
      this.emit('state:changed', changeInfo);
    });

    this.logger.info('State management initialized');
  }

  /**
   * リデューサー設定
   */
  setupReducers() {
    // アプリケーションリデューサー
    this.state.addReducer('app', (state = {}, action) => {
      switch (action.type) {
        case 'APP_INITIALIZED':
          return { ...state, isInitialized: true };
        case 'VIEW_CHANGED':
          return { ...state, currentView: action.view };
        default:
          return state;
      }
    });

    // ステップリデューサー
    this.state.addReducer('steps', (state = {}, action) => {
      switch (action.type) {
        case 'STEP_CHANGED':
          return { 
            ...state, 
            current: action.step,
            completed: this.updateCompletedSteps(state.completed, action.step)
          };
        case 'STEP_DATA_UPDATED':
          return {
            ...state,
            data: { ...state.data, [action.step]: action.data }
          };
        default:
          return state;
      }
    });

    // フォームリデューサー
    this.state.addReducer('form', (state = {}, action) => {
      switch (action.type) {
        case 'FORM_FIELD_CHANGED':
          return { ...state, [action.field]: action.value };
        case 'FORM_RESET':
          return action.initialData;
        default:
          return state;
      }
    });

    // 生成リデューサー
    this.state.addReducer('generation', (state = {}, action) => {
      switch (action.type) {
        case 'GENERATION_STARTED':
          return {
            ...state,
            isGenerating: true,
            strategy: action.strategy,
            progress: 0,
            error: null
          };
        case 'GENERATION_PROGRESS':
          return {
            ...state,
            progress: action.progress,
            phase: action.phase,
            estimatedTime: action.estimatedTime
          };
        case 'GENERATION_COMPLETED':
          return {
            ...state,
            isGenerating: false,
            progress: 100,
            result: action.result
          };
        case 'GENERATION_FAILED':
          return {
            ...state,
            isGenerating: false,
            error: action.error
          };
        default:
          return state;
      }
    });

    // UIリデューサー
    this.state.addReducer('ui', (state = {}, action) => {
      switch (action.type) {
        case 'UI_LOADING_SHOW':
          return { ...state, loadingVisible: true };
        case 'UI_LOADING_HIDE':
          return { ...state, loadingVisible: false };
        case 'UI_ERROR_SHOW':
          return { ...state, errorVisible: true };
        case 'UI_ERROR_HIDE':
          return { ...state, errorVisible: false };
        case 'UI_FOCUS_CHANGED':
          return { ...state, currentFocus: action.element };
        default:
          return state;
      }
    });
  }

  /**
   * UIシステム初期化
   */
  async initializeUISystem() {
    this.uiController = new UIController(this.config.ui);
    
    // UI イベント監視
    this.uiController.on('form:change', (data) => {
      this.handleFormChange(data);
    });

    this.uiController.on('ui:button:click', (data) => {
      this.handleButtonClick(data);
    });

    this.uiController.on('ui:step:navigate', (data) => {
      this.handleStepNavigation(data);
    });

    this.uiController.on('navigation:next', () => {
      this.stepManager.goToNextStep();
    });

    this.uiController.on('navigation:previous', () => {
      this.stepManager.goToPreviousStep();
    });

    this.uiController.on('navigation:generate', () => {
      this.startGeneration();
    });

    this.logger.info('UI system initialized');
  }

  /**
   * ビジネスロジック初期化
   */
  async initializeBusinessLogic() {
    // ステップマネージャー初期化
    this.stepManager = new StepManager(this.config.steps);
    
    // ステップイベント監視
    this.stepManager.on('step:changed', (data) => {
      this.handleStepChanged(data);
    });

    this.stepManager.on('step:validation:failed', (data) => {
      this.handleStepValidationFailed(data);
    });

    // シナリオ生成器初期化
    this.scenarioGenerator = new ScenarioGenerator(this.apiClient, this.config.generation);
    
    // 生成イベント監視
    this.scenarioGenerator.on('generation:start', (data) => {
      this.handleGenerationStart(data);
    });

    this.scenarioGenerator.on('generation:progress', (data) => {
      this.handleGenerationProgress(data);
    });

    this.scenarioGenerator.on('generation:complete', (data) => {
      this.handleGenerationComplete(data);
    });

    this.scenarioGenerator.on('generation:error', (data) => {
      this.handleGenerationError(data);
    });

    this.logger.info('Business logic initialized');
  }

  /**
   * イベントバインディング設定
   */
  async setupEventBindings() {
    // 状態変更に基づくUI更新
    this.state.subscribe('steps.current', (currentStep) => {
      const totalSteps = this.state.getState('steps.total');
      this.uiController.updateStepVisibility(currentStep, totalSteps);
    });

    this.state.subscribe('generation.isGenerating', (isGenerating) => {
      if (isGenerating) {
        const progress = this.state.getState('generation.progress');
        const phase = this.state.getState('generation.phase');
        this.uiController.showLoading(phase, progress);
      } else {
        this.uiController.hideLoading();
      }
    });

    this.state.subscribe('generation.error', (error) => {
      if (error) {
        this.uiController.showError(error.message || '生成エラーが発生しました');
      }
    });

    // ウィンドウイベント
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges()) {
        e.returnValue = '変更内容が保存されていません。ページを離れますか？';
      }
    });

    window.addEventListener('unload', () => {
      this.cleanup();
    });

    this.logger.info('Event bindings set up');
  }

  /**
   * 初期状態設定
   */
  async setupInitialState() {
    // 保存済みデータの復元試行
    try {
      const savedData = this.loadSavedData();
      if (savedData) {
        this.restoreAppState(savedData);
        this.logger.info('Restored saved application state');
      }
    } catch (error) {
      this.logger.warn('Failed to restore saved state:', error);
    }

    // アプリケーション初期化完了マーク
    this.state.dispatch({
      type: 'APP_INITIALIZED'
    });

    this.logger.info('Initial state set up');
  }

  /**
   * 自動保存設定
   */
  async setupAutoSave() {
    if (!this.config.ui.autoSave) return;

    setInterval(() => {
      if (this.hasUnsavedChanges()) {
        this.saveAppState();
      }
    }, this.config.ui.autoSaveInterval);

    this.logger.info('Auto-save configured');
  }

  /**
   * グローバルエラーハンドリング設定
   */
  async setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      this.logger.error('Global error:', event.error);
      this.emit('app:error', { error: event.error, type: 'javascript' });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.logger.error('Unhandled promise rejection:', event.reason);
      this.emit('app:error', { error: event.reason, type: 'promise' });
    });

    this.logger.info('Global error handling set up');
  }

  /**
   * イベントハンドラー
   */
  handleFormChange(data) {
    this.state.dispatch({
      type: 'FORM_FIELD_CHANGED',
      field: data.name,
      value: data.value
    });

    // ステップデータ更新
    const currentStep = this.state.getState('steps.current');
    const stepData = this.stepManager.getCurrentStepData();
    const updatedStepData = { ...stepData, [data.name]: data.value };
    
    this.stepManager.setStepData(currentStep, updatedStepData);
  }

  handleButtonClick(data) {
    const { button } = data;
    
    switch (button) {
      case 'prev-btn':
        this.stepManager.goToPreviousStep();
        break;
      case 'next-btn':
        this.stepManager.goToNextStep();
        break;
      case 'stepwise-generation-btn':
        this.startGeneration();
        break;
      default:
        this.logger.debug('Unhandled button click:', button);
    }
  }

  handleStepNavigation(data) {
    this.stepManager.navigateToStep(data.targetStep);
  }

  handleStepChanged(data) {
    this.state.dispatch({
      type: 'STEP_CHANGED',
      step: data.to,
      previousStep: data.from
    });

    this.logger.debug(`Step changed: ${data.from} -> ${data.to}`);
  }

  handleStepValidationFailed(data) {
    this.uiController.showError(`ステップ ${data.step} の入力に問題があります`);
    this.logger.warn('Step validation failed:', data);
  }

  handleGenerationStart(data) {
    this.isGenerating = true;
    
    this.state.dispatch({
      type: 'GENERATION_STARTED',
      strategy: data.strategy || 'unknown'
    });

    this.logger.info('Scenario generation started:', data);
  }

  handleGenerationProgress(data) {
    this.state.dispatch({
      type: 'GENERATION_PROGRESS',
      progress: data.percentage,
      phase: data.phase,
      estimatedTime: data.estimatedTime
    });

    this.uiController.updateProgress(
      data.percentage,
      data.phase,
      data.details,
      data.estimatedTime
    );
  }

  handleGenerationComplete(data) {
    this.isGenerating = false;
    this.currentScenario = data.result;
    
    this.state.dispatch({
      type: 'GENERATION_COMPLETED',
      result: data.result
    });

    this.displayScenario(data.result);
    this.logger.info('Scenario generation completed:', data);
  }

  handleGenerationError(data) {
    this.isGenerating = false;
    
    this.state.dispatch({
      type: 'GENERATION_FAILED',
      error: data.error
    });

    this.logger.error('Scenario generation failed:', data.error);
  }

  /**
   * シナリオ生成開始
   */
  async startGeneration() {
    if (this.isGenerating) {
      this.logger.warn('Generation already in progress');
      return;
    }

    try {
      // 最終バリデーション
      const isValid = await this.validateAllSteps();
      if (!isValid) {
        this.uiController.showError('入力内容に問題があります。全てのステップを確認してください。');
        return;
      }

      // フォームデータ収集
      const formData = this.collectFormData();
      
      // 生成開始
      const result = await this.scenarioGenerator.generateScenario(formData, {
        preferredStrategy: this.config.generation.defaultStrategy
      });

      this.logger.info('Scenario generation completed successfully');

    } catch (error) {
      this.logger.error('Scenario generation failed:', error);
      this.uiController.showError(
        `シナリオ生成に失敗しました: ${error.message}`
      );
    }
  }

  /**
   * シナリオ表示
   */
  displayScenario(result) {
    this.uiController.hideAllContainers();
    
    const resultContainer = document.getElementById('result-container');
    const scenarioContent = document.getElementById('scenario-content');
    
    if (resultContainer && scenarioContent) {
      // セキュアなコンテンツ設定
      scenarioContent.innerHTML = '';
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'prose max-w-none';
      
      // マークダウン風のフォーマット適用
      const formattedContent = this.formatScenarioContent(result.scenario);
      contentDiv.innerHTML = formattedContent;
      
      scenarioContent.appendChild(contentDiv);
      
      resultContainer.classList.remove('hidden');
      resultContainer.style.display = 'block';
      
      // 結果までスクロール
      resultContainer.scrollIntoView({ behavior: 'smooth' });
    }

    this.state.dispatch({
      type: 'VIEW_CHANGED',
      view: 'result'
    });
  }

  /**
   * シナリオコンテンツフォーマット
   */
  formatScenarioContent(scenario) {
    return scenario
      .replace(/##\s(.+)/g, '<h3 class="text-xl font-bold mt-4 mb-2 text-indigo-700">$1</h3>')
      .replace(/【(.+?)】/g, '<h4 class="text-lg font-bold mt-3 mb-1 text-indigo-600">【$1】</h4>')
      .replace(/^\d+\.\s(.+)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br>');
  }

  /**
   * 全ステップバリデーション
   */
  async validateAllSteps() {
    for (let i = 1; i <= this.config.steps.totalSteps; i++) {
      const isValid = this.stepManager.isStepCompleted(i);
      if (!isValid) {
        this.logger.warn(`Step ${i} validation failed`);
        return false;
      }
    }
    return true;
  }

  /**
   * フォームデータ収集
   */
  collectFormData() {
    return this.state.getState('form');
  }

  /**
   * 状態管理
   */
  saveAppState() {
    const state = {
      steps: this.stepManager.exportState(),
      form: this.state.getState('form'),
      timestamp: new Date().toISOString(),
      version: this.version
    };

    try {
      localStorage.setItem('murder-mystery-app-state', JSON.stringify(state));
      this.logger.debug('App state saved');
    } catch (error) {
      this.logger.warn('Failed to save app state:', error);
    }
  }

  loadSavedData() {
    try {
      const saved = localStorage.getItem('murder-mystery-app-state');
      if (saved) {
        const state = JSON.parse(saved);
        
        // バージョンチェック
        if (state.version === this.version) {
          return state;
        } else {
          this.logger.info('Saved state version mismatch, ignoring');
        }
      }
    } catch (error) {
      this.logger.warn('Failed to load saved state:', error);
    }
    return null;
  }

  restoreAppState(savedState) {
    if (savedState.steps) {
      this.stepManager.importState(savedState.steps);
    }

    if (savedState.form) {
      for (const [field, value] of Object.entries(savedState.form)) {
        this.state.dispatch({
          type: 'FORM_FIELD_CHANGED',
          field,
          value
        });
      }
    }
  }

  hasUnsavedChanges() {
    const saved = this.loadSavedData();
    if (!saved) return true;

    const current = {
      steps: this.stepManager.exportState(),
      form: this.state.getState('form')
    };

    return JSON.stringify(current) !== JSON.stringify({
      steps: saved.steps,
      form: saved.form
    });
  }

  /**
   * ユーティリティメソッド
   */
  updateCompletedSteps(completed, currentStep) {
    const newCompleted = [...completed];
    for (let i = 1; i < currentStep; i++) {
      if (!newCompleted.includes(i)) {
        newCompleted.push(i);
      }
    }
    return newCompleted.sort((a, b) => a - b);
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this.deepMerge(target[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  /**
   * 診断・デバッグ機能
   */
  getDiagnosticInfo() {
    return {
      app: {
        version: this.version,
        environment: this.environment,
        isInitialized: this.isInitialized,
        isGenerating: this.isGenerating,
        uptime: Date.now() - this.startTime
      },
      state: this.state?.getDebugInfo(),
      stepManager: this.stepManager?.getDebugInfo(),
      apiClient: this.apiClient?.getStats(),
      scenarioGenerator: this.scenarioGenerator?.getStrategyStats()
    };
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    this.logger.info('Cleaning up application');
    
    if (this.hasUnsavedChanges()) {
      this.saveAppState();
    }

    this.uiController?.destroy();
    this.apiClient?.clearCache();
    this.removeAllListeners();
  }

  /**
   * リセット機能
   */
  reset() {
    this.stepManager.reset();
    this.state.dispatch({ type: 'FORM_RESET', initialData: this.config.form });
    this.currentScenario = null;
    this.isGenerating = false;
    
    localStorage.removeItem('murder-mystery-app-state');
    
    this.logger.info('Application reset');
    this.emit('app:reset');
  }
}

// グローバル利用可能にする
window.MurderMysteryApp = MurderMysteryApp;

export default MurderMysteryApp;