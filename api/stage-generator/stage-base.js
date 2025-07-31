/**
 * 🎯 段階別Function共通ベースクラス
 * Vercel無料プラン（10秒制限）対応
 */

const { withSecurity } = require('../security-utils.js');
const { aiClient } = require('../utils/ai-client.js');
const { logger } = require('../utils/logger.js');
const { saveScenarioToSupabase, getScenarioFromSupabase } = require('../supabase-client.js');
const { callGroqAPI, getGroqApiKey } = require('../utils/groq-client.js');

class StageBase {
  constructor(stageName, stageWeight = 10) {
    this.stageName = stageName;
    this.stageWeight = stageWeight;
    this.maxDuration = 8; // 8秒でタイムアウト（10秒制限の安全マージン）
  }

  /**
   * 段階実行の共通フロー
   */
  async execute(req, res) {
    const startTime = Date.now();
    let sessionId = null;

    try {
      // リクエストデータの取得
      const { sessionId: reqSessionId, ...stageData } = req.body;
      sessionId = reqSessionId;

      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'sessionIdが必要です'
        });
      }

      logger.info(`🎯 ${this.stageName} 開始 [Session: ${sessionId}]`);

      // セッションデータの取得
      const sessionData = await this.getSessionData(sessionId);
      if (!sessionData) {
        return res.status(404).json({
          success: false,
          error: 'セッションが見つかりません'
        });
      }

      // セッション状態の更新（開始）
      await this.updateSessionStatus(sessionId, 'processing', {
        currentStage: this.stageName,
        progress: this.calculateStartProgress(sessionData.currentStageIndex || 0)
      });

      // タイムアウト監視
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('処理タイムアウト')), this.maxDuration * 1000);
      });

      // 段階処理の実行
      const processPromise = this.processStage(sessionData, stageData);
      const result = await Promise.race([processPromise, timeoutPromise]);

      // 結果の保存
      const updatedSessionData = {
        ...sessionData,
        ...result,
        currentStageIndex: (sessionData.currentStageIndex || 0) + 1,
        lastUpdate: new Date().toISOString()
      };

      await this.saveSessionData(sessionId, updatedSessionData);

      // セッション状態の更新（完了）
      await this.updateSessionStatus(sessionId, 'stage_completed', {
        currentStage: this.stageName,
        progress: this.calculateEndProgress(updatedSessionData.currentStageIndex),
        completed: true
      });

      const executionTime = Date.now() - startTime;
      logger.success(`✅ ${this.stageName} 完了 [${executionTime}ms]`);

      return res.status(200).json({
        success: true,
        stageName: this.stageName,
        sessionId: sessionId,
        result: result,
        executionTime: executionTime,
        nextStage: this.getNextStage(updatedSessionData.currentStageIndex)
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`❌ ${this.stageName} エラー [${executionTime}ms]:`, error);
      console.error(`[STAGE-BASE ERROR] ${this.stageName}:`, error);
      console.error(`[STAGE-BASE] Stack trace:`, error.stack);

      // APIキーの状態を確認
      const apiKeyStatus = {
        envGROQ: process.env.GROQ_API_KEY ? 'SET' : 'NOT_SET',
        envGROQLength: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.length : 0,
        envKeys: Object.keys(process.env).filter(k => k.includes('API') || k.includes('KEY')).sort(),
        vercelEnv: process.env.VERCEL ? 'YES' : 'NO',
        nodeEnv: process.env.NODE_ENV,
        stage: this.stageName,
        errorMessage: error.message,
        errorType: error.constructor.name
      };
      console.error('[STAGE-BASE] API Key Status:', apiKeyStatus);
      console.error('[STAGE-BASE] Full Error:', error);

      if (sessionId) {
        await this.updateSessionStatus(sessionId, 'error', {
          error: error.message,
          stage: this.stageName,
          apiKeyStatus: apiKeyStatus
        });
      }

      return res.status(500).json({
        success: false,
        error: error.message,
        stageName: this.stageName,
        executionTime: executionTime,
        debug: {
          apiKeyStatus: apiKeyStatus,
          errorType: error.constructor.name,
          errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      });
    }
  }

  /**
   * 段階固有の処理（サブクラスで実装）
   */
  async processStage(sessionData, stageData) {
    throw new Error('processStage must be implemented by subclass');
  }

  /**
   * セッションデータの取得
   */
  async getSessionData(sessionId) {
    try {
      const data = await getScenarioFromSupabase(sessionId);
      return data || null;
    } catch (error) {
      logger.warn('Supabaseからの取得失敗、メモリから試行:', error.message);
      // フォールバック：メモリキャッシュから取得
      return null;
    }
  }

  /**
   * セッションデータの保存
   */
  async saveSessionData(sessionId, data) {
    try {
      await saveScenarioToSupabase(sessionId, data);
    } catch (error) {
      logger.warn('Supabaseへの保存失敗:', error.message);
      // フォールバック処理（メモリキャッシュなど）
    }
  }

  /**
   * セッション状態の更新
   */
  async updateSessionStatus(sessionId, status, details = {}) {
    const statusData = {
      sessionId,
      status,
      timestamp: new Date().toISOString(),
      ...details
    };

    // 状態更新の実装（Supabaseのsession_statusテーブルなど）
    logger.debug(`📊 Status Update [${sessionId}]:`, statusData);
  }

  /**
   * 進捗計算（開始時）
   */
  calculateStartProgress(stageIndex) {
    const totalWeight = this.getTotalWeight();
    let currentWeight = 0;
    
    for (let i = 0; i < stageIndex; i++) {
      currentWeight += this.getStageWeight(i);
    }
    
    return Math.round((currentWeight / totalWeight) * 100);
  }

  /**
   * 進捗計算（完了時）
   */
  calculateEndProgress(stageIndex) {
    const totalWeight = this.getTotalWeight();
    let currentWeight = 0;
    
    for (let i = 0; i < stageIndex; i++) {
      currentWeight += this.getStageWeight(i);
    }
    
    return Math.round((currentWeight / totalWeight) * 100);
  }

  /**
   * 段階重みの取得
   */
  getStageWeight(stageIndex) {
    const weights = [15, 10, 12, 13, 35, 18, 8, 5, 4]; // 各段階の重み
    return weights[stageIndex] || 10;
  }

  /**
   * 総重みの取得
   */
  getTotalWeight() {
    return 15 + 10 + 12 + 13 + 35 + 18 + 8 + 5 + 4; // 120
  }

  /**
   * 次の段階の取得
   */
  getNextStage(currentStageIndex) {
    const stages = [
      'stage0', 'stage1', 'stage2', 'stage3', 'stage4',
      'stage5', 'stage6', 'stage7', 'stage8'
    ];
    
    if (currentStageIndex >= stages.length) {
      return 'completed';
    }
    
    return stages[currentStageIndex];
  }

  /**
   * AI生成の共通処理
   */
  async generateWithAI(systemPrompt, userPrompt, apiKey, options = {}) {
    const config = {
      maxTokens: options.maxTokens || 2000,
      temperature: options.temperature || 0.7,
      timeout: Math.min(options.timeout || 6000, 6000), // 6秒上限
      ...options
    };

    // APIキーが提供されていない場合、環境変数から取得
    let finalApiKey = apiKey;
    if (!finalApiKey) {
      finalApiKey = getGroqApiKey();
      if (finalApiKey) {
        logger.debug('Using API key from environment');
      }
    }

    if (!finalApiKey) {
      throw new Error('APIキーが設定されていません');
    }

    try {
      // シンプルなGROQ API直接呼び出しを使用
      const result = await callGroqAPI(systemPrompt, userPrompt, finalApiKey);
      return result;
    } catch (error) {
      logger.error(`AI generation failed for ${this.stageName}:`, error);
      
      // フォールバック：元のaiClientを使用
      try {
        return await aiClient.generateWithRetry(systemPrompt, userPrompt, {
          apiKey: finalApiKey,
          ...config
        });
      } catch (fallbackError) {
        logger.error('Fallback AI generation also failed:', fallbackError);
      }
      
      // 構造化されたエラーをチェック
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj.type === 'SYSTEM_FAILURE' || errorObj.type === 'CONFIGURATION_ERROR') {
          throw error; // 構造化されたエラーはそのまま伝播
        }
      } catch (e) {
        // JSONパースできない場合は通常のエラー
      }
      
      throw new Error(`AI生成に失敗しました: ${error.message}`);
    }
  }
}

module.exports = { StageBase };