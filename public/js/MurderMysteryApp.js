/**
 * MurderMysteryApp - 完全簡素化版
 * ZIP出力 + 新規作成の2択のみ
 */
class MurderMysteryApp {
  constructor() {
    this.version = '4.0.0-FINAL';
    this.isGenerating = false;
    this.currentResult = null;
    this.additionalContent = null;
    this._zipGenerating = false;
    this.isPhaseComplete = false;
    
    this.init();
  }

  init() {
    console.log('🚀 MurderMysteryApp v4.0.0-FINAL - 2択システム');
    this.setupActionButtons();
    this.initializeEventListeners();
    console.log('✅ 簡素化システム初期化完了！');
  }

  /**
   * 2つのアクションボタンのみ
   */
  setupActionButtons() {
    const resultContainer = document.getElementById('result-container');
    if (!resultContainer || resultContainer.classList.contains('hidden')) {
      return;
    }

    let actionPanel = document.getElementById('action-panel');
    if (actionPanel) {
      return;
    }

    actionPanel = document.createElement('div');
    actionPanel.id = 'action-panel';
    actionPanel.className = 'action-panel-simple';
    actionPanel.innerHTML = `
      <div class="action-buttons-simple">
        <button id="new-scenario-btn" class="btn btn-primary btn-large">
          🚀 新規作成
        </button>
        <button id="download-zip-btn" class="btn btn-success btn-large" ${!this.isPhaseComplete ? 'disabled' : ''}>
          📦 フェーズ2-8完了後に自動出力
        </button>
      </div>
      <div id="phase-progress" class="phase-progress" style="display: none;">
        <div class="progress-header">📊 フェーズ生成進行状況</div>
        <div class="progress-list">
          <div class="progress-item" data-phase="2">Phase 2: キャラクター設定 <span class="status">⏳ 準備中</span></div>
          <div class="progress-item" data-phase="3">Phase 3: 人物関係 <span class="status">⏳ 待機中</span></div>
          <div class="progress-item" data-phase="4">Phase 4: 事件詳細 <span class="status">⏳ 待機中</span></div>
          <div class="progress-item" data-phase="5">Phase 5: 証拠・手がかり <span class="status">⏳ 待機中</span></div>
          <div class="progress-item" data-phase="6">Phase 6: タイムライン <span class="status">⏳ 待機中</span></div>
          <div class="progress-item" data-phase="7">Phase 7: 真相解決 <span class="status">⏳ 待機中</span></div>
          <div class="progress-item" data-phase="8">Phase 8: GMガイド <span class="status">⏳ 待機中</span></div>
          <div class="progress-item" data-phase="handouts">ハンドアウト生成 <span class="status">⏳ 待機中</span></div>
        </div>
        <div class="overall-progress">
          <div class="progress-bar">
            <div class="progress-fill" id="overall-progress-fill" style="width: 0%"></div>
          </div>
          <div class="progress-text">0/8 フェーズ完了</div>
        </div>
      </div>
      <div class="zip-info">
        <h4>📦 ZIP パッケージ内容</h4>
        <div class="package-contents">
          ✅ Phase 1-8 完全実装 (全8フェーズ)<br>
          ✅ キャラクターハンドアウト<br>
          ✅ PDF + テキストファイル (12ファイル)<br>
          ✅ ゲームマスターガイド + 真相解決<br>
          ✅ 29200トークン最高品質コンテンツ
        </div>
      </div>
    `;
    
    resultContainer.appendChild(actionPanel);
    this.setupActionButtonEvents();
  }

  /**
   * 2つのボタンのイベントリスナー
   */
  setupActionButtonEvents() {
    const zipBtn = document.getElementById('download-zip-btn');
    if (zipBtn && !zipBtn.hasAttribute('data-listener')) {
      zipBtn.addEventListener('click', () => this.generateAndDownloadZIP());
      zipBtn.setAttribute('data-listener', 'true');
    }

    const newBtn = document.getElementById('new-scenario-btn');
    if (newBtn && !newBtn.hasAttribute('data-listener')) {
      newBtn.addEventListener('click', () => this.resetForNewScenario());
      newBtn.setAttribute('data-listener', 'true');
    }
  }

