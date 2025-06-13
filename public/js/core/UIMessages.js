/**
 * UIMessages - 日本語対応メッセージシステム
 * ユーザーフレンドリーなメッセージとローディング状態管理
 */
class UIMessages {
  constructor() {
    this.messages = {
      // ローディングメッセージ
      loading: {
        default: '処理中です...',
        generation: 'シナリオを生成しています...',
        api_connection: 'AIエンジンに接続しています...',
        concept_generation: '基本コンセプトを作成中...',
        character_generation: 'キャラクターを生成中...',
        clue_generation: '手がかりを作成中...',
        timeline_generation: 'タイムラインを構築中...',
        pdf_generation: 'PDFを作成中...',
        zip_generation: 'パッケージを準備中...'
      },

      // 成功メッセージ
      success: {
        generation_complete: 'シナリオ生成が完了しました',
        pdf_download: 'PDFダウンロードが完了しました',
        zip_download: 'ZIPパッケージのダウンロードが完了しました',
        data_saved: 'データが保存されました',
        validation_passed: '入力検証が完了しました'
      },

      // エラーメッセージ
      error: {
        network_error: 'ネットワーク接続に問題があります',
        api_error: 'サーバーとの通信でエラーが発生しました',
        validation_error: '入力内容に問題があります',
        timeout_error: '処理がタイムアウトしました',
        generation_failed: 'シナリオ生成に失敗しました',
        pdf_failed: 'PDF生成に失敗しました',
        file_download_failed: 'ファイルダウンロードに失敗しました',
        quota_exceeded: 'API利用制限に達しました',
        server_error: 'サーバーエラーが発生しました',
        unknown_error: '予期しないエラーが発生しました'
      },

      // 警告メッセージ
      warning: {
        short_content: '生成されたコンテンツが短い可能性があります',
        retry_suggestion: '再試行することをお勧めします',
        quality_check: '品質をご確認ください',
        connection_unstable: '接続が不安定です'
      },

      // 情報メッセージ
      info: {
        auto_save: '自動保存されました',
        keyboard_shortcuts: 'キーボードショートカットが利用できます',
        tip_generation: 'より良い結果のため、詳細な設定をお試しください',
        processing_time: '処理時間: {time}ms'
      },

      // 操作メッセージ
      action: {
        retry: '再試行',
        download: 'ダウンロード',
        reset: 'リセット',
        save: '保存',
        cancel: 'キャンセル',
        continue: '続行',
        back: '戻る',
        next: '次へ',
        generate: '生成開始',
        new_scenario: '新しいシナリオ'
      },

      // フォーム検証メッセージ
      validation: {
        required: 'この項目は必須です',
        participants_range: '参加者数は3-10人の範囲で入力してください',
        invalid_selection: '無効な選択です',
        field_empty: 'この項目を入力してください'
      },

      // プログレス段階
      progress: {
        phase_1: 'フェーズ1: 基本コンセプト生成',
        phase_2: 'フェーズ2: キャラクター設定',
        phase_3: 'フェーズ3: 関係性構築',
        phase_4: 'フェーズ4: 事件設定',
        phase_5: 'フェーズ5: 証拠・手がかり',
        phase_6: 'フェーズ6: タイムライン',
        phase_7: 'フェーズ7: 解決方法',
        phase_8: 'フェーズ8: ゲームマスター資料',
        finalization: '最終調整',
        complete: '完了'
      }
    };

    this.currentToast = null;
    this.loadingOverlay = null;
    this.setupStyles();
  }

