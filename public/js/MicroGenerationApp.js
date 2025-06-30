/**
 * 🔬 Micro Generation App - 超細分化フロントエンド
 * 各要素を最小単位で段階的に生成・表示
 */

export class MicroGenerationApp {
  constructor() {
    this.formData = {};
    this.context = {}; // 生成済みコンテキスト
    this.currentTasks = [];
    this.completedTasks = new Set();
    this.isGenerating = false;
    this.sessionId = null;
    
    // タスク定義（バックエンドと同期）
    this.taskDefinitions = {
      'phase1_title': { name: '作品タイトル', phase: 1, order: 1 },
      'phase1_concept': { name: '基本コンセプト', phase: 1, order: 2 },
      'phase1_worldview': { name: '世界観詳細', phase: 1, order: 3 },
      'phase1_setting': { name: '舞台詳細', phase: 1, order: 4 },
      'phase1_plot': { name: '基本プロット', phase: 1, order: 5 },
      // キャラクターは動的に追加
    };
    
    this.initializeApp();
  }
  
  initializeApp() {
    console.log('🔬 Micro Generation App initializing...');
    
    // イベントリスナー設定
    this.setupEventListeners();
    
    // UI初期化
    this.initializeUI();
  }
  
  setupEventListeners() {
    // 既存のボタンにマイクロ生成モードを追加
    const generateBtn = document.getElementById('generate-scenario');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.startMicroGeneration());
    }
    
    // モード切替ボタン（追加予定）
    const modeToggle = document.getElementById('generation-mode-toggle');
    if (modeToggle) {
      modeToggle.addEventListener('change', (e) => {
        this.generationMode = e.target.checked ? 'micro' : 'normal';
      });
    }
  }
  
  /**
   * マイクロ生成開始
   */
  async startMicroGeneration(externalFormData = null) {
    if (this.isGenerating) return;
    
    console.log('🔬 Starting micro generation...');
    
    // 外部からのフォームデータを使用（UltraIntegratedAppから）
    if (externalFormData) {
      this.formData = externalFormData;
    } else {
      this.collectFormData();
    }
    
    try {
      this.isGenerating = true;
      this.sessionId = `micro_${Date.now()}`;
      this.context = {};
      this.completedTasks.clear();
      
      // UI表示切替
      this.showMicroGenerationUI();
      
      // 最初のタスクを取得
      await this.fetchNextTasks();
      
      // 自動実行開始
      await this.executeNextTask();
      
    } catch (error) {
      console.error('❌ Micro generation failed:', error);
      this.showError(error.message);
    }
  }
  
  /**
   * 次の実行可能タスクを取得
   */
  async fetchNextTasks() {
    const response = await fetch('/api/micro-generation-system', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_next_tasks',
        context: this.context,
        formData: this.formData
      })
    });
    
    const result = await response.json();
    if (result.success) {
      this.currentTasks = result.nextTasks;
      this.updateProgress(result.progress);
    }
    
    return result;
  }
  
  /**
   * 次のタスクを実行
   */
  async executeNextTask() {
    if (!this.isGenerating || this.currentTasks.length === 0) {
      // 完了チェック
      if (this.completedTasks.size >= Object.keys(this.taskDefinitions).length) {
        await this.onGenerationComplete();
      }
      return;
    }
    
    // 次のタスクを取得
    const taskId = this.currentTasks.shift();
    console.log(`🔬 Executing task: ${taskId}`);
    
    // UI更新
    this.updateTaskStatus(taskId, 'running');
    
    try {
      // タスク実行
      const response = await fetch('/api/micro-generation-system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute_task',
          taskId: taskId,
          formData: this.formData,
          context: this.context,
          sessionId: this.sessionId
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // コンテキストに結果を保存
        this.context[taskId] = result.result.result;
        this.completedTasks.add(taskId);
        
        // UI更新
        this.updateTaskStatus(taskId, 'completed');
        this.displayTaskResult(taskId, result.result);
        
        // 新しいタスクを追加
        if (result.nextTasks.length > 0) {
          this.currentTasks.push(...result.nextTasks.filter(t => !this.currentTasks.includes(t)));
        }
        
        // 次のタスクを実行（遅延あり）
        setTimeout(() => this.executeNextTask(), 500);
        
      } else {
        throw new Error(result.error || 'Task execution failed');
      }
      
    } catch (error) {
      console.error(`❌ Task ${taskId} failed:`, error);
      this.updateTaskStatus(taskId, 'error');
      
      // エラーでも次のタスクは試行
      setTimeout(() => this.executeNextTask(), 1000);
    }
  }
  
  /**
   * マイクロ生成UI表示
   */
  showMicroGenerationUI() {
    // 既存のカードを非表示
    document.getElementById('main-card')?.classList.add('hidden');
    
    // マイクロ生成UIを作成・表示
    const container = document.getElementById('micro-generation-container') || this.createMicroUI();
    container.classList.remove('hidden');
    
    // タスクリストを初期化
    this.initializeTaskList();
  }
  
  /**
   * マイクロ生成UI作成
   */
  createMicroUI() {
    const container = document.createElement('div');
    container.id = 'micro-generation-container';
    container.className = 'card';
    container.innerHTML = `
      <div class="micro-generation-header">
        <h3>🔬 マイクロ生成モード - 詳細な段階的生成</h3>
        <div class="micro-progress">
          <div class="progress-bar-micro">
            <div class="progress-fill-micro" id="micro-progress-fill" style="width: 0%"></div>
          </div>
          <span id="micro-progress-text">0%</span>
        </div>
      </div>
      
      <div class="micro-content">
        <div class="task-list" id="micro-task-list">
          <!-- タスクが動的に追加される -->
        </div>
        
        <div class="result-preview" id="micro-result-preview">
          <h4>生成結果プレビュー</h4>
          <div id="micro-preview-content">
            <!-- 結果が順次表示される -->
          </div>
        </div>
      </div>
      
      <div class="micro-actions">
        <button id="pause-micro" class="btn btn-outline">⏸️ 一時停止</button>
        <button id="resume-micro" class="btn btn-outline hidden">▶️ 再開</button>
        <button id="complete-micro" class="btn btn-primary hidden">📦 完了してダウンロード</button>
      </div>
    `;
    
    document.querySelector('main').appendChild(container);
    
    // イベントリスナー
    document.getElementById('pause-micro')?.addEventListener('click', () => this.pauseGeneration());
    document.getElementById('resume-micro')?.addEventListener('click', () => this.resumeGeneration());
    document.getElementById('complete-micro')?.addEventListener('click', () => this.completeAndDownload());
    
    return container;
  }
  
  /**
   * タスクリスト初期化
   */
  initializeTaskList() {
    const taskList = document.getElementById('micro-task-list');
    if (!taskList) return;
    
    taskList.innerHTML = '';
    
    // フェーズごとにグループ化
    const phases = {};
    Object.entries(this.taskDefinitions).forEach(([taskId, task]) => {
      if (!phases[task.phase]) phases[task.phase] = [];
      phases[task.phase].push({ id: taskId, ...task });
    });
    
    // 各フェーズを表示
    Object.entries(phases).forEach(([phase, tasks]) => {
      const phaseEl = document.createElement('div');
      phaseEl.className = 'task-phase';
      phaseEl.innerHTML = `
        <h5>フェーズ ${phase}</h5>
        <div class="task-items" id="phase-${phase}-tasks">
          ${tasks.map(task => `
            <div class="task-item" id="task-${task.id}" data-task-id="${task.id}">
              <span class="task-status">⏳</span>
              <span class="task-name">${task.name}</span>
              <span class="task-time"></span>
            </div>
          `).join('')}
        </div>
      `;
      taskList.appendChild(phaseEl);
    });
  }
  
  /**
   * タスクステータス更新
   */
  updateTaskStatus(taskId, status) {
    const taskEl = document.querySelector(`#task-${taskId}`);
    if (!taskEl) return;
    
    const statusEl = taskEl.querySelector('.task-status');
    const statusIcons = {
      'waiting': '⏳',
      'running': '🔄',
      'completed': '✅',
      'error': '❌'
    };
    
    statusEl.textContent = statusIcons[status] || '❓';
    taskEl.className = `task-item ${status}`;
    
    // 実行中の場合はアニメーション
    if (status === 'running') {
      taskEl.classList.add('pulse');
    } else {
      taskEl.classList.remove('pulse');
    }
  }
  
  /**
   * タスク結果表示
   */
  displayTaskResult(taskId, result) {
    const previewContent = document.getElementById('micro-preview-content');
    if (!previewContent) return;
    
    // 結果を追加
    const resultEl = document.createElement('div');
    resultEl.className = 'result-item';
    resultEl.innerHTML = `
      <h6>${result.name}</h6>
      <div class="result-content">${this.formatResult(taskId, result.result)}</div>
      <div class="result-meta">実行時間: ${result.executionTime}ms</div>
    `;
    
    previewContent.appendChild(resultEl);
    
    // スクロール
    previewContent.scrollTop = previewContent.scrollHeight;
  }
  
  /**
   * 結果フォーマット
   */
  formatResult(taskId, result) {
    if (result.skip) return '<em>スキップされました</em>';
    
    // タスクタイプに応じてフォーマット
    if (taskId.includes('title')) {
      return `<strong>${result.title}</strong>`;
    } else if (taskId.includes('char')) {
      return `${result.character.name} (${result.character.age}歳, ${result.character.occupation})`;
    } else {
      // その他は最初の値を表示
      const firstValue = Object.values(result)[0];
      return typeof firstValue === 'string' ? firstValue : JSON.stringify(firstValue);
    }
  }
  
  /**
   * 進捗更新
   */
  updateProgress(progress) {
    const fillEl = document.getElementById('micro-progress-fill');
    const textEl = document.getElementById('micro-progress-text');
    
    if (fillEl) fillEl.style.width = `${progress.percentage}%`;
    if (textEl) textEl.textContent = `${progress.percentage}% (${progress.completed}/${progress.total})`;
  }
  
  /**
   * 生成一時停止
   */
  pauseGeneration() {
    this.isGenerating = false;
    document.getElementById('pause-micro')?.classList.add('hidden');
    document.getElementById('resume-micro')?.classList.remove('hidden');
  }
  
  /**
   * 生成再開
   */
  resumeGeneration() {
    this.isGenerating = true;
    document.getElementById('resume-micro')?.classList.add('hidden');
    document.getElementById('pause-micro')?.classList.remove('hidden');
    this.executeNextTask();
  }
  
  /**
   * 生成完了処理
   */
  async onGenerationComplete() {
    console.log('🎉 Micro generation complete!');
    this.isGenerating = false;
    
    // 完了ボタン表示
    document.getElementById('complete-micro')?.classList.remove('hidden');
    document.getElementById('pause-micro')?.classList.add('hidden');
    
    // 通知
    this.showNotification('すべてのタスクが完了しました！');
  }
  
  /**
   * 完了してダウンロード
   */
  async completeAndDownload() {
    // 通常の生成システムと統合してZIP作成
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionData: {
            sessionId: this.sessionId,
            formData: this.formData,
            phases: this.buildPhasesFromContext(),
            startTime: new Date().toISOString(),
            completedAt: new Date().toISOString()
          }
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'murder_mystery_micro_generated.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Download failed:', error);
      this.showError('ダウンロードに失敗しました');
    }
  }
  
  /**
   * コンテキストからフェーズデータを構築
   */
  buildPhasesFromContext() {
    // マイクロタスクの結果を統合して従来のフェーズ形式に変換
    const phases = {};
    
    // フェーズ1
    phases.phase1 = {
      concept: `
## 作品タイトル
${this.context.phase1_title?.title || ''}

## 基本コンセプト
${this.context.phase1_concept?.concept || ''}

## 世界観・設定
${this.context.phase1_worldview?.worldview || ''}

## 舞台詳細
${this.context.phase1_setting?.setting || ''}

## 基本プロット
${this.context.phase1_plot?.plot || ''}
`
    };
    
    // フェーズ2（キャラクター）
    const characters = [];
    for (let i = 1; i <= 8; i++) {
      const char = this.context[`phase2_char${i}`]?.character;
      if (char && !char.skip) {
        characters.push(char);
      }
    }
    phases.phase2 = { characters: this.formatCharacters(characters) };
    
    // 他のフェーズも同様に構築...
    
    return phases;
  }
  
  formatCharacters(characters) {
    return characters.map((char, i) => `
### キャラクター${i + 1}: ${char.name}
- 基本情報: ${char.age}歳、${char.occupation}
- 特徴: ${char.feature}
`).join('\n');
  }
  
  // 既存のメソッドとの互換性
  collectFormData() {
    // 既存のフォームデータ収集ロジックを使用
    const form = document.getElementById('scenario-form');
    if (!form) return;
    
    const formData = new FormData(form);
    this.formData = {};
    
    for (const [key, value] of formData.entries()) {
      this.formData[key] = value;
    }
  }
  
  showError(message) {
    // エラー表示
    const errorEl = document.createElement('div');
    errorEl.className = 'error-notification';
    errorEl.textContent = message;
    document.body.appendChild(errorEl);
    
    setTimeout(() => errorEl.remove(), 5000);
  }
  
  showNotification(message) {
    // 通知表示
    const notifEl = document.createElement('div');
    notifEl.className = 'success-notification';
    notifEl.textContent = message;
    document.body.appendChild(notifEl);
    
    setTimeout(() => notifEl.remove(), 3000);
  }
}

// アプリ初期化 - グローバル公開
window.MicroGenerationApp = MicroGenerationApp;

document.addEventListener('DOMContentLoaded', () => {
  // UltraIntegratedAppが管理するので、ここでは初期化しない
  console.log('🔬 MicroGenerationApp class loaded');
});