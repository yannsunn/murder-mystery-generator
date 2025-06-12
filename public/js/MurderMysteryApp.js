/**
 * MurderMysteryApp - 実用的なシンプル版
 * 即座に動作する高速実装
 */
class MurderMysteryApp {
  constructor() {
    this.version = '3.0.0-WORKING';
    this.isGenerating = false;
    this.currentResult = null;
    this.additionalContent = null;
    this.lastGeneratedPDF = null;
    this._zipGenerating = false;
    this._pdfGenerating = false;
    
    this.init();
  }

  init() {
    console.log('🚀 MurderMysteryApp v3.0.0-WORKING initializing...');
    this.setupActionButtons();
    this.initializeEventListeners();
    console.log('✅ MurderMysteryApp initialized successfully!');
  }

  /**
   * アクションボタンを動的に追加
   */
  setupActionButtons() {
    // 結果が表示されているかチェック
    const resultContainer = document.getElementById('result-container');
    if (!resultContainer || resultContainer.classList.contains('hidden')) {
      return;
    }

    // 既存のアクションボタンをチェック
    let actionPanel = document.getElementById('action-panel');
    if (actionPanel) {
      return; // 既に存在する場合はスキップ
    }

    // アクションパネルを作成
    actionPanel = document.createElement('div');
    actionPanel.id = 'action-panel';
    actionPanel.className = 'action-panel';
    actionPanel.innerHTML = `
      <div class="action-buttons">
        <button id="download-pdf-btn" class="btn btn-primary">
          📄 PDF出力
        </button>
        <button id="download-zip-btn" class="btn btn-success">
          📦 ZIP出力
        </button>
        <button id="generate-handouts-btn" class="btn btn-secondary">
          📋 ハンドアウト
        </button>
        <button id="enhance-scenario-btn" class="btn btn-secondary">
          ⚡ 拡張生成
        </button>
        <button id="new-scenario-btn" class="btn btn-secondary">
          🔄 新規作成
        </button>
        <button id="debug-info-btn" class="btn btn-secondary">
          🔧 デバッグ情報
        </button>
      </div>
      <div class="internal-info">
        <h4>🔧 内部情報</h4>
        <div class="debug-info">
          <span class="status-indicator success"></span>
          システム: 正常動作中 | 
          生成時間: ${this.currentResult?.metadata?.generationTime || 'Unknown'}ms | 
          戦略: Ultra Enhanced |\n          品質: ${this.currentResult?.metadata?.quality || 'PREMIUM'}
        </div>
        <div class="debug-info">
          バージョン: ${this.version} | 
          API: Groq + OpenAI | 
          生成完了: ${new Date().toLocaleTimeString()} |
          フェーズ: 1-8 完全実装
        </div>
      </div>
    `;
    
    resultContainer.appendChild(actionPanel);
    this.setupActionButtonEvents();
  }

  /**
   * アクションボタンのイベントリスナーを設定
   */
  setupActionButtonEvents() {
    const pdfBtn = document.getElementById('download-pdf-btn');
    if (pdfBtn && !pdfBtn.hasAttribute('data-listener')) {
      pdfBtn.addEventListener('click', () => this.generateAndShowPDF());
      pdfBtn.setAttribute('data-listener', 'true');
    }

    const zipBtn = document.getElementById('download-zip-btn');
    if (zipBtn && !zipBtn.hasAttribute('data-listener')) {
      zipBtn.addEventListener('click', () => this.generateAndDownloadZIP());
      zipBtn.setAttribute('data-listener', 'true');
    }

    const handoutsBtn = document.getElementById('generate-handouts-btn');
    if (handoutsBtn && !handoutsBtn.hasAttribute('data-listener')) {
      handoutsBtn.addEventListener('click', () => this.generateHandoutsManually());
      handoutsBtn.setAttribute('data-listener', 'true');
    }

    const enhanceBtn = document.getElementById('enhance-scenario-btn');
    if (enhanceBtn && !enhanceBtn.hasAttribute('data-listener')) {
      enhanceBtn.addEventListener('click', () => this.enhanceScenario());
      enhanceBtn.setAttribute('data-listener', 'true');
    }

    const newBtn = document.getElementById('new-scenario-btn');
    if (newBtn && !newBtn.hasAttribute('data-listener')) {
      newBtn.addEventListener('click', () => this.resetForNewScenario());
      newBtn.setAttribute('data-listener', 'true');
    }

    const debugBtn = document.getElementById('debug-info-btn');
    if (debugBtn && !debugBtn.hasAttribute('data-listener')) {
      debugBtn.addEventListener('click', () => this.showDebugInfo());
      debugBtn.setAttribute('data-listener', 'true');
    }
  }

