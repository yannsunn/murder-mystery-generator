/**
 * 🧠 AI生成品質自動評価システム
 * 商業品質TRPG基準による自動品質チェック・最適化
 */

export class QualityAssessor {
  constructor() {
    this.qualityThresholds = {
      narrative: 0.85,      // 物語性
      logic: 0.90,          // 論理性
      balance: 0.80,        // ゲームバランス
      engagement: 0.85,     // 魅力度
      completeness: 0.95,   // 完全性
      consistency: 0.90     // 一貫性
    };
    
    this.weightings = {
      narrative: 0.20,
      logic: 0.25,
      balance: 0.15,
      engagement: 0.20,
      completeness: 0.15,
      consistency: 0.05
    };
  }

  /**
   * 🎯 メイン品質評価エントリーポイント
   */
  async evaluateScenario(scenario, formData) {
    try {
      
      const metrics = {
        narrative: await this.checkNarrativeQuality(scenario),
        logic: await this.checkLogicalConsistency(scenario),
        balance: await this.checkGameBalance(scenario, formData),
        engagement: await this.checkEngagementLevel(scenario),
        completeness: await this.checkCompleteness(scenario),
        consistency: await this.checkConsistency(scenario)
      };

      const overallScore = this.calculateOverallScore(metrics);
      const recommendations = this.generateRecommendations(metrics);
      
      const assessment = {
        score: overallScore,
        metrics,
        recommendations,
        passesQuality: overallScore >= 0.85,
        timestamp: Date.now()
      };

      return assessment;
      
    } catch (error) {
      return {
        score: 0.5,
        metrics: {},
        recommendations: ['品質評価中にエラーが発生しました'],
        passesQuality: false,
        error: error.message
      };
    }
  }

  /**
   * 📖 物語性評価
   */
  async checkNarrativeQuality(scenario) {
    const narrativeChecks = {
      hasTitle: this.checkForTitle(scenario),
      hasPlot: this.checkForPlot(scenario),
      hasCharacterDepth: this.checkCharacterDepth(scenario),
      hasEmotionalHooks: this.checkEmotionalHooks(scenario),
      hasThematicElements: this.checkThematicElements(scenario)
    };

    const weights = {
      hasTitle: 0.1,
      hasPlot: 0.3,
      hasCharacterDepth: 0.3,
      hasEmotionalHooks: 0.2,
      hasThematicElements: 0.1
    };

    return this.calculateWeightedScore(narrativeChecks, weights);
  }

  /**
   * 🔍 論理性評価
   */
  async checkLogicalConsistency(scenario) {
    const logicChecks = {
      hasClues: this.checkForClues(scenario),
      hasEvidence: this.checkForEvidence(scenario),
      hasClearMotives: this.checkForMotives(scenario),
      hasTimelineConsistency: this.checkTimelineConsistency(scenario),
      hasSolvableStructure: this.checkSolvableStructure(scenario)
    };

    const weights = {
      hasClues: 0.25,
      hasEvidence: 0.25,
      hasClearMotives: 0.20,
      hasTimelineConsistency: 0.15,
      hasSolvableStructure: 0.15
    };

    return this.calculateWeightedScore(logicChecks, weights);
  }

  /**
   * ⚖️ ゲームバランス評価
   */
  async checkGameBalance(scenario, formData) {
    const balanceChecks = {
      appropriateComplexity: this.checkComplexityBalance(scenario, formData),
      timeManagement: this.checkTimeBalance(scenario, formData),
      playerEngagement: this.checkPlayerBalance(scenario, formData),
      difficultyBalance: this.checkDifficultyBalance(scenario),
      informationBalance: this.checkInformationBalance(scenario)
    };

    const weights = {
      appropriateComplexity: 0.25,
      timeManagement: 0.25,
      playerEngagement: 0.20,
      difficultyBalance: 0.15,
      informationBalance: 0.15
    };

    return this.calculateWeightedScore(balanceChecks, weights);
  }

  /**
   * 🎭 魅力度・エンゲージメント評価
   */
  async checkEngagementLevel(scenario) {
    const engagementChecks = {
      hasHooks: this.checkForEngagementHooks(scenario),
      hasConflict: this.checkForConflict(scenario),
      hasSurprises: this.checkForSurprises(scenario),
      hasPersonalStakes: this.checkPersonalStakes(scenario),
      hasAtmosphere: this.checkAtmosphere(scenario)
    };

    const weights = {
      hasHooks: 0.2,
      hasConflict: 0.2,
      hasSurprises: 0.2,
      hasPersonalStakes: 0.2,
      hasAtmosphere: 0.2
    };

    return this.calculateWeightedScore(engagementChecks, weights);
  }

