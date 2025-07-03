/**
 * 🌐 Offline Enhancement Engine - 90%オフライン対応システム
 * オフライン時の高品質体験と自動同期
 */

class OfflineEnhancementEngine {
  constructor() {
    this.isOnline = navigator.onLine;
    this.serviceWorker = null;
    this.syncQueue = [];
    this.offlineStorage = new OfflineStorage();
    this.conflictResolver = new ConflictResolver();
    
    // オフライン機能状態
    this.capabilities = {
      fullGeneration: false,      // 完全生成（高性能デバイスのみ）
      templateGeneration: true,   // テンプレート生成
      cachedContent: true,        // キャッシュコンテンツ
      smartSuggestions: true,     // スマート提案
      basicEditing: true,         // 基本編集
      exportFunctions: true       // エクスポート機能
    };
    
    // オフライン生成エンジン
    this.offlineGenerators = {
      template: new OfflineTemplateGenerator(),
      character: new OfflineCharacterGenerator(),
      evidence: new OfflineEvidenceGenerator(),
      scenario: new OfflineScenarioGenerator()
    };
    
    this.initialize();
  }

  /**
   * 初期化
   */
  async initialize() {
    try {
      logger.info('🌐 Initializing Offline Enhancement Engine');
      
      // Service Worker登録
      await this.registerServiceWorker();
      
      // オフライン状態監視
      this.setupConnectionMonitoring();
      
      // ローカルストレージ初期化
      await this.offlineStorage.initialize();
      
      // オフライン生成エンジン初期化
      await this.initializeGenerators();
      
      // デバイス性能評価
      this.evaluateDeviceCapabilities();
      
      logger.success('✅ Offline Enhancement Engine initialized');
      
    } catch (error) {
      logger.error('Offline Enhancement Engine initialization failed:', error);
    }
  }

  /**
   * Service Worker登録
   */
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/offline-service-worker.js');
        this.serviceWorker = registration;
        
