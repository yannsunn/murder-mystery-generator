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
    const newScenarioBtn = document.getElementById('new-scenario');
    // ZIPダウンロード機能は削除 - Web上完全表示のため

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
      
      // 5分タイムアウト設定
      const timeoutId = setTimeout(() => {
        if (this.isGenerating) {
          console.error('⏰ Generation timeout reached');
          this.showError('生成がタイムアウトしました。再度お試しください。');
          this.isGenerating = false;
          this.stopProgressTimer();
          this.hideElement('loading-container');
          this.showElement('main-card');
        }
      }, 300000);
      
      // 進捗とタイマーを開始
      this.startProgressTimer();
      
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
      
      // 進捗を100%に設定
      this.updateProgressBar(100);
      this.updatePhaseInfo(5, 5, '生成完了');
      
      // UX強化: 生成完了通知
      if (uxEnhancer) {
        uxEnhancer.showToast('🎉 統合マイクロ生成が完了しました！', 'success', 5000);
      }
      
      // 少し遅らせて結果表示
      setTimeout(() => {
        this.showResults(result.sessionData);
      }, 1000);
      
      clearTimeout(timeoutId);
      
    } catch (error) {
      console.error('❌ Integrated Micro Generation failed:', error);
      
      // タイマー停止
      this.stopProgressTimer();
      clearTimeout(timeoutId);
      
      // UX強化: エラー通知
      if (uxEnhancer) {
        uxEnhancer.showToast('❌ 生成中にエラーが発生しました', 'error', 5000);
      }
      
      this.showError(error.message);
    } finally {
      this.isGenerating = false;
      this.stopProgressTimer();
    }
  }

  // 🚀 旧ウルトラ生成メソッド - 統合マイクロ生成に統合されました
  async startUltraGeneration() {
    // 統合マイクロ生成にリダイレクト
    console.log('🔄 Redirecting to integrated micro generation...');
    await this.startMicroGeneration();
  }

  // 🎯 進捗タイマー開始
  startProgressTimer() {
    this.progressStartTime = Date.now();
    this.currentProgress = 0;
    this.currentPhase = 1;
    
    // 進捗シミュレーション (5つのフェーズ)
    this.progressPhases = [
      { name: '🚀 作品タイトル・コンセプト生成', duration: 60 },
      { name: '🎭 キャラクター完全設計', duration: 90 },
      { name: '🔍 事件・謎・真相構築', duration: 75 },
      { name: '⏱ タイムライン・進行管理', duration: 45 },
      { name: '🎓 GMガイド完成', duration: 30 }
    ];
    
    this.updatePhaseInfo(1, 5, this.progressPhases[0].name);
    
    // プログレスタイマー開始
    this.progressTimer = setInterval(() => {
      this.updateProgressSimulation();
    }, 1000);
  }
  
  // 🛑 進捗タイマー停止
  stopProgressTimer() {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
      this.progressTimer = null;
    }
  }
  
  // 📈 進捗シミュレーション更新
  updateProgressSimulation() {
    const elapsed = (Date.now() - this.progressStartTime) / 1000; // 秒
    
    // 各フェーズの累積時間を計算
    let totalDuration = 0;
    let currentPhaseDuration = 0;
    let phaseIndex = 0;
    
    for (let i = 0; i < this.progressPhases.length; i++) {
      if (elapsed < totalDuration + this.progressPhases[i].duration) {
        phaseIndex = i;
        currentPhaseDuration = elapsed - totalDuration;
        break;
      }
      totalDuration += this.progressPhases[i].duration;
    }
    
    // 全体進捗計算
    const totalTime = this.progressPhases.reduce((sum, phase) => sum + phase.duration, 0);
    const overallProgress = Math.min(95, (elapsed / totalTime) * 100); // 最大95%まで
    
    // 現在のフェーズ進捗
    const phaseProgress = Math.min(100, (currentPhaseDuration / this.progressPhases[phaseIndex].duration) * 100);
    
    // 前のフェーズが完了した場合
    if (phaseIndex !== this.currentPhase - 1) {
      this.currentPhase = phaseIndex + 1;
      this.updatePhaseInfo(this.currentPhase, 5, this.progressPhases[phaseIndex].name);
    }
    
    // 進捗バー更新
    this.updateProgressBar(Math.floor(overallProgress));
    
    // 残り時間計算
    const remainingTime = Math.max(0, totalTime - elapsed);
    this.updateEstimatedTime(remainingTime);
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
    
    if (phaseNumber) phaseNumber.textContent = `${currentPhase}/${totalPhases}`;
    if (currentPhaseEl) currentPhaseEl.textContent = phaseName;
    if (phaseDetails) phaseDetails.textContent = `フェーズ ${currentPhase} を処理中...`;
  }
  
  // 推定時間更新
  updateEstimatedTime(remainingSeconds) {
    const estimatedTime = document.getElementById('estimated-time');
    
    if (estimatedTime) {
      if (remainingSeconds > 0) {
        if (remainingSeconds > 60) {
          const minutes = Math.ceil(remainingSeconds / 60);
          estimatedTime.textContent = `約 ${minutes} 分`;
        } else {
          estimatedTime.textContent = `約 ${Math.ceil(remainingSeconds)} 秒`;
        }
      } else {
        estimatedTime.textContent = '完了間近';
      }
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
    
    if (currentPhase) currentPhase.textContent = '🚀 AI生成エンジン起動中...';
    if (phaseDetails) phaseDetails.textContent = 'マーダーミステリー生成を開始します';
    if (phaseNumber) phaseNumber.textContent = '0/5';
    
    // 初期推定時間設定（統合マイクロ生成用）
    if (estimatedTime) {
      estimatedTime.textContent = '約 5 分';
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
      const titleMatch = step1.content.concept.match(/## 作品タイトル[\s\S]*?\n([^\n]+)/);
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
            <span class="stat-label">プロ品質ステップ完了</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${sessionData.formData?.participants || 5}</span>
            <span class="stat-label">キャラクター</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${successfulImages.length}</span>
            <span class="stat-label">プロ品質画像</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">🏆</span>
            <span class="stat-label">商業品質</span>
          </div>
        </div>
        
        <!-- タブナビゲーション -->
        <div class="result-tabs">
          <button class="tab-button active" onclick="showTab('overview')">📊 作品概要</button>
          <button class="tab-button" onclick="showTab('scenario')">📜 完全シナリオ</button>
          <button class="tab-button" onclick="showTab('characters')">🎭 ハンドアウト集</button>
          <button class="tab-button" onclick="showTab('timeline')">⏱ 進行管理</button>
          <button class="tab-button" onclick="showTab('gm-guide')">🎓 GMマニュアル</button>
          ${successfulImages.length > 0 ? '<button class="tab-button" onclick="showTab(\'images\')">🖼 アートワーク</button>' : ''}
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
        
        <div class="web-actions-section">
          <h4>🌐 Web上で完全表示中</h4>
          <div class="web-actions">
            <button class="btn btn-primary" onclick="copyScenarioText()">
              📋 全シナリオをコピー
            </button>
            <button class="btn btn-info" onclick="copyTabContent()">
              📄 表示中タブをコピー
            </button>
            <button class="btn btn-secondary" onclick="window.print()">
              🖨️ ページを印刷
            </button>
            <button class="btn btn-warning" onclick="saveAsText()">
              💾 テキストファイル保存
            </button>
            <button class="btn btn-success" onclick="window.app.resetApp()">
              🔄 新規シナリオ作成
            </button>
          </div>
          <div class="web-display-note">
            <p>📖 すべての資料がWeb上で完全表示されています。タブを切り替えて各資料をご確認ください。</p>
            <p>💡 操作ヒント: Ctrl+F で検索、各ボタンで便利な機能をご利用いただけます。</p>
          </div>
        </div>
        
        <!-- 検索・フィルター機能 -->
        <div class="search-filter-section">
          <h4>🔍 検索・フィルター</h4>
          <div class="search-controls">
            <input type="text" id="content-search" placeholder="コンテンツ内を検索..." class="search-input">
            <button class="btn btn-primary" onclick="searchContent()">
              🔍 検索
            </button>
            <button class="btn btn-secondary" onclick="clearSearch()">
              ❌ クリア
            </button>
          </div>
          <div class="filter-controls">
            <select id="content-filter" class="filter-select">
              <option value="all">すべて表示</option>
              <option value="handouts">ハンドアウトのみ</option>
              <option value="gm-info">GM専用情報</option>
              <option value="characters">キャラクター情報</option>
              <option value="timeline">タイムライン</option>
            </select>
            <button class="btn btn-info" onclick="applyFilter()">
              🎯 フィルター適用
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
    
    if (!characters) {
      return '<p>キャラクターハンドアウトが生成されていません。</p>';
    }
    
    // プレイヤー別ハンドアウトを分離
    const playerHandouts = this.extractPlayerHandouts(characters);
    
    if (playerHandouts.length === 0) {
      return `
        <div class="characters-section">
          ${this.formatContent(characters)}
        </div>
      `;
    }
    
    return `
      <div class="characters-section">
        <div class="handout-navigation">
          <h5>📋 プレイヤー別ハンドアウト</h5>
          <div class="player-tabs">
            ${playerHandouts.map((handout, index) => `
              <button class="player-tab ${index === 0 ? 'active' : ''}" 
                      onclick="showPlayerHandout(${index})" 
                      id="player-tab-${index}">
                👤 ${handout.playerName}
              </button>
            `).join('')}
            <button class="player-tab" onclick="showAllHandouts()">
              📚 全ハンドアウト
            </button>
          </div>
        </div>
        
        <div class="handout-content">
          ${playerHandouts.map((handout, index) => `
            <div class="player-handout" id="handout-${index}" style="display: ${index === 0 ? 'block' : 'none'};">
              <div class="handout-header">
                <h4>🎭 ${handout.playerName} 専用ハンドアウト</h4>
                <div class="handout-actions">
                  <button class="btn btn-sm btn-primary" onclick="copyPlayerHandout(${index})">
                    📋 このハンドアウトをコピー
                  </button>
                  <button class="btn btn-sm btn-secondary" onclick="printPlayerHandout(${index})">
                    🖨️ 印刷
                  </button>
                </div>
              </div>
              <div class="handout-body">
                ${this.formatContent(handout.content)}
              </div>
            </div>
          `).join('')}
          
          <div class="player-handout" id="handout-all" style="display: none;">
            <div class="handout-header">
              <h4>📚 全プレイヤーハンドアウト</h4>
              <div class="handout-actions">
                <button class="btn btn-sm btn-primary" onclick="copyAllHandouts()">
                  📋 全ハンドアウトをコピー
                </button>
                <button class="btn btn-sm btn-secondary" onclick="printAllHandouts()">
                  🖨️ 全て印刷
                </button>
              </div>
            </div>
            <div class="handout-body">
              ${this.formatContent(characters)}
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // プレイヤー別ハンドアウトを抽出する新しいメソッド
  extractPlayerHandouts(charactersText) {
    const handouts = [];
    const sections = charactersText.split(/【プレイヤー\d+専用ハンドアウト/);
    
    if (sections.length < 2) {
      // 旧形式の場合、プレイヤー別に分割を試行
      const lines = charactersText.split('\n');
      let currentHandout = null;
      
      lines.forEach(line => {
        const playerMatch = line.match(/^#+\s*(.+(?:プレイヤー|キャラクター).+)/i);
        if (playerMatch) {
          if (currentHandout) {
            handouts.push(currentHandout);
          }
          currentHandout = {
            playerName: playerMatch[1].replace(/【|】|#+|\s/g, ''),
            content: line + '\n'
          };
        } else if (currentHandout) {
          currentHandout.content += line + '\n';
        }
      });
      
      if (currentHandout) {
        handouts.push(currentHandout);
      }
    } else {
      // 新形式の場合
      for (let i = 1; i < sections.length; i++) {
        const section = sections[i];
        const playerNameMatch = section.match(/^[^】]*】?\s*([^：\n]+)/);
        const playerName = playerNameMatch ? playerNameMatch[1].trim() : `プレイヤー${i}`;
        
        handouts.push({
          playerName: playerName,
          content: '【' + playerName + '専用ハンドアウト】' + section
        });
      }
    }
    
    return handouts;
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

  // Web上完全表示専用メソッド（ZIPダウンロード廃止）
  handleDownload() {
    // Web上で完全表示のため、コピー機能に統一
    if (typeof copyScenarioText === 'function') {
      copyScenarioText();
    } else {
      console.log('📖 All content is displayed on this web page. Use tabs to navigate.');
      alert('すべてのコンテンツはこのWebページ上で表示されています。タブを使って各資料をご確認ください。');
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