/**
 * ⌨️ Keyboard Shortcuts & Accessibility Enhancement
 * キーボードショートカットとアクセシビリティ強化
 */

// ショートカットの状態管理
let shortcutsEnabled = true;
let helpModalVisible = false;

/**
 * 🎮 キーボードショートカットのマッピング
 */
const shortcuts = {
  // タブ切り替え (Ctrl + 数字)
  'Ctrl+1': () => switchToTab('overview'),
  'Ctrl+2': () => switchToTab('scenario'), 
  'Ctrl+3': () => switchToTab('characters'),
  'Ctrl+4': () => switchToTab('timeline'),
  'Ctrl+5': () => switchToTab('gm-guide'),
  'Ctrl+6': () => switchToTab('images'),

  // 機能操作
  'Ctrl+c': () => copyCurrentTabContent(),
  'Ctrl+s': () => saveCurrentContent(),
  'Ctrl+p': () => window.print(),
  'Ctrl+f': () => focusSearchInput(),
  'Ctrl+r': () => window.app?.resetApp(),

  // ナビゲーション
  'ArrowLeft': () => navigateTabs(-1),
  'ArrowRight': () => navigateTabs(1),
  'Home': () => switchToTab('overview'),
  'End': () => switchToTab('gm-guide'),

  // ヘルプ・設定
  'F1': () => showShortcutHelp(),
  'h': () => showShortcutHelp(),
  'Escape': () => closeModalsAndOverlays(),

  // アクセシビリティ
  'Alt+h': () => toggleHighContrast(),
  'Alt+f': () => toggleLargeFonts(),
  'Alt+r': () => toggleReducedMotion(),

  // 開発者・デバッグ
  'F12': () => toggleDeveloperMode(),
};

/**
 * 📑 タブ切り替え関数
 */
function switchToTab(tabName) {
  if (typeof showTab === 'function') {
    showTab(tabName);
  }
}

/**
 * 🔄 タブナビゲーション
 */
function navigateTabs(direction) {
  const tabs = ['overview', 'scenario', 'characters', 'timeline', 'gm-guide', 'images'];
  const currentIndex = tabs.indexOf(currentActiveTab || 'overview');
  const newIndex = Math.max(0, Math.min(tabs.length - 1, currentIndex + direction));
  
  if (newIndex !== currentIndex) {
    switchToTab(tabs[newIndex]);
  }
}

/**
 * 📋 現在のタブ内容をコピー
 */
function copyCurrentTabContent() {
  if (typeof copyTabContent === 'function') {
    copyTabContent();
  }
}

/**
 * 💾 現在の内容を保存
 */
function saveCurrentContent() {
  if (typeof saveAsText === 'function') {
    saveAsText();
  }
}

/**
 * 🔍 検索入力にフォーカス
 */
function focusSearchInput() {
  const searchInput = document.getElementById('content-search');
  if (searchInput) {
    searchInput.focus();
    searchInput.select();
  }
}

/**
 * ❓ ショートカットヘルプ表示
 */
