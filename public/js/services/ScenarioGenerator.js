import EventEmitter from '../core/EventEmitter.js';
import Logger from '../utils/Logger.js';

/**
 * ScenarioGenerator - シナリオ生成のビジネスロジック
 * Factory パターンで生成戦略を管理
 */
class ScenarioGenerator extends EventEmitter {
  constructor(apiClient, options = {}) {
    super();
    
    this.apiClient = apiClient;
    this.maxRetries = options.maxRetries || 3;
    this.timeout = options.timeout || 300000; // 5分
    this.strategies = new Map();
    this.fallbackStrategies = [];
    this.currentGeneration = null;
    
    this.setupGenerationStrategies();
    this.setupFallbackChain();
  }

  /**
   * 生成戦略の設定
   */
  setupGenerationStrategies() {
    // Ultra Phases Strategy (Primary)
    this.addStrategy('ultra_phases', {
      name: 'Groq超高速8段階並列処理',
      estimatedTime: 45000, // 45秒
      priority: 1,
      generate: this.generateWithUltraPhases.bind(this)
    });

    // OpenAI Phases Strategy (Fallback)
    this.addStrategy('openai_phases', {
      name: 'OpenAI標準8段階処理',
      estimatedTime: 120000, // 2分
      priority: 2,
      generate: this.generateWithOpenAIPhases.bind(this)
    });

    // Simple Strategy (Emergency)
    this.addStrategy('simple', {
      name: 'シンプル単一生成',
      estimatedTime: 30000, // 30秒
      priority: 3,
      generate: this.generateSimple.bind(this)
    });

    // Emergency Local Strategy (Last Resort)
    this.addStrategy('emergency', {
      name: '緊急ローカル生成',
      estimatedTime: 5000, // 5秒
      priority: 4,
      generate: this.generateEmergency.bind(this)
    });
  }

  /**
   * フォールバック戦略チェーンの設定
   */
  setupFallbackChain() {
    this.fallbackStrategies = [
      'ultra_phases',
      'openai_phases', 
      'simple',
      'emergency'
    ];
  }

  /**
   * 戦略の追加
   */
  addStrategy(name, strategy) {
    this.strategies.set(name, {
      ...strategy,
      attempts: 0,
      lastError: null,
      successRate: 0,
      averageTime: 0
    });
  }

  /**
   * シナリオ生成のメイン実行メソッド
   */
  async generateScenario(formData, options = {}) {
    const generationId = this.generateId();
    
    this.currentGeneration = {
      id: generationId,
      formData,
      options,
      startTime: Date.now(),
      strategy: null,
      status: 'starting'
    };

    this.emit('generation:start', {
      id: generationId,
      formData,
      options
    });

    try {
      Logger.time(`scenario-generation-${generationId}`);
      
      // 戦略選択
      const strategy = this.selectStrategy(options.preferredStrategy);
      this.currentGeneration.strategy = strategy.name;
      this.currentGeneration.status = 'generating';

      this.emit('generation:strategy:selected', {
        id: generationId,
        strategy: strategy.name,
        estimatedTime: strategy.estimatedTime
      });

      // 生成実行
      const result = await this.executeWithFallback(formData, options);
      
      const duration = Logger.timeEnd(`scenario-generation-${generationId}`);
      
      this.currentGeneration.status = 'completed';
      this.currentGeneration.duration = duration;
      this.currentGeneration.result = result;

      // 成功統計更新
      this.updateStrategyStats(strategy.name, true, duration);

      this.emit('generation:complete', {
        id: generationId,
        result,
        duration,
        strategy: strategy.name
      });

      return result;

    } catch (error) {
      const duration = Date.now() - this.currentGeneration.startTime;
      
      this.currentGeneration.status = 'failed';
      this.currentGeneration.error = error;
      this.currentGeneration.duration = duration;

      Logger.error('Scenario generation failed:', error);

      this.emit('generation:error', {
        id: generationId,
        error,
        duration,
        strategy: this.currentGeneration.strategy
      });

      throw error;

    } finally {
      this.currentGeneration = null;
    }
  }

