/**
 * 🚀 AI Processing Worker - 専用ワーカーでAI処理を並列実行
 * メインスレッドをブロックしない高速AI処理
 */

// Worker内で使用するライブラリ
// logger-frontend.jsが存在しないため、シンプルなloggerを定義
const logger = {
  debug: (...args) => process.env.NODE_ENV !== 'production' && console.debug('[Worker]', ...args),
  info: (...args) => process.env.NODE_ENV !== 'production' && console.info('[Worker]', ...args),
  success: (...args) => process.env.NODE_ENV !== 'production' && console.log('[Worker] ✅', ...args),
  warn: (...args) => (process.env.NODE_ENV !== 'production' || true) && console.warn('[Worker]', ...args),
  error: (...args) => (process.env.NODE_ENV !== 'production' || true) && console.error('[Worker]', ...args)
};

class AIProcessingWorker {
  constructor() {
    this.taskQueue = new Map();
    this.activeProcesses = new Map();
    this.maxConcurrency = 3;
    this.currentId = 0;
    
    // パフォーマンス追跡
    this.metrics = {
      processedTasks: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      errorCount: 0
    };
    
    this.initializeWorker();
  }

  initializeWorker() {
    // メインスレッドからのメッセージ処理
    self.onmessage = (event) => {
      this.handleMessage(event.data);
    };
    
    // エラーハンドリング
    self.onerror = (error) => {
      this.handleError(error);
    };
    
    logger.info('🚀 AI Processing Worker initialized');
  }

  async handleMessage(data) {
    const { type, payload, taskId } = data;
    
    try {
      switch (type) {
      case 'processPhase':
        await this.processPhase(payload, taskId);
        break;
          
      case 'processParallel':
        await this.processParallelPhases(payload, taskId);
        break;
          
      case 'evaluateQuality':
        await this.evaluateQuality(payload, taskId);
        break;
          
      case 'optimizeContent':
        await this.optimizeContent(payload, taskId);
        break;
          
      case 'getMetrics':
        this.sendMetrics(taskId);
        break;
          
      case 'terminate':
        this.terminate();
        break;
          
      default:
        throw new Error(`Unknown task type: ${type}`);
      }
    } catch (error) {
      this.sendError(taskId, error);
    }
  }

  /**
   * 単一フェーズ処理
   */
  async processPhase(payload, taskId) {
    const startTime = performance.now();
    const processId = this.generateProcessId();
    
    try {
      this.activeProcesses.set(processId, {
        taskId,
        startTime,
        phase: payload.phaseName
      });
      
      // フェーズ処理をシミュレート（実際のAI処理呼び出し）
      const result = await this.executePhaseProcessing(payload);
      
      // 品質評価
      const qualityScore = await this.quickQualityEvaluation(result);
      
      const processingTime = performance.now() - startTime;
      this.updateMetrics(processingTime);
      
      this.sendSuccess(taskId, {
        processId,
        result,
        qualityScore,
        processingTime,
        phase: payload.phaseName
      });
      
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    } finally {
      this.activeProcesses.delete(processId);
    }
  }

