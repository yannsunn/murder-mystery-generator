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
    this.formData = {};
    this.sessionData = null;
    this.isGenerating = false;
    this.generationProgress = {
      currentPhase: 0,
      totalPhases: 9,
      status: 'waiting'
    };
    
    console.log('🚀 Ultra Integrated App - シンプル版初期化開始');
    this.init();
  }

  init() {
    try {
      console.log('🔍 シンプル版初期化開始 - DOM要素チェック');
      
      // 必須要素の存在確認（シンプル版）
      const requiredElements = [
        'scenario-form',
        'generate-btn',
        'loading-container',
        'result-container'
      ];
      
      const missingElements = requiredElements.filter(id => !document.getElementById(id));
      if (missingElements.length > 0) {
        console.error('❌ 必須要素が見つかりません:', missingElements);
      }
      
      this.setupEventListeners();
      this.setupUXEnhancements();
      
      // 生成モード初期化 - マイクロモードを標準に
      this.generationMode = 'micro';
      this.microApp = null;
      
      console.log('✅ Ultra Integrated App - シンプル版初期化完了');
      
      // 初期状態のデバッグ情報
      console.log('📊 初期状態:', {
        formElements: document.querySelectorAll('#scenario-form select').length,
        requiredFields: document.querySelectorAll('#scenario-form [required]').length
      });
      
    } catch (error) {
      console.error('❌ 初期化エラー:', error);
      if (uxEnhancer) {
        uxEnhancer.showToast('⚠️ アプリケーションの初期化に問題が発生しました', 'error', 5000);
      }
    }
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
    try {
      console.log('🔧 シンプル版イベントリスナー設定開始');
      
      // フォームとボタンの取得
      const formElement = document.getElementById('scenario-form');
      const generateBtn = document.getElementById('generate-btn');
      const newScenarioBtn = document.getElementById('new-scenario');
      
      if (!formElement) {
        console.error('❌ フォームが見つかりません');
        return;
      }
      
      // フォーム送信処理 - ページリロードを防ぐ
      formElement.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🚀 フォーム送信イベント受信');
        
        if (this.validateForm()) {
          this.generateScenario();
        }
      });
      
      // 生成ボタンの直接クリック処理
      if (generateBtn) {
        generateBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          console.log('🎯 生成ボタン直接クリック受信');
          
          if (this.validateForm()) {
            this.generateScenario();
          }
        });
      }
      
      // 新規シナリオボタン
      if (newScenarioBtn) {
        newScenarioBtn.addEventListener('click', () => this.resetApp());
      }
      
      // フォーム変更監視
      formElement.addEventListener('change', () => this.updateSummary());
      
      console.log('✅ イベントリスナー設定完了');
      
    } catch (error) {
      console.error('❌ イベントリスナー設定エラー:', error);
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
    console.log('🔍 goToNextStep called:', {
      currentStep: this.currentStep,
      totalSteps: this.totalSteps
    });
    
    if (this.currentStep < this.totalSteps) {
      // バリデーション
      console.log('📋 バリデーション開始');
      if (!this.validateForm()) {
        console.log('❌ バリデーション失敗');
        return;
      }
      console.log('✅ バリデーション成功');
      
      this.collectFormData();
      this.currentStep++;
      this.updateStepDisplay();
      this.updateButtonStates();
      
      console.log('📊 ステップ更新完了:', {
        newStep: this.currentStep,
        formData: this.formData
      });
      
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

  validateForm() {
    const formElement = document.getElementById('scenario-form');
    if (!formElement) {
      console.error('フォームが見つかりません');
      return false;
    }
    
    const requiredFields = formElement.querySelectorAll('[required]');
    console.log(`🔍 必須フィールド数: ${requiredFields.length}`);
    
    for (const field of requiredFields) {
      if (!field.value || field.value.trim() === '') {
        console.error(`❌ 必須フィールドが未入力: ${field.name || field.id}`);
        if (uxEnhancer) {
          uxEnhancer.showToast(`必須項目「${field.name || field.id}」を入力してください`, 'error', 3000);
        }
        field.focus();
        return false;
      }
    }
    
    console.log('✅ フォーム検証成功');
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

  // シンプル版フォームデータ収集
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
    this.formData.complexity = this.formData.complexity || 'standard';
    this.formData.motive = this.formData.motive || 'random';
    this.formData['victim-type'] = this.formData['victim-type'] || 'random';
    this.formData.weapon = this.formData.weapon || 'random';

    // チェックボックス（新しい名前に対応）
    const checkboxes = ['generate-images', 'detailed-handouts', 'gm-support'];
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
    console.log('🎯 生成開始ハンドラー呼び出し');
    
    // フォームバリデーション
    if (!this.validateForm()) {
      console.log('❌ フォームバリデーション失敗');
      return;
    }
    
    console.log('✅ フォームバリデーション成功');
    
    // マイクロモード専用に統一
    await this.startMicroGeneration();
  }
  
  // 🔬 統合マイクロ生成開始
  async startMicroGeneration() {
    if (this.isGenerating) return;

    console.log('🔬 Starting Integrated Micro Generation...');
    
    // 前のセッションデータを完全にクリア
    this.sessionData = null;
    window.currentSessionData = null;
    
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
      
      // より確実にユニークなセッションIDを生成
      const sessionId = `integrated_micro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('🔬 Starting staged generation with real-time progress...');
      
      // 🎯 段階的処理用のEventSourceを使用
      const eventSource = new EventSource('/api/integrated-micro-generator?' + new URLSearchParams({
        formData: JSON.stringify(this.formData),
        sessionId: sessionId
      }));
      
      let currentStep = 0;
      let finalSessionData = null;
      
      // Server-Sent Events リスナー
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 Received progress update:', data);
          
          if (data.step && data.content) {
            currentStep = data.step;
            
            // 進捗バー更新
            this.updateProgressBar(data.progress || 0);
            
            // フェーズ情報更新
            this.updatePhaseInfo(
              data.step, 
              data.totalSteps, 
              data.name || `段階${data.step}`
            );
            
            // 🎯 リアルタイムタブ更新: 段階完了時にセッションデータを更新
            if (window.currentSessionData) {
              // セッションデータに新しい段階情報を追加
              if (!window.currentSessionData.phases) {
                window.currentSessionData.phases = {};
              }
              
              window.currentSessionData.phases[`step${data.step}`] = {
                name: data.name,
                content: data.content,
                status: 'completed',
                completedAt: new Date().toISOString()
              };
              
              // 現在表示中のタブを更新
              const activeTab = document.querySelector('.tab-content[style*="block"]');
              if (activeTab) {
                const tabName = activeTab.id.replace('tab-', '');
                console.log(`🔄 Updating active tab: ${tabName}`);
                this.updateTabContent(tabName, window.currentSessionData);
              }
            }
            
            console.log(`✅ 段階${data.step}完了: ${data.name} (${data.progress}%)`);
            
            // UX強化: 段階完了通知
            if (uxEnhancer) {
              uxEnhancer.showToast(
                `段階${data.step}完了: ${data.name}`, 
                'info', 
                2000
              );
            }
          }
          
        } catch (parseError) {
          console.error('❌ Progress data parse error:', parseError);
        }
      };
      
      // 完了イベント
      eventSource.addEventListener('complete', (event) => {
        try {
          const finalResult = JSON.parse(event.data);
          console.log('🎉 All stages completed!', finalResult);
          
          finalSessionData = finalResult.sessionData;
          
          // 進捗を100%に設定
          this.updateProgressBar(100);
          this.updatePhaseInfo(9, 9, '生成完了');
          
          // UX強化: 生成完了通知
          if (uxEnhancer) {
            uxEnhancer.showToast('🎉 全段階完了！マーダーミステリー生成成功', 'success', 5000);
          }
          
          // 結果表示
          setTimeout(() => {
            this.showResults(finalSessionData);
          }, 1000);
          
          // EventSource終了
          eventSource.close();
          
        } catch (parseError) {
          console.error('❌ Final result parse error:', parseError);
        }
      });
      
      // エラーイベント
      eventSource.addEventListener('error', (event) => {
        console.error('❌ EventSource error:', event);
        
        // EventSourceが失敗した場合はPOSTフォールバックを試行
        if (!finalSessionData) {
          console.log('🔄 EventSource failed, trying POST fallback...');
          eventSource.close();
          
          // POSTフォールバックを実行
          this.fallbackToPostGeneration(sessionId, timeoutId);
          return;
        }
      });
      
      // 開始イベント
      eventSource.addEventListener('start', (event) => {
        console.log('🚀 Staged generation started');
        if (uxEnhancer) {
          uxEnhancer.showToast('🚀 段階的生成開始', 'info', 3000);
        }
      });
      
      // 代替: POSTリクエストによる段階的処理
      if (!window.EventSource) {
        console.log('⚠️ EventSource not supported, using POST fallback');
        
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

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                if (data.step && data.content) {
                  // 進捗更新処理（上記と同様）
                  this.updateProgressBar(data.progress || 0);
                  this.updatePhaseInfo(data.step, data.totalSteps, data.name);
                  
                  // リアルタイムタブ更新
                  this.updateTabsRealtime(data);
                }
              } catch (parseError) {
                console.error('❌ Chunk parse error:', parseError);
              }
            }
          }
        }
      }
      
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

  // 🔄 EventSource失敗時のPOSTフォールバック
  async fallbackToPostGeneration(sessionId, timeoutId) {
    try {
      console.log('🔄 Using POST fallback for staged generation...');
      
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
        console.error('❌ POST Fallback Error:', response.status, errorText);
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      // ストリーミングレスポンス読み取り
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 最後の不完全な行は保持
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.step && data.content) {
                // 進捗更新
                this.updateProgressBar(data.progress || 0);
                this.updatePhaseInfo(data.step, data.totalSteps, data.name);
                
                // リアルタイムタブ更新
                this.updateTabsRealtime(data);
                
                console.log(`✅ 段階${data.step}完了: ${data.name} (${data.progress}%)`);
                
                if (uxEnhancer) {
                  uxEnhancer.showToast(`段階${data.step}完了: ${data.name}`, 'info', 2000);
                }
              }
            } catch (parseError) {
              console.error('❌ Fallback parse error:', parseError);
            }
          } else if (line.startsWith('event: complete')) {
            // 次の行でデータを読み取り
          } else if (line.includes('"isComplete":true')) {
            try {
              const finalData = JSON.parse(line.substring(line.indexOf('{')));
              if (finalData.sessionData) {
                this.updateProgressBar(100);
                this.updatePhaseInfo(9, 9, '生成完了');
                
                if (uxEnhancer) {
                  uxEnhancer.showToast('🎉 全段階完了！マーダーミステリー生成成功', 'success', 5000);
                }
                
                setTimeout(() => {
                  this.showResults(finalData.sessionData);
                }, 1000);
                
                break;
              }
            } catch (parseError) {
              console.error('❌ Final parse error:', parseError);
            }
          }
        }
      }
      
      clearTimeout(timeoutId);
      
    } catch (fallbackError) {
      console.error('❌ POST Fallback failed:', fallbackError);
      
      this.stopProgressTimer();
      clearTimeout(timeoutId);
      
      if (uxEnhancer) {
        uxEnhancer.showToast('❌ 生成中にエラーが発生しました', 'error', 5000);
      }
      
      this.showError(fallbackError.message);
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
    
    // 進捗シミュレーション (完全段階的生成対応)
    const participantCount = parseInt(this.formData.participants) || 5;
    this.progressPhases = [
      { name: '🎲 段階0: ランダム全体構造生成', duration: 20 },
      { name: '🎨 段階1: 基本コンセプト精密化', duration: 30 },
      { name: '🔍 段階2: 事件核心・犯人・動機設定', duration: 35 },
      { name: '⏰ 段階3: 事件詳細・基本タイムライン', duration: 30 },
      { name: '👤 段階4-1: プレイヤー1 生成', duration: 25 },
      { name: '👤 段階4-2: プレイヤー2 生成', duration: 22 },
      { name: '👤 段階4-3: プレイヤー3 生成', duration: 22 },
      { name: '👤 段階4-4: プレイヤー4 生成', duration: 22 },
      ...(participantCount >= 5 ? [{ name: '👤 段階4-5: プレイヤー5 生成', duration: 22 }] : []),
      ...(participantCount >= 6 ? [{ name: '👤 段階4-6: プレイヤー6 生成', duration: 22 }] : []),
      ...(participantCount >= 7 ? [{ name: '👤 段階4-7: プレイヤー7 生成', duration: 22 }] : []),
      ...(participantCount >= 8 ? [{ name: '👤 段階4-8: プレイヤー8 生成', duration: 22 }] : []),
      { name: '🔗 段階4: 全体関係性調整', duration: 30 },
      { name: '🔍 段階5: 証拠配置・手がかり体系化', duration: 35 },
      { name: '🎓 段階6: GM進行ガイド作成', duration: 30 },
      { name: '🔧 段階7: 最終統合・つじつま調整', duration: 20 },
      { name: '🏆 段階8: 最終レビュー・総合調整完了', duration: 15 }
    ];
    
    this.updatePhaseInfo(1, this.progressPhases.length, this.progressPhases[0].name);
    
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
      this.updatePhaseInfo(this.currentPhase, this.progressPhases.length, this.progressPhases[phaseIndex].name);
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
      // グローバルセッションデータを保存
      window.currentSessionData = sessionData;
      window.app = this; // アプリインスタンスも保存
      
      // スケルトンローディングで段階的に表示
      if (skeletonLoader) {
        skeletonLoader.show('scenario-content', 'result');
        
        // 段階的にコンテンツを表示
        setTimeout(() => {
          skeletonLoader.hide('scenario-content');
          const summaryHtml = this.generateResultSummary(sessionData);
          contentEl.innerHTML = summaryHtml;
          contentEl.classList.add('skeleton-fade-in');
          
          // 初期タブ設定
          this.setupTabSystem();
        }, 600);
      } else {
        const summaryHtml = this.generateResultSummary(sessionData);
        contentEl.innerHTML = summaryHtml;
        
        // 初期タブ設定
        this.setupTabSystem();
      }
    }
  }
  
  // タブシステムのセットアップ
  setupTabSystem() {
    // タブボタンのイベントリスナー
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabName = e.target.getAttribute('onclick')?.match(/showTab\('(.+?)'\)/)?.[1];
        if (tabName) {
          e.preventDefault();
          this.showTab(tabName);
        }
      });
    });
  }
  
  // タブ表示（リアルタイム更新対応）
  showTab(tabName) {
    // 全タブを非表示
    document.querySelectorAll('.tab-content').forEach(content => {
      content.style.display = 'none';
    });
    
    // 全タブボタンを非アクティブ
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // 指定タブを表示
    const targetTab = document.getElementById(`tab-${tabName}`);
    const targetBtn = document.querySelector(`[onclick*="showTab('${tabName}')"]`);
    
    if (targetTab) {
      targetTab.style.display = 'block';
      
      // 現在のセッションデータでコンテンツを更新
      if (window.currentSessionData) {
        this.updateTabContent(tabName, window.currentSessionData);
      }
    }
    
    if (targetBtn) {
      targetBtn.classList.add('active');
    }
  }
  
  // タブコンテンツの動的更新
  updateTabContent(tabName, sessionData) {
    const tabElement = document.getElementById(`tab-${tabName}`);
    if (!tabElement) return;
    
    let content = '';
    
    switch(tabName) {
      case 'characters':
        content = this.generateCharactersContent(sessionData.phases, true);
        break;
      case 'timeline': 
        content = this.generateTimelineContent(sessionData.phases, true);
        break;
      case 'gm-guide':
        content = this.generateGMGuideContent(sessionData.phases, true);
        break;
      case 'scenario':
        content = this.generateScenarioContent(sessionData.phases, true);
        break;
      case 'overview':
        content = this.generateOverviewContent(sessionData, true);
        break;
      default:
        return;
    }
    
    // コンテンツ部分のみ更新（ヘッダーは保持）
    const contentSection = tabElement.querySelector('.characters-content, .timeline-content, .gm-guide-content, .scenario-full-content, .scenario-overview');
    if (contentSection) {
      contentSection.innerHTML = content;
    } else {
      // フォールバック: 全体更新
      const h4 = tabElement.querySelector('h4');
      const title = h4 ? h4.outerHTML : '';
      tabElement.innerHTML = title + '<div class="dynamic-content">' + content + '</div>';
    }
  }
  
  // リアルタイムタブ更新（段階完了時）
  updateTabsRealtime(stepData) {
    if (!window.currentSessionData) {
      // セッションデータが存在しない場合は初期化
      window.currentSessionData = {
        phases: {},
        formData: this.formData
      };
    }
    
    // 段階データを現在のセッションデータに統合
    if (stepData.step && stepData.content) {
      const stepKey = `step${stepData.step}`;
      window.currentSessionData.phases[stepKey] = {
        content: stepData.content,
        status: 'completed',
        name: stepData.name || `段階${stepData.step}`
      };
      
      console.log(`🔄 タブ更新: 段階${stepData.step}のデータを統合`);
      
      // 全てのタブコンテンツを更新（現在表示中でなくても準備）
      ['overview', 'scenario', 'characters', 'timeline', 'gm-guide'].forEach(tabName => {
        this.updateTabContent(tabName, window.currentSessionData);
      });
      
      // 視覚的フィードバック：タブボタンに更新インジケーターを追加
      this.addTabUpdateIndicator(stepData.step);
    }
  }
  
  // タブ更新インジケーター
  addTabUpdateIndicator(step) {
    // 段階に関連するタブを特定
    const stepTabMap = {
      1: ['overview', 'scenario'],
      2: ['scenario', 'gm-guide'],
      3: ['timeline', 'scenario'],
      4: ['characters'],
      5: ['timeline', 'scenario'],
      6: ['gm-guide', 'timeline'],
      7: ['scenario', 'gm-guide'],
      8: ['scenario', 'overview'],
      9: ['overview', 'scenario']
    };
    
    const relevantTabs = stepTabMap[step] || [];
    
    relevantTabs.forEach(tabName => {
      const tabButton = document.querySelector(`[onclick*="showTab('${tabName}')"]`);
      if (tabButton && !tabButton.classList.contains('active')) {
        // 更新インジケーターを追加
        tabButton.classList.add('updated');
        tabButton.style.position = 'relative';
        
        // 小さな更新ドット
        if (!tabButton.querySelector('.update-dot')) {
          const dot = document.createElement('span');
          dot.className = 'update-dot';
          dot.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            width: 8px;
            height: 8px;
            background: #43e97b;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
          `;
          tabButton.appendChild(dot);
          
          // 3秒後に自動削除
          setTimeout(() => {
            if (dot.parentNode) {
              dot.parentNode.removeChild(dot);
            }
            tabButton.classList.remove('updated');
          }, 3000);
        }
      }
    });
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

  // 美しいローディングコンテンツ生成
  generateLoadingContent(title, currentPhase, description) {
    return `
      <div class="loading-content-container">
        <div class="loading-header">
          <h4>${title}</h4>
          <div class="loading-status">
            <div class="loading-indicator">
              <div class="loading-spinner"></div>
              <span class="loading-text">生成中...</span>
            </div>
          </div>
        </div>
        
        <div class="loading-details">
          <div class="current-process">
            <h5>🔄 ${currentPhase}</h5>
            <p>${description}</p>
          </div>
          
          <div class="loading-progress">
            <div class="progress-bar-loading">
              <div class="progress-fill-loading"></div>
            </div>
            <div class="progress-text-loading">AI生成エンジン稼働中...</div>
          </div>
        </div>
        
        <div class="loading-tips">
          <h6>💡 このタブは生成完了時に自動更新されます</h6>
          <ul>
            <li>✨ プロフェッショナル品質で作成しています</li>
            <li>🎯 30分-1時間完結用に最適化</li>
            <li>🔄 他のタブも随時チェックしてください</li>
          </ul>
        </div>
      </div>
    `;
  }
  
  // 各コンテンツ生成メソッド
  generateOverviewContent(sessionData, isUpdate = false) {
    const formData = sessionData.formData || {};
    const phases = sessionData.phases || {};
    
    // 段階的生成の新しい構造からコンセプトを取得
    let concept = '';
    let title = 'マーダーミステリーシナリオ';
    
    // 段階0のランダム構造または段階1のコンセプトを探す
    if (phases.step1?.content) {
      const step1Content = phases.step1.content;
      if (typeof step1Content === 'object') {
        concept = step1Content.concept || step1Content.random_outline || '';
      } else {
        concept = step1Content;
      }
    }
    
    // 段階0のランダム構造も確認
    if (!concept && phases.step1?.content) {
      const step0Content = phases.step1.content;
      if (typeof step0Content === 'object') {
        concept = step0Content.random_outline || '';
      }
    }
    
    // タイトル抽出を試行
    const titleMatch = concept.match(/(?:作品タイトル|タイトル)[\s\S]*?[：:]\s*([^\n]+)/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    
    const completedSteps = Object.values(phases).filter(p => p.status === 'completed').length;
    
    return `
      <div class="overview-section">
        <div class="title-section">
          <h4 class="scenario-main-title">🎭 ${title}</h4>
          <p class="generation-status">✅ ${completedSteps}/9段階完了</p>
        </div>
        
        <h5>🎯 基本情報</h5>
        <ul>
          <li><strong>参加人数:</strong> ${formData.participants || 5}人</li>
          <li><strong>プレイ時間:</strong> ${formData.complexity === 'simple' ? '30分' : formData.complexity === 'complex' ? '60分' : '45分'}</li>
          <li><strong>時代背景:</strong> ${this.getDisplayText('era', formData.era)}</li>
          <li><strong>舞台設定:</strong> ${this.getDisplayText('setting', formData.setting)}</li>
          <li><strong>トーン:</strong> ${this.getDisplayText('tone', formData.tone)}</li>
        </ul>
        
        <h5>📝 生成されたコンセプト</h5>
        <div class="concept-preview">
          ${concept ? (concept.length > 800 ? concept.substring(0, 800) + '...' : concept) : '⚠️ コンセプトが生成されていません。'}
        </div>
        
        <h5>🔄 生成段階ステータス</h5>
        <div class="stages-status">
          ${Object.entries(phases).map(([stepKey, step]) => `
            <div class="stage-item ${step.status === 'completed' ? 'completed' : 'pending'}">
              <span class="stage-icon">${step.status === 'completed' ? '✅' : '⏳'}</span>
              <span class="stage-name">${step.name || stepKey}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  
  generateScenarioContent(phases, isUpdate = false) {
    console.log('🔍 Generating scenario content from phases:', phases);
    
    // 段階的生成の新しい構造に対応
    let scenarioContent = '';
    
    // 各段階のコンテンツを順番に表示
    Object.keys(phases).sort().forEach(stepKey => {
      const step = phases[stepKey];
      if (step && step.content && step.status === 'completed') {
        scenarioContent += `
          <div class="scenario-step">
            <h5 class="step-title">📋 ${step.name}</h5>
            <div class="step-content">
              ${this.formatStepContent(step.content)}
            </div>
          </div>
          <hr style="margin: 1.5rem 0; border-color: var(--primary-600);">
        `;
      }
    });
    
    if (!scenarioContent) {
      // 生成中の場合は美しいローディング表示
      if (this.isGenerating || !isUpdate) {
        return this.generateLoadingContent('📖 完全シナリオ', '段階1-8: 全体シナリオ統合中...', '9段階の生成プロセスを統合して完全なシナリオを構築しています');
      }
      return '<p class="no-content">⚠️ シナリオコンテンツが生成されていません。段階的生成を確認してください。</p>';
    }
    
    return `
      <div class="scenario-section">
        <div class="scenario-intro">
          <h4>🎯 完全生成シナリオ - 全9段階</h4>
          <p>以下は段階的生成システムによって作成された完全なマーダーミステリーシナリオです。</p>
        </div>
        ${scenarioContent}
      </div>
    `;
  }
  
  // 段階的生成コンテンツフォーマット
  formatStepContent(content) {
    if (typeof content === 'string') {
      return this.formatContent(content);
    }
    
    if (typeof content === 'object') {
      // オブジェクトの場合、各プロパティを表示
      let html = '';
      Object.entries(content).forEach(([key, value]) => {
        if (typeof value === 'string' && value.trim()) {
          html += `
            <div class="content-property">
              <h6 class="property-title">${this.formatPropertyName(key)}</h6>
              <div class="property-content">${this.formatContent(value)}</div>
            </div>
          `;
        }
      });
      return html || this.formatContent(JSON.stringify(content, null, 2));
    }
    
    return this.formatContent(String(content));
  }
  
  formatPropertyName(key) {
    const nameMap = {
      'random_outline': '🎲 ランダム全体構造',
      'concept': '🎨 基本コンセプト',
      'incident_core': '🔍 事件の核心',
      'incident_details': '⏰ 事件詳細',
      'characters': '👤 キャラクター設計',
      'evidence_system': '🔍 証拠システム',
      'gamemaster_guide': '🎓 GM進行ガイド',
      'final_integration': '🏆 最終統合',
      'comprehensive_review': '🏆 総合レビュー'
    };
    return nameMap[key] || key.replace(/_/g, ' ').toUpperCase();
  }

  generateCharactersContent(phases, isUpdate = false) {
    console.log('🔍 Generating characters content from phases:', phases);
    
    // 段階4のキャラクター情報を探す
    const step4 = phases.step4;
    if (!step4 || !step4.content) {
      // 生成中の場合は美しいローディング表示
      if (this.isGenerating || !isUpdate) {
        return this.generateLoadingContent('🎭 キャラクター詳細', '段階4: キャラクター生成中...', 'プロフェッショナル品質のキャラクターハンドアウトを作成しています');
      }
      return '<p class="no-content">⚠️ キャラクター情報が段階4で生成されていません。段階的生成を確認してください。</p>';
    }
    
    let characters = '';
    let characterRelationships = '';
    let characterList = [];
    
    // 段階4のコンテンツ構造を正確に解析
    if (typeof step4.content === 'object') {
      // 新しい構造に対応
      if (step4.content.characters) {
        characters = step4.content.characters;
      }
      if (step4.content.character_relationships) {
        characterRelationships = step4.content.character_relationships;
      }
      if (step4.content.character_list) {
        characterList = step4.content.character_list;
      }
    } else if (typeof step4.content === 'string') {
      characters = step4.content;
    }
    
    if (!characters || characters.trim() === '') {
      return '<p class="no-content">⚠️ キャラクター詳細が空です。段階4の生成を確認してください。</p>';
    }
    
    console.log('✅ Characters found:', characters.substring(0, 200));
    console.log('✅ Character relationships found:', characterRelationships ? 'Yes' : 'No');
    console.log('✅ Character list:', characterList);
    
    // キャラクターリストがある場合は、個別のハンドアウトとして表示
    let formattedContent = '';
    
    if (characterList && characterList.length > 0) {
      // キャラクターごとにセクションを作成
      const handouts = characters.split('---').filter(h => h.trim());
      
      formattedContent = `
        <div class="character-handouts-container">
          ${handouts.map((handout, index) => {
            const playerInfo = characterList[index] || { name: `プレイヤー${index + 1}`, playerId: index + 1 };
            return `
              <div class="character-handout-section" id="handout-player-${playerInfo.playerId}">
                <h5 class="handout-title">🎭 ${playerInfo.name} (プレイヤー${playerInfo.playerId})</h5>
                <div class="handout-content">
                  ${this.formatContent(handout)}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      // 関係性情報も追加
      if (characterRelationships) {
        formattedContent += `
          <div class="relationships-section">
            <h5>🔗 キャラクター関係図</h5>
            <div class="relationships-content">
              ${this.formatContent(characterRelationships)}
            </div>
          </div>
        `;
      }
    } else {
      // 従来のフォーマット
      formattedContent = this.formatContent(characters);
    }
    
    return `
      <div class="characters-section">
        <div class="characters-intro">
          <h4>🎭 プレイヤーハンドアウト完全版</h4>
          <p>各プレイヤーに配布する個別ハンドアウトです。それぞれのプレイヤーには自分の情報のみを渡してください。</p>
        </div>
        <div class="characters-content">
          ${formattedContent}
        </div>
      </div>
    `;
  }

  generateTimelineContent(phases, isUpdate = false) {
    console.log('🔍 Generating timeline content from phases:', phases);
    
    // タイムライン情報を複数の段階から統合的に取得
    const step3 = phases.step3; // 事件詳細・基本タイムライン
    const step5 = phases.step5; // 証拠配置・手がかり体系化
    const step6 = phases.step6; // GM進行ガイド（進行管理含む）
    
    // 生成中の場合は美しいローディング表示
    if (this.isGenerating && (!step3 || !step5 || !step6)) {
      return this.generateLoadingContent('⏱ タイムライン', '段階3,5,6: 統合タイムライン構築中...', '事件・証拠・進行の3層タイムラインを統合して作成しています');
    }
    
    let timelineContent = '';
    let incidentTimeline = '';
    let evidenceTimeline = '';
    let sessionTimeline = '';
    
    // 段階3: 事件タイムライン
    if (step3 && step3.content) {
      if (typeof step3.content === 'object' && step3.content.incident_details) {
        incidentTimeline = step3.content.incident_details;
      } else if (typeof step3.content === 'string') {
        incidentTimeline = step3.content;
      }
    }
    
    // 段階5: 証拠・調査タイムライン
    if (step5 && step5.content) {
      if (typeof step5.content === 'object' && step5.content.evidence_system) {
        evidenceTimeline = step5.content.evidence_system;
      } else if (typeof step5.content === 'string') {
        evidenceTimeline = step5.content;
      }
    }
    
    // 段階6: セッション進行タイムライン（GMガイドから抽出）
    if (step6 && step6.content) {
      let gmContent = '';
      if (typeof step6.content === 'object' && step6.content.gamemaster_guide) {
        gmContent = step6.content.gamemaster_guide;
      } else if (typeof step6.content === 'string') {
        gmContent = step6.content;
      }
      
      // GMガイドから進行管理部分を抽出
      const timelineMatches = gmContent.match(/##\s*30分-1時間完全進行[\s\S]*?(?=##|$)/i);
      if (timelineMatches) {
        sessionTimeline = timelineMatches[0];
      }
    }
    
    // 統合的なタイムラインコンテンツを構築
    let combinedContent = '';
    
    if (sessionTimeline) {
      combinedContent += `
        <div class="timeline-segment">
          <h5>📋 セッション進行タイムライン</h5>
          ${this.formatContent(sessionTimeline)}
        </div>
      `;
    }
    
    if (incidentTimeline) {
      // 事件タイムライン部分のみを抽出
      const eventTimelineMatch = incidentTimeline.match(/##\s*事件.*?タイムライン[\s\S]*?(?=##|$)/i);
      if (eventTimelineMatch) {
        combinedContent += `
          <div class="timeline-segment">
            <h5>🕐 事件タイムライン</h5>
            ${this.formatContent(eventTimelineMatch[0])}
          </div>
        `;
      }
    }
    
    if (evidenceTimeline) {
      // 段階別証拠公開タイミングを抽出
      const evidenceTimelineMatch = evidenceTimeline.match(/##\s*.*?段階別.*?公開[\s\S]*?(?=##|$)/i);
      if (evidenceTimelineMatch) {
        combinedContent += `
          <div class="timeline-segment">
            <h5>🔍 証拠公開タイムライン</h5>
            ${this.formatContent(evidenceTimelineMatch[0])}
          </div>
        `;
      }
    }
    
    if (!combinedContent) {
      // フォールバック: 利用可能なコンテンツを表示
      timelineContent = incidentTimeline || evidenceTimeline || sessionTimeline || '';
      
      if (!timelineContent) {
        // 生成中の場合は美しいローディング表示
        if (this.isGenerating || !isUpdate) {
          return this.generateLoadingContent('⏱ セッション進行管理', '段階3-6: 進行システム構築中...', '30分-1時間完結用の効率的なタイムラインを作成しています');
        }
        return '<p class="no-content">⚠️ 進行管理情報が生成されていません。段階3、5、6を確認してください。</p>';
      }
      
      combinedContent = this.formatContent(timelineContent);
    }
    
    console.log('✅ Timeline content assembled from multiple sources');
    
    return `
      <div class="timeline-section">
        <div class="timeline-intro">
          <h4>⏱ セッション進行管理・タイムライン</h4>
          <p>30分-1時間セッションの効率的な進行のためのタイムラインです。</p>
        </div>
        <div class="timeline-content">
          ${combinedContent}
        </div>
      </div>
    `;
  }
  
  generateGMGuideContent(phases, isUpdate = false) {
    console.log('🔍 Generating GM guide content from phases:', phases);
    
    // GMガイドを複数の段階から統合的に構築
    const step2 = phases.step2; // 事件核心・犯人・動機
    const step6 = phases.step6; // GM進行ガイド・セッション管理
    const step7 = phases.step7; // 統合・品質確認
    
    if (!step6 || !step6.content) {
      // 生成中の場合は美しいローディング表示
      if (this.isGenerating || !isUpdate) {
        return this.generateLoadingContent('🎓 ゲームマスター完全マニュアル', '段階6: GM進行ガイド作成中...', 'プロフェッショナルなセッション運営マニュアルを構築しています');
      }
      return '<p class="no-content">⚠️ GMガイド情報が段階6で生成されていません。段階的生成を確認してください。</p>';
    }
    
    let gmGuide = '';
    let incidentCore = '';
    let finalIntegration = '';
    
    // 段階2: 事件の核心情報（GMのみが知る真相）
    if (step2 && step2.content) {
      if (typeof step2.content === 'object' && step2.content.incident_core) {
        incidentCore = step2.content.incident_core;
      } else if (typeof step2.content === 'string') {
        incidentCore = step2.content;
      }
    }
    
    // 段階6: GM進行ガイド
    if (typeof step6.content === 'object' && step6.content.gamemaster_guide) {
      gmGuide = step6.content.gamemaster_guide;
    } else if (typeof step6.content === 'string') {
      gmGuide = step6.content;
    }
    
    // 段階7: 最終統合情報
    if (step7 && step7.content) {
      if (typeof step7.content === 'object' && step7.content.final_integration) {
        finalIntegration = step7.content.final_integration;
      } else if (typeof step7.content === 'string') {
        finalIntegration = step7.content;
      }
    }
    
    if (!gmGuide || gmGuide.trim() === '') {
      // 生成中の場合は美しいローディング表示
      if (this.isGenerating || !isUpdate) {
        return this.generateLoadingContent('🎓 ゲームマスター完全マニュアル', '段階6: GM進行ガイド詳細化中...', 'セッション成功のための実用的ガイドを作成しています');
      }
      return '<p class="no-content">⚠️ GMガイド詳細が空です。段階6の生成を確認してください。</p>';
    }
    
    console.log('✅ GM Guide assembled from multiple sources');
    
    // 統合的なGMガイドを構築
    let combinedContent = `
      <div class="gm-critical-info">
        <h5>🔒 GM専用情報（プレイヤーには絶対に見せないでください）</h5>
      </div>
    `;
    
    // 事件の真相（GM専用）
    if (incidentCore) {
      combinedContent += `
        <div class="gm-truth-section">
          <h5>💀 事件の真相と核心</h5>
          <div class="gm-truth-content">
            ${this.formatContent(incidentCore)}
          </div>
        </div>
      `;
    }
    
    // GM進行ガイド本体
    combinedContent += `
      <div class="gm-guide-main">
        <h5>📋 セッション進行完全ガイド</h5>
        <div class="gm-guide-content">
          ${this.formatContent(gmGuide)}
        </div>
      </div>
    `;
    
    // 最終チェックリスト
    if (finalIntegration) {
      const checklistMatch = finalIntegration.match(/##\s*.*?チェック[\s\S]*?(?=##|$)/i);
      if (checklistMatch) {
        combinedContent += `
          <div class="gm-checklist-section">
            <h5>✅ 最終品質チェックリスト</h5>
            <div class="gm-checklist-content">
              ${this.formatContent(checklistMatch[0])}
            </div>
          </div>
        `;
      }
    }
    
    return `
      <div class="gm-guide-section">
        <div class="gm-guide-intro">
          <h4>🎓 ゲームマスター完全マニュアル</h4>
          <p>このセクションはGM専用です。プレイヤーには見せないでください。</p>
          <p class="gm-warning">⚠️ ネタバレ注意：事件の真相、犯人、トリックがすべて記載されています。</p>
        </div>
        ${combinedContent}
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
    
    // より高度なマークダウン処理
    let formatted = content;
    
    // コードブロックの保護
    const codeBlocks = [];
    formatted = formatted.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`;
    });
    
    // マークダウン変換
    formatted = formatted
      .replace(/#### (.*?)\n/g, '<h6>$1</h6>\n')
      .replace(/### (.*?)\n/g, '<h5>$1</h5>\n')
      .replace(/## (.*?)\n/g, '<h4>$1</h4>\n')
      .replace(/# (.*?)\n/g, '<h3>$1</h3>\n')
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*?)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n)+/g, '<ul>$&</ul>\n')
      .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n)+/g, (match) => {
        if (match.includes('<ul>')) return match;
        return '<ol>' + match + '</ol>\n';
      })
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^>\s*(.*)$/gm, '<blockquote>$1</blockquote>')
      .replace(/---/g, '<hr>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // コードブロックの復元
    codeBlocks.forEach((block, index) => {
      const code = block.replace(/```(\w+)?\n?([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>');
      formatted = formatted.replace(`__CODE_BLOCK_${index}__`, code);
    });
    
    // 段落処理
    if (!formatted.startsWith('<')) {
      formatted = '<p>' + formatted;
    }
    if (!formatted.endsWith('>')) {
      formatted = formatted + '</p>';
    }
    
    // 連続する改行やタグの整理
    formatted = formatted
      .replace(/<p><h/g, '<h')
      .replace(/<\/h(\d)><\/p>/g, '</h$1>')
      .replace(/<p><ul>/g, '<ul>')
      .replace(/<\/ul><\/p>/g, '</ul>')
      .replace(/<p><ol>/g, '<ol>')
      .replace(/<\/ol><\/p>/g, '</ol>')
      .replace(/<p><blockquote>/g, '<blockquote>')
      .replace(/<\/blockquote><\/p>/g, '</blockquote>')
      .replace(/<p><hr><\/p>/g, '<hr>')
      .replace(/<br><br>/g, '<br>')
      .replace(/<p><\/p>/g, '');
    
    return formatted;
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

// グローバル関数の実装
window.showTab = function(tabName) {
  if (window.app && typeof window.app.showTab === 'function') {
    window.app.showTab(tabName);
  } else {
    console.warn('App instance not found or showTab method not available');
  }
};

window.copyScenarioText = function() {
  try {
    if (!window.currentSessionData) {
      alert('シナリオデータが見つかりません。');
      return;
    }
    
    const phases = window.currentSessionData.phases || {};
    let fullText = '# マーダーミステリーシナリオ - 完全版\n\n';
    
    // 各段階のコンテンツを順番に結合
    Object.keys(phases).sort().forEach(stepKey => {
      const step = phases[stepKey];
      if (step && step.content && step.status === 'completed') {
        fullText += `## ${step.name}\n\n`;
        if (typeof step.content === 'object') {
          Object.entries(step.content).forEach(([key, value]) => {
            if (typeof value === 'string' && value.trim()) {
              fullText += `### ${key.replace(/_/g, ' ').toUpperCase()}\n${value}\n\n`;
            }
          });
        } else {
          fullText += `${step.content}\n\n`;
        }
        fullText += '---\n\n';
      }
    });
    
    navigator.clipboard.writeText(fullText).then(() => {
      if (window.uxEnhancer) {
        window.uxEnhancer.showToast('📋 シナリオ全体をクリップボードにコピーしました', 'success', 3000);
      } else {
        alert('シナリオ全体をクリップボードにコピーしました！');
      }
    }).catch(err => {
      console.error('コピーに失敗:', err);
      alert('コピーに失敗しました。手動でテキストを選択してください。');
    });
  } catch (error) {
    console.error('copyScenarioText error:', error);
    alert('コピー中にエラーが発生しました。');
  }
};

window.copyTabContent = function() {
  try {
    const activeTab = document.querySelector('.tab-content[style*="block"]');
    if (!activeTab) {
      alert('アクティブなタブが見つかりません。');
      return;
    }
    
    const tabContent = activeTab.innerText || activeTab.textContent;
    navigator.clipboard.writeText(tabContent).then(() => {
      if (window.uxEnhancer) {
        window.uxEnhancer.showToast('📄 表示中タブの内容をコピーしました', 'success', 3000);
      } else {
        alert('表示中タブの内容をクリップボードにコピーしました！');
      }
    }).catch(err => {
      console.error('タブコピーに失敗:', err);
      alert('コピーに失敗しました。');
    });
  } catch (error) {
    console.error('copyTabContent error:', error);
    alert('タブのコピー中にエラーが発生しました。');
  }
};

window.saveAsText = function() {
  try {
    if (!window.currentSessionData) {
      alert('シナリオデータが見つかりません。');
      return;
    }
    
    const phases = window.currentSessionData.phases || {};
    let fullText = 'マーダーミステリーシナリオ - 完全版\n';
    fullText += '=' * 50 + '\n\n';
    
    // タイトル抽出
    const step1 = phases.step1;
    if (step1?.content?.concept) {
      const titleMatch = step1.content.concept.match(/## 作品タイトル[\s\S]*?\n([^\n]+)/);
      if (titleMatch) {
        fullText += `作品タイトル: ${titleMatch[1].trim()}\n`;
      }
    }
    
    fullText += `生成日時: ${new Date().toLocaleString('ja-JP')}\n`;
    fullText += `参加人数: ${window.currentSessionData.formData?.participants || '5'}人\n\n`;
    
    // 各段階のコンテンツを追加
    Object.keys(phases).sort().forEach(stepKey => {
      const step = phases[stepKey];
      if (step && step.content && step.status === 'completed') {
        fullText += `${step.name}\n${'='.repeat(step.name.length)}\n\n`;
        if (typeof step.content === 'object') {
          Object.entries(step.content).forEach(([key, value]) => {
            if (typeof value === 'string' && value.trim()) {
              fullText += `${key.replace(/_/g, ' ').toUpperCase()}\n${'-'.repeat(key.length)}\n${value}\n\n`;
            }
          });
        } else {
          fullText += `${step.content}\n\n`;
        }
        fullText += '\n';
      }
    });
    
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `マーダーミステリー_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    if (window.uxEnhancer) {
      window.uxEnhancer.showToast('💾 テキストファイルとして保存しました', 'success', 3000);
    } else {
      alert('テキストファイルとして保存しました！');
    }
  } catch (error) {
    console.error('saveAsText error:', error);
    alert('ファイル保存中にエラーが発生しました。');
  }
};

window.searchContent = function() {
  const searchInput = document.getElementById('content-search');
  if (!searchInput) return;
  
  const searchTerm = searchInput.value.trim().toLowerCase();
  if (!searchTerm) {
    alert('検索キーワードを入力してください。');
    return;
  }
  
  // アクティブなタブ内を検索
  const activeTab = document.querySelector('.tab-content[style*="block"]');
  if (!activeTab) {
    alert('検索可能なタブが見つかりません。');
    return;
  }
  
  // 既存のハイライトをクリア
  clearSearch();
  
  const walker = document.createTreeWalker(
    activeTab,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );
  
  let matches = 0;
  const textNodes = [];
  let node;
  
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  
  textNodes.forEach(textNode => {
    const text = textNode.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      const regex = new RegExp(`(${searchTerm})`, 'gi');
      const highlightedText = textNode.textContent.replace(regex, '<mark class="search-highlight">$1</mark>');
      
      const wrapper = document.createElement('span');
      wrapper.innerHTML = highlightedText;
      textNode.parentNode.replaceChild(wrapper, textNode);
      matches++;
    }
  });
  
  if (matches > 0) {
    if (window.uxEnhancer) {
      window.uxEnhancer.showToast(`🔍 ${matches}件の検索結果が見つかりました`, 'info', 3000);
    } else {
      alert(`${matches}件の検索結果が見つかりました。`);
    }
    
    // 最初の結果にスクロール
    const firstHighlight = activeTab.querySelector('.search-highlight');
    if (firstHighlight) {
      firstHighlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } else {
    if (window.uxEnhancer) {
      window.uxEnhancer.showToast('🔍 検索結果が見つかりませんでした', 'warning', 3000);
    } else {
      alert('検索結果が見つかりませんでした。');
    }
  }
};

window.clearSearch = function() {
  // 検索ハイライトをクリア
  document.querySelectorAll('.search-highlight').forEach(highlight => {
    const parent = highlight.parentNode;
    parent.replaceChild(document.createTextNode(highlight.textContent), highlight);
    parent.normalize();
  });
  
  // 検索フィールドをクリア
  const searchInput = document.getElementById('content-search');
  if (searchInput) {
    searchInput.value = '';
  }
};

window.applyFilter = function() {
  const filterSelect = document.getElementById('content-filter');
  if (!filterSelect) return;
  
  const filterValue = filterSelect.value;
  const activeTab = document.querySelector('.tab-content[style*="block"]');
  if (!activeTab) return;
  
  // フィルターロジックを実装（必要に応じて拡張）
  if (window.uxEnhancer) {
    window.uxEnhancer.showToast(`🎯 フィルター適用: ${filterValue}`, 'info', 2000);
  }
};

window.openImageModal = function(url, description) {
  // 画像モーダルを開く（簡易実装）
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8); z-index: 10000; display: flex;
    align-items: center; justify-content: center; cursor: pointer;
  `;
  
  const img = document.createElement('img');
  img.src = url;
  img.alt = description;
  img.style.cssText = 'max-width: 90%; max-height: 90%; border-radius: 8px;';
  
  modal.appendChild(img);
  modal.onclick = () => document.body.removeChild(modal);
  
  document.body.appendChild(modal);
};

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
  window.app = new UltraIntegratedApp();
  window.ultraIntegratedApp = window.app; // 後方互換性のため
});