  /**
   * ✅ 完全性評価
   */
  async checkCompleteness(scenario) {
    const completenessChecks = {
      hasAllSections: this.checkRequiredSections(scenario),
      hasCharacterDetails: this.checkCharacterCompleteness(scenario),
      hasGMGuidance: this.checkGMGuidance(scenario),
      hasResolution: this.checkResolution(scenario),
      hasNoTruncation: this.checkForTruncation(scenario)
    };

    const weights = {
      hasAllSections: 0.3,
      hasCharacterDetails: 0.25,
      hasGMGuidance: 0.2,
      hasResolution: 0.15,
      hasNoTruncation: 0.1
    };

    return this.calculateWeightedScore(completenessChecks, weights);
  }

  /**
   * 🔄 一貫性評価
   */
  async checkConsistency(scenario) {
    const consistencyChecks = {
      characterConsistency: this.checkCharacterConsistency(scenario),
      timelineConsistency: this.checkTimelineConsistency(scenario),
      toneConsistency: this.checkToneConsistency(scenario),
      settingConsistency: this.checkSettingConsistency(scenario)
    };

    const weights = {
      characterConsistency: 0.3,
      timelineConsistency: 0.3,
      toneConsistency: 0.2,
      settingConsistency: 0.2
    };

    return this.calculateWeightedScore(consistencyChecks, weights);
  }

  // ============= 詳細チェック関数群 =============

  checkForTitle(scenario) {
    const titlePatterns = [
      /## 作品タイトル/i,
      /タイトル[:：]/i,
      /作品名[:：]/i
    ];
    return titlePatterns.some(pattern => pattern.test(scenario));
  }

  checkForPlot(scenario) {
    const plotKeywords = [
      '事件', '謎', '真相', '犯人', '殺人', '事故', '秘密',
      '陰謀', '計画', '動機', '証拠', '手がかり'
    ];
    const plotCount = plotKeywords.filter(keyword => 
      scenario.includes(keyword)
    ).length;
    return Math.min(plotCount / 5, 1.0); // 5個以上で満点
  }

  checkCharacterDepth(scenario) {
    const depthIndicators = [
      'バックストーリー', '過去', '秘密', '動機', '関係',
      '性格', '目標', '恐れ', '願望', '専門知識'
    ];
    const depthCount = depthIndicators.filter(indicator => 
      scenario.includes(indicator)
    ).length;
    return Math.min(depthCount / 6, 1.0);
  }

  checkForClues(scenario) {
    const cluePatterns = [
      /手がかり/g,
      /証拠/g,
      /ヒント/g,
      /情報/g,
      /発見/g
    ];
    let totalClues = 0;
    cluePatterns.forEach(pattern => {
      const matches = scenario.match(pattern);
      if (matches) totalClues += matches.length;
    });
    return Math.min(totalClues / 10, 1.0); // 10個以上で満点
  }

  checkComplexityBalance(scenario, formData) {
    const complexity = formData?.complexity || 'standard';
    const textLength = scenario.length;
    
    const expectedLengths = {
      simple: { min: 3000, max: 8000 },
      standard: { min: 6000, max: 15000 },
      complex: { min: 10000, max: 25000 }
    };
    
    const range = expectedLengths[complexity];
    if (!range) return 0.5;
    
    if (textLength < range.min) {
      return textLength / range.min;
    } else if (textLength > range.max) {
      return Math.max(0.3, 1 - (textLength - range.max) / range.max);
    }
    
    return 1.0;
  }

  checkTimeBalance(scenario, formData) {
    const complexity = formData?.complexity || 'standard';
    const timeManagementKeywords = [
      '30分', '45分', '60分', '時間配分', '進行', 
      'タイムライン', 'フェーズ', '段階'
    ];
    
    const timeReferences = timeManagementKeywords.filter(keyword =>
      scenario.includes(keyword)
    ).length;
    
    const expectedReferences = {
      simple: 3,
      standard: 5,
      complex: 7
    };
    
    const expected = expectedReferences[complexity] || 5;
    return Math.min(timeReferences / expected, 1.0);
  }

  checkForTruncation(scenario) {
    const truncationIndicators = [
      '...', '続く', '以下同様', '省略', '等々',
      '（詳細は別途）', '（後述）'
    ];
    
    const hasTruncation = truncationIndicators.some(indicator =>
      scenario.includes(indicator)
    );
    
    return hasTruncation ? 0.3 : 1.0;
  }

  checkRequiredSections(scenario) {
    const requiredSections = [
      'タイトル', 'コンセプト', 'キャラクター', 
      'ハンドアウト', '事件', '真相', 'GM'
    ];
    
    const foundSections = requiredSections.filter(section =>
      scenario.includes(section)
    ).length;
    
    return foundSections / requiredSections.length;
  }

  // ============= ユーティリティ関数 =============

  calculateWeightedScore(checks, weights) {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [check, value] of Object.entries(checks)) {
      const weight = weights[check] || 0;
      const score = typeof value === 'boolean' ? (value ? 1 : 0) : value;
      totalScore += score * weight;
      totalWeight += weight;
    }
    
    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  calculateOverallScore(metrics) {
    let totalScore = 0;
    
    for (const [metric, score] of Object.entries(metrics)) {
      const weight = this.weightings[metric] || 0;
      totalScore += score * weight;
    }
    
    return Math.min(Math.max(totalScore, 0), 1);
  }

