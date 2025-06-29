/**
 * PDF生成メモリ最適化ユーティリティ
 */

// グローバルメモリ使用量監視
let memoryStats = {
  totalGenerated: 0,
  activeInstances: 0,
  peakMemory: 0,
  errors: 0
};

/**
 * メモリ使用量を監視
 */
export function getMemoryUsage() {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    return {
      rss: Math.round(usage.rss / 1024 / 1024), // MB
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
      external: Math.round(usage.external / 1024 / 1024) // MB
    };
  }
  return null;
}

/**
 * メモリクリーンアップ
 */
export function cleanupMemory() {
  try {
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
      console.log('♻️ メモリガベージコレクション実行');
    }
  } catch (error) {
    console.warn('⚠️ ガベージコレクション実行失敗:', error.message);
  }
}

/**
 * PDF生成統計を記録
 */
export function trackPDFGeneration(success = true, memoryUsed = 0) {
  memoryStats.totalGenerated++;
  
  if (success) {
    memoryStats.peakMemory = Math.max(memoryStats.peakMemory, memoryUsed);
  } else {
    memoryStats.errors++;
  }
  
  console.log('📊 PDF生成統計:', memoryStats);
}

/**
 * アクティブインスタンス数を管理
 */
export function incrementActiveInstances() {
  memoryStats.activeInstances++;
  console.log(`📈 アクティブPDFインスタンス: ${memoryStats.activeInstances}`);
}

export function decrementActiveInstances() {
  memoryStats.activeInstances = Math.max(0, memoryStats.activeInstances - 1);
  console.log(`📉 アクティブPDFインスタンス: ${memoryStats.activeInstances}`);
}

/**
 * メモリ制限チェック
 */
export function checkMemoryLimits() {
  const usage = getMemoryUsage();
  if (!usage) return true;
  
  const totalMemoryMB = usage.heapUsed + usage.external;
  const maxMemoryMB = 512; // 512MB制限
  
  if (totalMemoryMB > maxMemoryMB) {
    console.warn(`⚠️ メモリ使用量警告: ${totalMemoryMB}MB > ${maxMemoryMB}MB`);
    cleanupMemory();
    return false;
  }
  
  return true;
}

/**
 * PDF生成用メモリラッパー
 */
export async function withMemoryOptimization(asyncOperation) {
  const startTime = Date.now();
  let memoryBefore = null;
  let memoryAfter = null;
  
  try {
    // メモリ制限チェック
    if (!checkMemoryLimits()) {
      throw new Error('メモリ使用量が制限を超えています');
    }
    
    incrementActiveInstances();
    memoryBefore = getMemoryUsage();
    
    console.log('💾 PDF生成開始 - メモリ使用量:', memoryBefore);
    
    // 実際のPDF生成処理
    const result = await asyncOperation();
    
    memoryAfter = getMemoryUsage();
    const processingTime = Date.now() - startTime;
    
    console.log('✅ PDF生成完了 - メモリ使用量:', memoryAfter);
    console.log(`⏱️ 処理時間: ${processingTime}ms`);
    
    // 統計記録
    trackPDFGeneration(true, memoryAfter?.heapUsed || 0);
    
    return result;
    
  } catch (error) {
    memoryAfter = getMemoryUsage();
    console.error('❌ PDF生成エラー - メモリ使用量:', memoryAfter);
    
    // エラー統計記録
    trackPDFGeneration(false, memoryAfter?.heapUsed || 0);
    
    throw error;
    
  } finally {
    decrementActiveInstances();
    
    // メモリクリーンアップ
    setTimeout(() => {
      cleanupMemory();
    }, 1000);
  }
}

/**
 * 大きなテキストを分割処理
 */
export function processLargeContent(content, maxChunkSize = 10000) {
  if (!content || content.length <= maxChunkSize) {
    return [content || ''];
  }
  
  const chunks = [];
  let currentPos = 0;
  
  while (currentPos < content.length) {
    let chunkEnd = currentPos + maxChunkSize;
    
    // 文の境界で分割
    if (chunkEnd < content.length) {
      const nearestBreak = content.lastIndexOf('\n', chunkEnd);
      if (nearestBreak > currentPos) {
        chunkEnd = nearestBreak;
      }
    }
    
    chunks.push(content.substring(currentPos, chunkEnd));
    currentPos = chunkEnd;
  }
  
  console.log(`📄 大容量コンテンツを${chunks.length}チャンクに分割`);
  return chunks;
}

/**
 * メモリ統計をリセット
 */
export function resetMemoryStats() {
  memoryStats = {
    totalGenerated: 0,
    activeInstances: 0,
    peakMemory: 0,
    errors: 0
  };
  console.log('🔄 メモリ統計リセット');
}

/**
 * 現在のメモリ統計を取得
 */
export function getMemoryStats() {
  return {
    ...memoryStats,
    currentUsage: getMemoryUsage()
  };
}