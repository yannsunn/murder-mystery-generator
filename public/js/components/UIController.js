/**
 * UIController - UI操作の統一管理
 * DOM操作、アニメーション、ユーザーインタラクションを統制
 */
import EventEmitter from '../core/EventEmitter.js';
import Logger from '../core/Logger.js';

class UIController extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.animationDuration = options.animationDuration || 300;
    this.debounceDelay = options.debounceDelay || 300;
    this.elements = new Map();
    this.animations = new Map();
    this.debouncedFunctions = new Map();
    
    this.setupDefaultElements();
    this.setupEventDelegation();
    this.setupAccessibility();
  }

  /**
   * デフォルト要素の設定
   */
  setupDefaultElements() {
    const elementMap = {
      // ステップ要素
      stepContainer: '#step-container',
      stepIndicators: '.step-indicator-item',
      steps: '.step',
      
      // ナビゲーション
      prevBtn: '#prev-btn',
      nextBtn: '#next-btn',
      generateBtn: '#stepwise-generation-btn',
      buttonContainer: '.button-container',
      
      // フォーム
      form: '#scenario-form',
      formInputs: 'input, select, textarea',
      
      // 状態表示
      loadingIndicator: '#loading-indicator',
      errorContainer: '#error-container',
      resultContainer: '#result-container',
      progressAnnouncements: '#progress-announcements',
      
      // 設定サマリー
      settingsSummary: '#settings-summary',
      
      // ハンドアウト表示
      handoutsContainer: '#handouts-container',
      handoutsList: '#handouts-list',
      
      // PDFダウンロード
      pdfDownloadBtn: '#pdf-download-btn'
    };

    this.cacheElements(elementMap);
  }

  /**
   * 要素をキャッシュ
   */
  cacheElements(elementMap) {
    for (const [key, selector] of Object.entries(elementMap)) {
      if (selector.startsWith('.') || selector.startsWith('[')) {
        this.elements.set(key, document.querySelectorAll(selector));
      } else {
        this.elements.set(key, document.querySelector(selector));
      }
    }
  }

  /**
   * 要素を取得（キャッシュ付き）
   */
  getElement(key) {
    if (this.elements.has(key)) {
      return this.elements.get(key);
    }

    Logger.warn(`Element "${key}" not found in cache`);
    return null;
  }

  /**
   * 要素を再キャッシュ
   */
  refreshElement(key, selector) {
    if (selector.startsWith('.') || selector.startsWith('[')) {
      this.elements.set(key, document.querySelectorAll(selector));
    } else {
      this.elements.set(key, document.querySelector(selector));
    }
  }

  /**
   * イベント委譲の設定
   */
  setupEventDelegation() {
    // フォーム変更イベント
    this.delegateEvent('change', 'input, select', (e) => {
      this.handleFormChange(e);
    });

    // フォーカスイベント
    this.delegateEvent('focus', 'input, select, textarea', (e) => {
      this.handleElementFocus(e);
    });

    // ボタンクリックイベント
    this.delegateEvent('click', 'button', (e) => {
      this.handleButtonClick(e);
    });

    // ステップインジケータークリック
    this.delegateEvent('click', '.step-indicator-item', (e) => {
      this.handleStepIndicatorClick(e);
    });
  }

  /**
   * イベント委譲の実装
   */
  delegateEvent(eventType, selector, handler) {
    document.addEventListener(eventType, (e) => {
      if (e.target.matches(selector)) {
        handler(e);
      }
    }, { passive: eventType.startsWith('touch') });
  }

  /**
   * アクセシビリティ設定
   */
  setupAccessibility() {
    // ARIA ライブリージョンの設定
    this.setupAriaLiveRegions();
    
    // フォーカストラップの設定
    this.setupFocusTrap();
    
    // キーボードナビゲーション
    this.setupKeyboardNavigation();
  }

  /**
   * ARIA ライブリージョンの設定
   */
  setupAriaLiveRegions() {
    const announcements = this.getElement('progressAnnouncements');
    if (announcements) {
      announcements.setAttribute('aria-live', 'polite');
      announcements.setAttribute('aria-atomic', 'true');
    }
  }

  /**
   * ステップ表示の更新
   */
  updateStepVisibility(currentStep, totalSteps) {
    const steps = this.getElement('steps');
    
    if (!steps) {
      Logger.warn('Steps elements not found');
      return;
    }

    // アニメーションID生成
    const animationId = `step-transition-${Date.now()}`;
    
    // 既存のアニメーションをキャンセル
    this.cancelAnimation();

    // ステップ切り替えアニメーション
    this.animations.set(animationId, this.animateStepTransition(currentStep));

    // ステップインジケーター更新
    this.updateStepIndicators(currentStep, totalSteps);
    
    // ボタン状態更新
    this.updateNavigationButtons(currentStep, totalSteps);

    // ARIA通知
    this.announceStepChange(currentStep, totalSteps);
  }

  /**
   * ステップ切り替えアニメーション
   */
  async animateStepTransition(targetStep) {
    const steps = document.querySelectorAll('.step');
    const targetElement = document.getElementById(`step-${targetStep}`);

    if (!targetElement) {
      Logger.warn(`Step element not found: step-${targetStep}`);
      return;
    }

    try {
      // 全ステップを非表示
      steps.forEach(step => {
        step.classList.add('hidden');
        step.style.display = 'none';
      });

      // ターゲットステップを表示準備
      targetElement.classList.remove('hidden');
      targetElement.style.display = 'block';
      targetElement.style.opacity = '0';
      targetElement.style.transform = 'translateX(20px)';

      // アニメーション実行
      await this.animateElement(targetElement, {
        opacity: '1',
        transform: 'translateX(0)'
      }, this.animationDuration);

      this.emit('ui:step:transition:complete', { step: targetStep });

    } catch (error) {
      Logger.error('Step transition animation failed:', error);
      
      // フォールバック: 即座に表示
      targetElement.style.opacity = '1';
      targetElement.style.transform = 'translateX(0)';
    }
  }

  /**
   * 要素アニメーション
   */
  animateElement(element, styles, duration = this.animationDuration) {
    return new Promise((resolve) => {
      const originalTransition = element.style.transition;
      
      element.style.transition = `all ${duration}ms ease-out`;
      
      // スタイル適用
      Object.assign(element.style, styles);
      
      // アニメーション完了待機
      setTimeout(() => {
        element.style.transition = originalTransition;
        resolve();
      }, duration);
    });
  }

  /**
   * ステップインジケーター更新
   */
  updateStepIndicators(currentStep, totalSteps) {
    const indicators = this.getElement('stepIndicators');
    
    if (!indicators) return;

    indicators.forEach((indicator, index) => {
      const stepNum = index + 1;
      const classList = indicator.classList;
      
      // クラスリセット
      classList.remove('active', 'completed');
      
      if (stepNum === currentStep) {
        classList.add('active');
        indicator.setAttribute('aria-current', 'step');
      } else if (stepNum < currentStep) {
        classList.add('completed');
        indicator.removeAttribute('aria-current');
      } else {
        indicator.removeAttribute('aria-current');
      }

      // ARIA属性更新
      indicator.setAttribute('aria-label', 
        `ステップ ${stepNum}: ${indicator.dataset.title || ''} ${
          stepNum === currentStep ? '(現在)' : 
          stepNum < currentStep ? '(完了)' : '(未完了)'
        }`
      );
    });
  }

  /**
   * ナビゲーションボタン更新
   */
  updateNavigationButtons(currentStep, totalSteps) {
    const prevBtn = this.getElement('prevBtn');
    const nextBtn = this.getElement('nextBtn');
    const generateBtn = this.getElement('generateBtn');

    if (!prevBtn || !nextBtn || !generateBtn) {
      Logger.warn('Navigation buttons not found');
      return;
    }

    if (currentStep === 1) {
      // 最初のステップ
      prevBtn.style.visibility = 'hidden';
      prevBtn.setAttribute('aria-hidden', 'true');
      nextBtn.style.display = 'flex';
      nextBtn.removeAttribute('aria-hidden');
      generateBtn.style.display = 'none';
      generateBtn.setAttribute('aria-hidden', 'true');
    } else if (currentStep === totalSteps) {
      // 最後のステップ
      prevBtn.style.visibility = 'visible';
      prevBtn.removeAttribute('aria-hidden');
      nextBtn.style.display = 'none';
      nextBtn.setAttribute('aria-hidden', 'true');
      generateBtn.style.display = 'flex';
      generateBtn.removeAttribute('aria-hidden');
    } else {
      // 中間ステップ
      prevBtn.style.visibility = 'visible';
      prevBtn.removeAttribute('aria-hidden');
      nextBtn.style.display = 'flex';
      nextBtn.removeAttribute('aria-hidden');
      generateBtn.style.display = 'none';
      generateBtn.setAttribute('aria-hidden', 'true');
    }

    // ボタンの有効/無効状態も更新
    this.updateButtonStates(currentStep, totalSteps);
  }

  /**
   * ボタン状態更新
   */
  updateButtonStates(currentStep, totalSteps) {
    const prevBtn = this.getElement('prevBtn');
    const nextBtn = this.getElement('nextBtn');

    if (prevBtn) {
      prevBtn.disabled = currentStep === 1;
    }

    // nextBtnの状態は別途バリデーション結果で制御される
  }

  /**
   * フォーム変更ハンドラー
   */
  handleFormChange(event) {
    const { target } = event;
    const { name, value, type, checked } = target;
    
    const formData = {
      name,
      value: type === 'checkbox' ? checked : value,
      type,
      element: target
    };

    // デバウンス処理
    this.debounce(`form-change-${name}`, () => {
      this.emit('form:change', formData);
      this.validateField(target);
      this.updateDependentFields(target);
    }, this.debounceDelay);
  }

  /**
   * フィールドバリデーション
   */
  validateField(field) {
    const { name, value, type } = field;
    let isValid = true;
    let errorMessage = '';

    try {
      switch (name) {
        case 'participants':
          const participants = parseInt(value);
          if (!participants || participants < 4 || participants > 8) {
            isValid = false;
            errorMessage = '参加人数は4-8人の範囲で選択してください';
          }
          break;

        default:
          if (field.hasAttribute('required') && !value.trim()) {
            isValid = false;
            errorMessage = 'この項目は必須です';
          }
      }

      if (isValid) {
        this.clearFieldError(field);
      } else {
        this.showFieldError(field, errorMessage);
      }

      this.emit('field:validated', {
        field: name,
        value,
        valid: isValid,
        error: errorMessage
      });

    } catch (error) {
      Logger.error('Field validation error:', error);
      this.showFieldError(field, 'バリデーションエラーが発生しました');
    }
  }

  /**
   * フィールドエラー表示
   */
  showFieldError(field, message) {
    field.classList.add('error');
    field.setAttribute('aria-invalid', 'true');
    
    // エラーメッセージ要素を作成/更新
    let errorElement = field.parentNode.querySelector('.error-message');
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.className = 'error-message';
      errorElement.setAttribute('role', 'alert');
      field.parentNode.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    field.setAttribute('aria-describedby', errorElement.id || 'error-' + field.name);
  }

  /**
   * フィールドエラー消去
   */
  clearFieldError(field) {
    field.classList.remove('error');
    field.removeAttribute('aria-invalid');
    
    const errorElement = field.parentNode.querySelector('.error-message');
    if (errorElement) {
      errorElement.remove();
    }
    
    field.removeAttribute('aria-describedby');
  }

  /**
   * 依存フィールド更新
   */
  updateDependentFields(changedField) {
    const { name, value } = changedField;
    
    switch (name) {
      case 'era':
        this.updateSettingOptions(value);
        break;
      case 'participants':
        this.updateComplexityRecommendation(value);
        break;
      case 'worldview':
        this.suggestMatchingTone(value);
        break;
    }
  }

  /**
   * 設定オプション更新
   */
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

  /**
   * セレクト要素のアニメーション更新
   */
  async animateSelectUpdate(selectElement, options) {
    // フェードアウト
    await this.animateElement(selectElement, { opacity: '0.5' }, 150);
    
    // オプション更新
    selectElement.innerHTML = '';
    options.forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.text;
      selectElement.appendChild(optionElement);
    });
    
    // フェードイン
    await this.animateElement(selectElement, { opacity: '1' }, 150);
    
    this.emit('ui:select:updated', {
      element: selectElement,
      options: options.length
    });
  }

  /**
   * ローディング状態管理
   */
  showLoading(message = 'Loading...', progress = null) {
    const loadingIndicator = this.getElement('loadingIndicator');
    if (!loadingIndicator) return;

    this.hideAllContainers();
    
    // メッセージ更新
    const messageElement = loadingIndicator.querySelector('.loading-message');
    if (messageElement) {
      messageElement.textContent = message;
    }

    // 進捗更新
    if (progress !== null) {
      this.updateProgress(progress);
    }

    // ARIA通知
    this.announceToScreenReader(`読み込み中: ${message}`);

    loadingIndicator.classList.remove('hidden');
    loadingIndicator.style.display = 'block';

    this.emit('ui:loading:show', { message, progress });
  }

  hideLoading() {
    const loadingIndicator = this.getElement('loadingIndicator');
    if (loadingIndicator) {
      loadingIndicator.classList.add('hidden');
      loadingIndicator.style.display = 'none';
    }

    this.emit('ui:loading:hide');
  }

  /**
   * 進捗更新
   */
  updateProgress(percentage, phase = '', details = '', estimatedTime = '') {
    // 進捗バー更新
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressPercentage = document.getElementById('progress-percentage');
    
    if (progressFill) {
      progressFill.style.width = `${percentage}%`;
    }
    
    if (progressText) {
      progressText.textContent = `${percentage}%`;
    }
    
    if (progressPercentage) {
      progressPercentage.textContent = `${percentage}%`;
    }

    // フェーズ情報更新
    const currentPhase = document.getElementById('current-phase');
    const phaseDetails = document.getElementById('phase-details');
    const estimatedTimeElement = document.getElementById('estimated-time');
    
    if (currentPhase && phase) {
      currentPhase.textContent = phase;
    }
    
    if (phaseDetails && details) {
      phaseDetails.textContent = details;
    }
    
    if (estimatedTimeElement && estimatedTime) {
      estimatedTimeElement.textContent = estimatedTime;
    }

    // ARIA通知
    this.announceToScreenReader(`進行状況 ${percentage}% - ${phase}`);

    this.emit('ui:progress:update', {
      percentage,
      phase,
      details,
      estimatedTime
    });
  }

  /**
   * エラー表示
   */
  showError(message, type = 'error') {
    this.hideAllContainers();
    
    const errorContainer = this.getElement('errorContainer');
    if (!errorContainer) return;

    const errorMessage = errorContainer.querySelector('#error-message');
    if (errorMessage) {
      errorMessage.innerHTML = '';
      
      const messageElement = document.createElement('div');
      messageElement.textContent = message;
      messageElement.className = `error-message-text error-${type}`;
      errorMessage.appendChild(messageElement);
    }

    errorContainer.classList.remove('hidden');
    errorContainer.style.display = 'block';

    // ARIA通知
    this.announceToScreenReader(`エラー: ${message}`, 'assertive');

    this.emit('ui:error:show', { message, type });

    // 自動非表示タイマー
    setTimeout(() => {
      this.hideError();
    }, 10000);
  }

  hideError() {
    const errorContainer = this.getElement('errorContainer');
    if (errorContainer) {
      errorContainer.classList.add('hidden');
      errorContainer.style.display = 'none';
    }

    this.emit('ui:error:hide');
  }

  /**
   * コンテナ管理
   */
  hideAllContainers() {
    const containers = [
      this.getElement('loadingIndicator'),
      this.getElement('errorContainer'),
      this.getElement('resultContainer')
    ];

    containers.forEach(container => {
      if (container) {
        container.classList.add('hidden');
        container.style.display = 'none';
      }
    });
  }

  /**
   * スクリーンリーダー通知
   */
  announceToScreenReader(message, priority = 'polite') {
    const announcements = this.getElement('progressAnnouncements');
    if (announcements) {
      announcements.setAttribute('aria-live', priority);
      announcements.textContent = message;
      
      // 短時間後にクリア（連続通知のため）
      setTimeout(() => {
        announcements.textContent = '';
      }, 1000);
    }
  }

  /**
   * ステップ変更通知
   */
  announceStepChange(currentStep, totalSteps) {
    const stepElement = document.getElementById(`step-${currentStep}`);
    const stepTitle = stepElement?.querySelector('h3')?.textContent || `ステップ ${currentStep}`;
    
    this.announceToScreenReader(
      `${stepTitle}に移動しました。${currentStep}/${totalSteps}ステップ`
    );
  }

  /**
   * キーボードナビゲーション
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, select, textarea')) return;

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          this.emit('navigation:next');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          this.emit('navigation:previous');
          break;
        case 'Enter':
          if (e.ctrlKey) {
            e.preventDefault();
            this.emit('navigation:generate');
          }
          break;
        case 'Escape':
          e.preventDefault();
          this.emit('navigation:cancel');
          break;
      }
    });
  }

  /**
   * フォーカストラップ
   */
  setupFocusTrap() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.handleTabNavigation(e);
      }
    });
  }

  handleTabNavigation(e) {
    const focusableElements = document.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  }

  /**
   * イベントハンドラー
   */
  handleElementFocus(event) {
    this.emit('ui:focus', { element: event.target });
  }

  handleButtonClick(event) {
    const button = event.target.closest('button');
    if (!button) return;

    this.emit('ui:button:click', {
      button: button.id || button.className,
      element: button
    });
  }

  handleStepIndicatorClick(event) {
    const indicator = event.target.closest('.step-indicator-item');
    if (!indicator) return;

    const targetStep = parseInt(indicator.dataset.step);
    if (targetStep) {
      this.emit('ui:step:navigate', { targetStep });
    }
  }

  /**
   * ユーティリティ
   */
  debounce(key, func, delay) {
    if (this.debouncedFunctions.has(key)) {
      clearTimeout(this.debouncedFunctions.get(key));
    }

    const timeoutId = setTimeout(func, delay);
    this.debouncedFunctions.set(key, timeoutId);
  }

  cancelAnimation() {
    for (const [id, animation] of this.animations) {
      if (animation && typeof animation.cancel === 'function') {
        animation.cancel();
      }
    }
    this.animations.clear();
  }

  /**
   * クリーンアップ
   */
  destroy() {
    this.cancelAnimation();
    
    for (const timeoutId of this.debouncedFunctions.values()) {
      clearTimeout(timeoutId);
    }
    
    this.debouncedFunctions.clear();
    this.elements.clear();
    this.removeAllListeners();
  }

  /**
   * ハンドアウト表示
   */
  displayHandouts(handouts) {
    const container = this.getElement('handoutsContainer');
    const list = this.getElement('handoutsList');
    
    if (!container || !list) {
      Logger.warn('Handouts container not found');
      return;
    }

    list.innerHTML = '';
    
    handouts.forEach((handout, index) => {
      const handoutElement = document.createElement('div');
      handoutElement.className = 'handout-item';
      handoutElement.innerHTML = `
        <h3>📄 ${handout.character}</h3>
        <div class="handout-content">
          ${this.formatHandoutContent(handout.content)}
        </div>
        <button class="copy-handout-btn" data-character="${handout.character}">
          📋 コピー
        </button>
      `;
      list.appendChild(handoutElement);
    });

    this.showElement(container);
    this.emit('handouts:displayed', { count: handouts.length });
  }

  /**
   * ハンドアウト内容のフォーマット
   */
  formatHandoutContent(content) {
    return content
      .replace(/##\s(.+)/g, '<h4>$1</h4>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>');
  }

  /**
   * PDFダウンロードボタンの表示
   */
  showPDFDownloadButton(pdfData) {
    const btn = this.getElement('pdfDownloadBtn');
    if (!btn) {
      Logger.warn('PDF download button not found');
      return;
    }

    btn.style.display = 'inline-block';
    btn.onclick = () => this.downloadPDF(pdfData);
    this.emit('pdf:button:shown');
  }

  /**
   * PDFダウンロード
   */
  downloadPDF(pdfBase64) {
    try {
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${pdfBase64}`;
      link.download = `murder_mystery_${Date.now()}.pdf`;
      link.click();
      
      this.emit('pdf:downloaded');
    } catch (error) {
      Logger.error('PDF download failed:', error);
      this.showError('PDFダウンロードに失敗しました');
    }
  }
}

export default UIController;