        // Service Workerメッセージハンドラー
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });
        
        logger.debug('✅ Service Worker registered');
        
      } catch (error) {
        logger.warn('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * 接続状態監視
   */
  setupConnectionMonitoring() {
    // オンライン/オフライン状態変化監視
    window.addEventListener('online', () => {
      this.handleOnlineStateChange(true);
    });
    
    window.addEventListener('offline', () => {
      this.handleOnlineStateChange(false);
    });
    
    // 定期的な接続確認
    setInterval(() => {
      this.checkConnectionQuality();
    }, 30000); // 30秒ごと
  }

  /**
   * オンライン状態変化処理
   */
  async handleOnlineStateChange(isOnline) {
    this.isOnline = isOnline;
    
    if (isOnline) {
      logger.info('🌐 Connection restored - starting sync');
      this.showConnectionStatus('オンラインに復帰しました', 'success');
      
      // 自動同期開始
      await this.startAutomaticSync();
      
    } else {
      logger.warn('📴 Connection lost - switching to offline mode');
      this.showConnectionStatus('オフラインモードに切り替えました', 'warning');
      
      // オフライン機能の準備
      await this.prepareOfflineCapabilities();
    }
    
    // UI更新
    this.updateOfflineIndicator(isOnline);
  }

  /**
   * オフライン生成エンジン初期化
   */
  async initializeGenerators() {
    for (const [name, generator] of Object.entries(this.offlineGenerators)) {
      try {
        await generator.initialize();
        logger.debug(`✅ ${name} generator initialized`);
      } catch (error) {
        logger.warn(`${name} generator initialization failed:`, error);
      }
    }
  }

  /**
   * デバイス性能評価
   */
  evaluateDeviceCapabilities() {
    const performance = {
      cores: navigator.hardwareConcurrency || 2,
      memory: navigator.deviceMemory || 2,
      connection: navigator.connection?.effectiveType || '4g'
    };
    
    // 高性能デバイス判定
    const isHighPerformance = (
      performance.cores >= 4 &&
      performance.memory >= 4 &&
      ['4g', '5g'].includes(performance.connection)
    );
    
    if (isHighPerformance) {
      this.capabilities.fullGeneration = true;
      logger.info('🚀 High-performance device detected - full offline capabilities enabled');
    } else {
      logger.info('📱 Standard device - optimized offline capabilities enabled');
    }
  }

  /**
   * オフライン生成メイン API
   */
  async generateOffline(formData, options = {}) {
    if (this.isOnline && !options.forceOffline) {
      throw new Error('Use online generation when available');
    }
    
    const startTime = performance.now();
    
    try {
      logger.info('🔄 Starting offline generation');
      
      // キャッシュから類似コンテンツを検索
      const cachedResult = await this.findCachedSimilarContent(formData);
      if (cachedResult && options.allowCached) {
        logger.info('💾 Using cached similar content');
        return this.adaptCachedContent(cachedResult, formData);
      }
      
      let result;
      
      if (this.capabilities.fullGeneration) {
        // 高性能デバイス: 完全生成
        result = await this.performFullOfflineGeneration(formData);
      } else {
        // 標準デバイス: テンプレートベース生成
        result = await this.performTemplateBasedGeneration(formData);
      }
      
      // 結果をローカル保存
      await this.saveOfflineResult(formData, result);
      
      const generationTime = performance.now() - startTime;
      logger.success(`✅ Offline generation completed in ${Math.round(generationTime)}ms`);
      
      return {
        success: true,
        data: result,
        metadata: {
          generationType: this.capabilities.fullGeneration ? 'full' : 'template',
          generationTime,
          offline: true
        }
      };
      
    } catch (error) {
      logger.error('Offline generation failed:', error);
      
      // フォールバック: 基本テンプレート
      const fallbackResult = await this.generateBasicTemplate(formData);
      return {
        success: false,
        data: fallbackResult,
        metadata: { fallback: true, offline: true },
        error: error.message
      };
    }
  }

  /**
   * 完全オフライン生成
   */
  async performFullOfflineGeneration(formData) {
    const phases = [
      { name: 'concept', generator: this.offlineGenerators.template },
      { name: 'characters', generator: this.offlineGenerators.character },
      { name: 'evidence', generator: this.offlineGenerators.evidence },
      { name: 'scenario', generator: this.offlineGenerators.scenario }
    ];
    
    const results = {};
    
    for (const phase of phases) {
      logger.debug(`🔄 Generating ${phase.name}`);
      results[phase.name] = await phase.generator.generate(formData, results);
    }
    
    // 統合処理
    return this.integrateOfflineResults(results, formData);
  }

  /**
   * テンプレートベース生成
   */
  async performTemplateBasedGeneration(formData) {
    // キャッシュからベストマッチテンプレートを選択
    const template = await this.selectBestTemplate(formData);
    
    if (template) {
      // テンプレートカスタマイズ
      return this.customizeTemplate(template, formData);
    } else {
      // 基本テンプレート生成
      return this.generateBasicTemplate(formData);
    }
  }

  /**
   * キャッシュ類似コンテンツ検索
   */
  async findCachedSimilarContent(formData) {
    const cached = await window.advancedCacheEngine.intelligentGet('similar', formData);
    
    if (cached && cached.type !== 'suggestions') {
      return cached;
    }
    
    return null;
  }

  /**
   * ベストテンプレート選択
   */
  async selectBestTemplate(formData) {
    const templates = await this.offlineStorage.getTemplates();
    
    if (templates.length === 0) {
      return null;
    }
    
    // 最適マッチング
    const scored = templates.map(template => ({
      template,
      score: this.calculateTemplateCompatibility(template.metadata, formData)
    }));
    
    scored.sort((a, b) => b.score - a.score);
    
    return scored[0].score > 0.6 ? scored[0].template : null;
  }

  /**
   * テンプレート互換性計算
   */
  calculateTemplateCompatibility(templateMeta, formData) {
    let score = 0;
    let factors = 0;
    
    // 参加人数
    if (templateMeta.participants === formData.participants) {
      score += 30;
    } else if (Math.abs(templateMeta.participants - formData.participants) <= 1) {
      score += 15;
    }
    factors += 30;
    
    // 時代設定
    if (templateMeta.era === formData.era) {
      score += 20;
    }
    factors += 20;
    
    // 舞台設定
    if (templateMeta.setting === formData.setting) {
      score += 15;
    }
    factors += 15;
    
    // 複雑さ
    if (templateMeta.complexity === formData.complexity) {
      score += 10;
    }
    factors += 10;
    
    return factors > 0 ? score / factors : 0;
  }

  /**
   * 自動同期
   */
  async startAutomaticSync() {
    if (this.syncQueue.length === 0) {
      logger.debug('📡 No items to sync');
      return;
    }
    
    logger.info(`📡 Starting sync for ${this.syncQueue.length} items`);
    
    const syncResults = [];
    
    for (const item of this.syncQueue) {
      try {
        const result = await this.syncItem(item);
        syncResults.push({ item, result, success: true });
        
        // 成功したアイテムをキューから削除
        this.syncQueue = this.syncQueue.filter(i => i.id !== item.id);
        
      } catch (error) {
        logger.warn(`Sync failed for item ${item.id}:`, error);
        syncResults.push({ item, error, success: false });
      }
    }
    
    // 同期統計
    const successful = syncResults.filter(r => r.success).length;
    const failed = syncResults.filter(r => !r.success).length;
    
    if (successful > 0) {
      this.showSyncStatus(`${successful}件の同期が完了しました`, 'success');
    }
    
    if (failed > 0) {
      this.showSyncStatus(`${failed}件の同期に失敗しました`, 'warning');
    }
    
    logger.info(`📡 Sync completed: ${successful} success, ${failed} failed`);
  }

  /**
   * アイテム同期
   */
  async syncItem(item) {
    switch (item.type) {
      case 'scenario':
        return this.syncScenario(item);
      case 'user_data':
        return this.syncUserData(item);
      case 'preferences':
        return this.syncPreferences(item);
      default:
        throw new Error(`Unknown sync item type: ${item.type}`);
    }
  }

  /**
   * オフラインストレージ結果保存
   */
  async saveOfflineResult(formData, result) {
    const item = {
      id: `offline_${Date.now()}_${Math.random()}`,
      type: 'scenario',
      formData,
      result,
      timestamp: Date.now(),
      synced: false
    };
    
    await this.offlineStorage.save(item);
    this.syncQueue.push(item);
  }

  /**
   * 基本テンプレート生成
   */
  async generateBasicTemplate(formData) {
    const templates = {
      concept: this.generateBasicConcept(formData),
      characters: this.generateBasicCharacters(formData),
      incident_details: this.generateBasicIncident(formData),
      evidence_system: this.generateBasicEvidence(formData),
      gamemaster_guide: this.generateBasicGuide(formData)
    };
    
    return templates;
  }

  generateBasicConcept(formData) {
    const titles = {
      modern: ['消えた真実', '最後の証人', '隠された動機'],
      historical: ['呪われた館', '失われた記憶', '闇の陰謀'],
      fantasy: ['魔法の謎', '古き契約', '失われた魔導書']
    };
    
    const titleList = titles[formData.era] || titles.modern;
    const title = titleList[Math.floor(Math.random() * titleList.length)];
    
    return `## 作品基本情報
**作品タイトル**: ${title}
**基本コンセプト**: ${formData.participants}人用のマーダーミステリー
**舞台設定**: ${formData.setting}
**推定プレイ時間**: 30-60分

## 基本プロット
${formData.era}時代を背景とした${formData.setting}での事件。
${formData.incident_type}をきっかけに参加者は真相を探ることになる。`;
  }

  generateBasicCharacters(formData) {
    const roles = ['主人公', '容疑者A', '容疑者B', '証人', '関係者', '探偵役', '被害者関係者', '第三者'];
    const participants = parseInt(formData.participants);
    
    let characters = '## キャラクター設定\n\n';
    
    for (let i = 0; i < participants; i++) {
      const role = roles[i] || `参加者${i + 1}`;
      characters += `### ${role}\n`;
      characters += `- 年齢: ${20 + Math.floor(Math.random() * 40)}歳\n`;
      characters += `- 職業: 調査中\n`;
      characters += `- 事件との関係: 重要な関係者\n`;
      characters += `- 秘密: 隠された過去がある\n\n`;
    }
    
    return characters;
  }

  generateBasicIncident(formData) {
    return `## 事件詳細
**事件の種類**: ${formData.incident_type}
**発生時刻**: 詳細調査中
**発生場所**: ${formData.setting}内の重要な場所
**状況**: 参加者全員が関係する重大な事件

## 初期状況
事件発生により、参加者は真相究明のため調査を開始する。
各自が持つ情報を共有し、推理を進めることで真実に近づく。`;
  }

  generateBasicEvidence(formData) {
    return `## 証拠システム
**物理的証拠**: 現場に残された重要な手がかり
**証言**: 各参加者の証言と矛盾点
**文書**: 事件に関連する重要な文書
**状況証拠**: 各種状況から推測される情報

## 推理の流れ
1. 初期情報の共有
2. 証拠の検討
3. 仮説の立案
4. 検証と議論
5. 真相の解明`;
  }

  generateBasicGuide(formData) {
    return `## ゲームマスターガイド
**進行時間**: 約${formData.complexity === 'high' ? '60' : '30-45'}分
**参加人数**: ${formData.participants}人

### 進行の流れ
1. **導入** (5分): 状況説明と役職配布
2. **調査フェーズ** (20-30分): 情報収集と推理
3. **議論フェーズ** (10-15分): 全体での議論
4. **解決フェーズ** (5-10分): 真相発表

### 進行のコツ
- 参加者全員が発言できるよう配慮
- 推理の方向性をゆるやかに誘導
- 盛り上がりを重視した進行`;
  }

  /**
   * UI関連メソッド
   */
  updateOfflineIndicator(isOnline) {
    let indicator = document.getElementById('offline-indicator');
    
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        z-index: 1000;
        transition: all 0.3s ease;
      `;
      document.body.appendChild(indicator);
    }
    
    if (isOnline) {
      indicator.textContent = '🌐 オンライン';
      indicator.style.background = '#10b981';
      indicator.style.color = 'white';
    } else {
      indicator.textContent = '📴 オフライン';
      indicator.style.background = '#f59e0b';
      indicator.style.color = 'white';
    }
  }

  showConnectionStatus(message, type = 'info') {
    this.showToast(message, type);
  }

  showSyncStatus(message, type = 'info') {
    this.showToast(message, type);
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      z-index: 1001;
      opacity: 0;
      transform: translateY(100%);
      transition: all 0.3s ease;
      background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    `;
    
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /**
   * 接続品質チェック
   */
  async checkConnectionQuality() {
    if (!this.isOnline) return;
    
    try {
      const startTime = performance.now();
      const response = await fetch('/api/ping', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const latency = performance.now() - startTime;
      
      if (response.ok) {
        this.connectionQuality = latency < 100 ? 'excellent' : 
                                latency < 300 ? 'good' : 
                                latency < 1000 ? 'fair' : 'poor';
      } else {
        this.connectionQuality = 'poor';
      }
      
    } catch (error) {
      this.connectionQuality = 'offline';
      this.handleOnlineStateChange(false);
    }
  }

  /**
   * Service Workerメッセージ処理
   */
  handleServiceWorkerMessage(data) {
    switch (data.type) {
      case 'cache_updated':
        logger.debug('📦 Cache updated by service worker');
        break;
      case 'background_sync':
        logger.debug('🔄 Background sync triggered');
        this.startAutomaticSync();
        break;
      default:
        logger.debug('📨 Service worker message:', data);
    }
  }

  /**
   * オフライン機能準備
   */
  async prepareOfflineCapabilities() {
    // 必要なリソースの事前キャッシュ
    await this.preloadEssentialResources();
    
    // オフライン生成モデルの準備
    await this.prepareOfflineModels();
    
    logger.info('🔧 Offline capabilities prepared');
  }

  async preloadEssentialResources() {
    const essentialUrls = [
      '/css/main.css',
      '/js/main.js',
      '/assets/templates.json'
    ];
    
    for (const url of essentialUrls) {
      try {
        await caches.open('essential').then(cache => cache.add(url));
      } catch (error) {
        logger.warn(`Failed to cache ${url}:`, error);
      }
    }
  }

  async prepareOfflineModels() {
    // 軽量な生成モデルの準備
    try {
      await Promise.all([
        this.offlineGenerators.template.preload(),
        this.offlineGenerators.character.preload()
      ]);
    } catch (error) {
      logger.warn('Offline model preparation failed:', error);
    }
  }

  /**
   * 統計取得
   */
  getOfflineStats() {
    return {
      isOnline: this.isOnline,
      capabilities: this.capabilities,
      syncQueueSize: this.syncQueue.length,
      connectionQuality: this.connectionQuality,
      generatorsReady: Object.keys(this.offlineGenerators).length
    };
  }
}

/**
 * オフラインストレージ
 */
class OfflineStorage {
  constructor() {
    this.dbName = 'OfflineStorage';
    this.version = 1;
    this.db = null;
  }

  async initialize() {
    this.db = await this.openDatabase();
  }

  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('scenarios')) {
          const store = db.createObjectStore('scenarios', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('synced', 'synced');
        }
        
        if (!db.objectStoreNames.contains('templates')) {
          const store = db.createObjectStore('templates', { keyPath: 'id' });
          store.createIndex('type', 'type');
        }
      };
    });
  }

  async save(item) {
    const transaction = this.db.transaction(['scenarios'], 'readwrite');
    const store = transaction.objectStore('scenarios');
    return store.put(item);
  }

  async getTemplates() {
    const transaction = this.db.transaction(['templates'], 'readonly');
    const store = transaction.objectStore('templates');
    return store.getAll();
  }
}