  generateRecommendations(metrics) {
    const recommendations = [];
    
    for (const [metric, score] of Object.entries(metrics)) {
      const threshold = this.qualityThresholds[metric];
      if (score < threshold) {
        recommendations.push(this.getRecommendationForMetric(metric, score));
      }
    }
    
    if (recommendations.length === 0) {
      recommendations.push('🏆 素晴らしい品質です！商業レベルに到達しています。');
    }
    
    return recommendations;
  }

  getRecommendationForMetric(metric, score) {
    const recommendations = {
      narrative: `📖 物語性向上: キャラクターの背景や感情的な要素を強化してください (現在: ${(score * 100).toFixed(1)}%)`,
      logic: `🔍 論理性向上: 証拠や手がかりの配置をより論理的に構成してください (現在: ${(score * 100).toFixed(1)}%)`,
      balance: `⚖️ バランス調整: 難易度や情報量のバランスを調整してください (現在: ${(score * 100).toFixed(1)}%)`,
      engagement: `🎭 魅力度向上: より魅力的な展開や驚きの要素を追加してください (現在: ${(score * 100).toFixed(1)}%)`,
      completeness: `✅ 完全性向上: 不足している要素や詳細を補完してください (現在: ${(score * 100).toFixed(1)}%)`,
      consistency: `🔄 一貫性向上: 設定や登場人物の一貫性を確認してください (現在: ${(score * 100).toFixed(1)}%)`
    };
    
    return recommendations[metric] || `${metric}の品質向上が必要です (現在: ${(score * 100).toFixed(1)}%)`;
  }

  // ============= その他のチェック関数（簡略実装） =============
  
  checkEmotionalHooks(scenario) {
    const emotionalWords = ['愛', '憎しみ', '嫉妬', '復讐', '悲しみ', '怒り', '恐怖', '希望'];
    return emotionalWords.some(word => scenario.includes(word)) ? 0.8 : 0.4;
  }

  checkThematicElements(scenario) {
    return scenario.length > 1000 ? 0.9 : 0.6;
  }

  checkForEvidence(scenario) {
    return scenario.includes('証拠') ? 0.9 : 0.5;
  }

  checkForMotives(scenario) {
    return scenario.includes('動機') ? 0.9 : 0.5;
  }

  checkSolvableStructure(scenario) {
    return scenario.includes('解決') || scenario.includes('真相') ? 0.9 : 0.4;
  }

  checkPlayerBalance(scenario, formData) {
    const participants = parseInt(formData?.participants) || 5;
    const playerReferences = (scenario.match(/プレイヤー/g) || []).length;
    return Math.min(playerReferences / participants, 1.0);
  }

  checkDifficultyBalance(scenario) {
    const difficultyIndicators = ['簡単', '標準', '複雑', '難易度'];
    return difficultyIndicators.some(ind => scenario.includes(ind)) ? 0.8 : 0.6;
  }

  checkInformationBalance(scenario) {
    return scenario.length > 5000 && scenario.length < 20000 ? 1.0 : 0.7;
  }

  checkForEngagementHooks(scenario) {
    const hooks = ['秘密', '裏切り', '意外', '衝撃', '驚き'];
    return hooks.some(hook => scenario.includes(hook)) ? 0.9 : 0.5;
  }

  checkForConflict(scenario) {
    return scenario.includes('対立') || scenario.includes('争い') ? 0.8 : 0.6;
  }

  checkForSurprises(scenario) {
    return scenario.includes('どんでん返し') || scenario.includes('意外') ? 0.9 : 0.6;
  }

  checkPersonalStakes(scenario) {
    return scenario.includes('個人的') || scenario.includes('利害') ? 0.8 : 0.6;
  }

  checkAtmosphere(scenario) {
    const atmosphereWords = ['雰囲気', '緊張', '不安', '恐怖', '神秘'];
    return atmosphereWords.some(word => scenario.includes(word)) ? 0.8 : 0.5;
  }

  checkCharacterCompleteness(scenario) {
    return scenario.includes('ハンドアウト') ? 0.9 : 0.4;
  }

  checkGMGuidance(scenario) {
    return scenario.includes('GM') || scenario.includes('ゲームマスター') ? 0.9 : 0.3;
  }

  checkResolution(scenario) {
    return scenario.includes('解決') || scenario.includes('エンディング') ? 0.9 : 0.4;
  }

  checkCharacterConsistency(scenario) {
    return 0.8; // 簡略実装
  }

  checkToneConsistency(scenario) {
    return 0.8; // 簡略実装
  }

  checkSettingConsistency(scenario) {
    return 0.8; // 簡略実装
  }
}

export const qualityAssessor = new QualityAssessor();

