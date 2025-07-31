/**
 * UI改善とエラーハンドリング拡張
 */

class UIManager {
  constructor() {
    this.initializeEventListeners();
  }

  /**
   * エラー表示
   */
  showError(message, details = null) {
    const errorContainer = document.getElementById('error-container');
    const errorMessage = document.getElementById('error-message');
    const loadingContainer = document.getElementById('loading-container');
    const mainCard = document.getElementById('main-card');
    
    // ローディングを隠す
    loadingContainer.classList.add('hidden');
    
    // メインカードを隠す
    mainCard.classList.add('hidden');
    
    // エラーメッセージを設定
    errorMessage.textContent = message;
    if (details) {
      errorMessage.innerHTML += `<br><small>詳細: ${details}</small>`;
    }
    
    // エラー表示
    errorContainer.classList.remove('hidden');
    
    // エラー表示をアナウンス（スクリーンリーダー対応）
    this.announceToScreenReader(`エラーが発生しました: ${message}`);
  }

  /**
   * 成功状態の表示
   */
  showSuccess() {
    const resultContainer = document.getElementById('result-container');
    const loadingContainer = document.getElementById('loading-container');
    
    loadingContainer.classList.add('hidden');
    resultContainer.classList.remove('hidden');
    
    // 成功をアナウンス
    this.announceToScreenReader('シナリオ生成が完了しました。');
    
    // 成功効果音（オプション）
    this.playSuccessSound();
  }

  /**
   * プログレスバーの更新
   */
  updateProgress(percentage, currentPhase, phaseDetails) {
    const progressFill = document.getElementById('progress-fill');
    const currentPhaseElement = document.getElementById('current-phase');
    const phaseDetailsElement = document.getElementById('phase-details');
    const progressBar = document.querySelector('.progress-container');
    
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
      progressBar.setAttribute('aria-valuenow', percentage);
    }
    
    if (currentPhaseElement) {
      currentPhaseElement.textContent = currentPhase;
    }
    
    if (phaseDetailsElement) {
      phaseDetailsElement.textContent = phaseDetails;
    }
    
    // 進捗をアナウンス（25%ごと）
    if (percentage % 25 === 0 && percentage > 0) {
      this.announceToScreenReader(`進捗 ${percentage}パーセント完了`);
    }
  }

  /**
   * スクリーンリーダー用アナウンス
   */
  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'visually-hidden';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // 5秒後に削除
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 5000);
  }

  /**
   * 成功効果音（オプション）
   */
  playSuccessSound() {
    // Web Audio APIを使用した軽量な成功音
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
      // 音声再生エラーは無視
    }
  }

  /**
   * フォームリセット
   */
  resetToForm() {
    const mainCard = document.getElementById('main-card');
    const errorContainer = document.getElementById('error-container');
    const resultContainer = document.getElementById('result-container');
    const loadingContainer = document.getElementById('loading-container');
    
    // すべてのコンテナを隠す
    errorContainer.classList.add('hidden');
    resultContainer.classList.add('hidden');
    loadingContainer.classList.add('hidden');
    
    // メインフォームを表示
    mainCard.classList.remove('hidden');
    
    // フォーカスを最初の入力フィールドに移動
    const firstInput = document.querySelector('#scenario-form input, #scenario-form select');
    if (firstInput) {
      firstInput.focus();
    }
  }

  /**
   * イベントリスナーの初期化
   */
  initializeEventListeners() {
    // 再試行ボタン
    document.addEventListener('click', (e) => {
      if (e.target.id === 'retry-btn') {
        // 前回の設定で再試行
        const generateBtn = document.getElementById('generate-btn');
        generateBtn.click();
      }
      
      if (e.target.id === 'back-to-form-btn') {
        this.resetToForm();
      }
    });

    // キーボードナビゲーション改善
    document.addEventListener('keydown', (e) => {
      // Escapeキーでフォームに戻る
      if (e.key === 'Escape') {
        const errorContainer = document.getElementById('error-container');
        const resultContainer = document.getElementById('result-container');
        
        if (!errorContainer.classList.contains('hidden') || 
            !resultContainer.classList.contains('hidden')) {
          this.resetToForm();
        }
      }
    });

    // フォーカス管理
    this.manageFocus();
  }

  /**
   * フォーカス管理
   */
  manageFocus() {
    // モーダル的な表示のときのフォーカストラップ
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const errorContainer = document.getElementById('error-container');
        if (!errorContainer.classList.contains('hidden')) {
          this.trapFocus(e, errorContainer);
        }
      }
    });
  }

  /**
   * フォーカストラップ
   */
  trapFocus(e, container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      e.preventDefault();
    }
  }
}

// UIManager を初期化
const uiManager = new UIManager();

// グローバルに公開（core-app.js から使用するため）
window.uiManager = uiManager;