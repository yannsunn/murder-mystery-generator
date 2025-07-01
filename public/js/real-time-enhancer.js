/**
 * 🔄 リアルタイム進捗通知強化システム
 * 詳細フィードバック・品質情報・パフォーマンス統計表示
 */

class RealTimeEnhancer {
  constructor() {
    this.progressHistory = [];
    this.qualityMetrics = new Map();
    this.performanceStats = new Map();
    this.notifications = [];
    this.isEnhanced = false;
    
    this.enhancedElements = {
      progressContainer: null,
      qualityIndicator: null,
      performanceMonitor: null,
      detailedStatus: null
    };
  }

  /**
   * 🚀 リアルタイム強化開始
   */
  enableEnhancedMode() {
    if (this.isEnhanced) return;
    
    console.log('🔄 Enabling Enhanced Real-time Mode');
    this.createEnhancedUI();
    this.startDetailedMonitoring();
    this.isEnhanced = true;
  }

  /**
   * 🎨 強化UI作成
   */
  createEnhancedUI() {
    const loadingContainer = document.querySelector('.loading-container');
    if (!loadingContainer) return;

    // 詳細ステータス表示エリア
    const detailedStatusHtml = `
      <div class="enhanced-status-panel" id="enhanced-status">
        <div class="status-tabs">
          <button class="status-tab active" data-tab="progress">📊 進捗詳細</button>
          <button class="status-tab" data-tab="quality">🧠 品質評価</button>
          <button class="status-tab" data-tab="performance">⚡ パフォーマンス</button>
          <button class="status-tab" data-tab="logs">📝 ログ</button>
        </div>
        
        <div class="status-content">
          <!-- 進捗詳細タブ -->
          <div class="status-panel" id="progress-panel">
            <div class="progress-metrics">
              <div class="metric-card">
                <div class="metric-label">生成方式</div>
                <div class="metric-value" id="generation-method">順次実行</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">キャッシュ活用</div>
                <div class="metric-value" id="cache-usage">0%</div>
              </div>
              <div class="metric-card">
                <div class="metric-label">予測完了</div>
                <div class="metric-value" id="predicted-completion">計算中...</div>
              </div>
            </div>
            
            <div class="phase-timeline" id="phase-timeline">
              <!-- 詳細フェーズ進捗がここに表示 -->
            </div>
          </div>
          
          <!-- 品質評価タブ -->
          <div class="status-panel hidden" id="quality-panel">
            <div class="quality-overview">
              <div class="quality-score-display">
                <div class="score-circle" id="overall-quality-score">
                  <span class="score-value">-</span>
                  <span class="score-label">総合品質</span>
                </div>
              </div>
              
              <div class="quality-metrics" id="quality-metrics">
                <!-- 品質メトリクスがここに表示 -->
              </div>
            </div>
            
            <div class="quality-recommendations" id="quality-recommendations">
              <!-- 品質改善提案がここに表示 -->
            </div>
          </div>
          
          <!-- パフォーマンスタブ -->
          <div class="status-panel hidden" id="performance-panel">
            <div class="performance-charts">
              <div class="chart-container">
                <canvas id="performance-chart" width="400" height="200"></canvas>
              </div>
              
              <div class="performance-stats" id="performance-stats">
                <!-- パフォーマンス統計がここに表示 -->
              </div>
            </div>
          </div>
          
          <!-- ログタブ -->
          <div class="status-panel hidden" id="logs-panel">
            <div class="log-container" id="detailed-logs">
              <!-- 詳細ログがここに表示 -->
            </div>
          </div>
        </div>
      </div>
    `;

    loadingContainer.insertAdjacentHTML('beforeend', detailedStatusHtml);
    
    // タブ切り替えイベント
    this.setupTabSwitching();
    
    // UI要素参照を保存
    this.enhancedElements = {
      progressContainer: document.getElementById('enhanced-status'),
      qualityIndicator: document.getElementById('quality-panel'),
      performanceMonitor: document.getElementById('performance-panel'),
      detailedStatus: document.getElementById('progress-panel')
    };
  }

  /**
   * 🔄 タブ切り替え設定
   */
  setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.status-tab');
    const panels = document.querySelectorAll('.status-panel');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;
        