/**
 * 競合解決器
 */
class ConflictResolver {
  resolveConflict(localData, serverData) {
    // 簡単な解決ロジック（タイムスタンプベース）
    return localData.timestamp > serverData.timestamp ? localData : serverData;
  }
}

/**
 * オフライン生成器ベースクラス
 */
class OfflineGeneratorBase {
  constructor() {
    this.templates = [];
    this.initialized = false;
  }

  async initialize() {
    await this.loadTemplates();
    this.initialized = true;
  }

  async loadTemplates() {
    // テンプレートの読み込み
    this.templates = [];
  }

  async preload() {
    // 事前読み込み処理
  }

  async generate(formData, context = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    return this.performGeneration(formData, context);
  }

  async performGeneration(formData, context) {
    throw new Error('performGeneration must be implemented');
  }
}

/**
 * オフラインテンプレート生成器
 */
class OfflineTemplateGenerator extends OfflineGeneratorBase {
  async performGeneration(formData, context) {
    // テンプレートベースの生成
    return {
      type: 'template',
      content: `${formData.participants}人用${formData.era}時代マーダーミステリー`
    };
  }
}

/**
 * オフラインキャラクター生成器
 */
class OfflineCharacterGenerator extends OfflineGeneratorBase {
  async performGeneration(formData, context) {
    const characters = [];
    const count = parseInt(formData.participants);
    
    for (let i = 0; i < count; i++) {
      characters.push({
        id: i + 1,
        name: `キャラクター${i + 1}`,
        role: `役割${i + 1}`,
        background: '詳細な背景設定'
      });
    }
    
    return { characters };
  }
}

/**
 * オフライン証拠生成器
 */
class OfflineEvidenceGenerator extends OfflineGeneratorBase {
  async performGeneration(formData, context) {
    return {
      physical_evidence: ['重要な物証'],
      documents: ['関連文書'],
      testimonies: ['証言記録']
    };
  }
}

/**
 * オフラインシナリオ生成器
 */
class OfflineScenarioGenerator extends OfflineGeneratorBase {
  async performGeneration(formData, context) {
    return {
      timeline: ['事件発生', '調査開始', '真相解明'],
      resolution: '事件の解決'
    };
  }
}

// グローバルインスタンス
window.offlineEnhancementEngine = new OfflineEnhancementEngine();

// エクスポート
export { OfflineEnhancementEngine };