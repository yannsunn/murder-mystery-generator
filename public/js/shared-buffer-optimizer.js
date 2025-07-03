/**
 * 🚀 SharedArrayBuffer Optimizer - 高速並列処理最適化
 * Worker間でのゼロコピーデータ共有とメモリ効率最大化
 */

class SharedBufferOptimizer {
  constructor() {
    this.isSupported = this.checkSupport();
    this.bufferPools = new Map();
    this.activeBuffers = new Map();
    this.workerCommunicators = new Map();
    
    // バッファプール設定
    this.poolConfig = {
      small: { size: 1024 * 16, count: 10 },      // 16KB x 10
      medium: { size: 1024 * 256, count: 5 },     // 256KB x 5
      large: { size: 1024 * 1024, count: 2 },     // 1MB x 2
      xlarge: { size: 1024 * 1024 * 4, count: 1 } // 4MB x 1
    };
    
    // パフォーマンス統計
    this.stats = {
      buffersCreated: 0,
      buffersReused: 0,
      totalTransfers: 0,
      totalDataTransferred: 0,
      avgTransferTime: 0
    };
    
    this.initialize();
  }

  /**
   * SharedArrayBuffer対応チェック
   */
  checkSupport() {
    if (typeof SharedArrayBuffer === 'undefined') {
      logger.warn('⚠️ SharedArrayBuffer not supported - falling back to regular ArrayBuffer');
      return false;
    }
    
    // Cross-Origin Isolatedのチェック
    if (!crossOriginIsolated) {
      logger.warn('⚠️ SharedArrayBuffer requires cross-origin isolation');
      return false;
    }
    
    return true;
  }

  /**
   * 初期化
   */
  async initialize() {
    if (!this.isSupported) {
      logger.info('📦 Initializing ArrayBuffer fallback mode');
      return;
    }
    
    try {
      logger.info('🚀 Initializing SharedArrayBuffer Optimizer');
      
      // バッファプール作成
      await this.createBufferPools();
      
      // ワーカー通信セットアップ
      this.setupWorkerCommunication();
      
      // パフォーマンス監視開始
      this.startPerformanceMonitoring();
      
      logger.success('✅ SharedArrayBuffer Optimizer initialized');
      
    } catch (error) {
      logger.error('SharedArrayBuffer Optimizer initialization failed:', error);
    }
  }

  /**
   * バッファプール作成
   */
  async createBufferPools() {
    for (const [poolName, config] of Object.entries(this.poolConfig)) {
      const pool = [];
      
      for (let i = 0; i < config.count; i++) {
        try {
          const buffer = this.isSupported 
            ? new SharedArrayBuffer(config.size)
            : new ArrayBuffer(config.size);
          
          const bufferInfo = {
            id: `${poolName}_${i}`,
            buffer,
            size: config.size,
            inUse: false,
            createdAt: Date.now(),
            lastUsed: 0,
            usageCount: 0
          };
          
          pool.push(bufferInfo);
          this.stats.buffersCreated++;
          
        } catch (error) {
          logger.warn(`Failed to create ${poolName} buffer ${i}:`, error);
        }
      }
      
      this.bufferPools.set(poolName, pool);
      logger.debug(`✅ Created ${poolName} buffer pool: ${pool.length} buffers`);
    }
  }

  /**
   * バッファ取得
   */
  acquireBuffer(sizeHint, options = {}) {
    const poolName = this.selectOptimalPool(sizeHint);
    const pool = this.bufferPools.get(poolName);
    
    if (!pool) {
      throw new Error(`Buffer pool ${poolName} not found`);
    }
    
    // 使用可能なバッファを検索
    const availableBuffer = pool.find(buf => !buf.inUse);
    
    if (availableBuffer) {
      availableBuffer.inUse = true;
      availableBuffer.lastUsed = Date.now();
      availableBuffer.usageCount++;
      
      this.activeBuffers.set(availableBuffer.id, availableBuffer);
      this.stats.buffersReused++;
      
      logger.debug(`📦 Buffer acquired: ${availableBuffer.id}`);
      
      return {
        id: availableBuffer.id,
        buffer: availableBuffer.buffer,
        size: availableBuffer.size,
        view: this.createOptimalView(availableBuffer.buffer, options)
      };
    }
    
    // 使用可能なバッファがない場合は動的作成
    return this.createDynamicBuffer(sizeHint, options);
  }

