/**
 * 🚀 Ultra Integrated Murder Mystery App
 * 完全統合型フロントエンド - 自動フェーズ実行対応
 */

class UltraIntegratedApp {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.formData = {};
    this.sessionData = null;
    this.isGenerating = false;
    this.generationProgress = {
      currentPhase: 0,
      totalPhases: 8,
      status: 'waiting'
    };
    
    console.log('🚀 Ultra Integrated App - 初期化開始');
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateStepDisplay();
    this.updateButtonStates();
    this.restoreFormData();
    
    console.log('✅ Ultra Integrated App - 初期化完了');
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
      generateBtn.addEventListener('click', () => this.startUltraGeneration());
    }

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
    }
  }

  goToNextStep() {
    if (this.currentStep < this.totalSteps) {
      this.collectFormData();
      this.currentStep++;
      this.updateStepDisplay();
      this.updateButtonStates();
      if (this.currentStep === this.totalSteps) {
        this.updateSummary();
      }
    }
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

    if (nextBtn) {
      nextBtn.style.display = this.currentStep === this.totalSteps ? 'none' : 'block';
    }

    if (generateBtn) {
      generateBtn.style.display = this.currentStep === this.totalSteps ? 'block' : 'none';
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

    // チェックボックス
    const checkboxes = ['red_herring', 'twist_ending', 'secret_roles'];
    checkboxes.forEach(name => {
      const checkbox = document.getElementById(name);
      if (checkbox) {
        this.formData[name] = checkbox.checked;
      }
    });
    
    // ラジオボタン
    const generationMode = document.querySelector('input[name="generation_mode"]:checked');
    if (generationMode) {
      this.formData.generation_mode = generationMode.value;
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

  // 🚀 ウルトラ統合生成開始
  async startUltraGeneration() {
    if (this.isGenerating) return;

    this.collectFormData();
    console.log('🔥 Ultra Generation starting with data:', this.formData);

    try {
      this.isGenerating = true;
      this.showGenerationUI();
      
      const sessionId = `ultra_${Date.now()}`;
      
      const response = await fetch('/api/ultra-integrated-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate_complete',
          formData: this.formData,
          sessionId: sessionId
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('🎉 Ultra Generation completed successfully!');
        this.sessionData = result.sessionData;
        this.showResults(result.sessionData);
      } else {
        throw new Error(result.error || 'Generation failed');
      }
      
    } catch (error) {
      console.error('❌ Ultra Generation failed:', error);
      this.showError(error.message);
    } finally {
      this.isGenerating = false;
    }
  }

  // 生成UI表示
  showGenerationUI() {
    this.hideElement('main-card');
    this.showElement('loading-container');
    
    // プログレス初期化
    this.updateProgress(0, '🚀 ウルトラ統合生成開始...');
    
    // プログレス更新シミュレーション
    this.simulateProgress();
  }

  simulateProgress() {
    const phases = [
      { name: 'コンセプト・世界観生成', time: 2000 },
      { name: 'キャラクター詳細設計', time: 3000 },
      { name: '人物関係マトリクス構築', time: 2500 },
      { name: '事件・謎・仕掛け構築', time: 4000 },
      { name: '手がかり・証拠システム', time: 3000 },
      { name: 'タイムライン構築', time: 2000 },
      { name: '真相・解決編構築', time: 3500 },
      { name: 'ゲームマスターガイド', time: 2000 },
      { name: '画像生成・統合処理', time: 5000 }
    ];
    
    let currentPhase = 0;
    let totalTime = 0;
    
    const updatePhase = () => {
      if (currentPhase < phases.length && this.isGenerating) {
        const phase = phases[currentPhase];
        const progress = ((currentPhase + 1) / phases.length) * 100;
        
        this.updateProgress(progress, `${phase.name}中...`);
        this.updatePhaseInfo(currentPhase + 1, phases.length, phase.name);
        
        currentPhase++;
        totalTime += phase.time;
        
        setTimeout(updatePhase, phase.time);
      }
    };
    
    updatePhase();
  }

  updateProgress(percentage, message) {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressPercentage = document.getElementById('progress-percentage');
    
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = message;
    }
    
    if (progressPercentage) {
      progressPercentage.textContent = `${Math.round(percentage)}%`;
    }
  }

  updatePhaseInfo(current, total, phaseName) {
    const currentPhaseEl = document.getElementById('current-phase');
    const phaseDetailsEl = document.getElementById('phase-details');
    const phaseNumberEl = document.getElementById('current-phase-number');
    
    if (currentPhaseEl) {
      currentPhaseEl.textContent = `🔄 ${phaseName}`;
    }
    
    if (phaseDetailsEl) {
      phaseDetailsEl.textContent = 'AI エンジンが最適化処理中...';
    }
    
    if (phaseNumberEl) {
      phaseNumberEl.textContent = `${current}/${total}`;
    }
  }

  // 結果表示
  showResults(sessionData) {
    this.hideElement('loading-container');
    this.showElement('result-container');
    
    const contentEl = document.getElementById('scenario-content');
    if (contentEl && sessionData.phases) {
      const summaryHtml = this.generateResultSummary(sessionData);
      contentEl.innerHTML = summaryHtml;
    }
  }

  generateResultSummary(sessionData) {
    const phases = sessionData.phases || {};
    const concept = phases.phase1?.concept || '';
    const titleMatch = concept.match(/## 作品タイトル[\\s\\S]*?\\n([^\\n]+)/);
    const title = titleMatch ? titleMatch[1].trim() : 'マーダーミステリーシナリオ';
    
    return `
      <div class="result-summary">
        <h3 class="scenario-title">${title}</h3>
        <div class="generation-stats">
          <div class="stat-card">
            <span class="stat-number">${Object.keys(phases).length}</span>
            <span class="stat-label">生成フェーズ完了</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${sessionData.formData?.participants || 5}</span>
            <span class="stat-label">参加者用</span>
          </div>
          <div class="stat-card">
            <span class="stat-number">${sessionData.generatedImages?.length || 0}</span>
            <span class="stat-label">生成画像</span>
          </div>
        </div>
        
        <div class="result-phases">
          ${Object.entries(phases).map(([key, data]) => {
            const phaseNum = key.replace('phase', '');
            const phaseName = this.getPhaseName(phaseNum);
            return `
              <div class="phase-result">
                <h4>フェーズ ${phaseNum}: ${phaseName}</h4>
                <div class="phase-status">
                  ${data.status === 'completed' ? '✅ 完了' : 
                    data.status === 'error' ? '❌ エラー' : '⏳ 処理中'}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <div class="download-section">
          <h4>📥 ダウンロード可能な形式</h4>
          <div class="download-options">
            <div class="download-option">
              <strong>📦 ZIPアーカイブ</strong>
              <p>完全なシナリオテキストファイル + ゲームマスターガイド + プレイヤー配布資料</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getPhaseName(phaseNum) {
    const names = {
      '1': 'コンセプト・世界観',
      '2': 'キャラクター設定',
      '3': '人物関係',
      '4': '事件・謎',
      '5': '手がかり・証拠',
      '6': 'タイムライン',
      '7': '真相・解決',
      '8': 'ゲームマスター'
    };
    return names[phaseNum] || `フェーズ${phaseNum}`;
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
    this.hideElement('loading-container');
    this.showElement('error-container');
    
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
      errorEl.innerHTML = `
        <div class="error-content">
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
  window.ultraIntegratedApp = new UltraIntegratedApp();
});