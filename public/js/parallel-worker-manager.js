/**
 * 🚀 Parallel Worker Manager - Web Workers並列処理管理
 * 複数ワーカーの統合管理とタスク分散
 */

class ParallelWorkerManager {
  constructor() {
    this.workers = new Map();
    this.taskQueue = [];
    this.activeTasks = new Map();
    this.maxWorkers = navigator.hardwareConcurrency || 4;
    this.workerPool = [];
    this.isInitialized = false;
    
    // パフォーマンス追跡
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      totalProcessingTime: 0,
      avgProcessingTime: 0,
      workerUtilization: new Map()
    };
    
    // 設定
    this.config = {
      maxConcurrentTasks: this.maxWorkers * 2,
      taskTimeout: 60000, // 60秒
      retryAttempts: 2,
      adaptiveLoadBalancing: true
    };
    
    this.initialize();
  }

  /**
   * 初期化
   */
  async initialize() {
    try {
      logger.info('🚀 Initializing Parallel Worker Manager');
      
      // Workerプール作成
      await this.createWorkerPool();
      
      // タスクスケジューラー開始
      this.startTaskScheduler();
      
      // パフォーマンス監視開始
      this.startPerformanceMonitoring();
      
      this.isInitialized = true;
      logger.success('✅ Parallel Worker Manager initialized');
      
    } catch (error) {
      logger.error('Parallel Worker Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Workerプール作成
   */
  async createWorkerPool() {
    const workerCount = Math.min(this.maxWorkers, 4); // 最大4ワーカー
    
    for (let i = 0; i < workerCount; i++) {
      try {
        const worker = await this.createWorker(`worker_${i}`);
        this.workerPool.push(worker);
        
        logger.debug(`Worker ${i} created`);
      } catch (error) {
        logger.warn(`Failed to create worker ${i}:`, error);
      }
    }
    
    if (this.workerPool.length === 0) {
      throw new Error('No workers could be created');
    }
    
    logger.info(`✅ Worker pool created with ${this.workerPool.length} workers`);
  }

  /**
   * 個別Worker作成
   */
  async createWorker(workerId) {
    return new Promise((resolve, reject) => {
      try {
        const worker = new Worker('/js/workers/ai-processing-worker.js');
        
        const workerInfo = {
          id: workerId,
          worker: worker,
          status: 'idle',
          currentTask: null,
          taskCount: 0,
          totalProcessingTime: 0,
          lastTaskTime: 0,
          errorCount: 0,
          createdAt: Date.now()
        };
        
        // Workerイベントハンドラー設定
        worker.onmessage = (event) => {
          this.handleWorkerMessage(workerId, event.data);
        };
        
        worker.onerror = (error) => {
          this.handleWorkerError(workerId, error);
        };
        
        worker.onmessageerror = (error) => {
          this.handleWorkerError(workerId, error);
        };
        
        this.workers.set(workerId, workerInfo);
        resolve(workerInfo);
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Workerメッセージ処理
   */
  handleWorkerMessage(workerId, data) {
    const workerInfo = this.workers.get(workerId);
    if (!workerInfo) return;
    
    const { type, taskId, result, progress, error } = data;
    
    switch (type) {
      case 'success':
        this.handleTaskSuccess(workerId, taskId, result);
        break;
        
      case 'progress':
        this.handleTaskProgress(workerId, taskId, progress);
        break;
        
      case 'error':
        this.handleTaskError(workerId, taskId, error);
        break;
        
      case 'metrics':
        this.handleWorkerMetrics(workerId, result);
        break;
        
      case 'worker_error':
        this.handleWorkerError(workerId, error);
        break;
    }
  }

  /**
   * タスク成功処理
   */
  handleTaskSuccess(workerId, taskId, result) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;
    
    const workerInfo = this.workers.get(workerId);
    const processingTime = Date.now() - task.startTime;
    
    // Workerステータス更新
    workerInfo.status = 'idle';
    workerInfo.currentTask = null;
    workerInfo.taskCount++;
    workerInfo.totalProcessingTime += processingTime;
    workerInfo.lastTaskTime = processingTime;
    
    // メトリクス更新
    this.metrics.completedTasks++;
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.avgProcessingTime = this.metrics.totalProcessingTime / this.metrics.completedTasks;
    
    // タスク完了
    this.activeTasks.delete(taskId);
    
    // コールバック実行
    if (task.resolve) {
      task.resolve({
        success: true,
        result,
        processingTime,
        workerId
      });
    }
    
    logger.debug(`✅ Task ${taskId} completed by ${workerId} in ${processingTime}ms`);
    
    // 次のタスクをスケジュール
    this.scheduleNextTask();
  }

  /**
   * タスク進捗処理
   */
  handleTaskProgress(workerId, taskId, progress) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;
    
    // 進捗コールバック実行
    if (task.onProgress) {
      task.onProgress({
        workerId,
        taskId,
        progress
      });
    }
  }

  /**
   * タスクエラー処理
   */
  handleTaskError(workerId, taskId, error) {
    const task = this.activeTasks.get(taskId);
    const workerInfo = this.workers.get(workerId);
    
    if (workerInfo) {
      workerInfo.status = 'idle';
      workerInfo.currentTask = null;
      workerInfo.errorCount++;
    }
    
    if (task) {
      task.retryCount = (task.retryCount || 0) + 1;
      
      // リトライ判定
      if (task.retryCount <= this.config.retryAttempts) {
        logger.warn(`⚠️ Task ${taskId} failed, retrying (${task.retryCount}/${this.config.retryAttempts})`);
        
        // タスクをキューに戻す
        this.taskQueue.unshift(task);
        this.activeTasks.delete(taskId);
        
        // 次のタスクをスケジュール
        setTimeout(() => this.scheduleNextTask(), 1000);
        
      } else {
        logger.error(`❌ Task ${taskId} failed permanently after ${task.retryCount} attempts`);
        
        this.metrics.failedTasks++;
        this.activeTasks.delete(taskId);
        
        // エラーコールバック実行
        if (task.reject) {
          task.reject({
            success: false,
            error,
            workerId,
            retryCount: task.retryCount
          });
        }
      }
    }
  }

  /**
   * Workerエラー処理
   */
  handleWorkerError(workerId, error) {
    logger.error(`Worker ${workerId} error:`, error);
    
    const workerInfo = this.workers.get(workerId);
    if (workerInfo) {
      workerInfo.errorCount++;
      
      // エラーが多い場合はWorkerを再作成
      if (workerInfo.errorCount > 5) {
        this.recreateWorker(workerId);
      }
    }
  }

  /**
   * Worker再作成
   */
  async recreateWorker(workerId) {
    try {
      logger.info(`🔄 Recreating worker ${workerId}`);
      
      // 古いWorkerを終了
      const oldWorkerInfo = this.workers.get(workerId);
      if (oldWorkerInfo) {
        oldWorkerInfo.worker.terminate();
        this.workers.delete(workerId);
        
        // プールからも削除
        const poolIndex = this.workerPool.findIndex(w => w.id === workerId);
        if (poolIndex >= 0) {
          this.workerPool.splice(poolIndex, 1);
        }
      }
      
      // 新しいWorkerを作成
      const newWorker = await this.createWorker(workerId);
      this.workerPool.push(newWorker);
      
      logger.success(`✅ Worker ${workerId} recreated`);
      
    } catch (error) {
      logger.error(`Failed to recreate worker ${workerId}:`, error);
    }
  }

  /**
   * タスクスケジューラー開始
   */
  startTaskScheduler() {
    setInterval(() => {
      this.scheduleNextTask();
    }, 100); // 100msごとにスケジューリング
  }

  /**
   * 次のタスクをスケジュール
   */
  scheduleNextTask() {
    if (this.taskQueue.length === 0) return;
    if (this.activeTasks.size >= this.config.maxConcurrentTasks) return;
    
    // 最適なWorkerを選択
    const availableWorker = this.selectOptimalWorker();
    if (!availableWorker) return;
    
    // タスクを取得
    const task = this.taskQueue.shift();
    if (!task) return;
    
    // タスクを実行
    this.executeTask(availableWorker, task);
  }

  /**
   * 最適Worker選択
   */
  selectOptimalWorker() {
    const idleWorkers = this.workerPool.filter(w => w.status === 'idle');
    
    if (idleWorkers.length === 0) return null;
    
    if (this.config.adaptiveLoadBalancing) {
      // 負荷分散: 最も効率的なWorkerを選択
      return idleWorkers.reduce((best, current) => {
        const bestEfficiency = this.calculateWorkerEfficiency(best);
        const currentEfficiency = this.calculateWorkerEfficiency(current);
        
        return currentEfficiency > bestEfficiency ? current : best;
      });
    } else {
      // ラウンドロビン: 最も少ないタスクを処理したWorkerを選択
      return idleWorkers.reduce((best, current) => 
        current.taskCount < best.taskCount ? current : best
      );
    }
  }

  /**
   * Worker効率性計算
   */
  calculateWorkerEfficiency(workerInfo) {
    if (workerInfo.taskCount === 0) return 1.0;
    
    const avgProcessingTime = workerInfo.totalProcessingTime / workerInfo.taskCount;
    const errorRate = workerInfo.errorCount / workerInfo.taskCount;
    
    // 効率性 = 速度 × 信頼性
    const speedScore = Math.max(0, 1 - (avgProcessingTime / 10000)); // 10秒基準
    const reliabilityScore = Math.max(0, 1 - errorRate);
    
    return (speedScore + reliabilityScore) / 2;
  }

  /**
   * タスク実行
   */
  executeTask(workerInfo, task) {
    const taskId = task.taskId;
    
    // Workerステータス更新
    workerInfo.status = 'busy';
    workerInfo.currentTask = taskId;
    
    // アクティブタスクに追加
    task.startTime = Date.now();
    task.workerId = workerInfo.id;
    this.activeTasks.set(taskId, task);
    
    // メトリクス更新
    this.metrics.totalTasks++;
    
    // タスクタイムアウト設定
    const timeoutId = setTimeout(() => {
      this.handleTaskTimeout(taskId);
    }, this.config.taskTimeout);
    
    task.timeoutId = timeoutId;
    
    // Workerにタスク送信
    workerInfo.worker.postMessage({
      type: task.type,
      payload: task.payload,
      taskId: taskId
    });
    
    logger.debug(`🚀 Task ${taskId} started on ${workerInfo.id}`);
  }

  /**
   * タスクタイムアウト処理
   */
  handleTaskTimeout(taskId) {
    const task = this.activeTasks.get(taskId);
    if (!task) return;
    
    logger.warn(`⏰ Task ${taskId} timed out`);
    
    // Workerをリセット
    const workerInfo = this.workers.get(task.workerId);
    if (workerInfo) {
      workerInfo.status = 'idle';
      workerInfo.currentTask = null;
    }
    
    // タスクエラー処理
    this.handleTaskError(task.workerId, taskId, { 
      message: 'Task timeout',
      type: 'timeout' 
    });
  }

  /**
   * 並列タスク実行 (公開API)
   */
  async executeParallelTasks(tasks, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const { onProgress, maxConcurrency } = options;
    
    // タスクにIDを付与
    const tasksWithId = tasks.map((task, index) => ({
      ...task,
      taskId: `task_${Date.now()}_${index}`,
      onProgress
    }));
    
    // 並列実行制限
    const concurrency = Math.min(
      maxConcurrency || this.config.maxConcurrentTasks,
      tasksWithId.length
    );
    
    const results = [];
    const semaphore = new Semaphore(concurrency);
    
    const promises = tasksWithId.map(async (task) => {
      const permit = await semaphore.acquire();
      
      try {
        const result = await this.executeTask(task);
        results.push(result);
        return result;
      } finally {
        semaphore.release(permit);
      }
    });
    
    return Promise.allSettled(promises);
  }

  /**
   * 単一タスク実行 (公開API)
   */
  async executeSingleTask(task, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const { onProgress, timeout = this.config.taskTimeout } = options;
    
    return new Promise((resolve, reject) => {
      const taskWithId = {
        ...task,
        taskId: `single_${Date.now()}_${Math.random()}`,
        resolve,
        reject,
        onProgress
      };
      
      // タスクをキューに追加
      this.taskQueue.push(taskWithId);
      
      // 即座にスケジューリング試行
      this.scheduleNextTask();
    });
  }

  /**
   * パフォーマンス監視開始
   */
  startPerformanceMonitoring() {
    setInterval(() => {
      this.updateUtilizationMetrics();
    }, 5000); // 5秒ごと
  }

  /**
   * 利用率メトリクス更新
   */
  updateUtilizationMetrics() {
    this.workers.forEach((workerInfo, workerId) => {
      const utilization = workerInfo.status === 'busy' ? 1 : 0;
      
      if (!this.metrics.workerUtilization.has(workerId)) {
        this.metrics.workerUtilization.set(workerId, []);
      }
      
      const history = this.metrics.workerUtilization.get(workerId);
      history.push(utilization);
      
      // 最新100データポイントのみ保持
      if (history.length > 100) {
        history.shift();
      }
    });
  }

  /**
   * 統計取得
   */
  getStatistics() {
    const workerStats = Array.from(this.workers.values()).map(worker => ({
      id: worker.id,
      status: worker.status,
      taskCount: worker.taskCount,
      totalProcessingTime: worker.totalProcessingTime,
      avgProcessingTime: worker.taskCount > 0 ? worker.totalProcessingTime / worker.taskCount : 0,
      errorCount: worker.errorCount,
      efficiency: this.calculateWorkerEfficiency(worker),
      utilization: this.calculateWorkerUtilization(worker.id)
    }));
    
    return {
      overall: this.metrics,
      workers: workerStats,
      queue: {
        pending: this.taskQueue.length,
        active: this.activeTasks.size
      },
      config: this.config
    };
  }

  /**
   * Worker利用率計算
   */
  calculateWorkerUtilization(workerId) {
    const history = this.metrics.workerUtilization.get(workerId);
    if (!history || history.length === 0) return 0;
    
    const total = history.reduce((sum, val) => sum + val, 0);
    return (total / history.length) * 100;
  }

  /**
   * 設定更新
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    logger.info('🔧 Worker manager config updated', this.config);
  }

  /**
   * 終了処理
   */
  async shutdown() {
    logger.info('🚀 Shutting down Parallel Worker Manager');
    
    // 全Workerを終了
    this.workers.forEach((workerInfo) => {
      workerInfo.worker.terminate();
    });
    
    this.workers.clear();
    this.workerPool = [];
    this.activeTasks.clear();
    this.taskQueue = [];
    
    logger.info('✅ Parallel Worker Manager shutdown complete');
  }
}

/**
 * セマフォ実装
 */
class Semaphore {
  constructor(maxCount) {
    this.maxCount = maxCount;
    this.currentCount = 0;
    this.waitQueue = [];
  }

  async acquire() {
    return new Promise((resolve) => {
      if (this.currentCount < this.maxCount) {
        this.currentCount++;
        resolve(this.currentCount);
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }

  release(permit) {
    this.currentCount--;
    
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift();
      this.currentCount++;
      next(this.currentCount);
    }
  }
}

// グローバルインスタンス
window.parallelWorkerManager = new ParallelWorkerManager();

// エクスポート
export { ParallelWorkerManager };