  /**
   * スタイルの設定
   */
  setupStyles() {
    if (document.getElementById('ui-messages-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'ui-messages-styles';
    styles.textContent = `
      .ui-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        min-width: 300px;
        max-width: 500px;
        padding: 16px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        animation: slideInToast 0.3s ease-out;
        transition: all 0.3s ease;
      }

      .ui-toast.success {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }

      .ui-toast.error {
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
      }

      .ui-toast.warning {
        background: linear-gradient(135deg, #ffa502 0%, #f39c12 100%);
      }

      .ui-toast.info {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      .ui-toast-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .ui-toast-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .ui-toast-text {
        flex: 1;
        line-height: 1.4;
      }

      .ui-toast-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        opacity: 0.8;
        transition: opacity 0.2s ease;
      }

      .ui-toast-close:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
      }

      .ui-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(15, 15, 35, 0.9);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease-out;
      }

      .ui-loading-content {
        text-align: center;
        color: white;
        max-width: 400px;
        padding: 40px;
        background: rgba(22, 33, 62, 0.9);
        border-radius: 16px;
        border: 1px solid #334155;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      }

      .ui-loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #334155;
        border-top: 3px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
      }

      .ui-loading-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #94a3b8;
      }

      .ui-loading-message {
        font-size: 14px;
        color: #64748b;
        line-height: 1.4;
      }

      .ui-progress-container {
        width: 100%;
        margin: 20px 0;
      }

      .ui-progress-bar {
        width: 100%;
        height: 6px;
        background: #334155;
        border-radius: 3px;
        overflow: hidden;
      }

      .ui-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #8b5cf6);
        border-radius: 3px;
        transition: width 0.3s ease;
        position: relative;
      }

      .ui-progress-fill::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        animation: shimmer 2s infinite;
      }

      .ui-progress-text {
        font-size: 12px;
        color: #94a3b8;
        margin-top: 8px;
        text-align: center;
      }

      @keyframes slideInToast {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      @media (max-width: 640px) {
        .ui-toast {
          left: 20px;
          right: 20px;
          min-width: auto;
        }

        .ui-loading-content {
          margin: 0 20px;
          padding: 30px 20px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  /**
   * トーストメッセージを表示
   */
  showToast(message, type = 'info', duration = 5000) {
    // 既存のトーストを削除
    if (this.currentToast) {
      this.currentToast.remove();
    }

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `ui-toast ${type}`;
    toast.innerHTML = `
      <div class="ui-toast-content">
        <span class="ui-toast-icon">${icons[type] || icons.info}</span>
        <span class="ui-toast-text">${message}</span>
        <button class="ui-toast-close" onclick="this.closest('.ui-toast').remove()">×</button>
      </div>
    `;

    document.body.appendChild(toast);
    this.currentToast = toast;

    // 自動削除
    if (duration > 0) {
      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.animation = 'slideInToast 0.3s ease-out reverse';
          setTimeout(() => toast.remove(), 300);
        }
      }, duration);
    }

    return toast;
  }

  /**
   * ローディングオーバーレイを表示
   */
  showLoading(title = this.messages.loading.default, message = '', progress = null) {
    this.hideLoading(); // 既存のローディングを削除

    const overlay = document.createElement('div');
    overlay.className = 'ui-loading-overlay';
    
    let progressHTML = '';
    if (progress !== null) {
      progressHTML = `
        <div class="ui-progress-container">
          <div class="ui-progress-bar">
            <div class="ui-progress-fill" style="width: ${progress}%"></div>
          </div>
          <div class="ui-progress-text">${progress}% 完了</div>
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="ui-loading-content">
        <div class="ui-loading-spinner"></div>
        <div class="ui-loading-title">${title}</div>
        <div class="ui-loading-message">${message}</div>
        ${progressHTML}
      </div>
    `;

    document.body.appendChild(overlay);
    this.loadingOverlay = overlay;

    return overlay;
  }

  /**
   * ローディングオーバーレイを隠す
   */
  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.style.animation = 'fadeIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (this.loadingOverlay && this.loadingOverlay.parentNode) {
          this.loadingOverlay.remove();
        }
        this.loadingOverlay = null;
      }, 300);
    }
  }

  /**
   * ローディング進捗を更新
   */
  updateLoadingProgress(progress, title = null, message = null) {
    if (!this.loadingOverlay) return;

    const progressBar = this.loadingOverlay.querySelector('.ui-progress-fill');
    const progressText = this.loadingOverlay.querySelector('.ui-progress-text');
    const titleElement = this.loadingOverlay.querySelector('.ui-loading-title');
    const messageElement = this.loadingOverlay.querySelector('.ui-loading-message');

    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
    if (progressText) {
      progressText.textContent = `${progress}% 完了`;
    }
    if (title && titleElement) {
      titleElement.textContent = title;
    }
    if (message && messageElement) {
      messageElement.textContent = message;
    }
  }

  /**
   * エラーメッセージを取得
   */
  getErrorMessage(error) {
    if (typeof error === 'string') {
      return this.messages.error[error] || error;
    }
    
    if (error && error.message) {
      // 特定のエラーパターンをチェック
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('fetch')) {
        return this.messages.error.network_error;
      }
      if (message.includes('timeout')) {
        return this.messages.error.timeout_error;
      }
      if (message.includes('api') || message.includes('server')) {
        return this.messages.error.api_error;
      }
      if (message.includes('validation')) {
        return this.messages.error.validation_error;
      }
      
      return error.message;
    }
    
    return this.messages.error.unknown_error;
  }

  /**
   * 成功メッセージを表示
   */
  showSuccess(key, customMessage = null) {
    const message = customMessage || this.messages.success[key] || key;
    return this.showToast(message, 'success');
  }

  /**
   * エラーメッセージを表示
   */
  showError(error, customMessage = null) {
    const message = customMessage || this.getErrorMessage(error);
    return this.showToast(message, 'error', 8000);
  }

  /**
   * 警告メッセージを表示
   */
  showWarning(key, customMessage = null) {
    const message = customMessage || this.messages.warning[key] || key;
    return this.showToast(message, 'warning', 6000);
  }

  /**
   * 情報メッセージを表示
   */
  showInfo(key, customMessage = null, data = {}) {
    let message = customMessage || this.messages.info[key] || key;
    
    // テンプレート変数の置換
    Object.keys(data).forEach(key => {
      message = message.replace(`{${key}}`, data[key]);
    });
    
    return this.showToast(message, 'info');
  }

  /**
   * フォーム検証エラーを表示
   */
  showValidationError(field, error) {
    const message = this.messages.validation[error] || error;
    return this.showError(null, `${field}: ${message}`);
  }

  /**
   * プログレス段階メッセージを取得
   */
  getProgressMessage(phase) {
    return this.messages.progress[phase] || phase;
  }

  /**
   * すべてのメッセージをクリア
   */
  clearAll() {
    this.hideLoading();
    if (this.currentToast) {
      this.currentToast.remove();
      this.currentToast = null;
    }
  }
}

// グローバルインスタンス
window.UIMessages = window.UIMessages || new UIMessages();

export default UIMessages;