function showShortcutHelp() {
  if (helpModalVisible) return;
  
  const helpModal = document.createElement('div');
  helpModal.className = 'keyboard-help-modal';
  helpModal.innerHTML = `
    <div class="help-backdrop" onclick="closeShortcutHelp()"></div>
    <div class="help-content">
      <div class="help-header">
        <h3>⌨️ キーボードショートカット</h3>
        <button class="help-close" onclick="closeShortcutHelp()">✕</button>
      </div>
      <div class="help-body">
        <div class="shortcut-section">
          <h4>🔄 タブ切り替え</h4>
          <div class="shortcut-list">
            <div class="shortcut-item"><kbd>Ctrl + 1</kbd> → 作品概要</div>
            <div class="shortcut-item"><kbd>Ctrl + 2</kbd> → 完全シナリオ</div>
            <div class="shortcut-item"><kbd>Ctrl + 3</kbd> → ハンドアウト集</div>
            <div class="shortcut-item"><kbd>Ctrl + 4</kbd> → 進行管理</div>
            <div class="shortcut-item"><kbd>Ctrl + 5</kbd> → GMマニュアル</div>
            <div class="shortcut-item"><kbd>Ctrl + 6</kbd> → アートワーク</div>
          </div>
        </div>
        
        <div class="shortcut-section">
          <h4>📋 ファイル操作</h4>
          <div class="shortcut-list">
            <div class="shortcut-item"><kbd>Ctrl + C</kbd> → タブ内容をコピー</div>
            <div class="shortcut-item"><kbd>Ctrl + S</kbd> → テキストファイル保存</div>
            <div class="shortcut-item"><kbd>Ctrl + P</kbd> → ページを印刷</div>
          </div>
        </div>
        
        <div class="shortcut-section">
          <h4">🔍 検索・ナビゲーション</h4>
          <div class="shortcut-list">
            <div class="shortcut-item"><kbd>Ctrl + F</kbd> → 検索フィールドに移動</div>
            <div class="shortcut-item"><kbd>← →</kbd> → タブ切り替え</div>
            <div class="shortcut-item"><kbd>Home</kbd> → 最初のタブ</div>
            <div class="shortcut-item"><kbd>End</kbd> → 最後のタブ</div>
          </div>
        </div>
        
        <div class="shortcut-section">
          <h4>🔧 システム操作</h4>
          <div class="shortcut-list">
            <div class="shortcut-item"><kbd>Ctrl + R</kbd> → アプリリセット</div>
            <div class="shortcut-item"><kbd>F1</kbd> or <kbd>H</kbd> → このヘルプ</div>
            <div class="shortcut-item"><kbd>Esc</kbd> → モーダルを閉じる</div>
          </div>
        </div>
        
        <div class="shortcut-section">
          <h4>♿ アクセシビリティ</h4>
          <div class="shortcut-list">
            <div class="shortcut-item"><kbd>Alt + H</kbd> → ハイコントラスト切り替え</div>
            <div class="shortcut-item"><kbd>Alt + F</kbd> → 大きな文字切り替え</div>
            <div class="shortcut-item"><kbd>Alt + R</kbd> → アニメーション軽減</div>
          </div>
        </div>
      </div>
      <div class="help-footer">
        <p>💡 これらのショートカットで効率的に操作できます</p>
        <button class="btn btn-primary" onclick="closeShortcutHelp()">了解</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(helpModal);
  helpModalVisible = true;
  
  // ESCキーでも閉じられるように
  document.addEventListener('keydown', handleHelpEscape);
}

/**
 * ❌ ショートカットヘルプを閉じる
 */
function closeShortcutHelp() {
  const helpModal = document.querySelector('.keyboard-help-modal');
  if (helpModal) {
    helpModal.remove();
    helpModalVisible = false;
    document.removeEventListener('keydown', handleHelpEscape);
  }
}

/**
 * ⌨️ ヘルプモーダル用ESCキーハンドリング
 */
function handleHelpEscape(event) {
  if (event.key === 'Escape' && helpModalVisible) {
    event.preventDefault();
    closeShortcutHelp();
  }
}

/**
 * 🚫 モーダルとオーバーレイを閉じる
 */
function closeModalsAndOverlays() {
  // 画像モーダル
  if (typeof closeImageModal === 'function') {
    closeImageModal();
  }
  
  // ヘルプモーダル
  if (helpModalVisible) {
    closeShortcutHelp();
  }
  
  // 検索をクリア
  if (typeof clearSearch === 'function') {
    clearSearch();
  }
}

/**
 * 🎨 ハイコントラストモード切り替え
 */
function toggleHighContrast() {
  const body = document.body;
  const isHighContrast = body.classList.toggle('high-contrast');
  
  localStorage.setItem('high-contrast', isHighContrast);
  
  if (typeof showToast === 'function') {
    showToast(
      isHighContrast ? '🔳 ハイコントラストモードON' : '🔲 ハイコントラストモードOFF',
      'info',
      3000
    );
  }
}

/**
 * 📏 大きな文字モード切り替え
 */
function toggleLargeFonts() {
  const html = document.documentElement;
  const isLargeFonts = html.classList.toggle('large-fonts');
  
  localStorage.setItem('large-fonts', isLargeFonts);
  
  if (typeof showToast === 'function') {
    showToast(
      isLargeFonts ? '🔤 大きな文字モードON' : '🔡 標準文字サイズ',
      'info',
      3000
    );
  }
}

/**
 * 🎬 アニメーション軽減モード切り替え
 */
function toggleReducedMotion() {
  const html = document.documentElement;
  const isReduced = html.classList.toggle('reduced-motion');
  
  localStorage.setItem('reduced-motion', isReduced);
  
  if (typeof showToast === 'function') {
    showToast(
      isReduced ? '⏸️ アニメーション軽減モードON' : '▶️ 通常アニメーション',
      'info',
      3000
    );
  }
}

/**
 * 🛠️ 開発者モード切り替え
 */
function toggleDeveloperMode() {
  const isDeveloper = document.body.classList.toggle('developer-mode');
  
  if (isDeveloper) {
    console.log('🛠️ Developer Mode Enabled');
    console.log('Session Data:', window.currentSessionData);
    console.log('App Instance:', window.app);
    
    if (typeof showToast === 'function') {
      showToast('🛠️ 開発者モード有効 (コンソールを確認)', 'info', 4000);
    }
  } else {
    if (typeof showToast === 'function') {
      showToast('👤 通常モード', 'info', 2000);
    }
  }
}

/**
 * 🎮 メインキーボードイベントハンドラー
 */
function handleKeyboardShortcut(event) {
  if (!shortcutsEnabled) return;
  
  // 入力フィールドにフォーカスがある場合は一部のショートカットを無効化
  const activeElement = document.activeElement;
  const isInputFocused = activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.contentEditable === 'true'
  );
  
  // ショートカットキーの組み合わせを生成
  const keyCombo = [
    event.ctrlKey ? 'Ctrl' : '',
    event.altKey ? 'Alt' : '',
    event.shiftKey ? 'Shift' : '',
    event.key
  ].filter(Boolean).join('+');
  
  // 入力フィールド内では一部のショートカットのみ許可
  if (isInputFocused) {
    const allowedInInput = ['Ctrl+c', 'Ctrl+v', 'Ctrl+f', 'Escape', 'F1'];
    if (!allowedInInput.includes(keyCombo)) {
      return;
    }
  }
  
  // ショートカットの実行
  const shortcutFunction = shortcuts[keyCombo];
  if (shortcutFunction) {
    event.preventDefault();
    try {
      shortcutFunction();
    } catch (error) {
      console.error('Shortcut execution error:', error);
    }
  }
}

/**
 * 🎯 フォーカス管理の改善
 */
function improvedFocusManagement() {
  // Tab順序の改善
  let focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Tab') {
      let focusable = Array.from(document.querySelectorAll(focusableElements))
        .filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
      
      let index = focusable.indexOf(document.activeElement);
      
      if (event.shiftKey) {
        // Shift+Tab: 前の要素
        if (index === 0) {
          event.preventDefault();
          focusable[focusable.length - 1].focus();
        }
      } else {
        // Tab: 次の要素
        if (index === focusable.length - 1) {
          event.preventDefault();
          focusable[0].focus();
        }
      }
    }
  });
}

/**
 * 🎨 ユーザー設定の復元
 */
function restoreUserPreferences() {
  // ハイコントラスト
  if (localStorage.getItem('high-contrast') === 'true') {
    document.body.classList.add('high-contrast');
  }
  
  // 大きな文字
  if (localStorage.getItem('large-fonts') === 'true') {
    document.documentElement.classList.add('large-fonts');
  }
  
  // アニメーション軽減
  if (localStorage.getItem('reduced-motion') === 'true') {
    document.documentElement.classList.add('reduced-motion');
  }
}

/**
 * 📱 タッチデバイス向けアクセシビリティ
 */
function setupTouchAccessibility() {
  // ダブルタップでズーム
  let lastTap = 0;
  document.addEventListener('touchend', (event) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0) {
      // ダブルタップ検出
      const element = event.target.closest('[data-zoom-target]');
      if (element) {
        element.classList.toggle('zoomed');
      }
    }
    
    lastTap = currentTime;
  });
}

/**
 * 🔊 スクリーンリーダー対応の強化
 */
function enhanceScreenReaderSupport() {
  // 動的コンテンツの変更をアナウンス
  const announceElement = document.createElement('div');
  announceElement.setAttribute('aria-live', 'polite');
  announceElement.setAttribute('aria-atomic', 'true');
  announceElement.className = 'sr-only';
  document.body.appendChild(announceElement);
  
  window.announceToScreenReader = (message) => {
    announceElement.textContent = message;
    setTimeout(() => {
      announceElement.textContent = '';
    }, 1000);
  };
}

/**
 * 🚀 初期化
 */
function initializeKeyboardShortcuts() {
  // メインイベントリスナー
  document.addEventListener('keydown', handleKeyboardShortcut);
  
  // フォーカス管理
  improvedFocusManagement();
  
  // ユーザー設定復元
  restoreUserPreferences();
  
  // タッチアクセシビリティ
  setupTouchAccessibility();
  
  // スクリーンリーダー対応
  enhanceScreenReaderSupport();
  
  console.log('⌨️ Keyboard shortcuts and accessibility features initialized');
  
  // 初期化完了の通知
  if (typeof showToast === 'function') {
    setTimeout(() => {
      showToast('⌨️ キーボードショートカット有効 (F1でヘルプ)', 'info', 4000);
    }, 2000);
  }
}

// DOM読み込み完了時に初期化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeKeyboardShortcuts);
} else {
  initializeKeyboardShortcuts();
}

// グローバル関数として公開
window.showShortcutHelp = showShortcutHelp;
window.closeShortcutHelp = closeShortcutHelp;
window.toggleHighContrast = toggleHighContrast;
window.toggleLargeFonts = toggleLargeFonts;
window.toggleReducedMotion = toggleReducedMotion;