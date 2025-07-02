/**
 * 🎨 UX Enhancement System
 * ユーザーエクスペリエンス強化システム - インタラクション・フィードバック・アクセシビリティ
 */

class UXEnhancer {
  constructor() {
    this.isInitialized = false;
    this.activeToasts = new Map();
    this.tooltips = new Map();
    this.animations = {
      duration: 300,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
    };
    
    console.log('🎨 UXEnhancer initializing...');
    this.init();
  }

  /**
   * 初期化
   */
  init() {
    if (this.isInitialized) return;
    
    this.injectStyles();
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupTooltips();
    this.setupProgressiveEnhancement();
    this.setupReducedMotionSupport();
    this.setupTouchGestures();
    
    this.isInitialized = true;
    console.log('✅ UXEnhancer initialized successfully');
  }

  /**
   * UX強化用スタイル注入
   */
  injectStyles() {
    if (document.getElementById('ux-enhancement-styles')) return;

    const style = document.createElement('style');
    style.id = 'ux-enhancement-styles';
    style.textContent = `
      /* アクセシビリティ強化 */
      .focus-visible {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
      }
      
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* トースト通知 */
      .toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        pointer-events: none;
      }

      .toast {
        background: white;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        margin-bottom: 12px;
        padding: 16px 20px;
        min-width: 300px;
        max-width: 400px;
        pointer-events: auto;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border-left: 4px solid #10b981;
      }

      .toast.show {
        transform: translateX(0);
        opacity: 1;
      }

      .toast.success { border-left-color: #10b981; }
      .toast.error { border-left-color: #ef4444; }
      .toast.warning { border-left-color: #f59e0b; }
      .toast.info { border-left-color: #3b82f6; }

      .toast-content {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .toast-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .toast-text {
        flex: 1;
        color: #374151;
        font-weight: 500;
      }

      .toast-close {
        background: none;
        border: none;
        font-size: 18px;
        color: #6b7280;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 2px;
        transition: color 0.2s;
      }

      .toast-close:hover {
        color: #374151;
      }

      /* ツールチップ */
      .tooltip {
        position: absolute;
        background: #1f2937;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        pointer-events: none;
        white-space: nowrap;
        opacity: 0;
        transform: translateY(5px);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .tooltip.show {
        opacity: 1;
        transform: translateY(0);
      }

      .tooltip::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border: 5px solid transparent;
        border-top-color: #1f2937;
      }

      /* プログレスリング */
      .progress-ring {
        display: inline-block;
        position: relative;
        width: 40px;
        height: 40px;
      }

      .progress-ring svg {
        transform: rotate(-90deg);
        width: 100%;
        height: 100%;
      }

      .progress-ring circle {
        fill: none;
        stroke-width: 3;
        stroke-linecap: round;
      }

      .progress-ring .bg {
        stroke: rgba(255, 255, 255, 0.1);
      }

      .progress-ring .progress {
        stroke: #3b82f6;
        stroke-dasharray: 0 100;
        transition: stroke-dasharray 0.3s ease;
      }

      /* マイクロインタラクション */
      .interactive-element {
        position: relative;
        overflow: hidden;
        transition: all 0.2s ease;
      }

      .interactive-element::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: width 0.3s ease, height 0.3s ease;
        pointer-events: none;
      }

      .interactive-element:active::before {
        width: 200px;
        height: 200px;
      }

      /* フェードイン効果 */
      .fade-in {
        animation: fadeIn 0.5s ease-out;
      }

      .slide-in-up {
        animation: slideInUp 0.5s ease-out;
      }

      .slide-in-down {
        animation: slideInDown 0.5s ease-out;
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes slideInUp {
        from { 
          opacity: 0; 
          transform: translateY(30px); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0); 
        }
      }

      @keyframes slideInDown {
        from { 
          opacity: 0; 
          transform: translateY(-30px); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0); 
        }
      }

      /* ロード状態 */
      .loading-state {
        pointer-events: none;
        opacity: 0.6;
        position: relative;
      }

      .loading-state::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 20px;
        height: 20px;
        margin: -10px 0 0 -10px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #3b82f6;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      /* レスポンシブデザイン強化 */
      @media (max-width: 768px) {
        .toast {
          min-width: 280px;
          margin-left: 20px;
          margin-right: 20px;
        }
        
        .tooltip {
          max-width: 200px;
          white-space: normal;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .toast,
        .tooltip,
        .interactive-element,
        .fade-in,
        .slide-in-up,
        .slide-in-down {
          animation: none;
          transition: none;
        }
      }

      /* High contrast support */
      @media (prefers-contrast: high) {
        .toast {
          border-width: 2px;
          border-style: solid;
        }
        
        .tooltip {
          border: 1px solid white;
        }
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * キーボードナビゲーション設定
   */
  setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // ESCキーでモーダル・オーバーレイを閉じる
      if (e.key === 'Escape') {
        this.closeAllOverlays();
      }
      
      // Tab navigation enhancement
      if (e.key === 'Tab') {
        this.enhanceTabNavigation(e);
      }
      
      // Arrow key navigation for radio groups
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        this.handleArrowNavigation(e);
      }
    });
  }

  /**
   * フォーカス管理
   */
  setupFocusManagement() {
    // Focus visible support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    });

    document.addEventListener('mousedown', () => {
      document.body.classList.remove('keyboard-navigation');
    });

    // Focus trap for modals
    this.setupFocusTrap();
  }

  /**
   * ツールチップ設定
   */
  setupTooltips() {
    // data-tooltip属性を持つ要素にツールチップを追加
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
      element.addEventListener('mouseenter', (e) => this.showTooltip(e));
      element.addEventListener('mouseleave', () => this.hideTooltip());
      element.addEventListener('focus', (e) => this.showTooltip(e));
      element.addEventListener('blur', () => this.hideTooltip());
    });
  }

  /**
   * プログレッシブエンハンスメント
   */
  setupProgressiveEnhancement() {
    // Intersection Observer for animations
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });

      // Observe elements with animate-on-scroll class
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
      });
    }
  }

  /**
   * Reduced motion support
   */
  setupReducedMotionSupport() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (prefersReducedMotion.matches) {
      document.body.classList.add('reduced-motion');
    }
    
    prefersReducedMotion.addEventListener('change', (e) => {
      if (e.matches) {
        document.body.classList.add('reduced-motion');
      } else {
        document.body.classList.remove('reduced-motion');
      }
    });
  }

  /**
   * タッチジェスチャー設定
   */
  setupTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });

    document.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Swipe gestures
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          this.handleSwipeRight();
        } else {
          this.handleSwipeLeft();
        }
      }
    });
  }

  /**
   * トースト通知表示
   */
  showToast(message, type = 'info', duration = 5000) {
    const toastContainer = this.getOrCreateToastContainer();
    const toastId = `toast-${Date.now()}`;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.id = toastId;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-text">${message}</span>
        <button class="toast-close" aria-label="Close notification">×</button>
      </div>
    `;

    // Close button functionality
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => this.hideToast(toastId));

