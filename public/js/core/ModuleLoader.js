/**
 * ModuleLoader - ES6モジュール動的ローディングシステム
 * 依存関係解決、遅延読み込み、エラーハンドリング
 */
class ModuleLoader {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '/js';
    this.timeout = options.timeout || 10000;
    this.cache = new Map();
    this.loadingPromises = new Map();
    this.dependencies = new Map();
    this.loadOrder = [];
    this.retryCount = options.retryCount || 3;
    this.retryDelay = options.retryDelay || 1000;
    
    this.setupModuleMap();
  }

  /**
   * モジュールマップの設定
   */
  setupModuleMap() {
    this.moduleMap = {
      // コアモジュール
      'EventEmitter': `${this.baseUrl}/core/EventEmitter.js`,
      'StateManager': `${this.baseUrl}/core/StateManager.js`,
      'Logger': `${this.baseUrl}/core/Logger.js`,
      'ApiClient': `${this.baseUrl}/core/ApiClient.js`,
      'TypeSystem': `${this.baseUrl}/core/TypeSystem.js`,
      'PerformanceOptimizer': `${this.baseUrl}/core/PerformanceOptimizer.js`,
      
      // コンポーネント
      'StepManager': `${this.baseUrl}/components/StepManager.js`,
      'UIController': `${this.baseUrl}/components/UIController.js`,
      
      // サービス
      'ScenarioGenerator': `${this.baseUrl}/services/ScenarioGenerator.js`,
      
      // テスト
      'TestFramework': `${this.baseUrl}/test/TestFramework.js`,
      
      // メインアプリ
      'MurderMysteryApp': `${this.baseUrl}/MurderMysteryApp.js`
    };

    // 依存関係定義
    this.dependencies.set('StateManager', ['EventEmitter']);
    this.dependencies.set('Logger', []);
    this.dependencies.set('ApiClient', ['EventEmitter']);
    this.dependencies.set('TypeSystem', []);
    this.dependencies.set('PerformanceOptimizer', []);
    this.dependencies.set('StepManager', ['EventEmitter']);
    this.dependencies.set('UIController', ['EventEmitter', 'PerformanceOptimizer']);
    this.dependencies.set('ScenarioGenerator', ['EventEmitter', 'ApiClient']);
    this.dependencies.set('TestFramework', []);
    this.dependencies.set('MurderMysteryApp', [
      'EventEmitter', 
      'StateManager', 
      'Logger', 
      'ApiClient', 
      'TypeSystem',
      'PerformanceOptimizer',
      'StepManager', 
      'UIController', 
      'ScenarioGenerator'
    ]);
  }

  /**
   * モジュールを動的に読み込み
   */
  async loadModule(moduleName, options = {}) {
    try {
      // キャッシュチェック
      if (this.cache.has(moduleName) && !options.forceReload) {
        return this.cache.get(moduleName);
      }

      // 既に読み込み中の場合は待機
      if (this.loadingPromises.has(moduleName)) {
        return await this.loadingPromises.get(moduleName);
      }

      // 読み込み開始
      const loadingPromise = this.executeModuleLoad(moduleName, options);
      this.loadingPromises.set(moduleName, loadingPromise);

      const module = await loadingPromise;
      
      // キャッシュに保存
      this.cache.set(moduleName, module);
      this.loadingPromises.delete(moduleName);
      
      return module;

    } catch (error) {
      this.loadingPromises.delete(moduleName);
      throw new Error(`Failed to load module "${moduleName}": ${error.message}`);
    }
  }

  /**
   * 実際のモジュール読み込み実行
   */
  async executeModuleLoad(moduleName, options) {
    const url = this.moduleMap[moduleName];
    if (!url) {
      throw new Error(`Module "${moduleName}" not found in module map`);
    }

    // 依存関係の解決
    await this.resolveDependencies(moduleName);

    // タイムアウト付きimport
    const module = await this.importWithTimeout(url, this.timeout);

    // モジュール検証
    this.validateModule(module, moduleName);

    // 読み込み順序記録
    if (!this.loadOrder.includes(moduleName)) {
      this.loadOrder.push(moduleName);
    }

    console.log(`✅ Module loaded: ${moduleName}`);
    return module;
  }

  /**
   * 依存関係の解決
   */
  async resolveDependencies(moduleName) {
    const deps = this.dependencies.get(moduleName) || [];
    
    if (deps.length === 0) {
      return;
    }

    console.log(`📦 Resolving dependencies for ${moduleName}:`, deps);

    // 依存関係を並列読み込み
    const dependencyPromises = deps.map(dep => this.loadModule(dep));
    await Promise.all(dependencyPromises);

    console.log(`✅ Dependencies resolved for ${moduleName}`);
  }

  /**
   * タイムアウト付きimport
   */
  async importWithTimeout(url, timeout) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // ES6 dynamic import with retry logic
      let lastError;
      
      for (let attempt = 1; attempt <= this.retryCount; attempt++) {
        try {
          // リトライ時の遅延
          if (attempt > 1) {
            await this.sleep(this.retryDelay * attempt);
            console.log(`🔄 Retrying module import (${attempt}/${this.retryCount}): ${url}`);
          }

          const module = await import(url);
          clearTimeout(timeoutId);
          return module;

        } catch (error) {
          lastError = error;
          console.warn(`❌ Import attempt ${attempt} failed:`, error.message);
        }
      }

      throw lastError;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new Error(`Module import timeout: ${url}`);
      }
      
      throw error;
    }
  }

  /**
   * モジュール検証
   */
  validateModule(module, moduleName) {
    if (!module) {
      throw new Error(`Module "${moduleName}" is empty or undefined`);
    }

    // デフォルトエクスポートまたは名前付きエクスポートの確認
    if (!module.default && !Object.keys(module).length) {
      throw new Error(`Module "${moduleName}" has no exports`);
    }

    // コンストラクタ関数の場合の検証
    const ModuleClass = module.default || module[moduleName];
    if (typeof ModuleClass === 'function') {
      // プロトタイプチェックでクラスかどうか確認
      if (ModuleClass.prototype && ModuleClass.prototype.constructor === ModuleClass) {
        console.log(`📋 Validated class module: ${moduleName}`);
      }
    }
  }

  /**
   * 複数モジュールの並列読み込み
   */
  async loadModules(moduleNames, options = {}) {
    const { parallel = true, failFast = false } = options;

    if (parallel) {
      const promises = moduleNames.map(name => this.loadModule(name));
      
      if (failFast) {
        return await Promise.all(promises);
      } else {
        return await Promise.allSettled(promises);
      }
    } else {
      // 順次読み込み
      const results = [];
      for (const moduleName of moduleNames) {
        try {
          const module = await this.loadModule(moduleName);
          results.push({ status: 'fulfilled', value: module });
        } catch (error) {
          results.push({ status: 'rejected', reason: error });
          if (failFast) {
            throw error;
          }
        }
      }
      return results;
    }
  }

  /**
   * アプリケーション全体の初期化
   */
  async initializeApp(config = {}) {
    console.log('🚀 Initializing Murder Mystery Application...');
    
    try {
      // 1. セキュリティユーティリティ（既存スクリプト）
      await this.loadLegacyScript('/security-utils.js');
      
      // 2. コアモジュールの読み込み
      console.log('📦 Loading core modules...');
      const coreModules = ['EventEmitter', 'StateManager', 'Logger', 'ApiClient'];
      await this.loadModules(coreModules, { parallel: true, failFast: true });

      // 3. コンポーネントモジュールの読み込み
      console.log('🧩 Loading component modules...');
      const componentModules = ['StepManager', 'UIController'];
      await this.loadModules(componentModules, { parallel: true, failFast: true });

      // 4. サービスモジュールの読み込み
      console.log('⚙️ Loading service modules...');
      const serviceModules = ['ScenarioGenerator'];
      await this.loadModules(serviceModules, { parallel: true, failFast: true });

      // 5. メインアプリケーションの読み込み
      console.log('🎯 Loading main application...');
      const appModule = await this.loadModule('MurderMysteryApp');
      const MurderMysteryApp = appModule.default || appModule.MurderMysteryApp;

      // 6. アプリケーションインスタンス作成
      console.log('🎭 Creating application instance...');
      const app = new MurderMysteryApp(config);

      // 7. グローバル参照設定
      window.app = app;
      window.moduleLoader = this;

      console.log('✅ Murder Mystery Application initialized successfully!');
      console.log('📊 Module load order:', this.loadOrder);
      
      return app;

    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      this.showInitializationError(error);
      throw error;
    }
  }

  /**
   * レガシースクリプトの読み込み
   */
  async loadLegacyScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * 初期化エラー表示
   */
  showInitializationError(error) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #fee;
      border: 2px solid #f00;
      border-radius: 8px;
      padding: 20px;
      max-width: 500px;
      z-index: 10000;
      font-family: monospace;
    `;
    
    errorDiv.innerHTML = `
      <h3 style="color: #d00; margin: 0 0 10px 0;">⚠️ アプリケーション初期化エラー</h3>
      <p style="margin: 0 0 10px 0;">${error.message}</p>
      <details style="margin-top: 10px;">
        <summary style="cursor: pointer;">詳細を表示</summary>
        <pre style="margin: 10px 0 0 0; font-size: 12px; overflow: auto;">${error.stack}</pre>
      </details>
      <button onclick="location.reload()" style="
        margin-top: 15px;
        padding: 8px 16px;
        background: #007cba;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">ページを再読み込み</button>
    `;

    document.body.appendChild(errorDiv);
  }

  /**
   * プリロード機能
   */
  async preloadModules(moduleNames) {
    console.log('⚡ Preloading modules:', moduleNames);
    
    const promises = moduleNames.map(async (moduleName) => {
      try {
        await this.loadModule(moduleName);
        console.log(`✅ Preloaded: ${moduleName}`);
      } catch (error) {
        console.warn(`⚠️ Preload failed: ${moduleName}`, error.message);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * モジュールのホットリロード（開発用）
   */
  async reloadModule(moduleName) {
    if (process?.env?.NODE_ENV !== 'development') {
      console.warn('Hot reload is only available in development mode');
      return;
    }

    console.log(`🔄 Hot reloading module: ${moduleName}`);
    
    // キャッシュをクリア
    this.cache.delete(moduleName);
    
    // 依存関係のあるモジュールもクリア
    for (const [name, deps] of this.dependencies) {
      if (deps.includes(moduleName)) {
        this.cache.delete(name);
        console.log(`🔄 Also clearing dependent module: ${name}`);
      }
    }

    // 再読み込み
    return await this.loadModule(moduleName, { forceReload: true });
  }

  /**
   * モジュール統計情報
   */
  getModuleStats() {
    return {
      totalModules: Object.keys(this.moduleMap).length,
      loadedModules: this.cache.size,
      loadOrder: [...this.loadOrder],
      cacheHitRate: this.cache.size / Math.max(this.loadOrder.length, 1),
      dependencies: Object.fromEntries(this.dependencies)
    };
  }

  /**
   * キャッシュ管理
   */
  clearCache(moduleName = null) {
    if (moduleName) {
      this.cache.delete(moduleName);
      console.log(`🗑️ Cleared cache for: ${moduleName}`);
    } else {
      this.cache.clear();
      this.loadOrder.length = 0;
      console.log('🗑️ Cleared all module cache');
    }
  }

  /**
   * モジュール依存関係グラフの可視化（デバッグ用）
   */
  getDependencyGraph() {
    const graph = {};
    
    for (const [module, deps] of this.dependencies) {
      graph[module] = {
        dependencies: deps,
        loaded: this.cache.has(module),
        url: this.moduleMap[module]
      };
    }
    
    return graph;
  }

  /**
   * ユーティリティメソッド
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * メモリ使用量チェック
   */
  checkMemoryUsage() {
    if ('memory' in performance) {
      const memory = performance.memory;
      return {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        modules: this.cache.size
      };
    }
    return { error: 'Memory API not available' };
  }

  /**
   * クリーンアップ
   */
  destroy() {
    this.clearCache();
    this.loadingPromises.clear();
    console.log('🗑️ ModuleLoader destroyed');
  }
}

// グローバル利用可能にする
window.ModuleLoader = ModuleLoader;

export default ModuleLoader;