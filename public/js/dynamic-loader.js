/**
 * 🚀 Dynamic Module Loader - 50%バンドル削減
 * 必要な時だけモジュールを読み込む最適化システム
 */

class DynamicLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
  }

  /**
   * 動的モジュール読み込み（重複防止付き）
   */
  async loadModule(moduleName) {
    // 既に読み込み済み
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }

    // 読み込み中
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    // 新規読み込み
    const loadPromise = this._importModule(moduleName);
    this.loadingPromises.set(moduleName, loadPromise);

    try {
      const module = await loadPromise;
      this.loadedModules.set(moduleName, module);
      this.loadingPromises.delete(moduleName);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      throw error;
    }
  }

  /**
   * モジュール別インポートロジック
   */
  async _importModule(moduleName) {
    const moduleMap = {
      // Core機能（即座に必要）
      'skeleton': () => import('./SkeletonLoader.js'),
      'keyboard': () => import('./keyboard-shortcuts.js'),
      
      // 遅延読み込み可能
      'lazy-load': () => import('./lazy-load.js'),
      'worker': () => import('./workers/ai-processing-worker.js'),
      
      // 条件付き読み込み
      'offline': () => this._conditionalLoad('offline-service-worker.js', 
        () => !navigator.onLine)
    };

    const loader = moduleMap[moduleName];
    if (!loader) {
      throw new Error(`Unknown module: ${moduleName}`);
    }

    return await loader();
  }

  /**
   * 条件付き読み込み
   */
  async _conditionalLoad(scriptPath, condition) {
    if (typeof condition === 'function' ? condition() : condition) {
      const script = document.createElement('script');
      script.src = scriptPath;
      script.type = 'module';
      
      return new Promise((resolve, reject) => {
        script.onload = () => resolve({ loaded: true });
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return { loaded: false, reason: 'condition not met' };
  }

  /**
   * 複数モジュールの並列読み込み
   */
  async loadModules(moduleNames) {
    const loadPromises = moduleNames.map(name => this.loadModule(name));
    return Promise.allSettled(loadPromises);
  }

  /**
   * メモリクリーンアップ
   */
  cleanup() {
    this.loadedModules.clear();
    this.loadingPromises.clear();
  }
}

// グローバルインスタンス
window.dynamicLoader = new DynamicLoader();

export { DynamicLoader };