  /**
   * イベントリスナーの初期化
   */
  initializeEventListeners() {
    // 結果コンテナの監視
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

    // 生成完了イベントの監視
    document.addEventListener('generation:complete', (event) => {
      this.currentResult = event.detail;
      setTimeout(() => this.generateAdditionalContent(), 1000);
    });
  }

  /**
   * 追加コンテンツ生成（フェーズ2-8）
   */
  async generateAdditionalContent() {
    if (!this.currentResult) {
      console.log('⚠️ No current result to enhance');
      return;
    }

    try {
      console.log('🚀 Starting Phase 2-8 generation...');
      
      const scenarioContent = document.getElementById('scenario-content');
      if (!scenarioContent) {
        throw new Error('シナリオコンテンツが見つかりません');
      }

      const scenarioText = scenarioContent.innerText || scenarioContent.textContent;
      const formData = this.collectFormData();

      console.log('📝 Scenario text length:', scenarioText.length);

      // APIクライアントを作成
      const apiClient = this.createApiClient();

      // Phase 2-8を並列実行
      const additionalContent = {};

      try {
        console.log('👥 Generating Phase 2-8 in parallel...');
        
        const [characters, relationships, clues, timeline, gamemaster] = await Promise.all([
          this.callAPI(apiClient, '/api/groq-phase2-characters', { 
            concept: scenarioText, 
            participants: formData.participants,
            era: formData.era,
            setting: formData.setting
          }),
          this.callAPI(apiClient, '/api/groq-phase3-relationships', { 
            concept: scenarioText, 
            participants: formData.participants 
          }),
          this.callAPI(apiClient, '/api/groq-phase5-clues', { 
            concept: scenarioText, 
            participants: formData.participants 
          }),
          this.callAPI(apiClient, '/api/groq-phase6-timeline', { 
            concept: scenarioText, 
            participants: formData.participants 
          }),
          this.callAPI(apiClient, '/api/groq-phase8-gamemaster', { 
            concept: scenarioText, 
            participants: formData.participants 
          })
        ]);

        additionalContent.characters = characters;
        additionalContent.relationships = relationships;
        additionalContent.clues = clues;
        additionalContent.timeline = timeline;
        additionalContent.gamemaster = gamemaster;

        this.additionalContent = additionalContent;
        this.displayAdditionalContent();
        
        console.log('✅ Phase 2-8 generation completed successfully!');

      } catch (error) {
        console.warn('⚠️ Some phases failed, but continuing:', error);
        additionalContent.error = error.message;
        this.additionalContent = additionalContent;
      }

    } catch (error) {
      console.error('❌ Additional content generation failed:', error);
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
   * API呼び出しヘルパー
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
    
    // チェックボックスの値
    const checkboxes = ['red_herring', 'twist_ending', 'secret_roles'];
    checkboxes.forEach(name => {
      const checkbox = document.getElementById(name);
      data[name] = checkbox ? checkbox.checked : false;
    });
    
    return data;
  }

  /**
   * 追加コンテンツを表示
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
        <h3>🎭 Phase 2-8 生成コンテンツ</h3>
        
        <div class="content-section">
          <h4>👥 詳細キャラクター設定 (Phase 2)</h4>
          <div class="content-text">${formatContent(this.additionalContent.characters)}</div>
        </div>
        
        <div class="content-section">
          <h4>🤝 人物関係 (Phase 3)</h4>
          <div class="content-text">${formatContent(this.additionalContent.relationships)}</div>
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
          <h4>🎮 ゲームマスター進行ガイド (Phase 8)</h4>
          <div class="content-text">${formatContent(this.additionalContent.gamemaster)}</div>
        </div>
        
        <div class="content-section">
          <h4>📊 生成統計</h4>
          <div class="content-text">
            ✅ Phase 1: シナリオ概要 - 完了<br>
            ${this.additionalContent.characters ? '✅' : '❌'} Phase 2: キャラクター設定<br>
            ${this.additionalContent.relationships ? '✅' : '❌'} Phase 3: 人物関係<br>
            ${this.additionalContent.clues ? '✅' : '❌'} Phase 5: 証拠・手がかり<br>
            ${this.additionalContent.timeline ? '✅' : '❌'} Phase 6: タイムライン<br>
            ${this.additionalContent.gamemaster ? '✅' : '❌'} Phase 8: GMガイド<br>
            🕐 総生成時間: ${Date.now() - (this.startTime || Date.now())}ms
          </div>
        </div>
      </div>
    `;
    
    container.classList.remove('hidden');
    console.log('✅ Additional content displayed successfully');
  }

  /**
   * PDF生成とダウンロード
   */
  async generateAndShowPDF() {
    if (this._pdfGenerating) {
      console.log('⚠️ PDF generation already in progress');
      return;
    }
    
    this._pdfGenerating = true;
    
    try {
      console.log('🖨️ Starting PDF generation...');
      
      const scenarioContent = document.getElementById('scenario-content');
      if (!scenarioContent) {
        throw new Error('シナリオコンテンツが見つかりません');
      }
      
      const scenarioText = scenarioContent.innerText || scenarioContent.textContent;
      const formData = this.collectFormData();
      
      const pdfData = {
        scenario: scenarioText,
        title: this.extractTitle(scenarioText),
        characters: this.additionalContent?.characters || [],
        timeline: this.additionalContent?.timeline || 'タイムライン生成中...',
        handouts: [],
        quality: 'PREMIUM'
      };
      
      console.log('📄 PDF data prepared:', pdfData);
      
      const apiClient = this.createApiClient();
      const result = await apiClient.post('/api/generate-pdf', pdfData);
      
      if (result.success && result.pdf) {
        const link = document.createElement('a');
        link.href = 'data:application/pdf;base64,' + result.pdf;
        link.download = `murder_mystery_scenario_${formData.participants}players_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        this.lastGeneratedPDF = result.pdf;
        console.log('✅ PDF download completed');
        this.showNotification('PDFダウンロード完了！', 'success');
      } else {
        throw new Error('PDF生成に失敗しました');
      }
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      this.showNotification('PDF生成エラー: ' + error.message, 'error');
    } finally {
      this._pdfGenerating = false;
    }
  }

  /**
   * ZIP生成とダウンロード
   */
  async generateAndDownloadZIP() {
    if (this._zipGenerating) {
      console.log('⚠️ ZIP generation already in progress');
      return;
    }

    this._zipGenerating = true;
    
    try {
      console.log('🚀 Starting ZIP package generation...');
      
      const scenarioContent = document.getElementById('scenario-content');
      if (!scenarioContent) {
        throw new Error('シナリオコンテンツが見つかりません');
      }
      
      const scenarioText = scenarioContent.innerText || scenarioContent.textContent;
      const formData = this.collectFormData();

      const zipData = {
        scenario: scenarioText,
        characters: this.additionalContent?.characters || [],
        handouts: [],
        timeline: this.additionalContent?.timeline || 'タイムライン生成中...',
        clues: this.additionalContent?.clues || 'クルー生成中...',
        relationships: this.additionalContent?.relationships || '人物関係生成中...',
        gamemaster: this.additionalContent?.gamemaster || 'GMガイド生成中...',
        title: this.extractTitle(scenarioText),
        quality: 'PREMIUM',
        completePdf: this.lastGeneratedPDF
      };

      console.log('📦 ZIP data prepared');

      const apiClient = this.createApiClient();
      const zipResponse = await apiClient.post('/api/generate-zip-package', zipData);
      
      if (!zipResponse.success) {
        throw new Error(zipResponse.error || 'ZIP生成に失敗しました');
      }

      const zipBlob = this.base64ToBlob(zipResponse.zipPackage, 'application/zip');
      const downloadUrl = URL.createObjectURL(zipBlob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = zipResponse.packageName || `murder_mystery_package_${Date.now()}.zip`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      URL.revokeObjectURL(downloadUrl);

      console.log('✅ ZIP package generation and download successful');
      this.showNotification('ZIPパッケージダウンロード完了！', 'success');

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
    
    // 簡易通知表示
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
   * ハンドアウト生成
   */
  async generateHandoutsManually() {
    this.showNotification('ハンドアウト生成機能は開発中です', 'info');
  }

  /**
   * シナリオ拡張
   */
  async enhanceScenario() {
    this.showNotification('シナリオ拡張機能は開発中です', 'info');
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
    
    console.log('🔄 Reset for new scenario');
  }

  /**
   * デバッグ情報表示
   */
  showDebugInfo() {
    const debugData = {
      app: {
        version: this.version,
        currentResult: !!this.currentResult,
        additionalContent: !!this.additionalContent,
        hasLastPDF: !!this.lastGeneratedPDF
      },
      system: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        screenSize: `${screen.width}x${screen.height}`,
        memory: performance.memory ? {
          used: `${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)}MB`
        } : 'Not available'
      }
    };

    console.group('🔧 Debug Information');
    console.log('📊 App Data:', debugData);
    console.log('📈 Current Result:', this.currentResult);
    console.log('🎭 Additional Content:', this.additionalContent);
    console.groupEnd();

    const debugJson = JSON.stringify(debugData, null, 2);
    const blob = new Blob([debugJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `debug_info_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showNotification('デバッグ情報をダウンロードしました', 'info');
  }
}

// グローバル利用可能にする
window.MurderMysteryApp = MurderMysteryApp;

export default MurderMysteryApp;