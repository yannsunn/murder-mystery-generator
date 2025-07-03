/**
 * 🎨 UI COMPONENTS - 統合UIコンポーネント集
 * SkeletonLoader, UXEnhancer, Handout Manager等を統合
 */

/**
 * スケルトンローダー
 */
class SkeletonLoader {
  constructor() {
    this.activeLoaders = new Map();
  }

  show(targetId, options = {}) {
    const target = document.getElementById(targetId);
    if (!target) return;
    
    const loader = this.createLoader(options);
    target.appendChild(loader);
    this.activeLoaders.set(targetId, loader);
    
    logger.debug(`Skeleton loader shown: ${targetId}`);
  }

  hide(targetId) {
    const loader = this.activeLoaders.get(targetId);
    if (loader) {
      loader.remove();
      this.activeLoaders.delete(targetId);
      logger.debug(`Skeleton loader hidden: ${targetId}`);
    }
  }

  createLoader(options) {
    const loader = document.createElement('div');
    loader.className = 'skeleton-loader';
    
    const lines = options.lines || 3;
    for (let i = 0; i < lines; i++) {
      const line = document.createElement('div');
      line.className = 'skeleton-line';
      line.style.width = `${60 + Math.random() * 40}%`;
      loader.appendChild(line);
    }
    
    return loader;
  }
}

/**
 * UXエンハンサー
 */
class UXEnhancer {
  constructor() {
    this.toasts = [];
    this.tooltips = new Map();
  }

  /**
   * トースト通知表示
   */
  showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // アイコン追加
    const icon = this.getToastIcon(type);
    if (icon) {
      toast.insertAdjacentHTML('afterbegin', `<span class="toast-icon">${icon}</span>`);
    }
    
    document.body.appendChild(toast);
    
    // アニメーション
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    // 自動削除
    const timer = resourceManager.setTimeout(() => {
      toast.classList.remove('show');
      resourceManager.setTimeout(() => toast.remove(), 300);
    }, duration);
    
    this.toasts.push({ element: toast, timer });
    
    return toast;
  }

  getToastIcon(type) {
    const icons = {
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };
    return icons[type] || '';
  }

  /**
   * インタラクティブエフェクト追加
   */
  addInteractiveEffect(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // ホバーエフェクト
      resourceManager.addEventListener(element, 'mouseenter', () => {
        element.classList.add('hover-effect');
      });
      
      resourceManager.addEventListener(element, 'mouseleave', () => {
        element.classList.remove('hover-effect');
      });
      
      // クリックリップル
      resourceManager.addEventListener(element, 'click', (e) => {
        this.createRipple(element, e);
      });
    });
  }

  createRipple(element, event) {
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    
    element.appendChild(ripple);
    
    resourceManager.setTimeout(() => ripple.remove(), 600);
  }

  /**
   * ツールチップ追加
   */
  addTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    
    resourceManager.addEventListener(element, 'mouseenter', (e) => {
      document.body.appendChild(tooltip);
      this.positionTooltip(tooltip, element);
      tooltip.classList.add('show');
    });
    
    resourceManager.addEventListener(element, 'mouseleave', () => {
      tooltip.classList.remove('show');
      resourceManager.setTimeout(() => tooltip.remove(), 200);
    });
    
    this.tooltips.set(element, tooltip);
  }

  positionTooltip(tooltip, element) {
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let top = rect.top - tooltipRect.height - 10;
    let left = rect.left + (rect.width - tooltipRect.width) / 2;
    
    // 画面外チェック
    if (top < 0) {
      top = rect.bottom + 10;
    }
    if (left < 0) {
      left = 10;
    }
    if (left + tooltipRect.width > window.innerWidth) {
      left = window.innerWidth - tooltipRect.width - 10;
    }
    
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
  }
}

/**
 * ハンドアウトマネージャー
 */
class HandoutManager {
  constructor() {
    this.handouts = new Map();
    this.activeHandout = null;
  }

  /**
   * ハンドアウト追加
   */
  addHandout(playerId, content) {
    this.handouts.set(playerId, {
      id: playerId,
      content: content,
      createdAt: Date.now()
    });
    
    logger.debug(`Handout added for player ${playerId}`);
  }

  /**
   * ハンドアウト表示
   */
  displayHandout(playerId) {
    const handout = this.handouts.get(playerId);
    if (!handout) {
      logger.warn(`Handout not found for player ${playerId}`);
      return;
    }
    
    const modal = this.createHandoutModal(handout);
    document.body.appendChild(modal);
    
    this.activeHandout = modal;
    
    // モーダルアニメーション
    requestAnimationFrame(() => {
      modal.classList.add('show');
    });
  }

