/**
 * main.js - エントリーポイント
 * モジュールローダーを使用したアプリケーション起動
 */

(function() {
  'use strict';

  // アプリケーション設定
  const APP_CONFIG = {
    // 環境設定
    environment: detectEnvironment(),
    
    // API設定
    api: {
      baseURL: '/api',
      timeout: 30000,
      maxRetries: 3,
      rateLimitDelay: 100
    },
    
    // UI設定
    ui: {
      animationDuration: 300,
      debounceDelay: 300,
      autoSave: true,
      autoSaveInterval: 30000
    },
    
    // ステップ設定
    steps: {
      totalSteps: 5,
      validateOnChange: true,
      allowStepSkipping: false
    },
    
    // 生成設定
    generation: {
      defaultStrategy: 'ultra_phases',
      maxGenerationTime: 300000,
      enableFallback: true,
      qualityThreshold: 80
    },
    
    // ログ設定
    logging: {
      level: detectEnvironment() === 'development' ? 'DEBUG' : 'INFO',
      enableColors: true,
      enableTimestamp: true,
      maxLogSize: 1000
    }
  };

  /**
   * 環境検出
   */
  function detectEnvironment() {
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('dev')) {
      return 'development';
    }
    return 'production';
  }

  /**
   * ローディング画面の制御
   */
  function showInitialLoader() {
    const loader = document.createElement('div');
    loader.id = 'module-loader';
    loader.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      color: white;
      font-family: 'Inter', sans-serif;
    `;

    loader.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 4rem; margin-bottom: 1rem;">🕵️</div>
        <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem; font-weight: 600;">
          Murder Mystery Generator
        </h2>
        <p style="font-size: 1rem; opacity: 0.9; margin-bottom: 2rem;">
          モジュラーシステムを初期化中...
        </p>
        
        <div style="width: 300px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; overflow: hidden;">
          <div id="init-progress" style="
            width: 0%;
            height: 100%;
            background: white;
            border-radius: 2px;
            transition: width 0.3s ease;
          "></div>
        </div>
        
        <div id="init-status" style="
          margin-top: 1rem;
          font-size: 0.9rem;
          opacity: 0.8;
          min-height: 1.2rem;
        ">システム準備中...</div>
      </div>
    `;

    document.body.appendChild(loader);
    return loader;
  }

  function updateInitProgress(percentage, message) {
    const progressBar = document.getElementById('init-progress');
    const statusText = document.getElementById('init-status');
    
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
    
    if (statusText) {
      statusText.textContent = message;
    }
  }

  function hideInitialLoader() {
    const loader = document.getElementById('module-loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        loader.remove();
      }, 500);
    }
  }

  /**
   * フォールバックエラー処理
   */
  function setupFallbackErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Global JavaScript Error:', event.error);
      showCriticalError('JavaScriptエラーが発生しました', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      showCriticalError('非同期処理エラーが発生しました', event.reason);
    });
  }

  function showCriticalError(title, error) {
    // 既存のエラー表示を削除
    const existingError = document.getElementById('critical-error');
    if (existingError) {
      existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.id = 'critical-error';
    errorDiv.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      color: white;
      font-family: 'Inter', sans-serif;
    `;

    errorDiv.innerHTML = `
      <div style="
        background: #1e293b;
        border-radius: 12px;
        padding: 2rem;
        max-width: 600px;
        margin: 1rem;
        border: 2px solid #ef4444;
      ">
        <h2 style="color: #ef4444; margin: 0 0 1rem 0; font-size: 1.5rem;">
          ⚠️ ${title}
        </h2>
        <p style="margin: 0 0 1rem 0; line-height: 1.6;">
          アプリケーションの初期化中にエラーが発生しました。
          ページを再読み込みするか、ブラウザを更新してください。
        </p>
        <details style="margin: 1rem 0;">
          <summary style="cursor: pointer; color: #60a5fa;">技術的詳細を表示</summary>
          <pre style="
            background: #0f172a;
            padding: 1rem;
            border-radius: 6px;
            margin-top: 0.5rem;
            font-size: 0.8rem;
            overflow: auto;
            max-height: 200px;
          ">${error?.stack || error?.message || error}</pre>
        </details>
        <div style="text-align: center; margin-top: 1.5rem;">
          <button onclick="location.reload()" style="
            background: #3b82f6;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-size: 1rem;
            cursor: pointer;
            margin-right: 0.5rem;
          ">ページを再読み込み</button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            background: #6b7280;
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 6px;
            font-size: 1rem;
            cursor: pointer;
          ">閉じる</button>
        </div>
      </div>
    `;

    document.body.appendChild(errorDiv);
  }

  /**
   * 互換性チェック
   */
  function checkBrowserCompatibility() {
    const requiredFeatures = [
      'Promise',
      'fetch',
      'Map',
      'Set',
      'Symbol'
    ];

    const missingFeatures = requiredFeatures.filter(feature => 
      typeof window[feature] === 'undefined'
    );

    if (missingFeatures.length > 0) {
      showCriticalError(
        'ブラウザの互換性エラー', 
        `このアプリケーションには以下の機能が必要です: ${missingFeatures.join(', ')}\n\nモダンなブラウザをご使用ください。`
      );
      return false;
    }

    // ES6 動的インポートサポートチェック
    try {
      new Function('import("")');
    } catch {
      showCriticalError(
        'ES6モジュール非対応',
        'このブラウザはES6動的インポートに対応していません。\n最新のブラウザをご使用ください。'
      );
      return false;
    }

    return true;
  }

  /**
   * メインアプリケーション初期化
   */
  async function initializeApplication() {
    const loader = showInitialLoader();
    
    try {
      updateInitProgress(10, 'ブラウザ互換性チェック中...');
      
      if (!checkBrowserCompatibility()) {
        return;
      }

      updateInitProgress(20, 'モジュールローダーを初期化中...');
      
      // ModuleLoaderの動的インポート
      const { default: ModuleLoader } = await import('./core/ModuleLoader.js');
      
      updateInitProgress(30, 'モジュールローダーを設定中...');
      
      const moduleLoader = new ModuleLoader({
        baseUrl: './js',
        timeout: 15000,
        retryCount: 3
      });

      updateInitProgress(40, 'セキュリティシステムを初期化中...');
      
      // グローバル参照設定
      window.moduleLoader = moduleLoader;

      updateInitProgress(50, 'アプリケーションモジュールを読み込み中...');
      
      // メインアプリケーション初期化
      const app = await moduleLoader.initializeApp(APP_CONFIG);

      updateInitProgress(90, 'UI システムを準備中...');
      
      // 初期化完了イベント
      document.dispatchEvent(new CustomEvent('app:ready', {
        detail: { app, moduleLoader, config: APP_CONFIG }
      }));

      updateInitProgress(100, '初期化完了！');
      
      // 少し遅延してからローダーを隠す
      setTimeout(() => {
        hideInitialLoader();
      }, 500);

      console.log('🎉 Murder Mystery Application started successfully!');
      console.log('📊 Application stats:', {
        version: app.version,
        environment: app.environment,
        modules: moduleLoader.getModuleStats(),
        memory: moduleLoader.checkMemoryUsage()
      });

    } catch (error) {
      console.error('❌ Application initialization failed:', error);
      hideInitialLoader();
      showCriticalError('アプリケーション初期化エラー', error);
    }
  }

  /**
   * DOMContentLoadedでの起動
   */
  function startup() {
    console.log('🚀 Starting Murder Mystery Generator v2.0...');
    
    setupFallbackErrorHandling();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeApplication);
    } else {
      // DOM already loaded
      initializeApplication();
    }
  }

  /**
   * デバッグ用グローバル関数
   */
  if (APP_CONFIG.environment === 'development') {
    window.debugApp = {
      config: APP_CONFIG,
      restart: () => {
        location.reload();
      },
      getModuleStats: () => {
        return window.moduleLoader?.getModuleStats() || 'ModuleLoader not available';
      },
      getAppStats: () => {
        return window.app?.getDiagnosticInfo() || 'App not available';
      },
      clearCache: () => {
        if (window.moduleLoader) {
          window.moduleLoader.clearCache();
          console.log('🗑️ Module cache cleared');
        }
        localStorage.clear();
        console.log('🗑️ LocalStorage cleared');
      }
    };

    console.log('🛠️ Development mode enabled');
    console.log('💡 Use window.debugApp for debugging utilities');
  }

  // 起動
  startup();

})();