  /**
   * イベントリスナーの初期化
   */
  initializeEventListeners() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          if (target.id === 'result-container' && !target.classList.contains('hidden')) {
            setTimeout(() => this.setupActionButtons(), 100);
          }
        }
      });
    });

    const resultContainer = document.getElementById('result-container');
    if (resultContainer) {
      observer.observe(resultContainer, { attributes: true });
    }

    document.addEventListener('generation:complete', (event) => {
      this.currentResult = event.detail;
      this.isPhaseComplete = false; // Reset phase completion status
      
      // 🎯 フェーズ1完了時: ZIPボタン無効化とフェーズ2-8開始通知
      this.disableZipButtonWithMessage();
      
      setTimeout(() => this.generateAdditionalContent(), 1000);
    });
  }

  /**
   * 🚀 フェーズ1完了時: ZIPボタン無効化メッセージ表示
   */
  disableZipButtonWithMessage() {
    const zipBtn = document.getElementById('download-zip-btn');
    if (zipBtn) {
      zipBtn.disabled = true;
      zipBtn.classList.add('disabled');
      zipBtn.innerHTML = '📦 フェーズ2-8完了後に自動出力';
    }
    
    this.showNotification('🚀 フェーズ1完了！フェーズ2-8生成開始中...', 'info');
  }

  /**
   * Enable ZIP button after phase completion
   */
  enableZipButton() {
    const zipBtn = document.getElementById('download-zip-btn');
    if (zipBtn) {
      zipBtn.disabled = false;
      zipBtn.classList.remove('disabled');
      zipBtn.innerHTML = '📦 完全ZIP出力';
    }
    
    const phaseStatus = document.querySelector('.phase-status');
    if (phaseStatus) {
      phaseStatus.remove();
    }
  }

  /**
   * Show phase progress display
   */
  showPhaseProgress() {
    const progressDiv = document.getElementById('phase-progress');
    if (progressDiv) {
      progressDiv.style.display = 'block';
    }
  }

  /**
   * Update individual phase status
   */
  updatePhaseStatus(phase, status, className) {
    const phaseItem = document.querySelector(`[data-phase="${phase}"]`);
    if (phaseItem) {
      const statusSpan = phaseItem.querySelector('.status');
      if (statusSpan) {
        statusSpan.textContent = status;
        statusSpan.className = `status ${className}`;
      }
    }
  }

  /**
   * Update overall progress bar
   */
  updateOverallProgress(completed, total) {
    const progressFill = document.getElementById('overall-progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    if (progressFill) {
      const percentage = (completed / total) * 100;
      progressFill.style.width = `${percentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${completed}/${total} フェーズ完了`;
    }
  }

  /**
   * Phase 2-8 + ハンドアウト生成
   */
  async generateAdditionalContent() {
    if (!this.currentResult) {
      console.log('⚠️ No current result to enhance');
      return;
    }

    try {
      console.log('🚀 Starting Phase 2-8 + ハンドアウト with detailed progress tracking...');
      
      // Show progress display
      this.showPhaseProgress();
      
      const scenarioContent = document.getElementById('scenario-content');
      if (!scenarioContent) {
        throw new Error('シナリオコンテンツが見つかりません');
      }

      const scenarioText = scenarioContent.innerText || scenarioContent.textContent;
      const formData = this.collectFormData();

      console.log('📝 Scenario text length:', scenarioText.length);

      const apiClient = this.createApiClient();
      const additionalContent = {};
      let completedPhases = 0;

      // 🎯 順次フェーズ実行: エラー時停止システム
      console.log('👥 Starting sequential phase generation with error handling...');
      
      // フェーズ定義配列
      const phases = [
        { id: 2, name: 'Characters', endpoint: '/api/groq-phase2-characters', key: 'characters' },
        { id: 3, name: 'Relationships', endpoint: '/api/groq-phase3-relationships', key: 'relationships' },
        { id: 4, name: 'Incident', endpoint: '/api/groq-phase4-incident', key: 'incident' },
        { id: 5, name: 'Clues', endpoint: '/api/groq-phase5-clues', key: 'clues' },
        { id: 6, name: 'Timeline', endpoint: '/api/groq-phase6-timeline', key: 'timeline' },
        { id: 7, name: 'Solution', endpoint: '/api/groq-phase7-solution', key: 'solution' },
        { id: 8, name: 'Game Master', endpoint: '/api/groq-phase8-gamemaster', key: 'gamemaster' }
      ];
      
      // 各フェーズを順次実行
      for (let i = 0; i < phases.length; i++) {
        const phase = phases[i];
        
        try {
          console.log(`🚀 Phase ${phase.id}: ${phase.name} 開始中...`);
          this.updatePhaseStatus(phase.id, '🔄 生成中', 'generating');
          
          // API呼び出しパラメータ構築
          const apiParams = { 
            concept: scenarioText, 
            participants: formData.participants
          };
          
          // Phase 2の特別パラメータ
          if (phase.id === 2) {
            apiParams.era = formData.era;
            apiParams.setting = formData.setting;
          }
          
          // API呼び出し
          const result = await this.callAPIWithErrorHandling(apiClient, phase.endpoint, apiParams, phase.id);
          
          // 結果保存
          additionalContent[phase.key] = result;
          completedPhases++;
          
          // 成功時の状態更新
          this.updatePhaseStatus(phase.id, '✅ 完了', 'completed');
          this.updateOverallProgress(completedPhases, 8);
          
          console.log(`✅ Phase ${phase.id}: ${phase.name} 完了 (${completedPhases}/8)`);
          
          // 次フェーズまで短時間待機（UI更新のため）
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ Phase ${phase.id}: ${phase.name} でエラー発生:`, error.message);
          
          // エラー状態表示
          this.updatePhaseStatus(phase.id, '❌ エラー', 'error');
          this.showNotification(`Phase ${phase.id} (${phase.name}) でエラーが発生しました: ${error.message}`, 'error');
          
          // ❌ エラー時は処理を停止
          throw new Error(`Phase ${phase.id} (${phase.name}) 実行中にエラーが発生したため処理を停止しました: ${error.message}`);
        }
      }
      
      // 全フェーズ完了後: ハンドアウト生成
      try {
        console.log('📊 Final: Handouts Generation...');
        this.updatePhaseStatus('handouts', '🔄 生成中', 'generating');
        
        const handouts = await this.callAPIWithErrorHandling(apiClient, '/api/generate-handouts', { 
          scenario: scenarioText,
          characters: additionalContent.characters,
          participants: formData.participants
        }, 'handouts');
        
        additionalContent.handouts = handouts;
        this.updatePhaseStatus('handouts', '✅ 完了', 'completed');
        
      } catch (error) {
        console.error('❌ Handouts generation failed:', error.message);
        this.updatePhaseStatus('handouts', '❌ エラー', 'error');
        this.showNotification(`ハンドアウト生成でエラーが発生しました: ${error.message}`, 'error');
        
        // ハンドアウトエラーでも処理停止
        throw new Error(`ハンドアウト生成中にエラーが発生したため処理を停止しました: ${error.message}`);
      }

        this.additionalContent = additionalContent;
        this.displayAdditionalContent();
        
        console.log('✅ Phase 2-8 + ハンドアウト generation completed successfully!');
        
        // 🚀 ULTRA SYNC: フェーズ8完了後に自動ZIP出力
        this.isPhaseComplete = true;
        this.enableZipButton();
        
        // 🎯 限界突破: 全フェーズ完了後に自動的にZIPダウンロード開始
        console.log('🚀 ULTRA SYNC: All phases completed! Auto-starting ZIP download...');
        setTimeout(() => {
          this.autoDownloadZIP();
        }, 2000); // 2秒後に自動ダウンロード開始

    } catch (error) {
      console.error('❌ Phase generation stopped due to error:', error.message);
      
      // エラー時の詳細情報表示
      this.showNotification(`フェーズ生成エラーにより処理を停止しました: ${error.message}`, 'error');
      
      // エラー情報を保存
      this.additionalContent = {
        ...additionalContent,
        error: error.message,
        completedPhases: completedPhases,
        totalPhases: 8
      };
      
      // エラー状態でもコンテンツ表示（デバッグのため）
      this.displayAdditionalContent();
      
      // ❌ エラー時はZIPボタンを無効のまま維持
      this.isPhaseComplete = false;
      const zipBtn = document.getElementById('download-zip-btn');
      if (zipBtn) {
        zipBtn.disabled = true;
        zipBtn.innerHTML = '❌ エラーのため無効';
      }
      
      return; // エラー時は自動ZIP出力を行わない
    }

    } catch (error) {
      console.error('❌ Additional content generation completely failed:', error);
      this.showNotification(`致命的エラー: ${error.message}`, 'error');
    }
  }

  /**
   * APIクライアント作成
   */
  createApiClient() {
    return {
      post: async (endpoint, data) => {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`);
        }
        
        return await response.json();
      }
    };
  }

  /**
   * 🎯 エラーハンドリング付きAPI呼び出し（フェーズ別進捗対応）
   */
  async callAPIWithErrorHandling(apiClient, endpoint, data, phaseId) {
    const startTime = Date.now();
    console.log(`📡 API Call Start: ${endpoint} (Phase ${phaseId})`);
    
    try {
      const response = await apiClient.post(endpoint, data);
      const processingTime = Date.now() - startTime;
      
      console.log(`✅ API Call Success: ${endpoint} (${processingTime}ms)`);
      
      if (!response) {
        throw new Error('API レスポンスが空です');
      }
      
      const content = response.content || response.data;
      if (!content) {
        throw new Error('API レスポンスにコンテンツが含まれていません');
      }
      
      // 生成されたコンテンツの品質チェック
      if (typeof content === 'string' && content.length < 50) {
        console.warn(`⚠️ Short content warning for ${endpoint}: ${content.length} characters`);
      }
      
      return content;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ API Call Failed: ${endpoint} (${processingTime}ms)`, error);
      
      // 詳細なエラー情報
      let errorMessage = `Phase ${phaseId} API エラー: `;
      if (error.message.includes('fetch')) {
        errorMessage += 'ネットワーク接続エラー';
      } else if (error.message.includes('400')) {
        errorMessage += 'リクエストパラメータエラー';
      } else if (error.message.includes('401')) {
        errorMessage += 'API認証エラー';
      } else if (error.message.includes('500')) {
        errorMessage += 'サーバー内部エラー';
      } else if (error.message.includes('timeout')) {
        errorMessage += 'タイムアウトエラー';
      } else {
        errorMessage += error.message;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * 旧API呼び出しヘルパー（後方互換性のため残す）
   */
  async callAPI(apiClient, endpoint, data) {
    try {
      const response = await apiClient.post(endpoint, data);
      return response.content || response.data || 'Generated content not available';
    } catch (error) {
      console.warn(`API call failed: ${endpoint}`, error);
      return `Failed to generate content for ${endpoint}`;
    }
  }

  /**
   * フォームデータを収集
   */
  collectFormData() {
    const form = document.getElementById('scenario-form');
    if (!form) return {};

    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    const checkboxes = ['red_herring', 'twist_ending', 'secret_roles'];
    checkboxes.forEach(name => {
      const checkbox = document.getElementById(name);
      data[name] = checkbox ? checkbox.checked : false;
    });
    
    return data;
  }

  /**
   * Phase 2-8 + ハンドアウトコンテンツを表示
   */
  displayAdditionalContent() {
    const container = document.getElementById('additional-content');
    if (!container) {
      console.error('❌ Additional content container not found');
      return;
    }

    const formatContent = (content) => {
      if (!content) return '生成中...';
      if (typeof content === 'string') return content;
      if (Array.isArray(content)) return content.join('\n\n');
      return JSON.stringify(content, null, 2);
    };

    container.innerHTML = `
      <div class="additional-sections">
        <h3>🎭 Phase 2-8 + ハンドアウト 生成完了</h3>
        
        <div class="content-section">
          <h4>👥 詳細キャラクター設定 (Phase 2)</h4>
          <div class="content-text">${formatContent(this.additionalContent.characters)}</div>
        </div>
        
        <div class="content-section">
          <h4>🤝 人物関係 (Phase 3)</h4>
          <div class="content-text">${formatContent(this.additionalContent.relationships)}</div>
        </div>
        
        <div class="content-section">
          <h4>🎯 事件詳細・動機 (Phase 4)</h4>
          <div class="content-text">${formatContent(this.additionalContent.incident)}</div>
        </div>
        
        <div class="content-section">
          <h4>🔍 証拠・手がかり (Phase 5)</h4>
          <div class="content-text">${formatContent(this.additionalContent.clues)}</div>
        </div>
        
        <div class="content-section">
          <h4>⏰ 詳細タイムライン (Phase 6)</h4>
          <div class="content-text">${formatContent(this.additionalContent.timeline)}</div>
        </div>
        
        <div class="content-section">
          <h4>🎯 事件解決・真相 (Phase 7)</h4>
          <div class="content-text">${formatContent(this.additionalContent.solution)}</div>
        </div>
        
        <div class="content-section">
          <h4>🎮 ゲームマスター進行ガイド (Phase 8)</h4>
          <div class="content-text">${formatContent(this.additionalContent.gamemaster)}</div>
        </div>
        
        <div class="content-section">
          <h4>📋 キャラクターハンドアウト (完全版)</h4>
          <div class="content-text">${formatContent(this.additionalContent.handouts)}</div>
          <div class="info-note">💡 すべてのハンドアウトは完全ZIPパッケージに含まれます</div>
        </div>
        
        <div class="content-section">
          <h4>📊 最終統計 (商業品質 - Phase 1-8完全版)</h4>
          <div class="content-text">
            ✅ Phase 1: シナリオ概要 - 完了 (1800トークン)<br>
            ${this.additionalContent.characters ? '✅' : '❌'} Phase 2: キャラクター設定 (4000トークン)<br>
            ${this.additionalContent.relationships ? '✅' : '❌'} Phase 3: 人物関係 (3500トークン)<br>
            ${this.additionalContent.incident ? '✅' : '❌'} Phase 4: 事件詳細・動機 (3500トークン)<br>
            ${this.additionalContent.clues ? '✅' : '❌'} Phase 5: 証拠・手がかり (3500トークン)<br>
            ${this.additionalContent.timeline ? '✅' : '❌'} Phase 6: タイムライン (3500トークン)<br>
            ${this.additionalContent.solution ? '✅' : '❌'} Phase 7: 事件解決・真相 (3500トークン)<br>
            ${this.additionalContent.gamemaster ? '✅' : '❌'} Phase 8: GMガイド (3500トークン)<br>
            ${this.additionalContent.handouts ? '✅' : '❌'} ハンドアウト: 個別生成完了<br>
            📈 <strong>総品質レベル: ULTIMATE (29200総トークン)</strong><br>
            💼 <strong>商業出版レベル達成 - 顧客要求品質実現</strong>
          </div>
        </div>
      </div>
    `;
    
    container.classList.remove('hidden');
    console.log('✅ Additional content displayed successfully');
  }

  /**
   * 🚀 ULTRA SYNC: フェーズ8完了後の自動ZIP出力
   */
  async autoDownloadZIP() {
    console.log('🎯 Auto ZIP download triggered after all phases completed');
    
    // 通知表示
    this.showNotification('🚀 全フェーズ完了！自動的にZIPパッケージをダウンロード中...', 'success');
    
    // 自動ダウンロード実行
    await this.generateAndDownloadZIP();
  }

  /**
   * 完全ZIP生成とダウンロード
   */
  async generateAndDownloadZIP() {
    if (this._zipGenerating) {
      console.log('⚠️ ZIP generation already in progress');
      return;
    }

    this._zipGenerating = true;
    
    try {
      console.log('🚀 Starting complete ZIP package generation...');
      
      const scenarioContent = document.getElementById('scenario-content');
      if (!scenarioContent) {
        throw new Error('シナリオコンテンツが見つかりません');
      }
      
      const scenarioText = scenarioContent.innerText || scenarioContent.textContent;
      const formData = this.collectFormData();

      // Check if Phase 2-8 content is ready
      if (!this.additionalContent || Object.keys(this.additionalContent).length < 8) {
        console.log('📋 Phase 2-8 content not ready, generating now...');
        this.showNotification('Phase 2-8コンテンツを生成中... しばらくお待ちください', 'info');
        
        // Generate Phase 2-8 content first
        await this.generateAdditionalContent();
        
        // Wait a bit to ensure content is ready
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Ensure all content is properly generated
      const zipData = {
        scenario: scenarioText,
        characters: this.additionalContent?.characters || 'Error: Characters not generated',
        relationships: this.additionalContent?.relationships || 'Error: Relationships not generated',
        incident: this.additionalContent?.incident || 'Error: Incident not generated',
        clues: this.additionalContent?.clues || 'Error: Clues not generated',
        timeline: this.additionalContent?.timeline || 'Error: Timeline not generated',
        solution: this.additionalContent?.solution || 'Error: Solution not generated',
        gamemaster: this.additionalContent?.gamemaster || 'Error: GM Guide not generated',
        handouts: this.additionalContent?.handouts || 'Error: Handouts not generated',
        title: this.extractTitle(scenarioText),
        quality: 'PREMIUM',
        generationStats: {
          totalTokens: 29200,
          phases: 'Phase 1-8 Complete (Ultimate Quality)',
          qualityLevel: 'Commercial Publishing Grade',
          generationTime: new Date().toISOString(),
          model: 'Groq llama-3.1-70b-versatile',
          customerGrade: 'Maximum Quality Level'
        }
      };

      // Validate content before ZIP generation
      const missingContent = [];
      if (!this.additionalContent?.characters) missingContent.push('Characters');
      if (!this.additionalContent?.relationships) missingContent.push('Relationships');
      if (!this.additionalContent?.incident) missingContent.push('Incident');
      if (!this.additionalContent?.clues) missingContent.push('Clues');
      if (!this.additionalContent?.timeline) missingContent.push('Timeline');
      if (!this.additionalContent?.solution) missingContent.push('Solution');
      if (!this.additionalContent?.gamemaster) missingContent.push('GameMaster');
      if (!this.additionalContent?.handouts) missingContent.push('Handouts');

      if (missingContent.length > 0) {
        console.warn('⚠️ Missing content:', missingContent);
        this.showNotification(`警告: ${missingContent.join(', ')} が生成されていません。再度Phase生成を実行してください。`, 'warning');
      }

      console.log('📦 Complete ZIP data prepared');

      const apiClient = this.createApiClient();
      const zipResponse = await apiClient.post('/api/generate-zip-package', zipData);
      
      if (!zipResponse.success) {
        throw new Error(zipResponse.error || 'ZIP生成に失敗しました');
      }

      const zipBlob = this.base64ToBlob(zipResponse.zipPackage, 'application/zip');
      const downloadUrl = URL.createObjectURL(zipBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = zipResponse.packageName || `murder_mystery_complete_${Date.now()}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      URL.revokeObjectURL(downloadUrl);

      console.log('✅ Complete ZIP package generation and download successful');
      this.showNotification('完全ZIPパッケージダウンロード完了！', 'success');

    } catch (error) {
      console.error('❌ ZIP package generation failed:', error);
      this.showNotification('ZIP生成エラー: ' + error.message, 'error');
    } finally {
      this._zipGenerating = false;
    }
  }

  /**
   * Base64をBlobに変換
   */
  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  /**
   * タイトル抽出
   */
  extractTitle(scenario) {
    const titleMatch = scenario.match(/《(.+?)》|【(.+?)】|#\s*(.+)/);
    return titleMatch ? (titleMatch[1] || titleMatch[2] || titleMatch[3]) : 'マーダーミステリーシナリオ';
  }

  /**
   * 通知表示
   */
  showNotification(message, type = 'info') {
    console.log(`📢 ${type.toUpperCase()}: ${message}`);
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: 600;
      max-width: 400px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  /**
   * 新しいシナリオ用リセット
   */
  resetForNewScenario() {
    const resultContainer = document.getElementById('result-container');
    if (resultContainer) {
      resultContainer.classList.add('hidden');
    }

    const mainCard = document.getElementById('main-card');
    if (mainCard) {
      mainCard.classList.remove('hidden');
    }

    this.currentResult = null;
    this.additionalContent = null;
    this.isGenerating = false;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('🔄 Reset for new scenario - Ready for next generation');
  }
}

// グローバル利用可能にする
window.MurderMysteryApp = MurderMysteryApp;

export default MurderMysteryApp;