    toastContainer.appendChild(toast);

    // Show animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto hide
    const timeoutId = setTimeout(() => this.hideToast(toastId), duration);
    
    this.activeToasts.set(toastId, { element: toast, timeoutId });

    return toastId;
  }

  /**
   * トースト非表示
   */
  hideToast(toastId) {
    const toastData = this.activeToasts.get(toastId);
    if (!toastData) return;

    const { element, timeoutId } = toastData;
    
    clearTimeout(timeoutId);
    element.classList.remove('show');
    
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.activeToasts.delete(toastId);
    }, 300);
  }

  /**
   * ツールチップ表示
   */
  showTooltip(event) {
    const element = event.target;
    const text = element.getAttribute('data-tooltip');
    if (!text) return;

    this.hideTooltip(); // Hide existing tooltip

    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    tooltip.id = 'active-tooltip';

    document.body.appendChild(tooltip);

    // Position tooltip
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
    let top = rect.top - tooltipRect.height - 10;

    // Adjust if tooltip goes off screen
    if (left < 10) left = 10;
    if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    if (top < 10) {
      top = rect.bottom + 10;
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;

    setTimeout(() => tooltip.classList.add('show'), 10);
  }

  /**
   * ツールチップ非表示
   */
  hideTooltip() {
    const tooltip = document.getElementById('active-tooltip');
    if (tooltip) {
      tooltip.classList.remove('show');
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      }, 200);
    }
  }

  /**
   * プログレスリング作成
   */
  createProgressRing(percentage) {
    const circumference = 2 * Math.PI * 16; // radius = 16
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    
    return `
      <div class="progress-ring">
        <svg>
          <circle class="bg" cx="20" cy="20" r="16"></circle>
          <circle class="progress" cx="20" cy="20" r="16" style="stroke-dasharray: ${strokeDasharray}"></circle>
        </svg>
      </div>
    `;
  }

  /**
   * 要素にインタラクション効果を追加
   */
  addInteractiveEffect(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      element.classList.add('interactive-element');
    });
  }

  /**
   * ローディング状態の設定
   */
  setLoadingState(element, isLoading) {
    if (isLoading) {
      element.classList.add('loading-state');
      element.setAttribute('aria-busy', 'true');
    } else {
      element.classList.remove('loading-state');
      element.setAttribute('aria-busy', 'false');
    }
  }

  /**
   * Helper methods
   */
  getOrCreateToastContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  setupFocusTrap() {
    // Focus trap implementation for modals
    // This would be expanded based on specific modal requirements
  }

  enhanceTabNavigation(event) {
    // Enhanced tab navigation logic
    const focusableElements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }

  handleArrowNavigation(event) {
    const target = event.target;
    if (target.type === 'radio') {
      const radioGroup = document.querySelectorAll(`input[name="${target.name}"]`);
      const currentIndex = Array.from(radioGroup).indexOf(target);
      
      let nextIndex;
      if (event.key === 'ArrowDown') {
        nextIndex = (currentIndex + 1) % radioGroup.length;
      } else {
        nextIndex = (currentIndex - 1 + radioGroup.length) % radioGroup.length;
      }
      
      radioGroup[nextIndex].focus();
      radioGroup[nextIndex].checked = true;
      event.preventDefault();
    }
  }

  handleSwipeLeft() {
    // Custom swipe left logic
    const event = new CustomEvent('swipeLeft');
    document.dispatchEvent(event);
  }

  handleSwipeRight() {
    // Custom swipe right logic
    const event = new CustomEvent('swipeRight');
    document.dispatchEvent(event);
  }

  closeAllOverlays() {
    // Close any open modals, dropdowns, etc.
    this.hideTooltip();
    
    // Hide any open dropdowns
    const openDropdowns = document.querySelectorAll('.dropdown.open');
    openDropdowns.forEach(dropdown => dropdown.classList.remove('open'));
  }
}

// グローバルインスタンス作成
const uxEnhancer = new UXEnhancer();

// グローバルスコープで利用可能に
if (typeof window !== 'undefined') {
  window.UXEnhancer = UXEnhancer;
  window.uxEnhancer = uxEnhancer;
}