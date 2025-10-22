/**
 * 🚀 CORE APP - 統合コアシステム
 * ログ・リソース管理・アプリケーション初期化統合
 */

// ========== SECURITY UTILITIES ==========
/**
 * HTMLエスケープ関数（XSS対策）
 */
function escapeHtml(text) {
  if (typeof text !== 'string') {
    return text;
  }
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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
    if (!element || !event || !handler) {return null;}
    
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
        // メインフォーム関連
        mainCard: document.getElementById('main-card'),
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
      
      if (!startResponse || !startResponse.success) {
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
        
        // JSONレスポンスの場合、エラー詳細を取得
        try {
          const errorData = JSON.parse(errorText);
          const errorMsg = `生成開始エラー\n\n${errorData.error || 'サーバーエラーが発生しました'}\n\nステータス: ${response.status}`;
          this.handleError(errorMsg);
          return null;
        } catch (e) {
          this.handleError(`生成開始エラー: ${response.status}`);
          return null;
        }
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
    let stuckCount = 0;
    const maxStuckCount = 5; // 同じステージに5回以上いたら停止
    let lastStage = -1;
    let lastProgress = -1;
    const startTime = Date.now();
    const maxPollingTime = 5 * 60 * 1000; // 最大5分
    
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
          
          // JSONレスポンスの場合、デバッグ情報を表示
          try {
            const errorData = JSON.parse(errorText);
            console.error('❌ Server error details:', errorData);
            if (errorData.debug) {
              console.error('❌ Debug info:', errorData.debug);
              console.error('❌ API Key Status:', errorData.debug.apiKeyStatus);
            }
            throw new Error(errorData.error || `Polling failed: ${response.status}`);
          } catch (e) {
            // JSONパースエラーの場合はそのままエラーテキストを使用
            throw new Error(`Polling failed: ${response.status}`);
          }
        }
        
        const data = await response.json();
        console.log('📈 Polling response:', data);
        
        if (!data.success) {
          // エラーレスポンスの場合は即座に停止
          clearInterval(this.pollInterval);
          this.pollInterval = null;
          
          const errorDetails = [];
          
          // エラーメッセージの解析
          const errorMessage = data.error || 'シナリオ生成に失敗しました';
          
          // GROQ APIシステムエラーの場合の特別処理
          if (errorMessage.includes('SYSTEM_FAILURE') || errorMessage.includes('システムに一時的な問題')) {
            errorDetails.push('⚠️ APIサービスに一時的な問題が発生しています');
            errorDetails.push('');
            errorDetails.push('【対処方法】');
            errorDetails.push('1. 数分待ってから再度お試しください');
            errorDetails.push('2. 問題が続く場合は、APIプロバイダーの状態を確認してください');
            errorDetails.push('');
            errorDetails.push(`エラー詳細: ${errorMessage.substring(0, 200)}...`);
          } else {
            errorDetails.push(`エラー: ${errorMessage}`);
          }
          
          if (data.currentStage !== undefined) {errorDetails.push(`\nステージ: ${data.currentStage}`);}
          
          // デバッグ情報があれば追加
          if (data.debug) {
            console.error('❌ Debug information:', data.debug);
            if (data.debug.apiKeyStatus) {
              console.error('❌ API Key Status:', data.debug.apiKeyStatus);
            }
          }
          
          const errorMsg = errorDetails.join('\n');
          console.error('❌ Generation failed:', data);
          this.handleError(errorMsg);
          return;
        }
        
        // タイムアウトチェック
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime > maxPollingTime) {
          throw new Error('生成タイムアウト: 5分以上経過しました');
        }
        
        // スタックチェック（同じステージに停滞している場合）
        if (data.currentStage === lastStage && data.progress === lastProgress) {
          stuckCount++;
          console.warn(`⚠️ Stuck at stage ${data.currentStage} (${stuckCount}/${maxStuckCount})`);
          
          if (stuckCount >= maxStuckCount) {
            // タイムアウトエラー - 即座に停止
            clearInterval(this.pollInterval);
            this.pollInterval = null;
            const errorMsg = `エラー: ステージ${data.currentStage}で処理が進まなくなりました\n\n可能性のある原因:\n1. Vercel環境変数にGROQ_API_KEYが設定されていない\n2. APIキーが無効\n3. APIのレート制限\n\n現在のステージ: ${data.currentStage}\n進捗: ${data.progress}%\nセッションID: ${sessionId}`;
            console.error('❌ Stuck timeout:', {
              stage: data.currentStage,
              progress: data.progress,
              stuckCount: stuckCount,
              sessionId: sessionId
            });
            this.handleError(errorMsg);
            return;
          }
        } else {
          // 進行があった場合はカウントをリセット
          stuckCount = 0;
          lastStage = data.currentStage;
          lastProgress = data.progress;
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
        // エラーが発生したら即座に停止
        console.error('❌ Polling error occurred - stopping immediately:', error);
        
        clearInterval(this.pollInterval);
        this.pollInterval = null;
        
        // ユーザーにエラーを表示
        if (window.uiManager) {
          window.uiManager.showError(error.message || '生成中にエラーが発生しました。');
        }
        
        // レスポンスがある場合、詳細なデバッグ情報を表示
        if (error.response) {
          try {
            const errorData = await error.response.json();
            console.error('❌ Server error response:', errorData);
            if (errorData.debug) {
              console.error('❌ Debug info:', errorData.debug);
              console.error('❌ API Key Status:', errorData.debug.apiKeyStatus);
            }
          } catch (e) {
            // JSONパースエラーは無視
          }
        }
        
        // エラー内容を詳しく表示
        const errorMessage = `エラーが発生しました\n\n${error.message || 'ポーリング中にエラーが発生しました'}\n\nコンソールで詳細を確認してください。`;
        this.handleError(errorMessage);
        logger.error('Polling stopped due to error:', error);
        return;
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
    // XSS対策: DOM操作で要素を安全に構築
    const strong = document.createElement('strong');
    strong.textContent = '🎉 シナリオ生成完了！';
    const br = document.createElement('br');
    const text = document.createTextNode('生成されたシナリオが下に表示されています。ダウンロードボタンからZIPファイルとして保存できます。');
    successDiv.appendChild(strong);
    successDiv.appendChild(br);
    successDiv.appendChild(text);
    
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
    if (!this.elements.form) {return {};}
    
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
    if (!this.sessionData || !this.elements.resultContainer) {return;}
    
    // 詳細な結果表示
    this.createDetailedResultPresentation();
  }
  
  createDetailedResultPresentation() {
    const container = this.elements.resultContainer;
    const scenarioContent = container.querySelector('#scenario-content');
    
    if (!scenarioContent) {return;}
    
    const scenario = this.sessionData.scenario || this.sessionData;

    // メインシナリオコンテンツ（XSS対策: エスケープ処理を適用）
    scenarioContent.innerHTML = `
      <div class="mystery-title-card">
        <h2 class="mystery-title">🔍 ${escapeHtml(scenario.title || 'マーダーミステリーシナリオ')}</h2>
        <div class="mystery-subtitle">${escapeHtml(scenario.subtitle || '【生成完了】')}</div>
      </div>

      <div class="scenario-meta-info">
        <span class="meta-item">📅 ${escapeHtml(scenario.era || '現代')}</span>
        <span class="meta-item">🏠 ${escapeHtml(scenario.setting || '洋館')}</span>
        <span class="meta-item">👥 ${escapeHtml(scenario.participants || 6)}人</span>
        <span class="meta-item">⏱️ ${escapeHtml(scenario.playtime || '2-3時間')}</span>
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
    if (!content) {return '';}

    // XSS対策: テキストコンテンツをエスケープ
    const contentHtml = typeof content === 'string'
      ? `<p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>`
      : content;

    return `
      <div class="scenario-section ${escapeHtml(className)}">
        <h3>${escapeHtml(title)}</h3>
        <div class="section-content">
          ${contentHtml}
        </div>
      </div>
    `;
  }
  
  formatCharacters(characters) {
    if (!characters || !Array.isArray(characters)) {return '<p>キャラクター情報なし</p>';}

    // XSS対策: すべてのキャラクター情報をエスケープ
    return characters.map(char => `
      <div class="character-card">
        <h4>${escapeHtml(char.name || '名前未設定')}</h4>
        <p class="character-role">${escapeHtml(char.role || '役職未設定')}</p>
        <p>${escapeHtml(char.description || char.background || '説明なし')}</p>
        ${char.secret ? `<p class="character-secret">秘密: ${escapeHtml(char.secret)}</p>` : ''}
      </div>
    `).join('');
  }
  
  formatTimeline(timeline) {
    if (!timeline) {return '<p>タイムライン情報なし</p>';}

    // XSS対策: タイムライン情報をエスケープ
    if (Array.isArray(timeline)) {
      return timeline.map(event => `
        <div class="timeline-event">
          <span class="time">${escapeHtml(event.time || '時刻不明')}</span>
          <span class="event">${escapeHtml(event.event || event.description || '')}</span>
        </div>
      `).join('');
    }

    return `<p>${escapeHtml(timeline).replace(/\n/g, '<br>')}</p>`;
  }
  
  formatClues(clues) {
    if (!clues) {return '<p>手がかり情報なし</p>';}

    // XSS対策: 手がかり情報をエスケープ
    if (Array.isArray(clues)) {
      return clues.map(clue => `
        <div class="clue-item">
          <h4>${escapeHtml(clue.name || clue.title || '手がかり')}</h4>
          <p>${escapeHtml(clue.description || clue.content || '')}</p>
          ${clue.location ? `<p class="clue-location">場所: ${escapeHtml(clue.location)}</p>` : ''}
        </div>
      `).join('');
    }

    return `<p>${escapeHtml(clues).replace(/\n/g, '<br>')}</p>`;
  }
  
  async downloadScenario() {
    if (!this.sessionData) {
      this.showError('ダウンロードするシナリオがありません');
      return;
    }
    
    try {
      // Create download content from sessionData
      const content = this.createDownloadContent(this.sessionData);
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `murder-mystery-${this.sessionData.sessionId || Date.now()}.txt`;
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
  
  createDownloadContent(sessionData) {
    let content = 'マーダーミステリーシナリオ\n';
    content += '='.repeat(50) + '\n\n';
    
    if (sessionData.phases) {
      Object.values(sessionData.phases).forEach(phase => {
        if (phase.content) {
          Object.values(phase.content).forEach(text => {
            if (typeof text === 'string') {
              content += text + '\n\n';
            }
          });
        }
      });
    }
    
    return content;
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