  createHandoutModal(handout) {
    const modal = document.createElement('div');
    modal.className = 'handout-modal';
    
    const content = document.createElement('div');
    content.className = 'handout-content';
    
    const header = document.createElement('div');
    header.className = 'handout-header';
    header.innerHTML = `
      <h3>プレイヤー${handout.id}のハンドアウト</h3>
      <button class="close-btn">&times;</button>
    `;
    
    const body = document.createElement('div');
    body.className = 'handout-body';
    body.innerHTML = this.formatHandoutContent(handout.content);
    
    content.appendChild(header);
    content.appendChild(body);
    modal.appendChild(content);
    
    // 閉じるボタン
    const closeBtn = header.querySelector('.close-btn');
    resourceManager.addEventListener(closeBtn, 'click', () => {
      this.closeHandout();
    });
    
    // 背景クリックで閉じる
    resourceManager.addEventListener(modal, 'click', (e) => {
      if (e.target === modal) {
        this.closeHandout();
      }
    });
    
    return modal;
  }

  formatHandoutContent(content) {
    return content
      .replace(/## (.+)/g, '<h4>$1</h4>')
      .replace(/### (.+)/g, '<h5>$1</h5>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  closeHandout() {
    if (this.activeHandout) {
      this.activeHandout.classList.remove('show');
      resourceManager.setTimeout(() => {
        this.activeHandout.remove();
        this.activeHandout = null;
      }, 300);
    }
  }

  /**
   * ハンドアウト一覧表示
   */
  displayHandoutList() {
    const list = document.createElement('div');
    list.className = 'handout-list';
    
    for (const [playerId, handout] of this.handouts) {
      const item = document.createElement('div');
      item.className = 'handout-list-item';
      item.innerHTML = `
        <span>プレイヤー${playerId}</span>
        <button class="btn btn-small">表示</button>
      `;
      
      const button = item.querySelector('button');
      resourceManager.addEventListener(button, 'click', () => {
        this.displayHandout(playerId);
      });
      
      list.appendChild(item);
    }
    
    return list;
  }
}

/**
 * リアルタイムエンハンサー
 */
class RealTimeEnhancer {
  constructor() {
    this.animations = new Map();
    this.observers = new Map();
  }

  /**
   * 要素の出現アニメーション
   */
  observeElement(element, options = {}) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          if (options.once) {
            observer.unobserve(entry.target);
          }
        } else if (!options.once) {
          entry.target.classList.remove('animate-in');
        }
      });
    }, {
      threshold: options.threshold || 0.1,
      rootMargin: options.rootMargin || '0px'
    });
    
    observer.observe(element);
    this.observers.set(element, observer);
  }

  /**
   * カウントアップアニメーション
   */
  animateNumber(element, start, end, duration = 1000) {
    const startTime = performance.now();
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const current = Math.floor(start + (end - start) * this.easeOutQuad(progress));
      element.textContent = current.toLocaleString();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }

  easeOutQuad(t) {
    return t * (2 - t);
  }

  /**
   * プログレスリング
   */
  createProgressRing(size = 120, strokeWidth = 8) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
    svg.className = 'progress-ring';
    
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    
    // 背景円
    const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    bgCircle.setAttribute('cx', size / 2);
    bgCircle.setAttribute('cy', size / 2);
    bgCircle.setAttribute('r', radius);
    bgCircle.setAttribute('stroke', '#e0e0e0');
    bgCircle.setAttribute('stroke-width', strokeWidth);
    bgCircle.setAttribute('fill', 'none');
    
    // 進捗円
    const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    progressCircle.setAttribute('cx', size / 2);
    progressCircle.setAttribute('cy', size / 2);
    progressCircle.setAttribute('r', radius);
    progressCircle.setAttribute('stroke', '#667eea');
    progressCircle.setAttribute('stroke-width', strokeWidth);
    progressCircle.setAttribute('fill', 'none');
    progressCircle.setAttribute('stroke-linecap', 'round');
    progressCircle.setAttribute('stroke-dasharray', circumference);
    progressCircle.setAttribute('stroke-dashoffset', circumference);
    progressCircle.setAttribute('transform', `rotate(-90 ${size / 2} ${size / 2})`);
    progressCircle.className = 'progress-ring-circle';
    
    svg.appendChild(bgCircle);
    svg.appendChild(progressCircle);
    
    return {
      element: svg,
      setProgress: (percent) => {
        const offset = circumference - (percent / 100) * circumference;
        progressCircle.setAttribute('stroke-dashoffset', offset);
      }
    };
  }
}

// グローバルインスタンス作成
window.uiComponents = {
  skeletonLoader: new SkeletonLoader(),
  uxEnhancer: new UXEnhancer(),
  handoutManager: new HandoutManager(),
  realTimeEnhancer: new RealTimeEnhancer()
};

// エクスポート
export { SkeletonLoader, UXEnhancer, HandoutManager, RealTimeEnhancer };