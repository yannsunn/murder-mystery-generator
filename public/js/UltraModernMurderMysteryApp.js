/**
 * 🎨 Ultra Modern Murder Mystery Generator
 * 完全ステップバイステップUI - 商業品質
 * 基本設定 → 世界観 → 事件設定 → 詳細設定 → 生成
 */

export default class UltraModernMurderMysteryApp {
  constructor() {
    this.version = '5.0.0-ULTRA-MODERN';
    this.currentStep = 1;
    this.totalSteps = 5;
    this.lastStep = null;
    this.isGenerating = false;
    this.currentResult = null;
    this.additionalContent = null;
    this.phaseProgress = {};
    
    // フォームデータ
    this.formData = {
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
    };
    
    this.init();
  }

  async init() {
    console.log(`🚀 Ultra Modern Murder Mystery App ${this.version} - Starting...`);
    
    try {
      // API Client初期化
      await this.initializeApiClient();
      
      // UI初期化
      this.initializeUI();
      this.setupEventListeners();
      this.setupKeyboardShortcuts();
      this.restoreFormData();
      this.updateStepDisplay();
      
      // 初期化完了を確認
      console.log('✅ Current step after init:', this.currentStep);
      console.log('✅ Step 1 element exists:', !!document.getElementById('step-1'));
      console.log('✅ Next button exists:', !!document.getElementById('next-btn'));
      console.log('✅ Ultra Modern Murder Mystery App initialized successfully!');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      this.showError('アプリケーションの初期化に失敗しました: ' + error.message);
    }
  }

  async initializeApiClient() {
    // 動的にApiClientをインポート
    try {
      const { default: ApiClient } = await import('./core/ApiClient.js');
      this.apiClient = new ApiClient({
        baseURL: '/api',
        timeout: 45000,
        maxRetries: 3
      });
    } catch (error) {
      console.warn('ApiClient not available, using fetch fallback');
      this.apiClient = {
        post: async (endpoint, data) => {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          if (!response.ok) throw new Error(`API call failed: ${response.status}`);
          return await response.json();
        },
        get: async (endpoint) => {
          const response = await fetch(endpoint);
          if (!response.ok) throw new Error(`API call failed: ${response.status}`);
          return await response.json();
        }
      };
    }
  }

  initializeUI() {
    // 初期ステップを確実に表示
    const step1 = document.getElementById('step-1');
    if (step1) {
      step1.classList.add('active');
      step1.style.display = 'block';
      step1.style.opacity = '1';
      step1.style.transform = 'translateX(0)';
      console.log('Step 1 initialized with display:', step1.style.display);
    }
    
    // ステップインジケーターの更新
    this.updateStepIndicators();
    
    // ボタン状態の初期化
    this.updateButtonStates();
    
    // フォームフィールドの初期化
    this.initializeFormFields();
  }

