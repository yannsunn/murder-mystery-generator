/**
 * 🦴 Skeleton Loading UI System
 * スケルトンローディングとプログレッシブUI強化
 */

class SkeletonLoader {
  constructor() {
    this.activeSkeletons = new Map();
    this.animations = {
      pulse: 'skeleton-pulse',
      shimmer: 'skeleton-shimmer',
      wave: 'skeleton-wave'
    };
    
    this.injectStyles();
  }

  /**
   * スケルトンローディング用CSSスタイル注入
   */
  injectStyles() {
    if (document.getElementById('skeleton-styles')) return;

    const style = document.createElement('style');
    style.id = 'skeleton-styles';
    style.textContent = `
      .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        border-radius: 4px;
        position: relative;
        overflow: hidden;
      }

      .skeleton-pulse {
        animation: skeleton-pulse 1.5s ease-in-out infinite;
      }

      .skeleton-shimmer {
        animation: skeleton-shimmer 2s linear infinite;
      }

      .skeleton-wave {
        animation: skeleton-wave 1.6s linear infinite;
      }

      @keyframes skeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }

      @keyframes skeleton-shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      @keyframes skeleton-wave {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(100%); }
        100% { transform: translateX(100%); }
      }

      .skeleton-text {
        height: 1rem;
        margin-bottom: 0.5rem;
      }

      .skeleton-text.large {
        height: 1.5rem;
      }

      .skeleton-text.small {
        height: 0.75rem;
      }

      .skeleton-text.title {
        height: 2rem;
        width: 60%;
      }

      .skeleton-card {
        padding: 1rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        margin-bottom: 1rem;
      }

      .skeleton-button {
        height: 2.5rem;
        width: 120px;
        border-radius: 6px;
      }

      .skeleton-progress {
        height: 8px;
        border-radius: 4px;
        margin: 1rem 0;
      }

      .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }

      .skeleton-grid {
        display: grid;
        gap: 1rem;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      }

      .skeleton-fade-in {
        animation: skeleton-fade-in 0.3s ease-in;
      }

      .skeleton-fade-out {
        animation: skeleton-fade-out 0.3s ease-out;
      }

      @keyframes skeleton-fade-in {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes skeleton-fade-out {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
      }

      .skeleton-generation-card {
        padding: 2rem;
        border-radius: 12px;
        background: #ffffff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        margin: 1rem 0;
      }

      .skeleton-phase-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-bottom: 1px solid #f0f0f0;
      }

      .skeleton-phase-item:last-child {
        border-bottom: none;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * 基本的なスケルトン要素作成
   */
  createElement(type, className = '', animation = 'shimmer') {
    const element = document.createElement('div');
    element.className = `skeleton ${this.animations[animation]} ${className}`;
    return element;
  }

  /**
   * テキストスケルトン作成
   */
  createTextSkeleton(size = 'normal', width = '100%') {
    const skeleton = this.createElement('div', `skeleton-text ${size}`);
    skeleton.style.width = width;
    return skeleton;
  }

  /**
   * カードスケルトン作成
   */
  createCardSkeleton() {
    const card = this.createElement('div', 'skeleton-card');
    
    // タイトル
    card.appendChild(this.createTextSkeleton('title', '60%'));
    
    // コンテンツ行
    for (let i = 0; i < 3; i++) {
      const width = i === 2 ? '80%' : '100%';
      card.appendChild(this.createTextSkeleton('normal', width));
    }
    
    return card;
  }

  /**
   * 生成プロセス用スケルトン
   */
  createGenerationSkeleton() {
    const container = document.createElement('div');
    container.className = 'skeleton-generation-card skeleton-fade-in';
    
    // タイトル部分
    const titleSection = document.createElement('div');
    titleSection.appendChild(this.createTextSkeleton('large', '40%'));
    titleSection.appendChild(this.createTextSkeleton('normal', '60%'));
    container.appendChild(titleSection);
    
    // プログレスバー
    container.appendChild(this.createElement('div', 'skeleton-progress'));
    
    // フェーズリスト
    const phasesList = document.createElement('div');
    for (let i = 0; i < 8; i++) {
      const phaseItem = document.createElement('div');
      phaseItem.className = 'skeleton-phase-item';
      
      // アイコン部分
      phaseItem.appendChild(this.createElement('div', 'skeleton-avatar'));
      
      // テキスト部分
      const textSection = document.createElement('div');
      textSection.style.flex = '1';
      textSection.appendChild(this.createTextSkeleton('normal', '70%'));
      textSection.appendChild(this.createTextSkeleton('small', '40%'));
      phaseItem.appendChild(textSection);
      
      // ステータス部分
      phaseItem.appendChild(this.createElement('div', 'skeleton-button'));
      
      phasesList.appendChild(phaseItem);
    }
    
    container.appendChild(phasesList);
    return container;
  }

  /**
   * フォーム用スケルトン
   */
  createFormSkeleton() {
    const form = document.createElement('div');
    form.className = 'skeleton-fade-in';
    
    // フォームフィールド
    for (let i = 0; i < 6; i++) {
      const field = document.createElement('div');
      field.style.marginBottom = '1.5rem';
      
      // ラベル
      field.appendChild(this.createTextSkeleton('small', '30%'));
      
      // 入力フィールド
      const input = this.createElement('div', '', 'pulse');
      input.style.height = '2.5rem';
      input.style.marginTop = '0.5rem';
      field.appendChild(input);
      
      form.appendChild(field);
    }
    
    return form;
  }

  /**
   * 結果カード用スケルトン
   */
  createResultSkeleton() {
    const container = document.createElement('div');
    container.className = 'skeleton-fade-in';
    
    // ヘッダー
    const header = document.createElement('div');
    header.style.marginBottom = '2rem';
    header.appendChild(this.createTextSkeleton('title', '50%'));
    header.appendChild(this.createTextSkeleton('normal', '80%'));
    container.appendChild(header);
    
    // 統計グリッド
    const statsGrid = document.createElement('div');
    statsGrid.className = 'skeleton-grid';
    
    for (let i = 0; i < 3; i++) {
      const statCard = this.createCardSkeleton();
      statsGrid.appendChild(statCard);
    }
    
    container.appendChild(statsGrid);
    
    // フェーズ結果
    const phasesSection = document.createElement('div');
    phasesSection.style.marginTop = '2rem';
    
    for (let i = 0; i < 5; i++) {
      phasesSection.appendChild(this.createCardSkeleton());
    }
    
    container.appendChild(phasesSection);
    
    return container;
  }

  /**
   * スケルトン表示
   */
  show(containerId, type = 'card', options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      return null;
    }

    // 既存のスケルトンを削除
    this.hide(containerId);

    let skeleton;
    
    switch (type) {
      case 'generation':
        skeleton = this.createGenerationSkeleton();
        break;
      case 'form':
        skeleton = this.createFormSkeleton();
        break;
      case 'result':
        skeleton = this.createResultSkeleton();
        break;
      case 'card':
      default:
        skeleton = this.createCardSkeleton();
        break;
    }

    // オプション適用
    if (options.height) {
      skeleton.style.height = options.height;
    }
    
    if (options.className) {
      skeleton.classList.add(options.className);
    }

    // コンテナに追加
    container.innerHTML = '';
    container.appendChild(skeleton);
    
    // 管理用に記録
    this.activeSkeletons.set(containerId, {
      element: skeleton,
      type,
      startTime: Date.now()
    });

    return skeleton;
  }

  /**
   * スケルトン非表示
   */
  hide(containerId, fadeOut = true) {
    const skeletonData = this.activeSkeletons.get(containerId);
    if (!skeletonData) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    if (fadeOut) {
      skeletonData.element.classList.add('skeleton-fade-out');
      setTimeout(() => {
        if (container.contains(skeletonData.element)) {
          container.removeChild(skeletonData.element);
        }
        this.activeSkeletons.delete(containerId);
      }, 300);
    } else {
      if (container.contains(skeletonData.element)) {
        container.removeChild(skeletonData.element);
      }
      this.activeSkeletons.delete(containerId);
    }
  }

  /**
   * 段階的コンテンツ表示
   */
  showProgressiveContent(containerId, contentCreator, steps = 3, interval = 500) {
    const container = document.getElementById(containerId);
    if (!container) return;

    this.show(containerId, 'card');

    let currentStep = 0;
    
    const showNextStep = () => {
      if (currentStep >= steps) {
        // 最終コンテンツ表示
        this.hide(containerId);
        const finalContent = contentCreator();
        finalContent.classList.add('skeleton-fade-in');
        container.appendChild(finalContent);
        return;
      }

      // 段階的にスケルトンを更新
      const partialContent = contentCreator(currentStep / steps);
      if (partialContent) {
        container.innerHTML = '';
        container.appendChild(partialContent);
      }

      currentStep++;
      setTimeout(showNextStep, interval);
    };

    setTimeout(showNextStep, interval);
  }

  /**
   * 全スケルトン削除
   */
  hideAll() {
    for (const containerId of this.activeSkeletons.keys()) {
      this.hide(containerId, false);
    }
  }

  /**
   * 統計情報取得
   */
  getStats() {
    const stats = {
      active: this.activeSkeletons.size,
      instances: []
    };

    for (const [containerId, data] of this.activeSkeletons.entries()) {
      stats.instances.push({
        containerId,
        type: data.type,
        duration: Date.now() - data.startTime
      });
    }

    return stats;
  }
}

// グローバルインスタンス作成
const skeletonLoader = new SkeletonLoader();

// グローバルスコープで利用可能に
if (typeof window !== 'undefined') {
  window.SkeletonLoader = SkeletonLoader;
  window.skeletonLoader = skeletonLoader;
}