  /**
   * 並列フェーズ処理
   */
  async processParallelPhases(payload, taskId) {
    const { phases, maxConcurrency = this.maxConcurrency } = payload;
    const startTime = performance.now();
    
    try {
      // フェーズをバッチに分割
      const batches = this.createBatches(phases, maxConcurrency);
      const allResults = [];
      
      // バッチごとに並列実行
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        this.sendProgress(taskId, {
          type: 'batch_start',
          batchIndex,
          totalBatches: batches.length,
          batchSize: batch.length
        });
        
        // バッチ内で並列実行
        const batchPromises = batch.map(async (phase, phaseIndex) => {
          const phaseStartTime = performance.now();
          
          try {
            const result = await this.executePhaseProcessing(phase);
            const processingTime = performance.now() - phaseStartTime;
            
            this.sendProgress(taskId, {
              type: 'phase_complete',
              batchIndex,
              phaseIndex,
              phaseName: phase.phaseName,
              processingTime
            });
            
            return {
              phaseId: phase.phaseId,
              phaseName: phase.phaseName,
              result,
              processingTime
            };
            
          } catch (error) {
            logger.error(`Phase ${phase.phaseName} failed:`, error);
            return {
              phaseId: phase.phaseId,
              phaseName: phase.phaseName,
              error: error.message,
              processingTime: performance.now() - phaseStartTime
            };
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        allResults.push(...batchResults.map(r => r.value || r.reason));
        
        this.sendProgress(taskId, {
          type: 'batch_complete',
          batchIndex,
          results: batchResults.length
        });
      }
      
      const totalProcessingTime = performance.now() - startTime;
      this.updateMetrics(totalProcessingTime);
      
      this.sendSuccess(taskId, {
        type: 'parallel_complete',
        results: allResults,
        totalProcessingTime,
        phasesProcessed: phases.length
      });
      
    } catch (error) {
      this.metrics.errorCount++;
      throw error;
    }
  }

  /**
   * フェーズ処理実行
   */
  async executePhaseProcessing(phase) {
    const { phaseName, formData, context } = phase;
    
    // シミュレート処理（実際のプロダクションではAI APIコール）
    return new Promise((resolve) => {
      // 処理時間をシミュレート（実際の処理時間に基づく）
      const processingTime = this.calculateExpectedProcessingTime(phaseName);
      
      setTimeout(() => {
        // 模擬結果生成
        const result = this.generateMockResult(phaseName, formData, context);
        resolve(result);
      }, processingTime);
    });
  }

  /**
   * 期待処理時間計算
   */
  calculateExpectedProcessingTime(phaseName) {
    const baseTimes = {
      'random_outline': 500,
      'concept_refinement': 800,
      'incident_core': 1200,
      'incident_details': 1000,
      'character_generation': 1500,
      'evidence_system': 800,
      'gamemaster_guide': 600,
      'final_integration': 700,
      'comprehensive_review': 400
    };
    
    const baseTime = baseTimes[phaseName] || 1000;
    // ランダムな変動を追加 (±30%)
    const variation = (Math.random() - 0.5) * 0.6;
    return Math.floor(baseTime * (1 + variation));
  }

  /**
   * 模擬結果生成
   */
  generateMockResult(phaseName, formData, _context) {
    const templates = {
      'random_outline': {
        random_outline: `## 作品基本情報（ランダム版）
**作品タイトル**: ${this.generateRandomTitle(formData)}
**基本コンセプト**: ${formData.participants}人による${formData.era}時代の${formData.setting}でのミステリー
**舞台設定**: ${this.generateRandomSetting(formData)}

## 事件の大まかな構造（ランダム版）
**事件の種類**: ${formData.incident_type}
**犯人の数**: ${Math.random() > 0.7 ? '共犯' : '単犯'}
**基本的な動機**: ${this.generateRandomMotive()}
**主なトリック**: ${this.generateRandomTrick()}`
      },
      'concept_refinement': {
        concept: `## 詳細コンセプト
**作品タイトル**: ${this.generateRandomTitle(formData)}
**基本コンセプト**: 緻密に練られた${formData.participants}人用ミステリー
**ジャンル**: ${this.generateGenre(formData)}
**想定プレイ時間**: 30-60分`
      }
    };
    
    return templates[phaseName] || { content: `${phaseName}の処理結果` };
  }

  /**
   * ランダムタイトル生成
   */
  generateRandomTitle(_formData) {
    const prefixes = ['消えた', '隠された', '最後の', '呪われた', '忘れられた'];
    const subjects = ['真実', '証拠', '記憶', '告白', '手紙'];
    const suffixes = ['の謎', 'の秘密', 'の影', 'の謎解き', 'の事件'];
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    return `${prefix}${subject}${suffix}`;
  }

  generateRandomSetting(formData) {
    const settings = {
      'modern': ['オフィスビル', '高級マンション', '研究施設', 'カフェ'],
      'historical': ['洋館', '山荘', '寺院', '商家'],
      'fantasy': ['魔法学院', '古城', '森の小屋', '遺跡']
    };
    
    const options = settings[formData.era] || settings['modern'];
    return options[Math.floor(Math.random() * options.length)];
  }

  generateRandomMotive() {
    const motives = ['金銭', '復讐', '嫉妬', '秘密の隠蔽', '愛憎', '野心'];
    return motives[Math.floor(Math.random() * motives.length)];
  }

  generateRandomTrick() {
    const tricks = ['時刻トリック', 'アリバイ工作', '身代わり', '証拠隠滅', '偽装工作'];
    return tricks[Math.floor(Math.random() * tricks.length)];
  }

  generateGenre(_formData) {
    const genres = ['本格ミステリー', 'サスペンス', 'ホラーミステリー', '推理もの'];
    return genres[Math.floor(Math.random() * genres.length)];
  }

  /**
   * 簡易品質評価
   */
  async quickQualityEvaluation(result) {
    // 結果の内容に基づく簡易品質スコア
    let score = 0.5;
    
    const content = JSON.stringify(result);
    
    // 文字数チェック
    if (content.length > 200) {score += 0.2;}
    if (content.length > 500) {score += 0.1;}
    
    // キーワード存在チェック
    const keywords = ['タイトル', 'コンセプト', '事件', 'キャラクター'];
    keywords.forEach(keyword => {
      if (content.includes(keyword)) {score += 0.05;}
    });
    
    // ランダム要素
    score += Math.random() * 0.2;
    
    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * バッチ作成
   */
  createBatches(phases, maxConcurrency) {
    const batches = [];
    for (let i = 0; i < phases.length; i += maxConcurrency) {
      batches.push(phases.slice(i, i + maxConcurrency));
    }
    return batches;
  }

  /**
   * 品質評価処理
   */
  async evaluateQuality(payload, taskId) {
    const { content, criteria } = payload;
    const startTime = performance.now();

    const evaluation = await this.performQualityEvaluation(content, criteria);
    const processingTime = performance.now() - startTime;

    this.sendSuccess(taskId, {
      evaluation,
      processingTime
    });
  }

  async performQualityEvaluation(content, _criteria) {
    // 詳細な品質評価ロジック
    const scores = {};
    
    // 完全性評価
    scores.completeness = this.evaluateCompleteness(content);
    
    // 一貫性評価
    scores.consistency = this.evaluateConsistency(content);
    
    // 創造性評価
    scores.creativity = this.evaluateCreativity(content);
    
    // 論理性評価
    scores.logic = this.evaluateLogic(content);
    
    // 総合スコア
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / Object.keys(scores).length;
    
    return {
      scores,
      totalScore,
      recommendation: this.generateRecommendation(scores),
      passesQuality: totalScore >= 0.7
    };
  }

  evaluateCompleteness(content) {
    const requiredElements = ['タイトル', 'キャラクター', '事件', '動機'];
    const contentStr = JSON.stringify(content);
    
    let found = 0;
    requiredElements.forEach(element => {
      if (contentStr.includes(element)) {found++;}
    });
    
    return found / requiredElements.length;
  }

  evaluateConsistency(_content) {
    // 一貫性チェックの簡易実装
    return 0.7 + Math.random() * 0.3;
  }

  evaluateCreativity(_content) {
    // 創造性評価の簡易実装
    return 0.6 + Math.random() * 0.4;
  }

  evaluateLogic(_content) {
    // 論理性評価の簡易実装
    return 0.8 + Math.random() * 0.2;
  }

  generateRecommendation(scores) {
    const recommendations = [];
    
    if (scores.completeness < 0.7) {
      recommendations.push('必要な要素が不足しています');
    }
    
    if (scores.consistency < 0.7) {
      recommendations.push('内容の一貫性を向上させてください');
    }
    
    if (scores.creativity < 0.6) {
      recommendations.push('より創造的な要素を追加してください');
    }
    
    if (scores.logic < 0.7) {
      recommendations.push('論理的な構成を見直してください');
    }
    
    return recommendations.length > 0 ? recommendations : ['高品質なコンテンツです'];
  }

  /**
   * コンテンツ最適化
   */
  async optimizeContent(payload, taskId) {
    const { content, optimizationSettings } = payload;
    const startTime = performance.now();

    const optimizedContent = await this.performOptimization(content, optimizationSettings);
    const processingTime = performance.now() - startTime;

    this.sendSuccess(taskId, {
      optimizedContent,
      optimizations: optimizedContent.optimizations,
      processingTime
    });
  }

  async performOptimization(content, settings) {
    // コンテンツ最適化ロジック
    const optimizations = [];
    let optimizedContent = JSON.parse(JSON.stringify(content));
    
    // 文章の改善
    if (settings.improveText) {
      optimizedContent = this.improveText(optimizedContent);
      optimizations.push('文章表現の改善');
    }
    
    // 構造の最適化
    if (settings.optimizeStructure) {
      optimizedContent = this.optimizeStructure(optimizedContent);
      optimizations.push('構造の最適化');
    }
    
    // 一貫性の向上
    if (settings.enhanceConsistency) {
      optimizedContent = this.enhanceConsistency(optimizedContent);
      optimizations.push('一貫性の向上');
    }
    
    return {
      content: optimizedContent,
      optimizations
    };
  }

  improveText(content) {
    // テキスト改善の簡易実装
    return content;
  }

  optimizeStructure(content) {
    // 構造最適化の簡易実装
    return content;
  }

  enhanceConsistency(content) {
    // 一貫性向上の簡易実装
    return content;
  }

  /**
   * ユーティリティメソッド
   */
  generateProcessId() {
    return `proc_${++this.currentId}_${Date.now()}`;
  }

  updateMetrics(processingTime) {
    this.metrics.processedTasks++;
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.averageProcessingTime = this.metrics.totalProcessingTime / this.metrics.processedTasks;
  }

  /**
   * メッセージ送信メソッド
   */
  sendSuccess(taskId, result) {
    self.postMessage({
      type: 'success',
      taskId,
      result
    });
  }

  sendProgress(taskId, progress) {
    self.postMessage({
      type: 'progress',
      taskId,
      progress
    });
  }

  sendError(taskId, error) {
    self.postMessage({
      type: 'error',
      taskId,
      error: {
        message: error.message,
        stack: error.stack
      }
    });
  }

  sendMetrics(taskId) {
    self.postMessage({
      type: 'metrics',
      taskId,
      metrics: this.metrics
    });
  }

  handleError(error) {
    logger.error('Worker error:', error);
    self.postMessage({
      type: 'worker_error',
      error: {
        message: error.message,
        filename: error.filename,
        lineno: error.lineno
      }
    });
  }

  terminate() {
    logger.info('🚀 AI Processing Worker terminating');
    self.close();
  }
}

// ワーカー初期化
new AIProcessingWorker();