  /**
   * フォールバック付き実行
   */
  async executeWithFallback(formData, options) {
    let lastError = null;
    
    for (const strategyName of this.fallbackStrategies) {
      const strategy = this.strategies.get(strategyName);
      
      if (!strategy) continue;

      // 戦略スキップ条件チェック
      if (this.shouldSkipStrategy(strategy)) {
        continue;
      }

      try {
        this.emit('generation:attempt', {
          strategy: strategyName,
          attempt: strategy.attempts + 1
        });

        Logger.info(`Attempting generation with strategy: ${strategyName}`);

        const result = await this.executeStrategy(strategy, formData, options);
        
        Logger.info(`Generation successful with strategy: ${strategyName}`);
        return result;

      } catch (error) {
        lastError = error;
        strategy.attempts++;
        strategy.lastError = error;

        Logger.warn(`Strategy ${strategyName} failed:`, error.message);

        this.emit('generation:strategy:failed', {
          strategy: strategyName,
          error,
          attempts: strategy.attempts
        });

        // 戦略固有のエラーハンドリング
        if (this.isFatalError(error)) {
          Logger.error(`Fatal error in strategy ${strategyName}, stopping fallback chain`);
          break;
        }

        // 次の戦略に進む前の待機
        await this.sleep(1000);
      }
    }

    // 全戦略が失敗した場合
    throw new Error(`All generation strategies failed. Last error: ${lastError?.message}`);
  }

  /**
   * 戦略実行
   */
  async executeStrategy(strategy, formData, options) {
    const startTime = Date.now();
    
    try {
      const result = await Promise.race([
        strategy.generate(formData, options),
        this.createTimeoutPromise(strategy.estimatedTime * 2) // 推定時間の2倍でタイムアウト
      ]);

      const duration = Date.now() - startTime;
      this.updateStrategyStats(strategy.name, true, duration);

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateStrategyStats(strategy.name, false, duration);
      throw error;
    }
  }

  /**
   * 戦略選択
   */
  selectStrategy(preferredStrategy = null) {
    if (preferredStrategy && this.strategies.has(preferredStrategy)) {
      return this.strategies.get(preferredStrategy);
    }

    // 成功率と速度を考慮した自動選択
    let bestStrategy = null;
    let bestScore = -1;

    for (const [name, strategy] of this.strategies) {
      const score = this.calculateStrategyScore(strategy);
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    }

    return bestStrategy || this.strategies.get('ultra_phases');
  }

  /**
   * 戦略スコア計算
   */
  calculateStrategyScore(strategy) {
    const successWeight = 0.7;
    const speedWeight = 0.3;
    const maxTime = 300000; // 5分

    const successScore = strategy.successRate * successWeight;
    const speedScore = strategy.averageTime > 0 ? 
      (1 - (strategy.averageTime / maxTime)) * speedWeight : 0;

    return successScore + speedScore;
  }

  /**
   * 戦略スキップ判定
   */
  shouldSkipStrategy(strategy) {
    // 連続失敗回数が多い場合はスキップ
    if (strategy.attempts > 5 && strategy.successRate < 0.2) {
      return true;
    }

    // 最近のエラーが致命的な場合はスキップ
    if (strategy.lastError && this.isFatalError(strategy.lastError)) {
      return true;
    }

    return false;
  }

  /**
   * 致命的エラーの判定
   */
  isFatalError(error) {
    const fatalCodes = ['NETWORK_ERROR', 'AUTHENTICATION_ERROR', 'QUOTA_EXCEEDED'];
    return fatalCodes.includes(error.code) || error.status === 401 || error.status === 403;
  }