  /**
   * 最適プール選択
   */
  selectOptimalPool(sizeHint) {
    if (sizeHint <= this.poolConfig.small.size) return 'small';
    if (sizeHint <= this.poolConfig.medium.size) return 'medium';
    if (sizeHint <= this.poolConfig.large.size) return 'large';
    return 'xlarge';
  }

  /**
   * 最適なビュー作成
   */
  createOptimalView(buffer, options = {}) {
    const { dataType = 'uint8', offset = 0, length } = options;
    
    switch (dataType) {
      case 'uint8':
        return new Uint8Array(buffer, offset, length);
      case 'uint16':
        return new Uint16Array(buffer, offset, length);
      case 'uint32':
        return new Uint32Array(buffer, offset, length);
      case 'float32':
        return new Float32Array(buffer, offset, length);
      case 'float64':
        return new Float64Array(buffer, offset, length);
      default:
        return new Uint8Array(buffer, offset, length);
    }
  }

  /**
   * 動的バッファ作成
   */
  createDynamicBuffer(size, options = {}) {
    try {
      const buffer = this.isSupported 
        ? new SharedArrayBuffer(size)
        : new ArrayBuffer(size);
      
      const bufferId = `dynamic_${Date.now()}_${Math.random()}`;
      
      const bufferInfo = {
        id: bufferId,
        buffer,
        size,
        inUse: true,
        dynamic: true,
        createdAt: Date.now()
      };
      
      this.activeBuffers.set(bufferId, bufferInfo);
      this.stats.buffersCreated++;
      
      logger.debug(`🆕 Dynamic buffer created: ${bufferId} (${size} bytes)`);
      
      return {
        id: bufferId,
        buffer,
        size,
        view: this.createOptimalView(buffer, options)
      };
      
    } catch (error) {
      logger.error('Dynamic buffer creation failed:', error);
      throw error;
    }
  }

  /**
   * バッファ解放
   */
  releaseBuffer(bufferId) {
    const bufferInfo = this.activeBuffers.get(bufferId);
    
    if (!bufferInfo) {
      logger.warn(`Buffer ${bufferId} not found for release`);
      return;
    }
    
    if (bufferInfo.dynamic) {
      // 動的バッファは削除
      this.activeBuffers.delete(bufferId);
      logger.debug(`🗑️ Dynamic buffer released: ${bufferId}`);
    } else {
      // プールバッファは再利用のためプールに戻す
      bufferInfo.inUse = false;
      this.activeBuffers.delete(bufferId);
      logger.debug(`♻️ Buffer returned to pool: ${bufferId}`);
    }
  }

  /**
   * 高速データ転送
   */
  async transferDataToWorker(workerId, data, options = {}) {
    const startTime = performance.now();
    
    try {
      // データサイズ計算
      const dataSize = this.calculateDataSize(data);
      
      // 最適なバッファ取得
      const bufferInfo = this.acquireBuffer(dataSize, options);
      
      // データをバッファにコピー
      this.copyDataToBuffer(data, bufferInfo.view);
      
      // Workerに転送
      const transferResult = await this.sendBufferToWorker(
        workerId, 
        bufferInfo, 
        options
      );
      
      const transferTime = performance.now() - startTime;
      
      // 統計更新
      this.updateTransferStats(dataSize, transferTime);
      
      logger.debug(`⚡ Data transferred to worker ${workerId}: ${dataSize} bytes in ${Math.round(transferTime)}ms`);
      
      return transferResult;
      
    } catch (error) {
      logger.error('Data transfer to worker failed:', error);
      throw error;
    }
  }

  /**
   * データサイズ計算
   */
  calculateDataSize(data) {
    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }
    
    if (ArrayBuffer.isView(data)) {
      return data.byteLength;
    }
    
    if (typeof data === 'string') {
      return new TextEncoder().encode(data).length;
    }
    
