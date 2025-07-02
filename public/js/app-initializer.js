/**
 * 🚀 App Initializer - セキュリティ強化版
 * インラインスクリプトを外部化してCSP違反を回避
 */

// シンプル化されたアプリ初期化（重複防止）
let app;

function initializeApp() {
  // 重複初期化防止
  if (window.appInitialized) {
    console.log('⚠️ App already initialized, skipping...');
    return;
  }
  
  console.log('🔍 初期DOM状態チェック:', {
    generateBtn: !!document.getElementById('generate-btn'),
    randomBtn: !!document.getElementById('random-generate-btn'),
    form: !!document.getElementById('scenario-form'),
    readyState: document.readyState,
    bodyChildren: document.body.children.length
  });
  
  // UX enhancersを先に初期化
  if (typeof SkeletonLoader !== 'undefined' && !window.skeletonLoader) {
    window.skeletonLoader = new SkeletonLoader();
    console.log('✅ SkeletonLoader initialized globally');
  }
  if (typeof UXEnhancer !== 'undefined' && !window.uxEnhancer) {
    window.uxEnhancer = new UXEnhancer();
    console.log('✅ UXEnhancer initialized globally');
  }
  
  // メインアプリを初期化（重複防止）
  try {
    console.log('🚀 UltraIntegratedApp初期化開始');
    if (!window.app) {
      app = new UltraIntegratedApp();
      window.app = app; // グローバルに保存
      window.appInitialized = true; // 初期化完了フラグ
    }
    console.log('✅ UltraIntegratedApp initialized successfully');
    
    // 初期化完了後の追加チェック
    setTimeout(() => {
      console.log('🔄 初期化完了後チェック:', {
        appExists: !!app,
        generateBtnListeners: document.getElementById('generate-btn')?._events || 'no _events property',
        randomBtnListeners: document.getElementById('random-generate-btn')?._events || 'no _events property'
      });
    }, 100);
    
  } catch (error) {
    console.error('❌ CRITICAL: UltraIntegratedApp初期化失敗:', error);
    console.error('📊 エラー詳細:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
  }
  
  // グローバル関数（タブ切り替え用）
  window.showTab = function(tabName) {
    if (app) {
      app.showTab(tabName);
    }
  };
  
  // ボタンの重複設定を防ぐため、緊急修復を無効化
  // 通常の初期化で十分にボタンが動作する
  console.log('💡 緊急修復は無効化 - 通常初期化で十分対応');
  
  // デバッグ用グローバル関数
  window.testButtonClick = function() {
    console.log('🧪 手動ボタンテスト開始');
    const generateBtn = document.getElementById('generate-btn');
    const randomBtn = document.getElementById('random-generate-btn');
    
    if (generateBtn) {
      console.log('📋 generate-btn状態:', {
        disabled: generateBtn.disabled,
        style: generateBtn.style.cssText,
        events: generateBtn.onclick ? 'onclick exists' : 'no onclick'
      });
      generateBtn.click();
    }
    
    if (randomBtn) {
      console.log('📋 random-generate-btn状態:', {
        disabled: randomBtn.disabled,
        style: randomBtn.style.cssText,
        events: randomBtn.onclick ? 'onclick exists' : 'no onclick'
      });
    }
  };
}

/**
 * 🚀 PWA Service Worker 登録
 */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('✅ Service Worker registered successfully:', registration);
          
          // 更新チェック
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 新しいバージョンが利用可能
                if (window.uxEnhancer) {
                  window.uxEnhancer.showToast('🔄 新しいバージョンが利用可能です', 'info', 5000);
                }
              }
            });
          });
        })
        .catch(error => {
          console.error('❌ Service Worker registration failed:', error);
        });
    });
  }
}

// DOM読み込み完了時またはすでに読み込み済みの場合に初期化
function startApplication() {
  // 既に初期化済みの場合はスキップ
  if (window.appInitialized) {
    console.log('⚠️ Application already initialized, skipping duplicate initialization');
    return;
  }
  
  initializeApp();
  registerServiceWorker();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApplication);
} else {
  startApplication();
}