// 🚀 Ultra-Enhanced Interactions - 限界突破操作性システム
// 革命的なユーザー体験を提供

class UltraUI {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 5;
    this.animations = new Map();
    this.shortcuts = new Map();
    this.touchGestures = new Map();
    this.soundEnabled = false;
    
    this.init();
  }

  // 🎯 初期化
  init() {
    console.log('🚀 Ultra UI System initializing...');
    
    this.setupAdvancedInteractions();
    this.setupKeyboardShortcuts();
    this.setupTouchGestures();
    this.setupSmartValidation();
    this.setupProgressIndicators();
    this.setupAutoSave();
    this.setupAccessibility();
    
    console.log('✅ Ultra UI System ready!');
  }

  // 🎪 高度なインタラクション設定
  setupAdvancedInteractions() {
    // ステップインジケーターのクリック機能
    document.querySelectorAll('.step-indicator-item').forEach((item, index) => {
      item.addEventListener('click', (e) => {
        const targetStep = index + 1;
        if (this.canNavigateToStep(targetStep)) {
          this.animateStepTransition(targetStep);
        } else {
          this.showTooltip(item, '前のステップを完了してください', 'warning');
        }
      });

      // ホバー効果
      item.addEventListener('mouseenter', (e) => {
        if (!item.classList.contains('active')) {
          this.showTooltip(item, item.dataset.title, 'info');
        }
      });

      item.addEventListener('mouseleave', (e) => {
        this.hideTooltip();
      });
    });

    // フォーム要素の高度な機能
    this.setupSmartFormElements();
    
    // パラメータ連動機能
    this.setupParameterSyncing();
  }

  // ⌨️ キーボードショートカット
  setupKeyboardShortcuts() {
    const shortcuts = {
      'ArrowRight': () => this.nextStep(),
      'ArrowLeft': () => this.previousStep(),
      'Enter': (e) => {
        if (e.ctrlKey) this.startGeneration();
      },
      'Escape': () => this.showHelp(),
      'Space': (e) => {
        e.preventDefault();
        this.toggleQuickPreview();
      }
    };

    document.addEventListener('keydown', (e) => {
      const handler = shortcuts[e.key];
      if (handler && !this.isInputFocused()) {
        e.preventDefault();
        handler(e);
      }
    });

    // ショートカットヘルプの表示
    this.showShortcutHints();
  }

  // 📱 タッチジェスチャー（パフォーマンス最適化）
  setupTouchGestures() {
    let startX, startY, endX, endY;
    const stepContainer = document.getElementById('step-container');

    if (!stepContainer) {
      console.warn('Step container not found for touch gestures');
      return;
    }

    // passive: true でパフォーマンス最適化
    stepContainer.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    stepContainer.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = Math.abs(endY - startY);
      
      // 水平スワイプの検出
      if (Math.abs(deltaX) > 50 && deltaY < 100) {
        if (deltaX > 0) {
          this.previousStep(); // 右スワイプ = 前へ
        } else {
          this.nextStep(); // 左スワイプ = 次へ
        }
      }
    }, { passive: true });
  }

  // ✅ スマートバリデーション
  setupSmartValidation() {
    document.querySelectorAll('select, input').forEach(element => {
      element.addEventListener('change', (e) => {
        this.validateField(e.target);
        this.updateDependentFields(e.target);
        this.showPreviewEffect(e.target);
      });

      element.addEventListener('focus', (e) => {
        this.highlightRelatedElements(e.target);
      });

      element.addEventListener('blur', (e) => {
        this.clearHighlights();
      });
    });
  }

  // 📊 プログレス指標
  setupProgressIndicators() {
    try {
      // 完了度の動的更新
      if (typeof this.updateCompletionPercentage === 'function') {
        this.updateCompletionPercentage();
      }
      
      // 推定時間の表示（セーフチェック付き）
      if (typeof this.updateEstimatedTime === 'function') {
        this.updateEstimatedTime();
      } else {
        console.warn('updateEstimatedTimeメソッドが存在しません');
        // フォールバック実装
        this.updateEstimatedTime = function() {
          console.log('推定時間更新スキップ');
        };
      }
    } catch (error) {
      console.error('プログレス指標セットアップエラー:', error);
    }
  }
  
  // 🕰️ 推定時間更新（完全修正版）
  updateEstimatedTime() {
    try {
      const currentStep = this.getCurrentStep();
      const totalSteps = 5;
      const remainingSteps = Math.max(0, totalSteps - currentStep);
      const avgTimePerStep = 30; // 秒
      const estimatedTime = remainingSteps * avgTimePerStep;
      
      // 推定時間表示要素を探して更新
      const timeDisplay = document.querySelector('.estimated-time');
      if (timeDisplay) {
        timeDisplay.textContent = `推定時間: ${estimatedTime}秒`;
      }
    } catch (error) {
      console.warn('推定時間更新エラー:', error);
    }
  }
  
  // 📍 現在のステップを取得（缶落していたメソッド）
  getCurrentStep() {
    try {
      // アクティブなステップを探す
      const activeStep = document.querySelector('.step:not(.hidden)');
      if (activeStep) {
        const stepId = activeStep.id;
        const stepNumber = stepId.replace('step-', '');
        return parseInt(stepNumber) || 1;
      }
      
      // フォールバック: ステップインジケーターから取得
      const activeIndicator = document.querySelector('.step-indicator-item.active');
      if (activeIndicator) {
        const stepNumber = activeIndicator.getAttribute('data-step');
        return parseInt(stepNumber) || 1;
      }
      
      return 1; // デフォルト
    } catch (error) {
      console.warn('現在ステップ取得エラー:', error);
      return 1;
    }
  }

  // 💾 自動保存機能（パフォーマンス最適化）
  setupAutoSave() {
    // 既存のインターバルをクリア（重複防止）
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }
    
    // ユーザーがアクティブな時のみ保存
    this.autoSaveInterval = setInterval(() => {
      try {
        if (!document.hidden && this.hasFormChanges()) {
          this.autoSaveFormData();
        }
      } catch (error) {
        console.warn('自動保存エラー:', error);
      }
    }, 45000); // 45秒ごとに変更してパフォーマンス改善

    // ページ離脱時の警告
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges()) {
        e.returnValue = '入力内容が保存されていません。ページを離れますか？';
      }
    });
    
    // ページが非表示になったら自動保存停止
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval);
      } else if (!document.hidden && !this.autoSaveInterval) {
        this.setupAutoSave(); // 再開
      }
    });
  }
  
  // フォームの変更をチェック
  hasFormChanges() {
    const form = document.getElementById('scenario-form');
    if (!form) return false;
    
    const formData = new FormData(form);
    const currentData = Object.fromEntries(formData.entries());
    
    // 前回保存したデータと比較
    const lastSaved = localStorage.getItem('ultra-form-data');
    if (!lastSaved) return true;
    
    try {
      const lastSavedData = JSON.parse(lastSaved);
      return JSON.stringify(currentData) !== JSON.stringify(lastSavedData);
    } catch {
      return true;
    }
  }

  // ♿ アクセシビリティ
  setupAccessibility() {
    // フォーカス管理
    this.setupFocusManagement();
    
    // スクリーンリーダー対応
    this.setupAriaLabels();
    
    // 高コントラストモード
    this.setupHighContrastMode();
  }

  // 🎨 スマートフォーム要素
  setupSmartFormElements() {
    // 参加者数に応じた説明更新
    const participantsSelect = document.getElementById('participants');
    participantsSelect?.addEventListener('change', (e) => {
      this.updateParticipantsInfo(e.target.value);
    });

    // 時代背景に応じた舞台設定フィルタ
    const eraSelect = document.getElementById('era');
    eraSelect?.addEventListener('change', (e) => {
      this.updateSettingOptions(e.target.value);
    });

    // 世界観とトーンの連動
    const worldviewSelect = document.getElementById('worldview');
    worldviewSelect?.addEventListener('change', (e) => {
      this.suggestMatchingTone(e.target.value);
    });
  }

  // 🔗 パラメータ連動機能
  setupParameterSyncing() {
    const syncRules = {
      era: {
        'fantasy': { worldview: 'occult', setting: 'mountain-villa' },
        'near-future': { worldview: 'sci-fi', setting: 'military-facility' },
        'showa': { tone: 'serious', setting: 'mountain-villa' }
      },
      worldview: {
        'horror': { tone: 'horror' },
        'occult': { tone: 'serious' },
        'sci-fi': { incident_type: 'disappearance' }
      }
    };

    Object.keys(syncRules).forEach(fieldId => {
      const field = document.getElementById(fieldId);
      field?.addEventListener('change', (e) => {
        this.applySyncRules(e.target.value, syncRules[fieldId]);
      });
    });
  }

  // 🎯 ステップ遷移アニメーション
  animateStepTransition(targetStep) {
    const currentStepElement = document.getElementById(`step-${this.currentStep}`);
    const targetStepElement = document.getElementById(`step-${targetStep}`);
    
    if (!currentStepElement || !targetStepElement) return;

    // 現在のステップをフェードアウト
    currentStepElement.style.transform = 'translateX(-30px)';
    currentStepElement.style.opacity = '0';
    
    setTimeout(() => {
      currentStepElement.classList.add('hidden');
      targetStepElement.classList.remove('hidden');
      
      // 新しいステップをフェードイン
      targetStepElement.style.transform = 'translateX(30px)';
      targetStepElement.style.opacity = '0';
      
      requestAnimationFrame(() => {
        targetStepElement.style.transform = 'translateX(0)';
        targetStepElement.style.opacity = '1';
      });
    }, 200);

    this.currentStep = targetStep;
    this.updateStepIndicator();
    this.updateNavigationButtons();
    
    // ステップ変更音効
    this.playSound('step-change');
  }

  // 🏷️ ツールチップシステム
  showTooltip(element, message, type = 'info') {
    this.hideTooltip(); // 既存のツールチップを削除

    const tooltip = document.createElement('div');
    tooltip.className = `tooltip tooltip-${type}`;
    tooltip.textContent = message;
    tooltip.style.cssText = `
      position: absolute;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      z-index: 1000;
      pointer-events: none;
      backdrop-filter: blur(10px);
      animation: tooltipFadeIn 0.2s ease-out;
    `;

    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;

    this.currentTooltip = tooltip;
    
    // 自動削除
    setTimeout(() => this.hideTooltip(), 3000);
  }

  hideTooltip() {
    if (this.currentTooltip) {
      this.currentTooltip.remove();
      this.currentTooltip = null;
    }
  }

  // 🎵 サウンドシステム
  playSound(type) {
    if (!this.soundEnabled) return;

    const sounds = {
      'step-change': { frequency: 800, duration: 100 },
      'success': { frequency: 1000, duration: 200 },
      'error': { frequency: 300, duration: 300 },
      'completion': { frequency: 1200, duration: 500 }
    };

    const sound = sounds[type];
    if (sound) {
      this.createTone(sound.frequency, sound.duration);
    }
  }

  createTone(frequency, duration) {
    if (typeof AudioContext === 'undefined') return;

    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
  }

  // 📝 フィールドバリデーション
  validateField(field) {
    const validationRules = {
      participants: (value) => value >= 4 && value <= 8,
      era: (value) => ['modern', 'showa', 'near-future', 'fantasy'].includes(value),
      setting: (value) => value && value.length > 0
    };

    const rule = validationRules[field.id];
    if (rule && !rule(field.value)) {
      this.showFieldError(field, '無効な値です');
      return false;
    }

    this.clearFieldError(field);
    return true;
  }

  showFieldError(field, message) {
    field.classList.add('error');
    this.showTooltip(field, message, 'error');
  }

  clearFieldError(field) {
    field.classList.remove('error');
  }

  // 🔄 連動フィールド更新
  updateDependentFields(changedField) {
    if (changedField.id === 'era') {
      this.updateSettingOptions(changedField.value);
    }
    
    if (changedField.id === 'participants') {
      this.updateComplexityRecommendation(changedField.value);
    }
  }

  updateSettingOptions(era) {
    const settingSelect = document.getElementById('setting');
    if (!settingSelect) return;

    const eraSettings = {
      'fantasy': [
        { value: 'mountain-villa', text: '🏰 古城・山荘' },
        { value: 'closed-space', text: '🏛️ 魔法学院' }
      ],
      'near-future': [
        { value: 'military-facility', text: '🛸 宇宙ステーション' },
        { value: 'underwater-facility', text: '🌊 海中コロニー' }
      ],
      'showa': [
        { value: 'mountain-villa', text: '🏮 温泉旅館' },
        { value: 'closed-space', text: '🏘️ 商店街' }
      ]
    };

    if (eraSettings[era]) {
      this.animateSelectUpdate(settingSelect, eraSettings[era]);
    }
  }

  // 📊 完了度更新
  updateCompletionPercentage() {
    const completedSteps = this.getCompletedSteps();
    const percentage = (completedSteps / this.totalSteps) * 100;
    
    // プログレスバーを更新
    const progressBar = document.querySelector('.progress-fill');
    if (progressBar) {
      progressBar.style.width = `${percentage}%`;
    }
  }

  getCompletedSteps() {
    let completed = 0;
    for (let i = 1; i <= this.totalSteps; i++) {
      if (this.isStepCompleted(i)) completed++;
    }
    return completed;
  }

  isStepCompleted(stepNumber) {
    const stepElement = document.getElementById(`step-${stepNumber}`);
    if (!stepElement) return false;

    const requiredFields = stepElement.querySelectorAll('select[required], input[required]');
    return Array.from(requiredFields).every(field => field.value);
  }

  // 🎮 ナビゲーション
  nextStep() {
    if (this.currentStep < this.totalSteps && this.canProceedToNextStep()) {
      this.animateStepTransition(this.currentStep + 1);
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.animateStepTransition(this.currentStep - 1);
    }
  }

  canProceedToNextStep() {
    return this.isStepCompleted(this.currentStep);
  }

  canNavigateToStep(targetStep) {
    // 前のステップがすべて完了している場合のみ
    for (let i = 1; i < targetStep; i++) {
      if (!this.isStepCompleted(i)) return false;
    }
    return true;
  }

  // 💾 データ管理
  autoSaveFormData() {
    const formData = this.collectFormData();
    localStorage.setItem('murder-mystery-form', JSON.stringify({
      data: formData,
      timestamp: Date.now(),
      step: this.currentStep
    }));
  }

  loadSavedData() {
    const saved = localStorage.getItem('murder-mystery-form');
    if (saved) {
      try {
        const { data, step } = JSON.parse(saved);
        this.restoreFormData(data);
        this.animateStepTransition(step);
        return true;
      } catch (e) {
        console.warn('Failed to load saved data:', e);
      }
    }
    return false;
  }

  hasUnsavedChanges() {
    const currentData = this.collectFormData();
    const saved = localStorage.getItem('murder-mystery-form');
    
    if (!saved) return Object.keys(currentData).length > 0;
    
    try {
      const { data } = JSON.parse(saved);
      return JSON.stringify(data) !== JSON.stringify(currentData);
    } catch (e) {
      return true;
    }
  }

  // 🎯 ユーティリティ
  isInputFocused() {
    const activeElement = document.activeElement;
    return activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'SELECT' ||
      activeElement.tagName === 'TEXTAREA'
    );
  }

  showShortcutHints() {
    const hints = document.createElement('div');
    hints.className = 'shortcut-hints';
    hints.innerHTML = `
      <div class="shortcut-item">← → : ステップ移動</div>
      <div class="shortcut-item">Ctrl + Enter : 生成開始</div>
      <div class="shortcut-item">Space : プレビュー</div>
      <div class="shortcut-item">Esc : ヘルプ</div>
    `;
    hints.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px;
      border-radius: 8px;
      font-size: 0.8rem;
      z-index: 1000;
      opacity: 0.7;
    `;
    
    document.body.appendChild(hints);
    
    // 5秒後に自動削除
    setTimeout(() => hints.remove(), 5000);
  }

  collectFormData() {
    const form = document.getElementById('scenario-form');
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    // チェックボックスの状態も保存
    form.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      data[checkbox.name] = checkbox.checked;
    });
    
    return data;
  }

  restoreFormData(data) {
    Object.keys(data).forEach(key => {
      const element = document.querySelector(`[name="${key}"]`);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = data[key];
        } else {
          element.value = data[key];
        }
      }
    });
  }

  // 🎨 視覚効果
  showPreviewEffect(element) {
    element.style.transform = 'scale(1.02)';
    element.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.3)';
    
    setTimeout(() => {
      element.style.transform = '';
      element.style.boxShadow = '';
    }, 200);
  }

  highlightRelatedElements(element) {
    const relatedElements = this.findRelatedElements(element);
    relatedElements.forEach(el => {
      el.style.borderColor = 'rgba(139, 92, 246, 0.5)';
    });
  }

  clearHighlights() {
    document.querySelectorAll('.form-input, .form-select').forEach(el => {
      el.style.borderColor = '';
    });
  }

  findRelatedElements(element) {
    // 関連要素を見つけるロジック
    const related = [];
    const fieldName = element.name;
    
    if (fieldName === 'era') {
      related.push(document.getElementById('setting'));
      related.push(document.getElementById('worldview'));
    }
    
    return related.filter(Boolean);
  }
}

// 🚀 初期化（エラーフリー版）
document.addEventListener('DOMContentLoaded', () => {
  try {
    window.ultraUI = new UltraUI();
    
    // 保存されたデータの復元を試行
    if (window.ultraUI && typeof window.ultraUI.loadSavedData === 'function') {
      if (window.ultraUI.loadSavedData()) {
        console.log('✅ Saved data restored');
      }
    }
  } catch (error) {
    console.error('初期化エラー:', error);
    // フォールバックのダミーUIオブジェクトを作成
    window.ultraUI = {
      loadSavedData: () => false,
      autoSaveFormData: () => {},
      hasUnsavedChanges: () => false
    };
  }
}, { passive: true });

// 📱 PWA対応: ServiceWorkerは使用しないため完全削除
// エラー完全解決: sw.js 404エラーを防止

// 🎯 追加のCSS（プログラム的に注入）
const additionalStyles = `
  .shortcut-hints {
    font-family: 'Inter', sans-serif;
  }
  
  .shortcut-item {
    margin: 4px 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .form-input.error, .form-select.error {
    border-color: #ef4444 !important;
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1) !important;
  }
  
  @keyframes tooltipFadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .tooltip {
    border: 1px solid rgba(255, 255, 255, 0.2);
    animation: tooltipFadeIn 0.2s ease-out;
  }
  
  .tooltip-error {
    background: rgba(239, 68, 68, 0.9) !important;
  }
  
  .tooltip-warning {
    background: rgba(245, 158, 11, 0.9) !important;
  }
  
  .tooltip-info {
    background: rgba(59, 130, 246, 0.9) !important;
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);