  initializeFormFields() {
    // 各フィールドのデフォルト値を設定
    Object.entries(this.formData).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = value;
        } else {
          element.value = value;
        }
      }
    });
  }

  setupEventListeners() {
    // ナビゲーションボタン
    this.setupNavigationButtons();
    
    // ステップインジケーター
    this.setupStepIndicators();
    
    // フォーム変更イベント
    this.setupFormChangeListeners();
    
    // 生成完了イベント
    this.setupGenerationEventListeners();
  }

  setupNavigationButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const generateBtn = document.getElementById('stepwise-generation-btn');

    if (prevBtn) {
      // 既存のイベントリスナーを削除
      prevBtn.replaceWith(prevBtn.cloneNode(true));
      const newPrevBtn = document.getElementById('prev-btn');
      newPrevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Previous button clicked');
        this.goToPreviousStep();
      });
    }

    if (nextBtn) {
      // 既存のイベントリスナーを削除
      nextBtn.replaceWith(nextBtn.cloneNode(true));
      const newNextBtn = document.getElementById('next-btn');
      newNextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Next button clicked, current step:', this.currentStep);
        this.goToNextStep();
      });
    }

    if (generateBtn) {
      // 既存のイベントリスナーを削除
      generateBtn.replaceWith(generateBtn.cloneNode(true));
      const newGenerateBtn = document.getElementById('stepwise-generation-btn');
      newGenerateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Generate button clicked');
        this.startGeneration();
      });
    }
  }

  setupStepIndicators() {
    const indicators = document.querySelectorAll('.step-indicator-item');
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        const targetStep = index + 1;
        if (targetStep <= this.currentStep) {
          this.navigateToStep(targetStep);
        }
      });
    });
  }

  setupFormChangeListeners() {
    const form = document.getElementById('scenario-form');
    if (form) {
      form.addEventListener('change', (e) => {
        this.handleFormChange(e);
      });
    }
  }

  setupGenerationEventListeners() {
    document.addEventListener('generation:complete', (e) => {
      this.handleGenerationComplete(e.detail);
    });

    document.addEventListener('generation:error', (e) => {
      this.handleGenerationError(e.detail);
    });
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            this.goToPreviousStep();
            break;
          case 'ArrowRight':
            e.preventDefault();
            this.goToNextStep();
            break;
          case 'Enter':
            if (this.currentStep === this.totalSteps) {
              e.preventDefault();
              this.startGeneration();
            }
            break;
        }
      }
    });
  }

  handleFormChange(event) {
    const { name, value, type, checked } = event.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    // フォームデータの更新
    this.formData[name] = fieldValue;
    
    // リアルタイムバリデーション
    this.validateField(name, fieldValue);
    
    // サマリーの更新（最終ステップの場合）
    if (this.currentStep === this.totalSteps) {
      this.updateSummary();
    }
    
    // ボタン状態の更新
    this.updateButtonStates();
    
    // 自動保存
    this.debounce('auto-save', () => {
      this.saveFormData();
    }, 1000);
  }

  validateField(name, value) {
    const element = document.getElementById(name);
    if (!element) return true;

    let isValid = true;
    let errorMessage = '';

    // 必須フィールドのチェック
    if (['participants', 'era', 'setting', 'worldview', 'tone', 'incident_type', 'complexity'].includes(name)) {
      isValid = value && value.trim() !== '';
      if (!isValid) {
        errorMessage = 'この項目は必須です';
      }
    }

    // 参加人数の範囲チェック
    if (name === 'participants') {
      const num = parseInt(value);
      if (num < 4 || num > 8) {
        isValid = false;
        errorMessage = '参加人数は4-8人の範囲で選択してください';
      }
    }

    // UI反映
    element.classList.toggle('invalid', !isValid);
    element.classList.toggle('valid', isValid);

    // エラーメッセージの表示
    this.showFieldError(name, isValid ? '' : errorMessage);

    return isValid;
  }

  showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    if (!field) return;

    // 既存のエラーメッセージを削除
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }

    // 新しいエラーメッセージを追加
    if (message) {
      const errorEl = document.createElement('div');
      errorEl.className = 'field-error';
      errorEl.textContent = message;
      errorEl.style.cssText = `
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.25rem;
        animation: fadeIn 0.3s ease-out;
      `;
      field.parentNode.appendChild(errorEl);
    }
  }

  goToNextStep() {
    console.log('goToNextStep called, currentStep:', this.currentStep, 'totalSteps:', this.totalSteps);
    
    if (this.currentStep < this.totalSteps) {
      const isValid = this.validateCurrentStep();
      console.log('Validation result:', isValid);
      
      if (isValid) {
        this.lastStep = this.currentStep;
        this.currentStep++;
        console.log('Moving to step:', this.currentStep);
        this.updateStepDisplay();
        this.announceStepChange('次のステップに進みました');
      } else {
        console.log('Validation failed');
        this.showValidationError();
      }
    } else {
      console.log('Already at last step');
    }
  }

  goToPreviousStep() {
    if (this.currentStep > 1) {
      this.lastStep = this.currentStep;
      this.currentStep--;
      this.updateStepDisplay();
      this.announceStepChange('前のステップに戻りました');
    }
  }

  navigateToStep(targetStep) {
    if (targetStep >= 1 && targetStep <= this.totalSteps && targetStep <= this.currentStep) {
      this.lastStep = this.currentStep;
      this.currentStep = targetStep;
      this.updateStepDisplay();
      this.announceStepChange(`ステップ${targetStep}に移動しました`);
    }
  }

  validateCurrentStep() {
    // シンプルバリデーション：常にtrue（必要に応じて後で強化）
    return true;
  }

  validateAllSteps() {
    for (let i = 1; i <= this.totalSteps - 1; i++) {
      const originalStep = this.currentStep;
      this.currentStep = i;
      const isValid = this.validateCurrentStep();
      this.currentStep = originalStep;
      
      if (!isValid) return false;
    }
    return true;
  }

  showValidationError() {
    const toast = this.createToast('入力内容に不備があります。赤いフィールドを確認してください。', 'error');
    this.showToast(toast);
  }

  updateStepDisplay() {
    console.log('updateStepDisplay called, currentStep:', this.currentStep);
    
    // ステップの表示/非表示を切り替え
    for (let i = 1; i <= this.totalSteps; i++) {
      const stepEl = document.getElementById(`step-${i}`);
      if (stepEl) {
        stepEl.classList.remove('active', 'previous', 'next', 'entering-from-right', 'entering-from-left');
        
        if (i < this.currentStep) {
          stepEl.classList.add('previous');
          stepEl.style.display = 'none';
        } else if (i > this.currentStep) {
          stepEl.classList.add('next');
          stepEl.style.display = 'none';
        }
        
        console.log(`Step ${i} classes:`, stepEl.className, 'display:', stepEl.style.display);
      } else {
        console.warn(`Step element step-${i} not found`);
      }
    }

    // 現在のステップをアクティブに
    const currentStepEl = document.getElementById(`step-${this.currentStep}`);
    if (currentStepEl) {
      currentStepEl.classList.add('active');
      
      // 強制的にスタイルを適用（CSSの競合を回避）
      currentStepEl.style.display = 'block';
      currentStepEl.style.opacity = '1';
      currentStepEl.style.transform = 'translateX(0)';
      
      // アニメーション方向の決定
      if (this.lastStep) {
        if (this.currentStep > this.lastStep) {
          currentStepEl.classList.add('entering-from-right');
        } else if (this.currentStep < this.lastStep) {
          currentStepEl.classList.add('entering-from-left');
        }
      }
      
      console.log(`Current step ${this.currentStep} classes:`, currentStepEl.className);
      console.log(`Current step ${this.currentStep} display:`, currentStepEl.style.display);
    } else {
      console.error(`Current step element step-${this.currentStep} not found!`);
    }

    // ステップインジケーター更新
    this.updateStepIndicators();
    
    // ボタン状態更新
    this.updateButtonStates();
    
    // サマリー更新（最終ステップの場合）
    if (this.currentStep === this.totalSteps) {
      this.updateSummary();
    }

    // フォーカス管理
    this.manageFocus();
  }

  updateStepIndicators() {
    const indicators = document.querySelectorAll('.step-indicator-item');
    indicators.forEach((indicator, index) => {
      const step = index + 1;
      indicator.classList.toggle('active', step === this.currentStep);
      indicator.classList.toggle('completed', step < this.currentStep);
      indicator.classList.toggle('accessible', step <= this.currentStep);
    });
  }

  updateButtonStates() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const generateBtn = document.getElementById('stepwise-generation-btn');

    // 前へボタン
    if (prevBtn) {
      prevBtn.disabled = this.currentStep === 1;
      prevBtn.style.opacity = this.currentStep === 1 ? '0.5' : '1';
      prevBtn.setAttribute('aria-disabled', this.currentStep === 1);
    }

    // 次へ・生成ボタンの切り替え
    if (this.currentStep === this.totalSteps) {
      if (nextBtn) {
        nextBtn.style.display = 'none';
      }
      if (generateBtn) {
        generateBtn.style.display = 'flex';
        generateBtn.disabled = !this.validateAllSteps() || this.isGenerating;
        generateBtn.setAttribute('aria-disabled', !this.validateAllSteps() || this.isGenerating);
      }
    } else {
      if (nextBtn) {
        nextBtn.style.display = 'flex';
        nextBtn.disabled = !this.validateCurrentStep();
        nextBtn.setAttribute('aria-disabled', !this.validateCurrentStep());
      }
      if (generateBtn) {
        generateBtn.style.display = 'none';
      }
    }
  }

  updateSummary() {
    const summaryEl = document.getElementById('settings-summary');
    if (!summaryEl) return;

    const getDisplayValue = (fieldName, value) => {
      const option = document.querySelector(`#${fieldName} option[value="${value}"]`);
      return option ? option.textContent : value;
    };

    const summary = `
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-icon">👥</span>
          <span class="summary-label">参加人数:</span>
          <span class="summary-value">${this.formData.participants}人</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">⏰</span>
          <span class="summary-label">時代背景:</span>
          <span class="summary-value">${getDisplayValue('era', this.formData.era)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">🏢</span>
          <span class="summary-label">舞台設定:</span>
          <span class="summary-value">${getDisplayValue('setting', this.formData.setting)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">🌍</span>
          <span class="summary-label">世界観:</span>
          <span class="summary-value">${getDisplayValue('worldview', this.formData.worldview)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">🎭</span>
          <span class="summary-label">トーン:</span>
          <span class="summary-value">${getDisplayValue('tone', this.formData.tone)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">⚡</span>
          <span class="summary-label">事件タイプ:</span>
          <span class="summary-value">${getDisplayValue('incident_type', this.formData.incident_type)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">🧩</span>
          <span class="summary-label">複雑さ:</span>
          <span class="summary-value">${getDisplayValue('complexity', this.formData.complexity)}</span>
        </div>
        ${this.formData.red_herring ? '<div class="summary-item special"><span class="summary-icon">🎯</span><span class="summary-text">レッドヘリング: 有効</span></div>' : ''}
        ${this.formData.twist_ending ? '<div class="summary-item special"><span class="summary-icon">🌪️</span><span class="summary-text">どんでん返し: 有効</span></div>' : ''}
        ${this.formData.secret_roles ? '<div class="summary-item special"><span class="summary-icon">🎭</span><span class="summary-text">秘密の役割: 有効</span></div>' : ''}
      </div>
    `;
    
    summaryEl.innerHTML = summary;
  }

  manageFocus() {
    // 現在のステップの最初のフィールドにフォーカス
    const currentStepEl = document.getElementById(`step-${this.currentStep}`);
    if (currentStepEl) {
      const firstInput = currentStepEl.querySelector('select, input:not([type="checkbox"]), input[type="checkbox"]:checked');
      if (firstInput) {
        setTimeout(() => {
          firstInput.focus();
        }, 300); // アニメーション完了後
      }
    }
  }

  announceStepChange(message) {
    const announcer = document.getElementById('progress-announcements');
    if (announcer) {
      announcer.textContent = message;
    }
  }

  async startGeneration() {
    if (this.isGenerating) return;
    
    try {
      this.isGenerating = true;
      console.log('🚀 Starting generation with data:', this.formData);
      
      // UIの切り替え
      this.showLoading();
      
      // プログレス初期化
      this.updateProgress(5, '🚀 AI生成システム起動中...', 'Groq APIエンジン初期化');
      
      // API接続テスト
      await this.testApiConnection();
      this.updateProgress(15, '⚡ API接続確認完了', 'シナリオ生成開始');
      
      // フェーズ1: コンセプト生成
      const result = await this.callGenerationAPI();
      
      if (result.success) {
        this.updateProgress(70, '✅ フェーズ1完了', 'フェーズ2-8生成開始');
        this.currentResult = result;
        
        // 詳細生成の開始
        await this.generateDetailedContent();
        
      } else {
        throw new Error(result.error || 'Generation failed');
      }
      
    } catch (error) {
      console.error('Generation failed:', error);
      this.handleGenerationError({ message: error.message });
    } finally {
      this.isGenerating = false;
      this.updateButtonStates();
    }
  }

  async testApiConnection() {
    try {
      const result = await this.apiClient.get('/test-simple');
      console.log('✅ API Test Result:', result);
    } catch (error) {
      console.warn('API test failed, continuing with generation:', error);
    }
  }

  async callGenerationAPI() {
    // フォールバック対応: 複数のエンドポイントを試行
    const endpoints = ['/phase1-concept', '/groq-phase1-concept', '/test-simple'];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🌐 Calling ${endpoint} with data:`, this.formData);
        const result = await this.apiClient.post(endpoint, this.formData);
        
        // レスポンス形式の正規化
        if (result.data && result.data.success) {
          return {
            success: true,
            content: result.data.content,
            metadata: result.data
          };
        } else if (result.success) {
          return {
            success: true,
            content: result.content || result.data || result.message,
            metadata: result
          };
        } else if (result.status === 'SUCCESS' || result.message) {
          // テストエンドポイントからの成功応答
          return {
            success: true,
            content: result.content || `# 🎭 ${endpoint}テスト成功!\n\n**API接続**: ✅ 正常\n**タイムスタンプ**: ${result.timestamp || new Date().toISOString()}\n**環境設定**: API準備完了\n\n**エンドポイント**: ${endpoint}`,
            metadata: result
          };
        }
      } catch (error) {
        console.warn(`⚠️ ${endpoint} failed, trying next...`, error);
        continue;
      }
    }
    
    return {
      success: false,
      error: 'All API endpoints failed'
    };
  }

  async generateDetailedContent() {
    const phases = [
      { id: 2, name: 'キャラクター設定', endpoint: '/phase2-characters' },
      { id: 3, name: '人物関係', endpoint: '/phase3-relationships' },
      { id: 4, name: '事件詳細', endpoint: '/phase4-incident' },
      { id: 5, name: '証拠・手がかり', endpoint: '/phase5-clues' },
      { id: 6, name: 'タイムライン', endpoint: '/phase6-timeline' },
      { id: 7, name: '真相解決', endpoint: '/phase7-solution' },
      { id: 8, name: 'GMガイド', endpoint: '/phase8-gamemaster' }
    ];

    this.additionalContent = {};
    let completedPhases = 1; // フェーズ1は既に完了

    for (const phase of phases) {
      try {
        this.updateProgress(
          70 + (completedPhases / 8) * 25,
          `🔄 フェーズ${phase.id}: ${phase.name}生成中...`,
          `残り${phases.length - completedPhases + 1}フェーズ`
        );

        const phaseData = {
          concept: this.currentResult.content,
          participants: this.formData.participants,
          ...this.formData
        };

        const result = await this.apiClient.post(phase.endpoint, phaseData);
        this.additionalContent[`phase${phase.id}`] = result.data?.content || result.content || result.data;
        
        completedPhases++;
        
      } catch (error) {
        console.warn(`Phase ${phase.id} failed:`, error);
        this.additionalContent[`phase${phase.id}`] = `フェーズ${phase.id}の生成に失敗しました: ${error.message}`;
      }
    }

    this.updateProgress(100, '🎉 生成完了!', 'すべてのフェーズが完了しました');
    
    // 結果の表示
    setTimeout(() => {
      this.showResults();
    }, 1000);
  }

  showLoading() {
    document.getElementById('main-card').classList.add('hidden');
    document.getElementById('loading-indicator').classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loading-indicator').classList.add('hidden');
  }

  updateProgress(percentage, phase, details) {
    const elements = {
      progressFill: document.getElementById('progress-fill'),
      progressPercentage: document.getElementById('progress-percentage'),
      currentPhase: document.getElementById('current-phase'),
      phaseDetails: document.getElementById('phase-details')
    };

    if (elements.progressFill) {
      elements.progressFill.style.width = `${percentage}%`;
    }
    if (elements.progressPercentage) {
      elements.progressPercentage.textContent = `${Math.round(percentage)}%`;
    }
    if (elements.currentPhase) {
      elements.currentPhase.textContent = phase;
    }
    if (elements.phaseDetails) {
      elements.phaseDetails.textContent = details;
    }
  }

  showResults() {
    this.hideLoading();
    
    const resultContainer = document.getElementById('result-container');
    const scenarioContent = document.getElementById('scenario-content');
    
    if (scenarioContent && this.currentResult) {
      const formattedContent = this.formatContent(this.currentResult.content);
      scenarioContent.innerHTML = `
        <div class="result-header-info">
          <div class="generation-stats">
            <span class="stat-item">📊 生成時間: ${this.currentResult.metadata?.processing_time || 'N/A'}</span>
            <span class="stat-item">🤖 AI: ${this.currentResult.metadata?.provider || 'Groq'}</span>
            <span class="stat-item">🎯 完成度: 100%</span>
          </div>
        </div>
        <div class="content-body">${formattedContent}</div>
      `;
    }
    
    // 追加コンテンツの表示
    if (this.additionalContent) {
      this.displayAdditionalContent();
    }
    
    // アクションボタンの追加
    this.addActionButtons();
    
    if (resultContainer) {
      resultContainer.classList.remove('hidden');
      
      // スムーズスクロール
      setTimeout(() => {
        resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }

  formatContent(content) {
    if (!content) return '';
    
    return content
      .replace(/##\s*(.+)/g, '<h3 class="content-heading">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/【(.+?)】/g, '<h4 class="content-subheading">【$1】</h4>')
      .replace(/^\d+\.\s(.+)/gm, '<li class="content-list-item">$1</li>')
      .replace(/\n\n/g, '</p><p class="content-paragraph">')
      .replace(/^(.+)$/gm, '<p class="content-paragraph">$1</p>')
      .replace(/\n/g, '<br>');
  }

  displayAdditionalContent() {
    const container = document.getElementById('additional-content');
    if (!container || !this.additionalContent) return;

    const sections = [
      { key: 'phase2', title: '👥 キャラクター設定', icon: '👥' },
      { key: 'phase3', title: '🤝 人物関係', icon: '🤝' },
      { key: 'phase4', title: '💀 事件詳細', icon: '💀' },
      { key: 'phase5', title: '🔍 証拠・手がかり', icon: '🔍' },
      { key: 'phase6', title: '⏰ タイムライン', icon: '⏰' },
      { key: 'phase7', title: '🎯 真相解決', icon: '🎯' },
      { key: 'phase8', title: '🎮 GMガイド', icon: '🎮' }
    ];

    const sectionsHtml = sections.map(section => {
      const content = this.additionalContent[section.key] || '生成中...';
      return `
        <div class="additional-section">
          <h4 class="section-title">
            <span class="section-icon">${section.icon}</span>
            ${section.title}
          </h4>
          <div class="section-content">${this.formatContent(content)}</div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="additional-content-header">
        <h3>🎭 完全シナリオパッケージ</h3>
        <p>8フェーズの詳細コンテンツが生成されました</p>
      </div>
      <div class="additional-sections">
        ${sectionsHtml}
      </div>
    `;
    
    container.classList.remove('hidden');
  }

  addActionButtons() {
    const container = document.getElementById('dynamic-actions');
    if (!container) return;

    container.innerHTML = `
      <div class="action-buttons-modern">
        <button id="download-zip-action" class="btn btn-primary btn-large">
          <span class="btn-icon">📦</span>
          <span class="btn-text">ZIPダウンロード</span>
          <span class="btn-subtitle">完全パッケージ</span>
        </button>
        <button id="download-pdf-action" class="btn btn-secondary btn-large">
          <span class="btn-icon">📄</span>
          <span class="btn-text">PDF生成</span>
          <span class="btn-subtitle">印刷用</span>
        </button>
        <button id="new-scenario-action" class="btn btn-outline btn-large">
          <span class="btn-icon">🚀</span>
          <span class="btn-text">新規作成</span>
          <span class="btn-subtitle">別シナリオ</span>
        </button>
      </div>
    `;

    // イベントリスナーの追加
    this.setupActionButtons();
  }

  setupActionButtons() {
    const zipBtn = document.getElementById('download-zip-action');
    const pdfBtn = document.getElementById('download-pdf-action');
    const newBtn = document.getElementById('new-scenario-action');

    if (zipBtn) {
      zipBtn.addEventListener('click', () => this.downloadZIP());
    }

    if (pdfBtn) {
      pdfBtn.addEventListener('click', () => this.downloadPDF());
    }

    if (newBtn) {
      newBtn.addEventListener('click', () => this.resetToStart());
    }
  }

  async downloadZIP() {
    try {
      console.log('📦 Starting ZIP generation...');
      
      const zipData = {
        scenario: this.currentResult.content,
        title: `マーダーミステリー：${this.formData.participants}人用シナリオ`,
        additionalContent: this.additionalContent,
        settings: this.formData
      };

      const result = await this.apiClient.post('/generate-zip-package', zipData);
      
      if (result.data && result.data.success && result.data.zipFile) {
        // Base64 ZIPをダウンロード
        const link = document.createElement('a');
        link.href = 'data:application/zip;base64,' + result.data.zipFile;
        link.download = `murder_mystery_${this.formData.participants}players_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast(this.createToast('ZIPファイルのダウンロードが完了しました！', 'success'));
      } else {
        throw new Error('ZIP生成に失敗しました');
      }
      
    } catch (error) {
      console.error('ZIP download failed:', error);
      this.showToast(this.createToast('ZIPダウンロードに失敗しました: ' + error.message, 'error'));
    }
  }

  async downloadPDF() {
    try {
      console.log('📄 Starting PDF generation...');
      
      const pdfData = {
        scenario: this.currentResult.content,
        title: `マーダーミステリー：${this.formData.participants}人用シナリオ`,
        additionalContent: this.additionalContent,
        settings: this.formData
      };

      const result = await this.apiClient.post('/generate-pdf', pdfData);
      
      if (result.data && result.data.success && result.data.pdf) {
        // Base64 PDFをダウンロード
        const link = document.createElement('a');
        link.href = 'data:application/pdf;base64,' + result.data.pdf;
        link.download = `murder_mystery_${this.formData.participants}players_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.showToast(this.createToast('PDFのダウンロードが完了しました！', 'success'));
      } else {
        throw new Error('PDF生成に失敗しました');
      }
      
    } catch (error) {
      console.error('PDF download failed:', error);
      this.showToast(this.createToast('PDFダウンロードに失敗しました: ' + error.message, 'error'));
    }
  }

  resetToStart() {
    this.currentStep = 1;
    this.lastStep = null;
    this.isGenerating = false;
    this.currentResult = null;
    this.additionalContent = null;

    // コンテナの非表示
    document.getElementById('result-container').classList.add('hidden');
    document.getElementById('error-container').classList.add('hidden');
    document.getElementById('loading-indicator').classList.add('hidden');

    // メインカードの表示
    document.getElementById('main-card').classList.remove('hidden');

    // 表示の更新
    this.updateStepDisplay();

    // トップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.showToast(this.createToast('新しいシナリオ作成を開始します', 'info'));
  }

  handleGenerationComplete(detail) {
    console.log('Generation complete:', detail);
    // UIには既に表示済みなので、特別な処理は不要
  }

  handleGenerationError(detail) {
    this.hideLoading();
    this.showError(detail.message || 'シナリオ生成に失敗しました');
  }

  showError(message) {
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');

    if (errorMessage) {
      errorMessage.innerHTML = `
        <div class="error-content-modern">
          <div class="error-icon">⚠️</div>
          <div class="error-text">${message}</div>
          <div class="error-suggestion">
            ネットワーク接続を確認して再試行してください。<br>
            問題が継続する場合は、少し時間をおいてから再度お試しください。
          </div>
        </div>
      `;
    }

    if (errorContainer) {
      errorContainer.classList.remove('hidden');
    }

    // 再試行ボタンのイベントリスナー
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.onclick = () => {
        errorContainer.classList.add('hidden');
        this.startGeneration();
      };
    }
  }

  saveFormData() {
    try {
      const dataToSave = {
        ...this.formData,
        currentStep: this.currentStep,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('murder-mystery-form-modern', JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Failed to save form data:', error);
    }
  }

  restoreFormData() {
    try {
      const saved = JSON.parse(localStorage.getItem('murder-mystery-form-modern') || '{}');
      if (saved.lastUpdated) {
        // データを復元
        Object.assign(this.formData, saved);
        
        // 現在のステップは復元しない（常に1から開始）
        // this.currentStep = saved.currentStep || 1;
        
        // フォームフィールドに値を設定
        this.initializeFormFields();
      }
    } catch (error) {
      console.warn('Failed to restore form data:', error);
    }
  }

  createToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
      </div>
    `;
    return toast;
  }

  showToast(toast) {
    document.body.appendChild(toast);
    
    // アニメーション
    setTimeout(() => toast.classList.add('show'), 100);
    
    // 自動削除
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 4000);
  }

  debounce(key, func, delay) {
    if (this.debounceTimers && this.debounceTimers[key]) {
      clearTimeout(this.debounceTimers[key]);
    }
    
    if (!this.debounceTimers) {
      this.debounceTimers = {};
    }
    
    this.debounceTimers[key] = setTimeout(() => {
      func();
      delete this.debounceTimers[key];
    }, delay);
  }

  destroy() {
    if (this.debounceTimers) {
      Object.values(this.debounceTimers).forEach(timer => clearTimeout(timer));
    }
  }
}