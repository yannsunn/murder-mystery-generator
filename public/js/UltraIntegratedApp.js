/**
 * 🚀 Ultra Integrated Murder Mystery App
 * 完全統合型フロントエンド - 自動フェーズ実行対応
 */

// スケルトンローダーとUXエンハンサーのインポート（モジュール対応）
let SkeletonLoader, skeletonLoader, UXEnhancer, uxEnhancer;
try {
  if (typeof module !== 'undefined' && module.exports) {
    // Node.js環境
    ({ SkeletonLoader, skeletonLoader } = require('./SkeletonLoader.js'));
    ({ UXEnhancer, uxEnhancer } = require('./UXEnhancer.js'));
  } else {
    // ブラウザ環境 - 動的インポート
    if (typeof SkeletonLoader !== 'undefined') {
      skeletonLoader = new SkeletonLoader();
    }
    if (typeof UXEnhancer !== 'undefined') {
      uxEnhancer = new UXEnhancer();
    }
  }
} catch (error) {
  console.warn('Modules not available:', error.message);
}

class UltraIntegratedApp {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.formData = {};
    this.sessionData = null;
    this.isGenerating = false;
    this.generationProgress = {
      currentPhase: 0,
      totalPhases: 5,
      status: 'waiting'
    };
    
    console.log('🚀 Ultra Integrated App - 初期化開始');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupUXEnhancements();
    this.updateStepDisplay();
    this.updateButtonStates();
    this.restoreFormData();
    
    // 生成モード初期化 - マイクロモードを標準に
    this.generationMode = 'micro';
    this.microApp = null;
    