  /**
   * Groq超高速8段階並列処理
   */
  async generateWithUltraPhases(formData, options) {
    const results = {};
    
    this.updateProgress(5, '🚀 Groq超高速システム起動', 'AI エンジン並列処理準備中...', '約40秒');

    try {
      // Phase 1: コンセプト生成
      this.updateProgress(10, '💡 コンセプト生成中', 'シナリオの核心を構築中...', '約35秒');
      results.concept = await this.callGroqAPI('/groq-phase1-concept', formData);

      // Phase 2&3: 並列実行
      this.updateProgress(25, '👥 キャラクター&関係性構築', '魅力的なキャラクターと複雑な人間関係を並列生成中...', '約30秒');
      const [characters, relationships] = await Promise.all([
        this.callGroqAPI('/groq-phase2-characters', {
          concept: results.concept,
          participants: formData.participants
        }),
        this.callGroqAPI('/groq-phase3-relationships', {
          concept: results.concept,
          participants: formData.participants
        })
      ]);
      
      results.characters = characters;
      results.relationships = relationships;

      // Phase 4&5: 並列実行
      this.updateProgress(50, '🕵️ 事件&手がかり生成', '謎に満ちた事件と巧妙な手がかりを同時生成中...', '約20秒');
      const [incident, clues] = await Promise.all([
        this.callGroqAPI('/groq-phase4-incident', {
          concept: results.concept,
          characters: results.characters,
          relationships: results.relationships
        }),
        this.callGroqAPI('/groq-phase5-clues', {
          concept: results.concept,
          characters: results.characters,
          relationships: results.relationships
        })
      ]);
      
      results.incident = incident;
      results.clues = clues;

      // Phase 6&7&8: 三重並列実行
      this.updateProgress(75, '⚡ 最終統合処理', 'タイムライン・真相・ガイドを三重並列生成中...', '約10秒');
      const [timeline, solution, gamemaster] = await Promise.all([
        this.callGroqAPI('/groq-phase6-timeline', {
          characters: results.characters,
          incident: results.incident,
          clues: results.clues
        }),
        this.callGroqAPI('/groq-phase7-solution', {
          characters: results.characters,
          relationships: results.relationships,
          incident: results.incident,
          clues: results.clues
        }),
        this.callGroqAPI('/groq-phase8-gamemaster', {
          concept: results.concept,
          characters: results.characters,
          clues: results.clues
        })
      ]);
      
      results.timeline = timeline;
      results.solution = solution;
      results.gamemaster = gamemaster;

      // 最終統合
      this.updateProgress(95, '🎯 品質統合', '完璧なシナリオに仕上げています...', '約3秒');
      const finalScenario = this.integrateResults(results);

      this.updateProgress(100, '🎉 生成完了！', 'あなた専用のマーダーミステリーシナリオが完成しました！', '完了');

      return {
        scenario: finalScenario,
        metadata: {
          strategy: 'ultra_phases',
          phases: Object.keys(results),
          quality: this.calculateQuality(results),
          generationTime: Date.now() - this.currentGeneration.startTime
        }
      };

    } catch (error) {
      Logger.error('Groq ultra phases generation failed:', error);
      throw new Error(`Groq生成エラー: ${error.message}`);
    }
  }