    if (typeof data === 'object') {
      return new TextEncoder().encode(JSON.stringify(data)).length;
    }
    
    return 1024; // デフォルトサイズ
  }

  /**
   * データをバッファにコピー
   */
  copyDataToBuffer(data, view) {
    if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
      // バイナリデータの直接コピー
      const sourceView = new Uint8Array(data);
      view.set(sourceView);
    } else if (typeof data === 'string') {
      // 文字列をUTF-8でエンコード
      const encoded = new TextEncoder().encode(data);
      view.set(encoded);
    } else {
      // オブジェクトをJSONシリアライズ
      const jsonString = JSON.stringify(data);
      const encoded = new TextEncoder().encode(jsonString);
      view.set(encoded);
    }
  }

  /**
   * Workerにバッファ送信
   */
  async sendBufferToWorker(workerId, bufferInfo, options = {}) {
    const worker = this.getWorker(workerId);
    
    if (!worker) {
      throw new Error(`Worker ${workerId} not found`);
    }
    
    const message = {
      type: 'shared_buffer_transfer',
      bufferId: bufferInfo.id,
      buffer: bufferInfo.buffer,
      size: bufferInfo.size,
      dataType: options.dataType || 'uint8',
      metadata: options.metadata || {}
    };
    
    // SharedArrayBufferは直接転送、ArrayBufferはTransferable
    if (this.isSupported) {
      worker.postMessage(message);
    } else {
      worker.postMessage(message, [bufferInfo.buffer]);
    }
    
    return {
      bufferId: bufferInfo.id,
      transferred: true,
      size: bufferInfo.size
    };
  }

  /**
   * Worker取得
   */
  getWorker(workerId) {
    // パラレルワーカーマネージャーから取得
    if (window.parallelWorkerManager) {
      const workerInfo = window.parallelWorkerManager.workers.get(workerId);
      return workerInfo?.worker;
    }
    
    return null;
  }

  /**
   * 並列データ処理
   */
  async processDataInParallel(data, processingConfig) {
    const startTime = performance.now();
    
    try {
      // データを分割
      const chunks = this.splitDataIntoChunks(data, processingConfig);
      
      // 各チャンクを並列処理
      const processingPromises = chunks.map(async (chunk, index) => {
        const workerId = `worker_${index % processingConfig.workerCount}`;
        
        return this.transferDataToWorker(workerId, chunk.data, {
          metadata: {
            chunkIndex: index,
            totalChunks: chunks.length,
            processingType: processingConfig.type
          }
        });
      });
      
      const results = await Promise.allSettled(processingPromises);
      
      // 結果をマージ
      const mergedResult = this.mergeProcessingResults(results);
      
      const totalTime = performance.now() - startTime;
      logger.info(`⚡ Parallel processing completed in ${Math.round(totalTime)}ms`);
      
      return mergedResult;
      
    } catch (error) {
      logger.error('Parallel data processing failed:', error);
      throw error;
    }
  }

  /**
   * データ分割
   */
  splitDataIntoChunks(data, config) {
    const chunks = [];
    const chunkSize = Math.ceil(data.length / config.chunkCount);
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = {
        data: data.slice(i, i + chunkSize),
        index: chunks.length,
        startIndex: i,
        endIndex: Math.min(i + chunkSize, data.length)
      };
      
      chunks.push(chunk);
    }
    
    return chunks;
  }

  /**
   * 結果マージ
   */
  mergeProcessingResults(results) {
    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);
    
    const failed = results
      .filter(result => result.status === 'rejected')
      .map(result => result.reason);
    
    return {
      successful,
      failed,
      totalProcessed: successful.length,
      successRate: successful.length / results.length
    };
  }

  /**
   * バッファ間ゼロコピー転送
   */
  async zeroCopyTransfer(sourceBufferId, targetBufferId, options = {}) {
    if (!this.isSupported) {
      logger.warn('Zero-copy transfer requires SharedArrayBuffer');
      return this.fallbackCopyTransfer(sourceBufferId, targetBufferId, options);
    }
    
    const sourceBuffer = this.activeBuffers.get(sourceBufferId);
    const targetBuffer = this.activeBuffers.get(targetBufferId);
    
    if (!sourceBuffer || !targetBuffer) {
      throw new Error('Source or target buffer not found');
    }
    
    // SharedArrayBufferの場合、実際のコピーは不要
    // ポインタ共有のみ
    const transferInfo = {
      sourceId: sourceBufferId,
      targetId: targetBufferId,
      sharedBuffer: sourceBuffer.buffer,
      transferType: 'zero_copy',
      timestamp: Date.now()
    };
    
    logger.debug(`🔄 Zero-copy transfer: ${sourceBufferId} → ${targetBufferId}`);
    
    return transferInfo;
  }

  /**
   * フォールバックコピー転送
   */
  async fallbackCopyTransfer(sourceBufferId, targetBufferId, options = {}) {
    const sourceBuffer = this.activeBuffers.get(sourceBufferId);
    const targetBuffer = this.activeBuffers.get(targetBufferId);
    
    if (!sourceBuffer || !targetBuffer) {
      throw new Error('Source or target buffer not found');
    }
    
    // 通常のコピー処理
    const sourceView = new Uint8Array(sourceBuffer.buffer);
    const targetView = new Uint8Array(targetBuffer.buffer);
    
    const copySize = Math.min(sourceView.length, targetView.length);
    targetView.set(sourceView.subarray(0, copySize));
    
    logger.debug(`📋 Fallback copy transfer: ${copySize} bytes`);
    
    return {
      sourceId: sourceBufferId,
      targetId: targetBufferId,
      copiedBytes: copySize,
      transferType: 'copy'
    };
  }

  /**
   * メモリ最適化
   */
  optimizeMemoryUsage() {
    const currentTime = Date.now();
    const cleanupThreshold = 5 * 60 * 1000; // 5分
    
    let cleanedCount = 0;
    
    // 長時間未使用の動的バッファをクリーンアップ
    for (const [bufferId, bufferInfo] of this.activeBuffers) {
      if (bufferInfo.dynamic && 
          !bufferInfo.inUse && 
          (currentTime - bufferInfo.lastUsed) > cleanupThreshold) {
        
        this.activeBuffers.delete(bufferId);
        cleanedCount++;
      }
    }
    
    // プールバッファの最適化
    for (const [poolName, pool] of this.bufferPools) {
      // 使用率が低いプールのサイズ調整
      const usageRate = pool.filter(buf => buf.usageCount > 0).length / pool.length;
      
      if (usageRate < 0.3 && pool.length > 2) {
        // 未使用バッファを削除
        const unusedBuffers = pool.filter(buf => buf.usageCount === 0);
        const toRemove = Math.floor(unusedBuffers.length / 2);
        
        for (let i = 0; i < toRemove; i++) {
          const index = pool.indexOf(unusedBuffers[i]);
          if (index > -1) {
            pool.splice(index, 1);
            cleanedCount++;
          }
        }
      }
    }
    
    if (cleanedCount > 0) {
      logger.debug(`🧹 Memory optimized: ${cleanedCount} buffers cleaned`);
    }
  }

  /**
   * Workerコミュニケーションセットアップ
   */
  setupWorkerCommunication() {
    // Workerからのメッセージ処理
    const handleWorkerMessage = (workerId, message) => {
      switch (message.type) {
        case 'buffer_request':
          this.handleBufferRequest(workerId, message);
          break;
        case 'buffer_release':
          this.handleBufferRelease(workerId, message);
          break;
        case 'processing_complete':
          this.handleProcessingComplete(workerId, message);
          break;
      }
    };
    
    // パラレルワーカーマネージャーと連携
    if (window.parallelWorkerManager) {
      window.parallelWorkerManager.onWorkerMessage = handleWorkerMessage;
    }
  }

  /**
   * バッファリクエスト処理
   */
  async handleBufferRequest(workerId, message) {
    try {
      const { size, dataType, requestId } = message;
      const bufferInfo = this.acquireBuffer(size, { dataType });
      
      // Workerに応答
      const worker = this.getWorker(workerId);
      if (worker) {
        worker.postMessage({
          type: 'buffer_response',
          requestId,
          bufferId: bufferInfo.id,
          buffer: bufferInfo.buffer,
          size: bufferInfo.size
        });
      }
      
    } catch (error) {
      logger.error(`Buffer request failed for worker ${workerId}:`, error);
    }
  }

  /**
   * バッファリリース処理
   */
  handleBufferRelease(workerId, message) {
    const { bufferId } = message;
    this.releaseBuffer(bufferId);
  }

  /**
   * 処理完了処理
   */
  handleProcessingComplete(workerId, message) {
    const { bufferId, result, processingTime } = message;
    
    // 統計更新
    this.updateProcessingStats(processingTime);
    
    // バッファの自動解放（オプション）
    if (message.autoRelease) {
      this.releaseBuffer(bufferId);
    }
  }

  /**
   * パフォーマンス監視開始
   */
  startPerformanceMonitoring() {
    // 定期的な最適化
    setInterval(() => {
      this.optimizeMemoryUsage();
    }, 60000); // 1分ごと
    
    // 統計レポート
    setInterval(() => {
      this.logPerformanceStats();
    }, 300000); // 5分ごと
  }

  /**
   * 転送統計更新
   */
  updateTransferStats(dataSize, transferTime) {
    this.stats.totalTransfers++;
    this.stats.totalDataTransferred += dataSize;
    this.stats.avgTransferTime = (
      (this.stats.avgTransferTime * (this.stats.totalTransfers - 1)) + transferTime
    ) / this.stats.totalTransfers;
  }

  /**
   * 処理統計更新
   */
  updateProcessingStats(processingTime) {
    // 処理時間統計の更新
  }

  /**
   * パフォーマンス統計ログ
   */
  logPerformanceStats() {
    const memoryUsage = this.calculateMemoryUsage();
    const efficiency = this.calculateEfficiency();
    
    logger.info('📊 SharedBuffer Performance Stats:', {
      ...this.stats,
      memoryUsage,
      efficiency,
      supportMode: this.isSupported ? 'SharedArrayBuffer' : 'ArrayBuffer'
    });
  }

  /**
   * メモリ使用量計算
   */
  calculateMemoryUsage() {
    let totalSize = 0;
    let usedSize = 0;
    
    for (const pool of this.bufferPools.values()) {
      for (const bufferInfo of pool) {
        totalSize += bufferInfo.size;
        if (bufferInfo.inUse) {
          usedSize += bufferInfo.size;
        }
      }
    }
    
    for (const bufferInfo of this.activeBuffers.values()) {
      if (bufferInfo.dynamic) {
        totalSize += bufferInfo.size;
        usedSize += bufferInfo.size;
      }
    }
    
    return {
      total: totalSize,
      used: usedSize,
      utilization: totalSize > 0 ? (usedSize / totalSize) * 100 : 0
    };
  }

  /**
   * 効率性計算
   */
  calculateEfficiency() {
    const reuseRate = this.stats.buffersCreated > 0 
      ? (this.stats.buffersReused / this.stats.buffersCreated) * 100 
      : 0;
      
    return {
      bufferReuseRate: reuseRate,
      avgTransferSpeed: this.stats.totalDataTransferred / Math.max(this.stats.avgTransferTime, 1)
    };
  }

  /**
   * 統計取得
   */
  getStats() {
    return {
      ...this.stats,
      isSupported: this.isSupported,
      memoryUsage: this.calculateMemoryUsage(),
      efficiency: this.calculateEfficiency(),
      activeBuffers: this.activeBuffers.size,
      poolSizes: Object.fromEntries(
        Array.from(this.bufferPools.entries()).map(([name, pool]) => [name, pool.length])
      )
    };
  }

  /**
   * クリーンアップ
   */
  cleanup() {
    // 全てのアクティブバッファを解放
    for (const bufferId of this.activeBuffers.keys()) {
      this.releaseBuffer(bufferId);
    }
    
    // プールクリア
    this.bufferPools.clear();
    
    logger.info('🧹 SharedBufferOptimizer cleanup completed');
  }
}

// グローバルインスタンス
window.sharedBufferOptimizer = new SharedBufferOptimizer();

// エクスポート
export { SharedBufferOptimizer };