    console.log('✅ Ultra Integrated App - 初期化完了');
  }

  setupUXEnhancements() {
    if (!uxEnhancer) return;

    // インタラクティブ要素にエフェクトを追加
    uxEnhancer.addInteractiveEffect('.btn');
    uxEnhancer.addInteractiveEffect('.checkbox-label');
    uxEnhancer.addInteractiveEffect('.radio-label');

    // ツールチップを追加
    this.addTooltips();

    // スワイプジェスチャーのハンドリング
    document.addEventListener('swipeLeft', () => this.goToNextStep());
    document.addEventListener('swipeRight', () => this.goToPreviousStep());

    // 成功通知の表示
    uxEnhancer.showToast('🚀 アプリケーション初期化完了', 'success', 3000);
  }

  addTooltips() {
    // ツールチップデータを追加
    const tooltipData = {
      'participants': '参加人数を選択してください。5-6人が最も楽しめます。',
      'era': '物語の時代背景を設定します。現代設定が推奨です。',
      'setting': '事件が発生する場所を選択します。',
      'complexity': 'シナリオの複雑さを設定します。初回は標準がおすすめです。',
      'red_herring': '偽の手がかりを追加して推理を困難にします。',
      'twist_ending': '意外な真相でプレイヤーを驚かせます。',
      'secret_roles': 'プレイヤーに秘密の役割を与えます。'
    };

    Object.entries(tooltipData).forEach(([id, text]) => {
      const element = document.getElementById(id);
      if (element) {
        element.setAttribute('data-tooltip', text);
      }
    });
  }

  setupEventListeners() {
    // ナビゲーションボタン
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const generateBtn = document.getElementById('generate-btn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.goToPreviousStep());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.goToNextStep());
    }

    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.handleGenerationStart());
    }
    
    // 統合マイクロ生成のみ対応（モード選択は無し）
    console.log('🔬 Integrated micro generation mode only');

    // 結果画面のボタン
    const downloadZipBtn = document.getElementById('download-zip');
    const newScenarioBtn = document.getElementById('new-scenario');

    if (downloadZipBtn) {
      downloadZipBtn.addEventListener('click', () => this.downloadFile('zip'));
    }

    if (newScenarioBtn) {
      newScenarioBtn.addEventListener('click', () => this.resetApp());
    }

    // フォーム変更監視
    const form = document.getElementById('scenario-form');
    if (form) {
      form.addEventListener('change', () => this.updateSummary());
    }
  }

  // ステップナビゲーション
  goToPreviousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepDisplay();
      this.updateButtonStates();
      
      // UX強化: ステップ変更の通知
      if (uxEnhancer) {
        uxEnhancer.showToast(`ステップ ${this.currentStep} に戻りました`, 'info', 2000);
      }
    }
  }

  goToNextStep() {
    if (this.currentStep < this.totalSteps) {
      // バリデーション
      if (!this.validateCurrentStep()) {
        return;
      }
      
      this.collectFormData();
      this.currentStep++;
      this.updateStepDisplay();
      this.updateButtonStates();
      
      if (this.currentStep === this.totalSteps) {
        this.updateSummary();
        if (uxEnhancer) {
          uxEnhancer.showToast('🎯 設定完了！生成の準備ができました', 'success', 3000);
        }
      } else if (uxEnhancer) {
        uxEnhancer.showToast(`ステップ ${this.currentStep} に進みました`, 'info', 2000);
      }
    }
  }

  validateCurrentStep() {
    const currentStepElement = document.getElementById(`step-${this.currentStep}`);
    const requiredFields = currentStepElement.querySelectorAll('[required]');
    
    for (const field of requiredFields) {
      if (!field.value.trim()) {
        if (uxEnhancer) {
          const label = field.closest('.form-group')?.querySelector('label')?.textContent || 'フィールド';
          uxEnhancer.showToast(`⚠️ ${label}を選択してください`, 'warning', 3000);
        }
        field.focus();
        return false;
      }
    }
    return true;
  }

  updateStepDisplay() {
    // 現在のステップを表示
    document.querySelectorAll('.step').forEach((step, index) => {
      const stepNum = index + 1;
      step.classList.toggle('active', stepNum === this.currentStep);
    });

    // ステップインジケーター更新
    document.querySelectorAll('.step-indicator-item').forEach((item, index) => {
      const stepNum = index + 1;
      item.classList.toggle('active', stepNum === this.currentStep);
      item.classList.toggle('completed', stepNum < this.currentStep);
    });
  }

  updateButtonStates() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const generateBtn = document.getElementById('generate-btn');

    if (prevBtn) {
      prevBtn.disabled = this.currentStep === 1;
    }

    // visibility切り替えで位置ずれを防ぐ
    if (nextBtn) {
      if (this.currentStep === this.totalSteps) {
        nextBtn.style.visibility = 'hidden';
        nextBtn.style.opacity = '0';
        nextBtn.style.pointerEvents = 'none';
      } else {
        nextBtn.style.visibility = 'visible';
        nextBtn.style.opacity = '1';
        nextBtn.style.pointerEvents = 'auto';
      }
    }

    if (generateBtn) {
      if (this.currentStep === this.totalSteps) {
        generateBtn.style.visibility = 'visible';
        generateBtn.style.opacity = '1';
        generateBtn.style.pointerEvents = 'auto';
      } else {
        generateBtn.style.visibility = 'hidden';
        generateBtn.style.opacity = '0';
        generateBtn.style.pointerEvents = 'none';
      }
    }
    
    // モード説明を最終ステップで表示
    const modeInfo = document.getElementById('mode-info');
    if (modeInfo) {
      modeInfo.style.display = this.currentStep === this.totalSteps ? 'block' : 'none';
    }
  }

  // フォームデータ収集
  collectFormData() {
    const form = document.getElementById('scenario-form');
    if (!form) return;

    const formData = new FormData(form);
    this.formData = {};

    for (const [key, value] of formData.entries()) {
      this.formData[key] = value;
    }

    // デフォルト値を設定
    this.formData.participants = this.formData.participants || '5';
    this.formData.era = this.formData.era || 'modern';
    this.formData.setting = this.formData.setting || 'closed-space';
    this.formData.worldview = this.formData.worldview || 'realistic';
    this.formData.tone = this.formData.tone || 'serious';
    this.formData.incident_type = this.formData.incident_type || 'murder';
    this.formData.complexity = this.formData.complexity || 'standard';

    // チェックボックス
    const checkboxes = ['red_herring', 'twist_ending', 'secret_roles'];
    checkboxes.forEach(name => {
      const checkbox = document.getElementById(name);
      if (checkbox) {
        this.formData[name] = checkbox.checked;
      } else {
        this.formData[name] = false;
      }
    });
    
    // ラジオボタン
    const generationMode = document.querySelector('input[name="generation_mode"]:checked');
    if (generationMode) {
      this.formData.generation_mode = generationMode.value;
    } else {
      this.formData.generation_mode = 'staged';
    }
  }

  updateSummary() {
    const summaryEl = document.getElementById('settings-summary');
    if (!summaryEl) return;

    this.collectFormData();

    const summaryHtml = `
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-icon">👥</span>
          <span class="summary-label">参加人数:</span>
          <span class="summary-value">${this.formData.participants || '5'}人</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">⏰</span>
          <span class="summary-label">時代背景:</span>
          <span class="summary-value">${this.getOptionText('era', this.formData.era)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">🏢</span>
          <span class="summary-label">舞台設定:</span>
          <span class="summary-value">${this.getOptionText('setting', this.formData.setting)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">🎭</span>
          <span class="summary-label">トーン:</span>
          <span class="summary-value">${this.getOptionText('tone', this.formData.tone)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">🔍</span>
          <span class="summary-label">事件種類:</span>
          <span class="summary-value">${this.getOptionText('incident_type', this.formData.incident_type)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">🧩</span>
          <span class="summary-label">複雑さ:</span>
          <span class="summary-value">${this.getOptionText('complexity', this.formData.complexity)}</span>
        </div>
      </div>
    `;

    summaryEl.innerHTML = summaryHtml;
  }

  getOptionText(selectId, value) {
    const select = document.getElementById(selectId);
    if (select) {
      const option = select.querySelector(`option[value="${value}"]`);
      return option ? option.textContent : value;
    }
    return value || '未設定';
  }

  // 🎯 統合マイクロ生成モード固定
  onModeChange(mode) {
    // 統合マイクロモード固定（他のモードはなし）
    this.generationMode = 'micro';
    console.log(`🔄 Generation mode: integrated micro (only option)`);
    
    // ボタンテキスト更新
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn) {
      generateBtn.innerHTML = '<span>🔬</span> 詳細生成開始';
    }
  }
  
  // 🎯 生成開始ハンドラー（マイクロモード専用）
  async handleGenerationStart() {
    // マイクロモード専用に統一
    await this.startMicroGeneration();
  }
  
  // 🔬 統合マイクロ生成開始
  async startMicroGeneration() {
    if (this.isGenerating) return;

    console.log('🔬 Starting Integrated Micro Generation...');
    
    // フォームデータを収集
    this.collectFormData();
    
    console.log('📋 Collected formData:', this.formData);
    
    // UX強化: 生成開始通知
    if (uxEnhancer) {
      uxEnhancer.showToast('🔬 統合マイクロ生成を開始します', 'info', 3000);
    }

    try {
      this.isGenerating = true;
      this.showGenerationUI();
      
      const sessionId = `integrated_micro_${Date.now()}`;
      
      console.log('🔬 Calling integrated micro generator...');
      
      const response = await fetch('/api/integrated-micro-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: this.formData,
          sessionId: sessionId
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Response Error:', response.status, errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Integrated micro generation failed');
      }
      
      console.log('🎉 Integrated Micro Generation completed successfully!');
      this.sessionData = result.sessionData;
      
      // UX強化: 生成完了通知
      if (uxEnhancer) {
        uxEnhancer.showToast('🎉 統合マイクロ生成が完了しました！', 'success', 5000);
      }
      
      this.showResults(result.sessionData);
      
    } catch (error) {
      console.error('❌ Integrated Micro Generation failed:', error);
      
      // UX強化: エラー通知
      if (uxEnhancer) {
        uxEnhancer.showToast('❌ 生成中にエラーが発生しました', 'error', 5000);
      }
      
      this.showError(error.message);
    } finally {
      this.isGenerating = false;
    }
  }

  // 🚀 旧ウルトラ生成メソッド - 統合マイクロ生成に統合されました
  async startUltraGeneration() {
    // 統合マイクロ生成にリダイレクト
    console.log('🔄 Redirecting to integrated micro generation...');
    await this.startMicroGeneration();
  }

  // 進捗更新表示 - 統合マイクロ生成用
  updateProgress(progressData) {
    // 統合生成では進捗は簡単なパーセンテージ表示のみ
    if (progressData && progressData.percentage !== undefined) {
      this.updateProgressBar(progressData.percentage);
      console.log(`📈 Integrated micro generation: ${progressData.percentage}%`);
    }
  }
  
  // 進捗バー更新
  updateProgressBar(percentage) {
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressText = document.getElementById('progress-text');
    
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (progressPercentage) progressPercentage.textContent = `${percentage}%`;
    if (progressText) progressText.textContent = `生成中... ${percentage}%`;
  }
  
  // フェーズ情報更新
  updatePhaseInfo(currentPhase, totalPhases, phaseName) {
    const phaseNumber = document.getElementById('current-phase-number');
    const currentPhaseEl = document.getElementById('current-phase');
    const phaseDetails = document.getElementById('phase-details');
    const estimatedTime = document.getElementById('estimated-time');
    const generationMethod = document.getElementById('generation-method');
    
    if (phaseNumber) phaseNumber.textContent = `${currentPhase}/${totalPhases}`;
    if (currentPhaseEl) currentPhaseEl.textContent = `🔄 ${phaseName}`;
    if (phaseDetails) phaseDetails.textContent = `フェーズ ${currentPhase} を処理中...`;
    
    // 推定残り時間の動的計算（統合マイクロ生成用）
    const remainingPhases = totalPhases - currentPhase;
    const timePerPhase = 60; // 統合生成では各ステップが約1分
    const estimatedSeconds = remainingPhases * timePerPhase;
    
    if (estimatedTime) {
      if (estimatedSeconds > 0) {
        if (estimatedSeconds > 60) {
          const minutes = Math.ceil(estimatedSeconds / 60);
          estimatedTime.textContent = `約 ${minutes} 分`;
        } else {
          estimatedTime.textContent = `約 ${estimatedSeconds} 秒`;
        }
      } else {
        estimatedTime.textContent = '完了間近';
      }
    }
    
    // 生成方式の説明を更新（統合マイクロ生成）
    if (generationMethod) {
      generationMethod.textContent = '統合マイクロ生成（超詳細）';
    }
  }
  
  // 現在フェーズ更新
  updateCurrentPhase(phaseNum, phaseName, status) {
    const statusEmoji = status === 'completed' ? '✅' : '🔄';
    console.log(`${statusEmoji} Phase ${phaseNum}: ${phaseName}`);
  }

  // 生成UI表示
  showGenerationUI() {
    this.hideElement('main-card');
    this.showElement('loading-container');
    
    // スケルトンローディング表示
    if (skeletonLoader) {
      skeletonLoader.show('loading-container', 'generation', {
        className: 'generation-skeleton'
      });
      
      // 少し遅らせて実際のUIに切り替え
      setTimeout(() => {
        this.showActualGenerationUI();
      }, 800);
    } else {
      this.showActualGenerationUI();
    }
  }

  // 実際の生成UI表示
  showActualGenerationUI() {
    if (skeletonLoader) {
      skeletonLoader.hide('loading-container');
    }
    
    // プログレス初期化
    this.updateProgressBar(0);
    
    // 初期表示設定（正しい情報で）
    const currentPhase = document.getElementById('current-phase');
    const phaseDetails = document.getElementById('phase-details');
    const phaseNumber = document.getElementById('current-phase-number');
    const estimatedTime = document.getElementById('estimated-time');
    const generationMethod = document.getElementById('generation-method');
    
    if (currentPhase) currentPhase.textContent = '🚀 AI生成エンジン起動中...';
    if (phaseDetails) phaseDetails.textContent = 'マーダーミステリー生成を開始します';
    if (phaseNumber) phaseNumber.textContent = '1/5';
    
    // 初期推定時間設定（統合マイクロ生成用）
    if (estimatedTime) {
      const totalTime = 300; // 5分（統合生成のため十分な時間）
      const minutes = Math.ceil(totalTime / 60);
      estimatedTime.textContent = `最大 ${minutes} 分`;
    }
    
    // 統合マイクロ生成方式表示
    if (generationMethod) {
      generationMethod.textContent = '統合マイクロ生成（超詳細）';
    }
  }


  // 結果表示
  showResults(sessionData) {
    this.hideElement('loading-container');
    this.showElement('result-container');
    
    const contentEl = document.getElementById('scenario-content');
    if (contentEl && sessionData.phases) {
      // スケルトンローディングで段階的に表示
      if (skeletonLoader) {
        skeletonLoader.show('scenario-content', 'result');
        
        // 段階的にコンテンツを表示
        setTimeout(() => {
          skeletonLoader.hide('scenario-content');
          const summaryHtml = this.generateResultSummary(sessionData);
          contentEl.innerHTML = summaryHtml;
          contentEl.classList.add('skeleton-fade-in');
        }, 600);
      } else {
        const summaryHtml = this.generateResultSummary(sessionData);
        contentEl.innerHTML = summaryHtml;
      }
    }
  }

  generateResultSummary(sessionData) {
    const phases = sessionData.phases || {};
    const images = sessionData.images || [];
    
    // 統合マイクロ生成の結果からタイトルを抽出
    let title = 'マーダーミステリーシナリオ';
    
    // step1のコンセプトからタイトルを探す
    const step1 = phases.step1;
    if (step1 && step1.content && step1.content.concept) {
      const titleMatch = step1.content.concept.match(/## 作品タイトル[\\s\\S]*?\\n([^\\n]+)/);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
    }
    
    const completedSteps = Object.values(phases).filter(p => p.status === 'completed').length;
    const totalSteps = Object.keys(phases).length;
    const successfulImages = images.filter(img => img.status === 'success');
    
    // グローバルスコープに保存（タブ切り替え用）
    window.currentSessionData = sessionData;
    
    return `
      <div class="result-summary">
        <h3 class="scenario-title">${title}</h3>
        <div class="generation-stats">
          <div class="stat-card">
            <span class="stat-number">${completedSteps}</span>
            <span class="stat-label">統合ステップ完了</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${sessionData.formData?.participants || 5}</span>
            <span class="stat-label">参加者用</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${successfulImages.length}</span>
            <span class="stat-label">生成画像</span>
          </div>
        </div>
        
        <!-- タブナビゲーション -->
        <div class="result-tabs">
          <button class="tab-button active" onclick="showTab('overview')">📊 概要</button>
          <button class="tab-button" onclick="showTab('scenario')">📝 シナリオ</button>
          <button class="tab-button" onclick="showTab('characters')">👥 キャラクター</button>
          <button class="tab-button" onclick="showTab('timeline')">⏰ タイムライン</button>
          <button class="tab-button" onclick="showTab('gm-guide')">🎮 GMガイド</button>
          ${successfulImages.length > 0 ? '<button class="tab-button" onclick="showTab(\'images\')">🎨 画像</button>' : ''}
        </div>
        
        <!-- タブコンテンツ -->
        <div class="tab-content" id="tab-overview" style="display: block;">
          <h4>🌟 シナリオ概要</h4>
          <div class="scenario-overview">
            ${this.generateOverviewContent(sessionData)}
          </div>
        </div>
        
        <div class="tab-content" id="tab-scenario" style="display: none;">
          <h4>📖 完全シナリオ</h4>
          <div class="scenario-full-content">
            ${this.generateScenarioContent(phases)}
          </div>
        </div>
        
        <div class="tab-content" id="tab-characters" style="display: none;">
          <h4>🎭 キャラクター詳細</h4>
          <div class="characters-content">
            ${this.generateCharactersContent(phases)}
          </div>
        </div>
        
        <div class="tab-content" id="tab-timeline" style="display: none;">
          <h4>⏱ タイムライン</h4>
          <div class="timeline-content">
            ${this.generateTimelineContent(phases)}
          </div>
        </div>
        
        <div class="tab-content" id="tab-gm-guide" style="display: none;">
          <h4>🎓 ゲームマスターガイド</h4>
          <div class="gm-guide-content">
            ${this.generateGMGuideContent(phases)}
          </div>
        </div>
        
        ${successfulImages.length > 0 ? `
          <div class="tab-content" id="tab-images" style="display: none;">
            <h4>🎨 生成画像ギャラリー</h4>
            <div class="images-gallery">
              ${this.generateImagesGallery(successfulImages)}
            </div>
          </div>
        ` : ''}
        
        <div class="download-section">
          <h4>📥 ダウンロードオプション</h4>
          <div class="download-options">
            <button class="btn btn-primary" onclick="window.app.handleDownload()">
              📦 全てをZIPでダウンロード
            </button>
            <button class="btn btn-secondary" onclick="copyScenarioText()">
              📋 シナリオをコピー
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // 各コンテンツ生成メソッド
  generateOverviewContent(sessionData) {
    const formData = sessionData.formData || {};
    const concept = sessionData.phases?.step1?.content?.concept || '';
    
    return `
      <div class="overview-section">
        <h5>🎯 基本情報</h5>
        <ul>
          <li><strong>参加人数:</strong> ${formData.participants || 5}人</li>
          <li><strong>プレイ時間:</strong> ${formData.complexity === 'simple' ? '30分' : formData.complexity === 'complex' ? '60分' : '45分'}</li>
          <li><strong>時代背景:</strong> ${this.getDisplayText('era', formData.era)}</li>
          <li><strong>舞台設定:</strong> ${this.getDisplayText('setting', formData.setting)}</li>
          <li><strong>トーン:</strong> ${this.getDisplayText('tone', formData.tone)}</li>
        </ul>
        
        <h5>📝 コンセプト</h5>
        <div class="concept-preview">
          ${concept.length > 500 ? concept.substring(0, 500) + '...' : concept}
        </div>
      </div>
    `;
  }
  
  generateScenarioContent(phases) {
    const step1 = phases.step1?.content?.concept || '';
    const step3 = phases.step3?.content?.incident_and_truth || '';
    
    return `
      <div class="scenario-section">
        ${this.formatContent(step1)}
        <hr style="margin: 2rem 0; border-color: var(--primary-600);">
        ${this.formatContent(step3)}
      </div>
    `;
  }
  
  generateCharactersContent(phases) {
    const characters = phases.step2?.content?.characters || '';
    return `
      <div class="characters-section">
        ${this.formatContent(characters)}
      </div>
    `;
  }
  
  generateTimelineContent(phases) {
    const timeline = phases.step4?.content?.timeline || '';
    return `
      <div class="timeline-section">
        ${this.formatContent(timeline)}
      </div>
    `;
  }
  
  generateGMGuideContent(phases) {
    const gmGuide = phases.step5?.content?.gamemaster_guide || '';
    return `
      <div class="gm-guide-section">
        ${this.formatContent(gmGuide)}
      </div>
    `;
  }
  
  generateImagesGallery(images) {
    return `
      <div class="images-grid">
        ${images.map((img, index) => `
          <div class="image-card">
            <img src="${img.url}" alt="${img.description}" loading="lazy" onclick="openImageModal('${img.url}', '${img.description}')"
                 style="cursor: pointer; transition: transform 0.2s; border-radius: 8px;"
                 onmouseover="this.style.transform='scale(1.05)'"
                 onmouseout="this.style.transform='scale(1)'">
            <div class="image-info">
              <h5>${img.description}</h5>
              <p class="image-type">${img.type}</p>
              <a href="${img.url}" download="${img.type}_${index + 1}.png" class="btn btn-sm" style="background: var(--accent-primary); color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 6px; display: inline-block;">
                💾 ダウンロード
              </a>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  formatContent(content) {
    if (!content) return '<p>コンテンツが生成されていません。</p>';
    
    return content
      .replace(/## /g, '<h4>')
      .replace(/### /g, '<h5>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }
  
  getDisplayText(field, value) {
    const mappings = {
      era: { 'modern': '現代', 'showa': '昭和', 'near-future': '近未来', 'fantasy': 'ファンタジー' },
      setting: { 'closed-space': '閉鎖空間', 'mountain-villa': '山荘', 'city': '都市部' },
      tone: { 'serious': 'シリアス', 'comedy': 'コメディ', 'horror': 'ホラー', 'adventure': '冒険活劇' }
    };
    return mappings[field]?.[value] || value || '未設定';
  }

  getPhaseName(stepNum) {
    const names = {
      '1': '作品タイトル・コンセプト',
      '2': 'キャラクター完全設計',
      '3': '事件・謎・真相構築',
      '4': 'タイムライン・進行管理',
      '5': 'ゲームマスター完全ガイド'
    };
    return names[stepNum] || `ステップ${stepNum}`;
  }

  // ZIPファイルダウンロード（PDF廃止）
  async downloadFile(format = 'zip') {
    if (!this.sessionData) {
      this.showError('ダウンロード用のデータがありません');
      return;
    }

    try {
      console.log('📦 Downloading ZIP scenario package...');
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionData: this.sessionData
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'murder_mystery_scenario.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ ZIP download completed');
      } else {
        throw new Error(`Download failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Download failed:', error);
      this.showError(`ダウンロードに失敗しました: ${error.message}`);
    }
  }

  // エラー表示
  showError(message) {
    // スケルトンローディングを停止
    if (skeletonLoader) {
      skeletonLoader.hideAll();
    }
    
    this.hideElement('loading-container');
    this.showElement('error-container');
    
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
      errorEl.innerHTML = `
        <div class="error-content skeleton-fade-in">
          <h3>⚠️ エラーが発生しました</h3>
          <p>${message}</p>
          <div class="error-actions">
            <button onclick="window.location.reload()" class="btn btn-primary">
              🔄 リロードして再試行
            </button>
          </div>
        </div>
      `;
    }
  }

  // アプリリセット
  resetApp() {
    this.sessionData = null;
    this.formData = {};
    this.currentStep = 1;
    this.isGenerating = false;
    
    this.hideElement('result-container');
    this.hideElement('error-container');
    this.showElement('main-card');
    
    this.updateStepDisplay();
    this.updateButtonStates();
    
    // フォームリセット
    const form = document.getElementById('scenario-form');
    if (form) {
      form.reset();
    }
  }

  // フォームデータ復元
  restoreFormData() {
    const saved = localStorage.getItem('murderMysteryFormData');
    if (saved) {
      try {
        this.formData = JSON.parse(saved);
        this.populateForm();
      } catch (error) {
        console.error('Failed to restore form data:', error);
      }
    }
  }

  populateForm() {
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

  // ユーティリティ
  showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove('hidden');
    }
  }

  hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add('hidden');
    }
  }
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
  window.app = new UltraIntegratedApp();
  window.ultraIntegratedApp = window.app; // 後方互換性のため
});