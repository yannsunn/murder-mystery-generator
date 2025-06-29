/**
 * 🎭 Murder Mystery Generator - Main Application
 * プロフェッショナル品質のマーダーミステリー生成システム
 * 基本設定 → 世界観 → 事件設定 → 詳細設定 → 生成
 */

class MurderMysteryApp {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.formData = {};
    this.generatedScenario = null;
    
    console.log('🎭 Murder Mystery Generator - 初期化開始');
    this.init();
  }

  init() {
    // イベントリスナーの設定
    this.setupEventListeners();
    
    // 初期表示の更新
    this.updateStepDisplay();
    this.updateButtonStates();
    
    // フォームデータの復元
    this.restoreFormData();
    
    console.log('✅ Murder Mystery Generator - 初期化完了');
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
      generateBtn.addEventListener('click', () => this.startGeneration());
    }

    // フォーム変更監視
    const form = document.getElementById('scenario-form');
    if (form) {
      form.addEventListener('change', (e) => this.handleFormChange(e));
    }

    // ステップインジケーター
    const indicators = document.querySelectorAll('.step-indicator-item');
    indicators.forEach((indicator, index) => {
      indicator.addEventListener('click', () => {
        const targetStep = index + 1;
        if (targetStep <= this.currentStep) {
          this.navigateToStep(targetStep);
        }
      });
    });

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.goToNextStep();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.goToPreviousStep();
        }
      }
    });

    // 結果画面のボタン
    this.setupResultButtons();
  }

  setupResultButtons() {
    const downloadPdfBtn = document.getElementById('download-pdf');
    const downloadZipBtn = document.getElementById('download-zip');
    const newScenarioBtn = document.getElementById('new-scenario');

    if (downloadPdfBtn) {
      downloadPdfBtn.addEventListener('click', () => this.downloadPDF());
    }

    if (downloadZipBtn) {
      downloadZipBtn.addEventListener('click', () => this.downloadZIP());
    }

    if (newScenarioBtn) {
      newScenarioBtn.addEventListener('click', () => this.resetToStart());
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

  goToPreviousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.updateStepDisplay();
      this.updateButtonStates();
    }
  }

  navigateToStep(targetStep) {
    if (targetStep >= 1 && targetStep <= this.totalSteps && targetStep <= this.currentStep) {
      this.currentStep = targetStep;
      this.updateStepDisplay();
      this.updateButtonStates();
      
      if (this.currentStep === this.totalSteps) {
        this.updateSummary();
      }
    }
  }

  updateStepDisplay() {
    // 全ステップを非表示
    for (let i = 1; i <= this.totalSteps; i++) {
      const stepEl = document.getElementById(`step-${i}`);
      if (stepEl) {
        stepEl.classList.remove('active');
        stepEl.style.display = 'none';
      }
    }

    // 現在のステップを表示
    const currentStepEl = document.getElementById(`step-${this.currentStep}`);
    if (currentStepEl) {
      currentStepEl.classList.add('active');
      currentStepEl.style.display = 'block';
    }

    // ステップインジケーターの更新
    this.updateStepIndicators();
  }

  updateStepIndicators() {
    const indicators = document.querySelectorAll('.step-indicator-item');
    indicators.forEach((indicator, index) => {
      const step = index + 1;
      indicator.classList.remove('active', 'completed');
      
      if (step === this.currentStep) {
        indicator.classList.add('active');
      } else if (step < this.currentStep) {
        indicator.classList.add('completed');
      }
    });
  }

  updateButtonStates() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const generateBtn = document.getElementById('generate-btn');

    // 前へボタン
    if (prevBtn) {
      prevBtn.disabled = this.currentStep === 1;
    }

    // 次へ・生成ボタンの切り替え
    if (this.currentStep === this.totalSteps) {
      if (nextBtn) nextBtn.style.display = 'none';
      if (generateBtn) generateBtn.style.display = 'block';
    } else {
      if (nextBtn) nextBtn.style.display = 'block';
      if (generateBtn) generateBtn.style.display = 'none';
    }
  }

  handleFormChange(event) {
    this.collectFormData();
    this.saveFormData();
  }

  collectFormData() {
    const form = document.getElementById('scenario-form');
    if (!form) return;

    const formData = new FormData(form);
    this.formData = {};

    // 通常のフィールド
    for (const [key, value] of formData.entries()) {
      this.formData[key] = value;
    }

    // チェックボックス（チェックされていない場合もfalseとして保存）
    const checkboxes = ['red_herring', 'twist_ending', 'secret_roles'];
    checkboxes.forEach(name => {
      const checkbox = document.getElementById(name);
      if (checkbox) {
        this.formData[name] = checkbox.checked;
      }
    });
    
    // ラジオボタン（generation_mode）
    const generationMode = document.querySelector('input[name="generation_mode"]:checked');
    if (generationMode) {
      this.formData.generation_mode = generationMode.value;
    }
  }

  updateSummary() {
    const summaryEl = document.getElementById('settings-summary');
    if (!summaryEl) return;

    this.collectFormData();

    const getOptionText = (selectId, value) => {
      const select = document.getElementById(selectId);
      if (select) {
        const option = select.querySelector(`option[value="${value}"]`);
        return option ? option.textContent : value;
      }
      return value;
    };

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
          <span class="summary-value">${getOptionText('era', this.formData.era || 'modern')}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">🏢</span>
          <span class="summary-label">舞台設定:</span>
          <span class="summary-value">${getOptionText('setting', this.formData.setting || 'closed-space')}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">🌍</span>
          <span class="summary-label">世界観:</span>
          <span class="summary-value">${getOptionText('worldview', this.formData.worldview || 'realistic')}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">🎭</span>
          <span class="summary-label">トーン:</span>
          <span class="summary-value">${getOptionText('tone', this.formData.tone || 'serious')}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">⚡</span>
          <span class="summary-label">事件タイプ:</span>
          <span class="summary-value">${getOptionText('incident_type', this.formData.incident_type || 'murder')}</span>
        </div>
        <div class="summary-item">
          <span class="summary-icon">🧩</span>
          <span class="summary-label">複雑さ:</span>
          <span class="summary-value">${getOptionText('complexity', this.formData.complexity || 'standard')}</span>
        </div>
        ${this.formData.red_herring ? '<div class="summary-item special"><span class="summary-icon">🎯</span><span class="summary-text">レッドヘリング: 有効</span></div>' : ''}
        ${this.formData.twist_ending ? '<div class="summary-item special"><span class="summary-icon">🌪️</span><span class="summary-text">どんでん返し: 有効</span></div>' : ''}
        ${this.formData.secret_roles ? '<div class="summary-item special"><span class="summary-icon">🎭</span><span class="summary-text">秘密の役割: 有効</span></div>' : ''}
      </div>
    `;

    summaryEl.innerHTML = summaryHtml;
  }

  async startGeneration() {
    console.log('🚀 シナリオ生成開始 - 段階的処理モード');
    this.collectFormData();

    // UI切り替え
    this.showLoading();

    try {
      // 段階的生成モードを使用
      if (this.useStageMode()) {
        await this.startStagedGeneration();
      } else {
        // 従来の一括生成（フォールバック）
        const scenario = await this.generateScenario();
        this.generatedScenario = scenario;
        this.showResults(scenario);
      }
    } catch (error) {
      console.error('生成エラー:', error);
      this.showError(error.message);
    }
  }

  useStageMode() {
    // 段階的生成モードを使用するかの判定
    const generationMode = this.formData.generation_mode || 'staged';
    return generationMode === 'staged';
  }

  async startStagedGeneration() {
    console.log('📊 段階的生成モード開始 - Individual Phase Execution');
    
    try {
      // セッション作成
      this.updateProgress(0, '初期化中...', 'セッションを作成しています');
      const sessionId = await this.createGenerationSession();
      this.currentSessionId = sessionId;
      
      // 警告メッセージを表示してフェーズ別実行モードを案内
      this.showPhaseByPhaseRecommendation();
      
      // Individual Phase Execution
      await this.executePhaseByPhase(sessionId);
      
    } catch (error) {
      console.error('段階的生成エラー:', error);
      this.handleStagedGenerationError(error);
    }
  }

  showPhaseByPhaseRecommendation() {
    const recommendationHtml = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>🚀 推奨: フェーズ別実行モード</h3>
        <p>タイムアウトエラーを回避するため、新しいフェーズ別実行モードをご利用ください。</p>
        <div style="margin-top: 15px;">
          <a href="/phase-by-phase.html" style="display: inline-block; padding: 12px 24px; background: white; color: #667eea; text-decoration: none; border-radius: 6px; font-weight: bold;">フェーズ別実行モードへ移動</a>
        </div>
      </div>
    `;
    
    const loadingEl = document.getElementById('loading-spinner');
    if (loadingEl) {
      loadingEl.innerHTML = recommendationHtml;
    }
  }

  async executePhaseByPhase(sessionId) {
    const phases = [
      { id: 1, name: 'コンセプト生成' },
      { id: 2, name: 'キャラクター設定' },
      { id: 3, name: '人物関係' },
      { id: 4, name: '事件詳細' },
      { id: 5, name: '証拠・手がかり' },
      { id: 6, name: 'タイムライン' },
      { id: 7, name: '真相解決' },
      { id: 8, name: 'GMガイド' }
    ];

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      try {
        this.updateProgress((i / phases.length) * 100, `Phase ${phase.id}: ${phase.name}`, '実行中...');
        
        await this.executeSinglePhase(sessionId, phase.id);
        
        this.updateProgress(((i + 1) / phases.length) * 100, `Phase ${phase.id}: ${phase.name}`, '完了');
        
        // 各フェーズ間で少し待機
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`Phase ${phase.id} error:`, error);
        // フェーズエラーでも続行を試行
        this.updateProgress(((i + 1) / phases.length) * 100, `Phase ${phase.id}: ${phase.name}`, `エラー: ${error.message}`);
      }
    }

    // 全フェーズ完了後にシナリオ取得
    try {
      const scenario = await this.getGeneratedScenario(sessionId);
      this.generatedScenario = scenario;
      this.showResults(scenario);
    } catch (error) {
      console.error('シナリオ取得エラー:', error);
      this.showError('一部のフェーズでエラーが発生しました。フェーズ別実行モードをお試しください。');
    }
  }

  async executeSinglePhase(sessionId, phaseId) {
    const response = await fetch('/api/phase-executor?action=execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phaseId,
        sessionId,
        formData: this.formData
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Phase ${phaseId} failed`);
    }

    return await response.json();
  }

  async createGenerationSession() {
    const response = await fetch('/api/scenario-storage?action=create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        metadata: this.formData
      })
    });

    if (!response.ok) {
      throw new Error('セッション作成に失敗しました');
    }

    const result = await response.json();
    console.log('✅ セッション作成:', result.sessionId);
    return result.sessionId;
  }

  async executeStage1(sessionId) {
    const response = await fetch('/api/staged-generation?stage=1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        formData: this.formData
      })
    });

    if (!response.ok) {
      throw new Error('Stage 1の実行に失敗しました');
    }

    const result = await response.json();
    console.log('✅ Stage 1完了:', result);
    return result;
  }

  async executeStage1Continue(sessionId) {
    const response = await fetch('/api/staged-generation?stage=1-continue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId
      })
    });

    if (!response.ok) {
      throw new Error('Stage 1続きの実行に失敗しました');
    }

    const result = await response.json();
    console.log('✅ Stage 1続き完了:', result);
    return result;
  }

  async executeStage2(sessionId) {
    const response = await fetch('/api/staged-generation?stage=2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId
      })
    });

    if (!response.ok) {
      throw new Error('Stage 2の実行に失敗しました');
    }

    const result = await response.json();
    console.log('✅ Stage 2完了:', result);
    return result;
  }

  async getGeneratedScenario(sessionId) {
    const response = await fetch(`/api/scenario-storage?action=get&sessionId=${sessionId}`);

    if (!response.ok) {
      throw new Error('シナリオの取得に失敗しました');
    }

    const result = await response.json();
    return result.scenario;
  }

  shouldAutoGeneratePDF() {
    // PDF自動生成の設定（将来的に設定可能に）
    return false;
  }

  handleStagedGenerationError(error) {
    // エラー処理とリトライオプション
    const retryButton = `
      <button onclick="window.app.retryStagedGeneration()" style="
        background: #3b82f6;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        margin-top: 1rem;
      ">段階的生成を再試行</button>
    `;
    
    this.showError(error.message + '<br>' + retryButton);
  }

  async retryStagedGeneration() {
    if (this.currentSessionId) {
      this.showLoading();
      try {
        // 最後の成功したステージから再開
        await this.resumeStagedGeneration(this.currentSessionId);
      } catch (error) {
        this.showError('再試行に失敗しました: ' + error.message);
      }
    } else {
      this.startGeneration();
    }
  }

  async resumeStagedGeneration(sessionId) {
    // セッションの状態を確認して適切なステージから再開
    const scenario = await this.getGeneratedScenario(sessionId);
    
    if (!scenario.phases || Object.keys(scenario.phases).length === 0) {
      // 最初から
      await this.executeStage1(sessionId);
    } else if (Object.keys(scenario.phases).length < 8) {
      // 後半から
      await this.executeStage1Continue(sessionId);
    }
    
    // 結果表示
    const updatedScenario = await this.getGeneratedScenario(sessionId);
    this.generatedScenario = updatedScenario;
    this.showResults(updatedScenario);
  }

  async generateScenario() {
    const phases = [
      { id: 1, name: 'コンセプト生成', endpoint: '/api/phase1-concept' },
      { id: 2, name: 'キャラクター設定', endpoint: '/api/phase2-characters' },
      { id: 3, name: '人物関係', endpoint: '/api/phase3-relationships' },
      { id: 4, name: '事件詳細', endpoint: '/api/phase4-incident' },
      { id: 5, name: '証拠・手がかり', endpoint: '/api/phase5-clues' },
      { id: 6, name: 'タイムライン', endpoint: '/api/phase6-timeline' },
      { id: 7, name: '真相解決', endpoint: '/api/phase7-solution' },
      { id: 8, name: 'GMガイド', endpoint: '/api/phase8-gamemaster' }
    ];

    const scenario = {
      metadata: {
        participants: this.formData.participants,
        era: this.formData.era,
        setting: this.formData.setting,
        worldview: this.formData.worldview,
        tone: this.formData.tone,
        incident_type: this.formData.incident_type,
        complexity: this.formData.complexity,
        features: {
          red_herring: this.formData.red_herring,
          twist_ending: this.formData.twist_ending,
          secret_roles: this.formData.secret_roles
        }
      },
      phases: {}
    };

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      
      // プログレス更新
      const progress = ((i + 1) / phases.length) * 100;
      this.updateProgress(progress, `フェーズ${phase.id}: ${phase.name}`, `${i + 1}/${phases.length} 完了`);

      try {
        const requestData = {
          ...this.formData,
          previousPhases: scenario.phases
        };

        const response = await fetch(phase.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        if (!response.ok) {
          throw new Error(`フェーズ${phase.id}の生成に失敗しました`);
        }

        const phaseResult = await response.json();
        scenario.phases[`phase${phase.id}`] = phaseResult;

        console.log(`✅ フェーズ${phase.id} 完了:`, phase.name);

      } catch (error) {
        console.warn(`⚠️ フェーズ${phase.id} エラー:`, error);
        // フェールバック処理
        scenario.phases[`phase${phase.id}`] = await this.generateFallbackContent(phase, this.formData);
      }
    }

    return scenario;
  }

  async generateFallbackContent(phase, formData) {
    // フェールバック用のシンプルな生成
    console.log(`🔄 フェーズ${phase.id} フェールバック生成`);
    
    const fallbackTemplates = {
      1: this.generateBasicConcept(formData),
      2: this.generateBasicCharacters(formData),
      3: this.generateBasicRelationships(formData),
      4: this.generateBasicIncident(formData),
      5: this.generateBasicClues(formData),
      6: this.generateBasicTimeline(formData),
      7: this.generateBasicSolution(formData),
      8: this.generateBasicGMGuide(formData)
    };

    return {
      content: fallbackTemplates[phase.id] || `フェーズ${phase.id}の内容`,
      generated_by: 'fallback_system',
      timestamp: new Date().toISOString()
    };
  }

  generateBasicConcept(formData) {
    const participants = formData.participants || '5';
    const era = formData.era || 'modern';
    const setting = formData.setting || 'closed-space';
    const incident = formData.incident_type || 'murder';

    return `# 🎭 マーダーミステリー：${era === 'modern' ? '現代' : era}の${incident === 'murder' ? '殺人' : '事件'}

## 基本情報
- **参加人数**: ${participants}人
- **時代設定**: ${era === 'modern' ? '現代（2020年代）' : era}
- **舞台**: ${setting === 'closed-space' ? '閉鎖空間' : setting}
- **事件種別**: ${incident === 'murder' ? '殺人事件' : incident}

## あらすじ
${participants}人の登場人物が${setting === 'closed-space' ? '密室空間' : '特定の場所'}に集まった時、思わぬ事件が発生する。
参加者は探偵となり、限られた情報と手がかりから真相を解明しなければならない。

**推定プレイ時間**: 2-3時間
**難易度**: ${formData.complexity === 'simple' ? '初心者向け' : formData.complexity === 'complex' ? '上級者向け' : '標準'}`;
  }

  generateBasicCharacters(formData) {
    const participants = parseInt(formData.participants || '5');
    const characters = [];

    for (let i = 1; i <= participants; i++) {
      characters.push(`
## キャラクター${i}
- **名前**: [キャラクター${i}の名前]
- **年齢**: [年齢]
- **職業**: [職業]
- **性格**: [性格の特徴]
- **秘密**: [隠している秘密]
- **動機**: [行動の動機]`);
    }

    return `# 👥 キャラクター設定

${characters.join('\n')}

## 注意事項
- 各キャラクターには明確な動機と秘密を設定
- 全員に事件への関わりを持たせる
- バランスよく疑惑を分散させる`;
  }

  generateBasicRelationships(formData) {
    return `# 🤝 人物関係図

## 関係性マップ
各キャラクター間の複雑な関係性を設定します。

## 主要な関係
- **同盟関係**: 協力し合うキャラクター
- **対立関係**: 敵対するキャラクター  
- **秘密の関係**: 隠された繋がり
- **過去の因縁**: 古い恨みや愛情

## ゲームマスターへの注意
- 関係性は段階的に明かす
- プレイヤーの推理を誘導する手がかりとして活用
- 意外性のある関係性を1-2個仕込む`;
  }

  generateBasicIncident(formData) {
    const incident = formData.incident_type || 'murder';
    
    return `# 💀 事件詳細

## 事件概要
${incident === 'murder' ? '殺人事件' : '事件'}が発生しました。

## 発生状況
- **発生時刻**: [具体的な時刻]
- **発見時刻**: [発見された時刻]
- **現場状況**: [現場の詳細な状況]
- **第一発見者**: [誰が発見したか]

## 物証
- **凶器**: [使用された凶器]
- **現場の手がかり**: [現場に残された証拠]
- **目撃情報**: [重要な目撃情報]

## 謎の要素
- なぜその場所で？
- なぜその時刻に？
- 真の動機は何か？`;
  }

  generateBasicClues(formData) {
    return `# 🔍 証拠・手がかり

## 物的証拠
1. **血痕**: 現場に残された血液
2. **指紋**: 重要な場所の指紋
3. **足跡**: 犯人の移動ルート
4. **遺留品**: 犯人が落とした物品

## 証言・目撃情報
1. **アリバイ証言**: 各人のアリバイ
2. **行動証言**: 事件前後の行動
3. **関係性証言**: 人間関係の証言
4. **動機情報**: 各人の動機に関する情報

## 隠された手がかり
- 一見無関係に見える重要な証拠
- 複数の証拠を組み合わせて判明する真実
- ${formData.red_herring ? 'レッドヘリング（偽の手がかり）も含む' : ''}`;
  }

  generateBasicTimeline(formData) {
    return `# ⏰ タイムライン

## 事件当日のスケジュール

### 午前
- **09:00**: 参加者集合
- **10:00**: 開始イベント
- **11:00**: 各キャラクターの行動開始

### 午後  
- **13:00**: 昼食・休憩
- **14:00**: 重要イベント発生
- **15:30**: 事件発生
- **16:00**: 事件発見・調査開始

### 夜
- **18:00**: 推理・議論フェーズ
- **19:00**: 解決フェーズ
- **20:00**: 真相発表

## 重要なポイント
- 各時間帯での各キャラクターの行動
- アリバイの確認ポイント
- 事件発生の決定的瞬間`;
  }

  generateBasicSolution(formData) {
    return `# 🎯 真相と解決

## 犯人
**[犯人の名前]**が真犯人です。

## 動機
[具体的な犯行動機を記載]

## 犯行手順
1. **準備段階**: [事前の準備]
2. **実行段階**: [犯行の実行方法]
3. **隠蔽段階**: [証拠隠滅の方法]
4. **発覚回避**: [疑いを逸らす工作]

## 決定的証拠
- [犯人を特定する決定的な証拠]
- [アリバイ崩しの方法]
- [動機を裏付ける証拠]

## 解決のポイント
${formData.twist_ending ? '- どんでん返し要素が含まれています' : ''}
${formData.secret_roles ? '- 秘密の役割が真相に関わります' : ''}

## 代替解決案
プレイヤーが異なる推理をした場合の対応方法も準備してください。`;
  }

  generateBasicGMGuide(formData) {
    return `# 🎮 ゲームマスターガイド

## 進行の流れ
1. **導入**: キャラクター紹介と状況説明（15分）
2. **事件発生**: 事件の発生と現場確認（10分）
3. **調査フェーズ**: 証拠収集と聞き込み（60分）
4. **推理フェーズ**: 議論と推理（30分）
5. **解決フェーズ**: 真相発表（15分）

## GMの役割
- **情報管理**: 適切なタイミングで情報を開示
- **進行管理**: 議論が停滞しないよう誘導
- **雰囲気作り**: ${formData.tone || 'serious'}の雰囲気を維持

## 注意事項
- プレイヤーのレベルに合わせてヒントを調整
- 全員が参加できるよう配慮
- ${formData.complexity === 'simple' ? '初心者向けなので、適切なサポートを' : formData.complexity === 'complex' ? '上級者向けなので、高度な推理を求める' : '標準レベルなので、バランスよく進行'}

## トラブルシューティング
- 推理が行き詰まった場合の追加ヒント
- 議論が紛糾した場合の仲裁方法
- 時間管理のコツ`;
  }

  showLoading() {
    document.getElementById('main-card').classList.add('hidden');
    document.getElementById('loading-container').classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loading-container').classList.add('hidden');
  }

  updateProgress(percentage, phase, details) {
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const currentPhase = document.getElementById('current-phase');
    const phaseDetails = document.getElementById('phase-details');

    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    if (progressPercentage) {
      progressPercentage.textContent = `${Math.round(percentage)}%`;
    }
    if (currentPhase) {
      currentPhase.textContent = phase;
    }
    if (phaseDetails) {
      phaseDetails.textContent = details;
    }
  }

  showResults(scenario) {
    this.hideLoading();
    
    const resultContainer = document.getElementById('result-container');
    const scenarioContent = document.getElementById('scenario-content');
    
    if (scenarioContent) {
      let contentHtml = '<div class="scenario-phases">';
      
      // 各フェーズの内容を表示
      Object.entries(scenario.phases).forEach(([phaseKey, phaseData]) => {
        const phaseNumber = phaseKey.replace('phase', '');
        const phaseNames = {
          '1': 'コンセプト',
          '2': 'キャラクター設定', 
          '3': '人物関係',
          '4': '事件詳細',
          '5': '証拠・手がかり',
          '6': 'タイムライン',
          '7': '真相解決',
          '8': 'GMガイド'
        };
        
        contentHtml += `
          <div class="phase-section">
            <h3>フェーズ${phaseNumber}: ${phaseNames[phaseNumber]}</h3>
            <div class="phase-content">${this.formatContent(phaseData.content)}</div>
          </div>
        `;
      });
      
      contentHtml += '</div>';
      scenarioContent.innerHTML = contentHtml;
    }
    
    if (resultContainer) {
      resultContainer.classList.remove('hidden');
      resultContainer.scrollIntoView({ behavior: 'smooth' });
    }
  }

  formatContent(content) {
    if (!content) return '';
    
    return content
      .replace(/##\s*(.+)/g, '<h4 class="content-heading">$1</h4>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/^- (.+)/gm, '<li>$1</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, '<p>$1</p>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n/g, '<br>');
  }

  showError(message) {
    this.hideLoading();
    
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    
    if (errorMessage) {
      errorMessage.innerHTML = `
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <div class="error-text">${message}</div>
          <div class="error-suggestion">
            ネットワーク接続を確認して再試行してください。
          </div>
        </div>
      `;
    }
    
    if (errorContainer) {
      errorContainer.classList.remove('hidden');
    }

    // 再試行ボタン
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
      retryBtn.onclick = () => {
        errorContainer.classList.add('hidden');
        this.startGeneration();
      };
    }
  }

  async downloadPDF() {
    if (!this.generatedScenario && !this.currentSessionId) return;

    try {
      // 段階的生成モードの場合
      if (this.currentSessionId && this.useStageMode()) {
        this.showPDFGenerationProgress();
        
        // Stage 2を実行してPDF生成
        await this.executeStage2(this.currentSessionId);
        
        // PDFをダウンロード
        await this.downloadGeneratedPDF(this.currentSessionId);
        
        this.hidePDFGenerationProgress();
      } else {
        // 強化版PDF生成を使用
        const response = await fetch('/api/enhanced-pdf-generator', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            scenario: this.generatedScenario,
            title: `マーダーミステリー_${this.formData.participants}人用`
          })
        });

        if (!response.ok) throw new Error('PDF生成に失敗しました');

        const blob = await response.blob();
        this.downloadBlob(blob, `murder_mystery_${new Date().toISOString().split('T')[0]}.pdf`);
      }

      console.log('✅ PDF ダウンロード完了');
    } catch (error) {
      console.error('PDF ダウンロードエラー:', error);
      this.hidePDFGenerationProgress();
      alert('PDFのダウンロードに失敗しました: ' + error.message);
    }
  }

  async downloadGeneratedPDF(sessionId) {
    // ストレージからPDFデータを取得
    const response = await fetch(`/api/scenario-storage?action=get&sessionId=${sessionId}_pdf`);
    
    if (!response.ok) {
      throw new Error('PDFデータの取得に失敗しました');
    }

    const result = await response.json();
    const pdfData = result.scenario;
    
    // Base64からBlobに変換
    const byteCharacters = atob(pdfData.data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    this.downloadBlob(blob, pdfData.filename || `murder_mystery_${sessionId}.pdf`);
  }

  downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  showPDFGenerationProgress() {
    // PDF生成中の進捗表示
    const progressOverlay = document.createElement('div');
    progressOverlay.id = 'pdf-generation-overlay';
    progressOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;
    
    progressOverlay.innerHTML = `
      <div style="
        background: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        max-width: 400px;
      ">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📄</div>
        <h3 style="margin: 0 0 1rem 0; color: #1e293b;">PDF生成中...</h3>
        <p style="color: #64748b; margin: 0 0 1rem 0;">
          シナリオをPDF形式に変換しています
        </p>
        <div style="
          width: 100%;
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
        ">
          <div style="
            width: 50%;
            height: 100%;
            background: #3b82f6;
            animation: progress 2s ease-in-out infinite;
          "></div>
        </div>
      </div>
      
      <style>
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      </style>
    `;
    
    document.body.appendChild(progressOverlay);
  }

  hidePDFGenerationProgress() {
    const overlay = document.getElementById('pdf-generation-overlay');
    if (overlay) {
      overlay.remove();
    }
  }

  async downloadZIP() {
    if (!this.generatedScenario) return;

    try {
      const response = await fetch('/api/generate-zip-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          scenario: this.generatedScenario,
          title: `マーダーミステリー_${this.formData.participants}人用`,
          settings: this.formData
        })
      });

      if (!response.ok) throw new Error('ZIPパッケージ生成に失敗しました');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `murder_mystery_package_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('✅ ZIP パッケージダウンロード完了');
    } catch (error) {
      console.error('ZIP ダウンロードエラー:', error);
      alert('ZIPパッケージのダウンロードに失敗しました: ' + error.message);
    }
  }

  resetToStart() {
    this.currentStep = 1;
    this.formData = {};
    this.generatedScenario = null;

    // UI をリセット
    document.getElementById('result-container').classList.add('hidden');
    document.getElementById('error-container').classList.add('hidden');
    document.getElementById('main-card').classList.remove('hidden');

    // フォームをリセット
    const form = document.getElementById('scenario-form');
    if (form) {
      form.reset();
    }

    // 表示を更新
    this.updateStepDisplay();
    this.updateButtonStates();

    // トップにスクロール
    window.scrollTo({ top: 0, behavior: 'smooth' });

    console.log('🔄 アプリケーションリセット完了');
  }

  saveFormData() {
    try {
      localStorage.setItem('murder-mystery-form-data', JSON.stringify({
        ...this.formData,
        currentStep: this.currentStep,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.warn('フォームデータの保存に失敗:', error);
    }
  }

  restoreFormData() {
    try {
      const saved = localStorage.getItem('murder-mystery-form-data');
      if (saved) {
        const data = JSON.parse(saved);
        this.formData = data;
        
        // フォームフィールドに値を復元
        Object.entries(data).forEach(([key, value]) => {
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
    } catch (error) {
      console.warn('フォームデータの復元に失敗:', error);
    }
  }
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MurderMysteryApp();
});

export default MurderMysteryApp;