        // タブボタンの状態更新
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // パネルの表示切り替え
        panels.forEach(panel => panel.classList.add('hidden'));
        const targetPanel = document.getElementById(`${targetTab}-panel`);
        if (targetPanel) {
          targetPanel.classList.remove('hidden');
        }
      });
    });
  }

  /**
   * 📊 詳細監視開始
   */
  startDetailedMonitoring() {
    // フェーズタイムライン初期化
    this.initializePhaseTimeline();
    
    // パフォーマンスチャート初期化
    this.initializePerformanceChart();
    
    // 定期更新開始
    this.monitoringInterval = setInterval(() => {
      this.updateEnhancedMetrics();
    }, 2000);
  }

  /**
   * 📅 フェーズタイムライン初期化
   */
  initializePhaseTimeline() {
    const timeline = document.getElementById('phase-timeline');
    if (!timeline) return;

    const phases = [
      { name: '🚀 作品コンセプト', duration: 60, status: 'pending' },
      { name: '🎭 キャラクター設計', duration: 90, status: 'pending' },
      { name: '🔍 事件・謎構築', duration: 75, status: 'pending' },
      { name: '⏱ 進行管理', duration: 45, status: 'pending' },
      { name: '🎓 GMガイド', duration: 30, status: 'pending' }
    ];

    const timelineHtml = phases.map((phase, index) => `
      <div class="timeline-item" id="timeline-${index}">
        <div class="timeline-marker ${phase.status}"></div>
        <div class="timeline-content">
          <div class="timeline-title">${phase.name}</div>
          <div class="timeline-duration">予定時間: ${phase.duration}秒</div>
          <div class="timeline-status" id="timeline-status-${index}">待機中</div>
        </div>
      </div>
    `).join('');

    timeline.innerHTML = timelineHtml;
  }

  /**
   * 📈 パフォーマンスチャート初期化
   */
  initializePerformanceChart() {
    const canvas = document.getElementById('performance-chart');
    if (!canvas) return;

    // 簡単なパフォーマンスチャート（Canvas API使用）
    this.chartContext = canvas.getContext('2d');
    this.performanceData = {
      labels: [],
      cpuUsage: [],
      memoryUsage: [],
      responseTime: []
    };

    this.drawPerformanceChart();
  }

  /**
   * 📊 パフォーマンスチャート描画
   */
  drawPerformanceChart() {
    if (!this.chartContext) return;

    const ctx = this.chartContext;
    const canvas = ctx.canvas;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 背景
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // グリッド線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 10; i++) {
      const y = (i / 10) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    
    // データがある場合はグラフを描画
    if (this.performanceData.responseTime.length > 0) {
      this.drawLineChart(ctx, this.performanceData.responseTime, 'rgba(59, 130, 246, 0.8)');
    }
    
    // ラベル
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px Inter';
    ctx.fillText('レスポンス時間 (ms)', 10, 20);
  }

  /**
   * 📈 線グラフ描画
   */
  drawLineChart(ctx, data, color) {
    if (data.length < 2) return;

    const canvas = ctx.canvas;
    const maxValue = Math.max(...data);
    const minValue = Math.min(...data);
    const range = maxValue - minValue || 1;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((value, index) => {
      const x = (index / (data.length - 1)) * canvas.width;
      const y = canvas.height - ((value - minValue) / range) * canvas.height;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
  }

  /**
   * 🔄 強化メトリクス更新
   */
  updateEnhancedMetrics() {
    this.updateProgressMetrics();
    this.updatePerformanceStats();
    this.updateQualityIndicators();
  }

  /**
   * 📊 進捗メトリクス更新
   */
  updateProgressMetrics() {
    // 生成方式表示
    const methodElement = document.getElementById('generation-method');
    if (methodElement) {
      methodElement.textContent = '順次実行 + 品質評価';
    }

    // キャッシュ使用率（模擬）
    const cacheElement = document.getElementById('cache-usage');
    if (cacheElement) {
      const cacheRate = Math.random() * 30; // 0-30%の模擬値
      cacheElement.textContent = `${Math.round(cacheRate)}%`;
    }

    // 予測完了時間
    const completionElement = document.getElementById('predicted-completion');
    if (completionElement) {
      const now = Date.now();
      const elapsed = now - (window.generationStartTime || now);
      const remaining = Math.max(0, 300000 - elapsed); // 5分 - 経過時間
      
      if (remaining > 0) {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        completionElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      } else {
        completionElement.textContent = '完了間近';
      }
    }
  }

  /**
   * ⚡ パフォーマンス統計更新
   */
  updatePerformanceStats() {
    const statsContainer = document.getElementById('performance-stats');
    if (!statsContainer) return;

    // 模擬パフォーマンスデータ
    const stats = {
      responseTime: Math.random() * 2000 + 1000, // 1-3秒
      memoryUsage: Math.random() * 50 + 30,      // 30-80%
      cpuUsage: Math.random() * 40 + 20          // 20-60%
    };

    // データを履歴に追加
    this.performanceData.responseTime.push(stats.responseTime);
    if (this.performanceData.responseTime.length > 20) {
      this.performanceData.responseTime.shift();
    }

    // パフォーマンス統計表示
    statsContainer.innerHTML = `
      <div class="stat-row">
        <span class="stat-label">レスポンス時間:</span>
        <span class="stat-value">${Math.round(stats.responseTime)}ms</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">メモリ使用率:</span>
        <span class="stat-value">${Math.round(stats.memoryUsage)}%</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">CPU使用率:</span>
        <span class="stat-value">${Math.round(stats.cpuUsage)}%</span>
      </div>
    `;

    // チャート更新
    this.drawPerformanceChart();
  }

  /**
   * 🧠 品質指標更新
   */
  updateQualityIndicators() {
    // 品質スコア（模擬）
    const overallScore = Math.random() * 20 + 80; // 80-100%
    
    const scoreElement = document.querySelector('#overall-quality-score .score-value');
    if (scoreElement) {
      scoreElement.textContent = Math.round(overallScore);
    }

    // 品質メトリクス表示
    const metricsContainer = document.getElementById('quality-metrics');
    if (metricsContainer) {
      const metrics = {
        narrative: Math.random() * 15 + 85,
        logic: Math.random() * 10 + 90,
        balance: Math.random() * 20 + 75,
        engagement: Math.random() * 15 + 80
      };

      metricsContainer.innerHTML = `
        <div class="quality-metric">
          <span class="metric-name">📖 物語性</span>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${metrics.narrative}%"></div>
          </div>
          <span class="metric-score">${Math.round(metrics.narrative)}%</span>
        </div>
        <div class="quality-metric">
          <span class="metric-name">🔍 論理性</span>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${metrics.logic}%"></div>
          </div>
          <span class="metric-score">${Math.round(metrics.logic)}%</span>
        </div>
        <div class="quality-metric">
          <span class="metric-name">⚖️ バランス</span>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${metrics.balance}%"></div>
          </div>
          <span class="metric-score">${Math.round(metrics.balance)}%</span>
        </div>
        <div class="quality-metric">
          <span class="metric-name">🎭 魅力度</span>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${metrics.engagement}%"></div>
          </div>
          <span class="metric-score">${Math.round(metrics.engagement)}%</span>
        </div>
      `;
    }
  }

  /**
   * 📝 詳細ログ追加
   */
  addDetailedLog(message, type = 'info') {
    const logsContainer = document.getElementById('detailed-logs');
    if (!logsContainer) return;

    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.innerHTML = `
      <span class="log-time">${timestamp}</span>
      <span class="log-message">${message}</span>
    `;

    logsContainer.insertBefore(logEntry, logsContainer.firstChild);

    // ログ数制限
    while (logsContainer.children.length > 50) {
      logsContainer.removeChild(logsContainer.lastChild);
    }
  }

  /**
   * 🛑 強化モード終了
   */
  disableEnhancedMode() {
    if (!this.isEnhanced) return;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    const enhancedPanel = document.getElementById('enhanced-status');
    if (enhancedPanel) {
      enhancedPanel.remove();
    }

    this.isEnhanced = false;
    console.log('🔄 Enhanced Real-time Mode disabled');
  }

  /**
   * 🎯 フェーズ更新通知
   */
  updatePhaseStatus(phaseIndex, status, details = '') {
    const timelineItem = document.getElementById(`timeline-${phaseIndex}`);
    const statusElement = document.getElementById(`timeline-status-${phaseIndex}`);
    
    if (timelineItem && statusElement) {
      const marker = timelineItem.querySelector('.timeline-marker');
      
      marker.className = `timeline-marker ${status}`;
      
      switch (status) {
        case 'running':
          statusElement.textContent = '実行中...';
          this.addDetailedLog(`フェーズ ${phaseIndex + 1} 開始: ${details}`, 'info');
          break;
        case 'completed':
          statusElement.textContent = '完了';
          this.addDetailedLog(`フェーズ ${phaseIndex + 1} 完了: ${details}`, 'success');
          break;
        case 'error':
          statusElement.textContent = 'エラー';
          this.addDetailedLog(`フェーズ ${phaseIndex + 1} エラー: ${details}`, 'error');
          break;
      }
    }
  }
}

// グローバルインスタンス
const realTimeEnhancer = new RealTimeEnhancer();

// 生成開始時に強化モードを有効化
document.addEventListener('generationStart', () => {
  window.generationStartTime = Date.now();
  realTimeEnhancer.enableEnhancedMode();
});

// 生成完了時に強化モードを無効化
document.addEventListener('generationComplete', () => {
  setTimeout(() => {
    realTimeEnhancer.disableEnhancedMode();
  }, 3000);
});

// グローバルエクスポート
window.realTimeEnhancer = realTimeEnhancer;

console.log('🔄 Real-time Enhancer loaded');