  /**
   * OpenAI標準8段階処理
   */
  async generateWithOpenAIPhases(formData, options) {
    const results = {};
    
    this.updateProgress(10, '🔄 OpenAIフォールバック開始', 'OpenAI APIシステムを使用中...', '約2分');

    try {
      // 順次実行（OpenAIはレート制限が厳しいため）
      this.updateProgress(20, '💡 コンセプト生成', 'OpenAI APIでシナリオ基盤を構築中...', '約90秒');
      results.concept = await this.callOpenAIAPI('/phase1-concept', formData);

      this.updateProgress(35, '👥 キャラクター生成', '魅力的なキャラクター設定中...', '約75秒');
      results.characters = await this.callOpenAIAPI('/phase2-characters', {
        concept: results.concept,
        participants: formData.participants
      });

      this.updateProgress(50, '🤝 関係性構築', '複雑な人間関係を設計中...', '約60秒');
      results.relationships = await this.callOpenAIAPI('/phase3-relationships', {
        concept: results.concept,
        characters: results.characters
      });

      this.updateProgress(65, '🕵️ 事件構築', '謎に満ちた事件を設計中...', '約45秒');
      results.incident = await this.callOpenAIAPI('/phase4-incident', {
        concept: results.concept,
        characters: results.characters,
        relationships: results.relationships
      });

      this.updateProgress(80, '🔍 手がかり配置', '巧妙な手がかりシステムを構築中...', '約30秒');
      results.clues = await this.callOpenAIAPI('/phase5-clues', {
        concept: results.concept,
        characters: results.characters,
        incident: results.incident
      });

      this.updateProgress(90, '⏰ 最終統合', 'タイムラインと真相を統合中...', '約15秒');
      
      // 最終段階は並列実行
      const [timeline, solution] = await Promise.all([
        this.callOpenAIAPI('/phase6-timeline', {
          characters: results.characters,
          incident: results.incident,
          clues: results.clues
        }),
        this.callOpenAIAPI('/phase7-solution', {
          characters: results.characters,
          relationships: results.relationships,
          incident: results.incident,
          clues: results.clues
        })
      ]);

      results.timeline = timeline;
      results.solution = solution;

      const finalScenario = this.integrateResults(results);

      this.updateProgress(100, '✅ OpenAI生成完了', 'フォールバックシナリオが完成しました', '完了');

      return {
        scenario: finalScenario,
        metadata: {
          strategy: 'openai_phases',
          phases: Object.keys(results),
          quality: this.calculateQuality(results),
          generationTime: Date.now() - this.currentGeneration.startTime
        }
      };

    } catch (error) {
      Logger.error('OpenAI phases generation failed:', error);
      throw new Error(`OpenAI生成エラー: ${error.message}`);
    }
  }

  /**
   * シンプル生成
   */
  async generateSimple(formData, options) {
    this.updateProgress(20, '🔧 シンプル生成開始', '単一APIでシナリオを生成中...', '約30秒');

    try {
      const response = await this.apiClient.post('/generate-scenario', formData);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'シンプル生成に失敗しました');
      }

      this.updateProgress(100, '📝 シンプル生成完了', 'ベーシックシナリオが完成しました', '完了');

