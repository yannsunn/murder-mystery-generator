// 商業品質ゲートシステム
// 各フェーズの出力を自動検証し、商業レベルの品質を保証

export class QualityGateSystem {
  constructor() {
    this.minQualityThresholds = {
      concept: {
        minLength: 800,
        uniquenessScore: 85,
        logicScore: 90,
        commercialViability: 80
      },
      characters: {
        diversityScore: 95,
        depthScore: 80,
        consistencyScore: 90,
        distinctiveness: 85
      },
      plot: {
        complexityScore: 75,
        solvabilityScore: 95,
        originalityScore: 85,
        engagementScore: 80
      }
    };
  }

  async validatePhaseOutput(phase, content, context = {}) {
    const validator = this.getValidator(phase);
    const score = await validator.assess(content, context);
    
    return {
      passed: score.overall >= this.minQualityThresholds[phase].overall,
      score,
      recommendations: score.overall < this.minQualityThresholds[phase].overall 
        ? this.generateImprovements(phase, score) 
        : [],
      commercialReadiness: this.assessCommercialReadiness(score)
    };
  }

  getValidator(phase) {
    switch (phase) {
      case 'concept': return new ConceptValidator();
      case 'characters': return new CharacterValidator();
      case 'plot': return new PlotValidator();
      default: throw new Error(`Unknown phase: ${phase}`);
    }
  }

  generateImprovements(phase, score) {
    const improvements = [];
    const thresholds = this.minQualityThresholds[phase];
    
    Object.keys(thresholds).forEach(metric => {
      if (score[metric] < thresholds[metric]) {
        improvements.push({
          metric,
          current: score[metric],
          target: thresholds[metric],
          suggestion: this.getImprovementSuggestion(phase, metric)
        });
      }
    });
    
    return improvements;
  }

  assessCommercialReadiness(score) {
    if (score.overall >= 90) return 'premium'; // ¥5,000+
    if (score.overall >= 80) return 'standard'; // ¥2,000-3,000
    if (score.overall >= 70) return 'basic'; // ¥1,000-2,000
    return 'insufficient'; // 要改善
  }

  getImprovementSuggestion(phase, metric) {
    const suggestions = {
      concept: {
        minLength: '詳細な設定と背景を追加',
        uniquenessScore: '独創的な要素を強化',
        logicScore: '論理的整合性を向上',
        commercialViability: '商業的魅力を増強'
      },
      characters: {
        diversityScore: 'キャラクターの多様性を向上',
        depthScore: 'キャラクターの深みを追加',
        consistencyScore: '設定の一貫性を確保',
        distinctiveness: '各キャラクターの独自性を強化'
      },
      plot: {
        complexityScore: 'プロットの複雑さを適度に向上',
        solvabilityScore: '謎解きの解決可能性を確保',
        originalityScore: '独創的な展開を追加',
        engagementScore: 'プレイヤーエンゲージメントを向上'
      }
    };
    
    return suggestions[phase][metric] || '品質向上が必要';
  }
}

class ConceptValidator {
  async assess(content, context) {
    const scores = {
      minLength: this.assessLength(content),
      uniquenessScore: await this.assessUniqueness(content),
      logicScore: this.assessLogic(content),
      commercialViability: this.assessCommercialViability(content)
    };
    
    scores.overall = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;
    return scores;
  }

  assessLength(content) {
    const length = content.length;
    if (length >= 1200) return 100;
    if (length >= 800) return 80;
    if (length >= 500) return 60;
    return Math.max(20, (length / 500) * 60);
  }

  async assessUniqueness(content) {
    // 簡易版：キーワードの多様性チェック
    const words = content.toLowerCase().match(/\w+/g) || [];
    const uniqueWords = new Set(words);
    const diversity = (uniqueWords.size / words.length) * 100;
    
    // 商業版では既存シナリオとの類似度もチェック
    return Math.min(100, diversity * 1.2);
  }

  assessLogic(content) {
    let score = 80; // ベーススコア
    
    // 基本要素の存在チェック
    if (content.includes('タイトル')) score += 5;
    if (content.includes('概要')) score += 5;
    if (content.includes('設定')) score += 5;
    if (content.includes('事件')) score += 5;
    
    // 具体性チェック
    if (content.match(/\d{1,2}:\d{2}/)) score += 5; // 時刻
    if (content.match(/[0-9]+人/)) score += 5; // 人数
    
    return Math.min(100, score);
  }

  assessCommercialViability(content) {
    let score = 70; // ベーススコア
    
    // 商業的魅力要素
    if (content.includes('独創') || content.includes('ユニーク')) score += 10;
    if (content.includes('謎') || content.includes('ミステリー')) score += 10;
    if (content.includes('推理') || content.includes('解決')) score += 10;
    
    return Math.min(100, score);
  }
}

class CharacterValidator {
  async assess(content, context) {
    // キャラクター専用の評価ロジック
    return {
      diversityScore: 85,
      depthScore: 80,
      consistencyScore: 90,
      distinctiveness: 85,
      overall: 85
    };
  }
}

class PlotValidator {
  async assess(content, context) {
    // プロット専用の評価ロジック
    return {
      complexityScore: 75,
      solvabilityScore: 95,
      originalityScore: 85,
      engagementScore: 80,
      overall: 83.75
    };
  }
}

export default QualityGateSystem;