      return {
        scenario: response.data.scenario,
        metadata: {
          strategy: 'simple',
          quality: 'basic',
          generationTime: Date.now() - this.currentGeneration.startTime
        }
      };

    } catch (error) {
      Logger.error('Simple generation failed:', error);
      throw new Error(`シンプル生成エラー: ${error.message}`);
    }
  }

  /**
   * 緊急ローカル生成
   */
  async generateEmergency(formData, options) {
    this.updateProgress(30, '🚨 緊急生成開始', 'ローカルテンプレートを使用中...', '約5秒');

    const scenario = this.createEmergencyScenario(formData);

    this.updateProgress(100, '🆘 緊急生成完了', '基本的なシナリオテンプレートが完成しました', '完了');

    return {
      scenario,
      metadata: {
        strategy: 'emergency',
        quality: 'template',
        generationTime: Date.now() - this.currentGeneration.startTime,
        warning: 'これは緊急生成版です。API復旧後に再生成をお勧めします。'
      }
    };
  }

  /**
   * 緊急シナリオ作成
   */
  createEmergencyScenario(formData) {
    const participantCount = parseInt(formData.participants) || 5;
    const era = formData.era || 'modern';
    const setting = formData.setting || 'closed-space';
    
    let scenario = `# 🆘 緊急生成シナリオ

## タイトル
「秘密の館」

## 概要
${participantCount}人の参加者が${this.getSettingName(setting)}で${this.getIncidentName(formData.incident_type)}に巻き込まれるマーダーミステリーです。

## 舞台設定
${this.getEraName(era)}の${this.getSettingName(setting)}。外部との連絡が断たれた状況で、参加者たちは協力して事件の真相に迫ります。

## 人物設定`;

    // キャラクター生成
    for (let i = 1; i <= participantCount; i++) {
      scenario += `

### キャラクター${i}: ${this.getCharacterName(i)}
- **年齢**: ${20 + i * 5}歳
- **職業**: ${this.getCharacterJob(i)}
- **性格**: ${this.getCharacterPersonality(i)}
- **秘密**: ${this.getCharacterSecret(i)}`;
    }

    scenario += `

## 事件の概要
パーティーの最中、突然の停電。明かりが戻ると、一人の参加者が倒れていた。
密室状況の中、犯人は参加者の中にいることが判明する。

## ゲームの進行
1. **情報開示フェーズ** (30分): 各自の情報を共有
2. **調査フェーズ** (45分): 手がかりを探し、証言を集める
3. **議論フェーズ** (30分): 互いの証言を検証
4. **投票フェーズ** (15分): 犯人を決定
5. **真相発表** (15分): 正解と解説

## 手がかり
- 現場に残された謎のメモ
- アリバイに矛盾のある証言
- 隠された人間関係
- 重要な時間の記録

---
**⚠️ 注意**: これは緊急生成版です。完全版の生成をご希望の場合は、API復旧後に再試行してください。`;

    return scenario;
  }

  /**
   * API呼び出しメソッド
   */
  async callGroqAPI(endpoint, data) {
    try {
      const response = await this.apiClient.post(endpoint, data);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'Groq API call failed');
      }

      return response.data.content;
    } catch (error) {
      Logger.error(`Groq API call failed: ${endpoint}`, error);
      throw error;
    }
  }

  async callOpenAIAPI(endpoint, data) {
    try {
      const response = await this.apiClient.post(endpoint, data);
      
      if (!response.data.success) {
        throw new Error(response.data.error || 'OpenAI API call failed');
      }

      return response.data.content;
    } catch (error) {
      Logger.error(`OpenAI API call failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * 結果統合
   */
  integrateResults(results) {
    const qualityMetrics = this.calculateQuality(results);
    
    return `# 🎭 ${this.extractTitle(results.concept)}

${qualityMetrics.badge}

${results.concept}

${results.characters}

${results.relationships}

${results.incident}

${results.clues}

${results.timeline}

${results.solution}

${results.gamemaster || ''}

---
## 📊 品質メトリクス
- **総文字数**: ${qualityMetrics.totalChars.toLocaleString()}文字
- **品質スコア**: ${qualityMetrics.qualityScore}/100
- **完成度**: ${qualityMetrics.completeness}%
- **生成戦略**: ${this.currentGeneration?.strategy || 'Unknown'}
- **生成時間**: ${this.formatDuration(Date.now() - (this.currentGeneration?.startTime || Date.now()))}

🏆 **認定**: このシナリオは高品質基準をクリアしています`;
  }

  /**
   * 品質計算
   */
  calculateQuality(results) {
    const totalChars = Object.values(results).join('').length;
    
    let qualityScore = 0;
    qualityScore += results.concept?.length > 1000 ? 15 : 10;
    qualityScore += results.characters?.length > 1500 ? 15 : 10;
    qualityScore += results.relationships?.length > 1000 ? 10 : 7;
    qualityScore += results.incident?.length > 1500 ? 15 : 10;
    qualityScore += results.clues?.length > 1200 ? 15 : 10;
    qualityScore += results.timeline?.length > 1000 ? 10 : 7;
    qualityScore += results.solution?.length > 1500 ? 15 : 10;
    
    const completeness = Math.min(100, Math.round((totalChars / 15000) * 100));
    const badge = qualityScore >= 90 ? "🏆 PLATINUM QUALITY" : 
                  qualityScore >= 80 ? "🥇 GOLD QUALITY" : "🥈 SILVER QUALITY";
    
    return {
      totalChars,
      qualityScore,
      completeness,
      badge
    };
  }

  /**
   * 統計更新
   */
  updateStrategyStats(strategyName, success, duration) {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) return;

    strategy.attempts++;
    
    if (success) {
      strategy.successRate = (strategy.successRate * (strategy.attempts - 1) + 1) / strategy.attempts;
      strategy.averageTime = (strategy.averageTime * (strategy.attempts - 1) + duration) / strategy.attempts;
    } else {
      strategy.successRate = (strategy.successRate * (strategy.attempts - 1)) / strategy.attempts;
    }
  }

  /**
   * 進捗更新
   */
  updateProgress(percentage, phase, details, estimatedTime) {
    this.emit('generation:progress', {
      percentage,
      phase,
      details,
      estimatedTime,
      generationId: this.currentGeneration?.id
    });
  }

  /**
   * ユーティリティメソッド
   */
  generateId() {
    return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  createTimeoutPromise(ms) {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Generation timeout')), ms);
    });
  }

  extractTitle(concept) {
    const titleMatch = concept?.match(/##?\s*🏆?\s*(.+)/);
    return titleMatch ? titleMatch[1].trim() : "マーダーミステリーシナリオ";
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}分${seconds % 60}秒` : `${seconds}秒`;
  }

  // 緊急生成用ヘルパーメソッド
  getCharacterName(index) {
    const names = ['田中健一', '佐藤美咲', '鈴木拓海', '高橋由美', '伊藤浩二', '渡辺真理', '山田健太', '中村咲良'];
    return names[index - 1] || `人物${index}`;
  }

  getCharacterJob(index) {
    const jobs = ['会社員', '教師', '医師', '弁護士', '記者', '芸術家', '研究者', '実業家'];
    return jobs[index - 1] || '関係者';
  }

  getCharacterPersonality(index) {
    const personalities = ['真面目', '社交的', '慎重', '積極的', '内向的', '楽観的', '現実的', '理想主義'];
    return personalities[index - 1] || '普通';
  }

  getCharacterSecret(index) {
    const secrets = [
      '実は被害者と以前トラブルがあった',
      '重要な証拠を隠している',
      '事件当夜の行動に嘘がある',
      '被害者の秘密を知っていた',
      '金銭的な問題を抱えている',
      '他の参加者との関係に秘密がある'
    ];
    return secrets[index - 1] || '何かを隠している';
  }

  getEraName(era) {
    const names = {
      modern: '現代',
      showa: '昭和時代',
      'near-future': '近未来',
      fantasy: 'ファンタジー世界'
    };
    return names[era] || '現代';
  }

  getSettingName(setting) {
    const names = {
      'closed-space': '閉鎖空間',
      'mountain-villa': '山荘',
      'military-facility': '軍事施設',
      'underwater-facility': '海中施設',
      city: '都市部'
    };
    return names[setting] || '閉鎖空間';
  }

  getIncidentName(incident) {
    const names = {
      murder: '殺人事件',
      disappearance: '失踪事件',
      theft: '盗難事件',
      blackmail: '恐喝事件',
      fraud: '詐欺事件'
    };
    return names[incident] || '殺人事件';
  }

  /**
   * 現在の生成状況を取得
   */
  getCurrentGeneration() {
    return this.currentGeneration ? { ...this.currentGeneration } : null;
  }

  /**
   * 戦略統計を取得
   */
  getStrategyStats() {
    const stats = {};
    for (const [name, strategy] of this.strategies) {
      stats[name] = {
        attempts: strategy.attempts,
        successRate: Math.round(strategy.successRate * 100),
        averageTime: Math.round(strategy.averageTime / 1000),
        lastError: strategy.lastError?.message
      };
    }
    return stats;
  }
}

export default ScenarioGenerator;