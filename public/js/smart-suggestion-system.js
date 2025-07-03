/**
 * 💡 Smart Suggestion System - AI駆動スマート提案システム
 * ユーザー行動学習 + 予測的提案 + パーソナライゼーション
 */

class SmartSuggestionSystem {
  constructor() {
    this.cache = window.advancedCacheEngine;
    this.learningEngine = new UserLearningEngine();
    this.predictionEngine = new PredictionEngine();
    this.personalizationEngine = new PersonalizationEngine();
    
    // 提案の種類
    this.suggestionTypes = {
      POPULAR: 'popular',           // 人気ベース
      TREND: 'trend',              // トレンドベース
      PERSONAL: 'personal',        // パーソナル
      SIMILAR: 'similar',          // 類似ユーザー
      COMPLETION: 'completion',     // 入力補完
      OPTIMIZATION: 'optimization' // 最適化提案
    };
    
    // 提案履歴
    this.suggestionHistory = new Map();
    this.acceptanceRates = new Map();
    
    // リアルタイム提案
    this.realtimeSuggestions = new Set();
    this.lastFormState = {};
    
    this.initialize();
  }

  /**
   * 初期化
   */
  async initialize() {
    try {
      logger.info('💡 Smart Suggestion System 初期化開始');
      
      // 学習エンジン初期化
      await this.learningEngine.initialize();
      
      // 予測エンジン初期化
      await this.predictionEngine.initialize();
      
      // パーソナライゼーション初期化
      await this.personalizationEngine.initialize();
      
      // リアルタイム監視開始
      this.startRealtimeMonitoring();
      
      logger.success('✅ Smart Suggestion System initialized');
      
    } catch (error) {
      logger.error('Smart Suggestion System initialization failed:', error);
    }
  }

  /**
   * メイン提案生成
   */
  async generateSuggestions(formData, context = {}) {
    const startTime = performance.now();
    
    try {
      // ユーザープロファイル取得
      const userProfile = await this.learningEngine.getUserProfile();
      
      // 複数の提案エンジンを並列実行
      const suggestionPromises = [
        this.generatePopularSuggestions(formData, userProfile),
        this.generateTrendSuggestions(formData, userProfile),
        this.generatePersonalSuggestions(formData, userProfile),
        this.generateSimilarUserSuggestions(formData, userProfile),
        this.generateCompletionSuggestions(formData, userProfile),
        this.generateOptimizationSuggestions(formData, userProfile)
      ];
      
      const results = await Promise.allSettled(suggestionPromises);
      
      // 提案をマージして優先度付け
      const allSuggestions = this.mergeSuggestions(results);
      
      // スコア計算と並び替え
      const scoredSuggestions = await this.scoreSuggestions(allSuggestions, formData, userProfile);
      
      // フィルタリングとランキング
      const finalSuggestions = this.rankAndFilterSuggestions(scoredSuggestions, formData);
      
      // 提案履歴に記録
      await this.recordSuggestions(formData, finalSuggestions);
      
      const processingTime = performance.now() - startTime;
      logger.debug(`💡 Generated ${finalSuggestions.length} suggestions in ${Math.round(processingTime)}ms`);
      
      return {
        suggestions: finalSuggestions,
        metadata: {
          processingTime,
          userProfile: userProfile.summary,
          context
        }
      };
      
    } catch (error) {
      logger.error('Suggestion generation failed:', error);
      return { suggestions: [], error: error.message };
    }
  }

  /**
   * 人気ベース提案
   */
  async generatePopularSuggestions(formData, userProfile) {
    try {
      const popularTemplates = await this.cache.getPopularTemplates();
      
      return popularTemplates
        .filter(template => this.isCompatibleTemplate(template, formData))
        .slice(0, 3)
        .map(template => ({
          id: `popular_${template.id}`,
          type: this.suggestionTypes.POPULAR,
          title: this.extractTemplateTitle(template),
          description: `${template.accessCount}回使用された人気パターン`,
          confidence: 0.8,
          baseScore: template.accessCount / 10,
          data: template.metadata?.formData || {},
          preview: this.generatePreview(template),
          tags: ['人気', '実績あり'],
          source: 'popular_templates'
        }));
        
    } catch (error) {
      logger.warn('Popular suggestions generation failed:', error);
      return [];
    }
  }

  /**
   * トレンドベース提案
   */
  async generateTrendSuggestions(formData, userProfile) {
    try {
      const recentTrends = await this.cache.getRecentTrends();
      
      // 最近1週間のトレンド分析
      const trendAnalysis = this.analyzeTrends(recentTrends);
      
      return trendAnalysis
        .filter(trend => this.isCompatibleTrend(trend, formData))
        .slice(0, 2)
        .map(trend => ({
          id: `trend_${trend.id}`,
          type: this.suggestionTypes.TREND,
          title: trend.trendTitle,
          description: `最近${trend.frequency}回作成されているトレンド`,
          confidence: trend.confidence,
          baseScore: trend.frequency * 2,
          data: trend.commonParameters,
          preview: this.generateTrendPreview(trend),
          tags: ['トレンド', '注目'],
          source: 'recent_trends'
        }));
        
    } catch (error) {
      logger.warn('Trend suggestions generation failed:', error);
      return [];
    }
  }

  /**
   * パーソナル提案
   */
  async generatePersonalSuggestions(formData, userProfile) {
    try {
      if (!userProfile.hasHistory) {
        return [];
      }
      
      const personalPatterns = userProfile.favoritePatterns;
      
      return personalPatterns
        .filter(pattern => this.isPersonallyRelevant(pattern, formData, userProfile))
        .slice(0, 3)
        .map(pattern => ({
          id: `personal_${pattern.id}`,
          type: this.suggestionTypes.PERSONAL,
          title: `あなた好みの${pattern.category}`,
          description: `過去の成功パターンに基づく提案 (成功率: ${Math.round(pattern.successRate * 100)}%)`,
          confidence: pattern.successRate,
          baseScore: pattern.successRate * 15,
          data: pattern.parameters,
          preview: this.generatePersonalPreview(pattern),
          tags: ['パーソナル', 'おすすめ'],
          source: 'user_history'
        }));
        
    } catch (error) {
      logger.warn('Personal suggestions generation failed:', error);
      return [];
    }
  }

  /**
   * 類似ユーザー提案
   */
  async generateSimilarUserSuggestions(formData, userProfile) {
    try {
      const similarUsers = await this.personalizationEngine.findSimilarUsers(userProfile);
      
      if (similarUsers.length === 0) {
        return [];
      }
      
      const collaborativeRecommendations = this.generateCollaborativeRecommendations(
        similarUsers, 
        formData
      );
      
      return collaborativeRecommendations
        .slice(0, 2)
        .map(rec => ({
          id: `similar_${rec.id}`,
          type: this.suggestionTypes.SIMILAR,
          title: rec.title,
          description: `類似の好みを持つユーザーに人気 (類似度: ${Math.round(rec.similarity * 100)}%)`,
          confidence: rec.similarity,
          baseScore: rec.popularity * rec.similarity * 10,
          data: rec.parameters,
          preview: this.generateCollaborativePreview(rec),
          tags: ['類似ユーザー', 'コラボ'],
          source: 'collaborative_filtering'
        }));
        
    } catch (error) {
      logger.warn('Similar user suggestions generation failed:', error);
      return [];
    }
  }

  /**
   * 入力補完提案
   */
  async generateCompletionSuggestions(formData, userProfile) {
    try {
      const completions = [];
      
      // 未入力フィールドの補完提案
      const incompleteFields = this.findIncompleteFields(formData);
      
      for (const field of incompleteFields) {
        const suggestion = await this.predictFieldValue(field, formData, userProfile);
        
        if (suggestion) {
          completions.push({
            id: `completion_${field}_${Date.now()}`,
            type: this.suggestionTypes.COMPLETION,
            title: `${this.getFieldDisplayName(field)}の提案`,
            description: `${suggestion.value} (確信度: ${Math.round(suggestion.confidence * 100)}%)`,
            confidence: suggestion.confidence,
            baseScore: suggestion.confidence * 8,
            data: { [field]: suggestion.value },
            preview: this.generateCompletionPreview(field, suggestion),
            tags: ['補完', '自動入力'],
            source: 'field_prediction',
            field: field
          });
        }
      }
      
      return completions.slice(0, 2);
      
    } catch (error) {
      logger.warn('Completion suggestions generation failed:', error);
      return [];
    }
  }

  /**
   * 最適化提案
   */
  async generateOptimizationSuggestions(formData, userProfile) {
    try {
      const optimizations = [];
      
      // バランス分析
      const balance = this.analyzeFormBalance(formData);
      
      if (balance.issues.length > 0) {
        for (const issue of balance.issues) {
          optimizations.push({
            id: `optimization_${issue.type}_${Date.now()}`,
            type: this.suggestionTypes.OPTIMIZATION,
            title: `${issue.field}の最適化`,
            description: issue.suggestion,
            confidence: issue.confidence,
            baseScore: issue.importance * 5,
            data: issue.recommendedChange,
            preview: this.generateOptimizationPreview(issue),
            tags: ['最適化', '改善'],
            source: 'balance_analysis',
            optimization: issue
          });
        }
      }
      
      return optimizations.slice(0, 2);
      
    } catch (error) {
      logger.warn('Optimization suggestions generation failed:', error);
      return [];
    }
  }

  /**
   * 提案マージ
   */
  mergeSuggestions(results) {
    const allSuggestions = [];
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        allSuggestions.push(...result.value);
      } else if (result.status === 'rejected') {
        logger.warn(`Suggestion generator ${index} failed:`, result.reason);
      }
    });
    
    return allSuggestions;
  }

  /**
   * 提案スコア計算
   */
  async scoreSuggestions(suggestions, formData, userProfile) {
    return Promise.all(
      suggestions.map(async (suggestion) => {
        let score = suggestion.baseScore || 0;
        
        // ユーザープロファイルとの適合性
        const profileFit = this.calculateProfileFit(suggestion, userProfile);
        score += profileFit * 10;
        
        // フォームデータとの互換性
        const compatibility = this.calculateCompatibility(suggestion, formData);
        score += compatibility * 8;
        
        // 過去の受け入れ率
        const acceptanceRate = this.getAcceptanceRate(suggestion.type);
        score += acceptanceRate * 5;
        
        // 多様性ボーナス
        const diversityBonus = this.calculateDiversityBonus(suggestion, suggestions);
        score += diversityBonus * 3;
        
        // 時間的関連性
        const timeRelevance = this.calculateTimeRelevance(suggestion);
        score += timeRelevance * 2;
        
        return {
          ...suggestion,
          finalScore: Math.max(0, score),
          scoreBreakdown: {
            base: suggestion.baseScore || 0,
            profileFit: profileFit * 10,
            compatibility: compatibility * 8,
            acceptanceRate: acceptanceRate * 5,
            diversity: diversityBonus * 3,
            timeRelevance: timeRelevance * 2
          }
        };
      })
    );
  }

  /**
   * ランキングとフィルタリング
   */
  rankAndFilterSuggestions(suggestions, formData) {
    // スコア順でソート
    const sorted = suggestions.sort((a, b) => b.finalScore - a.finalScore);
    
    // 重複除去
    const deduped = this.removeDuplicateSuggestions(sorted);
    
    // 多様性フィルタ
    const diverse = this.ensureDiversity(deduped);
    
    // 最大提案数制限
    const limited = diverse.slice(0, 8);
    
    // 最終調整
    return this.finalAdjustments(limited, formData);
  }

  /**
   * リアルタイム監視開始
   */
  startRealtimeMonitoring() {
    // フォーム変更監視
    document.addEventListener('input', (event) => {
      if (event.target.form && event.target.form.id === 'scenario-form') {
        this.handleFormChange(event.target);
      }
    });
    
    // 定期的な提案更新
    setInterval(() => {
      this.updateRealtimeSuggestions();
    }, 2000); // 2秒ごと
  }

  /**
   * フォーム変更処理
   */
  async handleFormChange(element) {
    const currentFormData = this.collectCurrentFormData();
    
    // 変更が十分大きい場合のみ処理
    if (this.isSignificantChange(this.lastFormState, currentFormData)) {
      this.lastFormState = { ...currentFormData };
      
      // 関連する提案を生成
      const contextualSuggestions = await this.generateContextualSuggestions(
        currentFormData, 
        element.name
      );
      
      if (contextualSuggestions.length > 0) {
        this.displayRealtimeSuggestions(contextualSuggestions, element);
      }
    }
  }

  /**
   * コンテキスト提案生成
   */
  async generateContextualSuggestions(formData, changedField) {
    try {
      const userProfile = await this.learningEngine.getUserProfile();
      
      // 変更されたフィールドに関連する提案のみ生成
      let suggestions = [];
      
      switch (changedField) {
        case 'participants':
          suggestions = await this.generateParticipantRelatedSuggestions(formData, userProfile);
          break;
        case 'era':
          suggestions = await this.generateEraRelatedSuggestions(formData, userProfile);
          break;
        case 'setting':
          suggestions = await this.generateSettingRelatedSuggestions(formData, userProfile);
          break;
        default:
          suggestions = await this.generateGenericSuggestions(formData, userProfile);
      }
      
      return suggestions.slice(0, 3); // リアルタイムは3つまで
      
    } catch (error) {
      logger.warn('Contextual suggestions generation failed:', error);
      return [];
    }
  }

  /**
   * リアルタイム提案表示
   */
  displayRealtimeSuggestions(suggestions, targetElement) {
    // 既存の提案を削除
    this.clearRealtimeSuggestions();
    
    if (suggestions.length === 0) return;
    
    // 提案パネル作成
    const suggestionPanel = this.createSuggestionPanel(suggestions, targetElement);
    
    // DOM に追加
    document.body.appendChild(suggestionPanel);
    
    // アニメーション
    requestAnimationFrame(() => {
      suggestionPanel.classList.add('show');
    });
    
    // 自動非表示タイマー
    setTimeout(() => {
      this.clearRealtimeSuggestions();
    }, 10000); // 10秒後に自動非表示
  }

  /**
   * 提案パネル作成
   */
  createSuggestionPanel(suggestions, targetElement) {
    const panel = document.createElement('div');
    panel.className = 'smart-suggestion-panel';
    panel.id = 'realtime-suggestions';
    
    // 位置計算
    const rect = targetElement.getBoundingClientRect();
    panel.style.cssText = `
      position: fixed;
      top: ${rect.bottom + window.scrollY + 5}px;
      left: ${rect.left + window.scrollX}px;
      min-width: ${rect.width}px;
      max-width: 400px;
      background: rgba(0, 0, 0, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      z-index: 1000;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease;
      font-size: 14px;
      color: white;
    `;
    
    // ヘッダー
    const header = document.createElement('div');
    header.className = 'suggestion-header';
    header.innerHTML = `
      <span>💡 スマート提案</span>
      <button class="close-btn" onclick="window.smartSuggestionSystem.clearRealtimeSuggestions()">×</button>
    `;
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-weight: 600;
    `;
    
    panel.appendChild(header);
    
    // 提案リスト
    suggestions.forEach((suggestion, index) => {
      const item = this.createSuggestionItem(suggestion, index);
      panel.appendChild(item);
    });
    
    return panel;
  }

  /**
   * 提案アイテム作成
   */
  createSuggestionItem(suggestion, index) {
    const item = document.createElement('div');
    item.className = 'suggestion-item';
    item.style.cssText = `
      padding: 8px;
      margin: 4px 0;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.1);
      cursor: pointer;
      transition: background 0.2s ease;
    `;
    
    item.innerHTML = `
      <div class="suggestion-title" style="font-weight: 600; margin-bottom: 4px;">
        ${suggestion.title}
      </div>
      <div class="suggestion-desc" style="font-size: 12px; opacity: 0.8;">
        ${suggestion.description}
      </div>
      <div class="suggestion-tags" style="margin-top: 4px;">
        ${suggestion.tags.map(tag => 
          `<span style="background: rgba(102, 126, 234, 0.3); padding: 2px 6px; border-radius: 12px; font-size: 10px; margin-right: 4px;">${tag}</span>`
        ).join('')}
      </div>
    `;
    
    // クリックイベント
    item.addEventListener('click', () => {
      this.applySuggestion(suggestion);
      this.clearRealtimeSuggestions();
    });
    
    // ホバーエフェクト
    item.addEventListener('mouseenter', () => {
      item.style.background = 'rgba(255, 255, 255, 0.2)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.background = 'rgba(255, 255, 255, 0.1)';
    });
    
    return item;
  }

  /**
   * 提案適用
   */
  async applySuggestion(suggestion) {
    try {
      // フォームデータ適用
      Object.entries(suggestion.data).forEach(([field, value]) => {
        const element = document.querySelector(`[name="${field}"]`);
        if (element) {
          element.value = value;
          element.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      
      // 使用統計記録
      await this.recordSuggestionUsage(suggestion);
      
      // 学習データ更新
      this.learningEngine.recordPositiveFeedback(suggestion);
      
      logger.info(`💡 Applied suggestion: ${suggestion.title}`);
      
      // 成功フィードバック表示
      this.showFeedback('提案を適用しました', 'success');
      
    } catch (error) {
      logger.error('Suggestion application failed:', error);
      this.showFeedback('提案の適用に失敗しました', 'error');
    }
  }

  /**
   * リアルタイム提案クリア
   */
  clearRealtimeSuggestions() {
    const panel = document.getElementById('realtime-suggestions');
    if (panel) {
      panel.classList.remove('show');
      setTimeout(() => {
        panel.remove();
      }, 300);
    }
  }

  /**
   * フィードバック表示
   */
  showFeedback(message, type = 'info') {
    const feedback = document.createElement('div');
    feedback.className = `suggestion-feedback feedback-${type}`;
    feedback.textContent = message;
    feedback.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 16px;
      border-radius: 6px;
      color: white;
      font-size: 14px;
      z-index: 1001;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    `;
    
    document.body.appendChild(feedback);
    
    requestAnimationFrame(() => {
      feedback.style.opacity = '1';
      feedback.style.transform = 'translateX(0)';
    });
    
    setTimeout(() => {
      feedback.style.opacity = '0';
      feedback.style.transform = 'translateX(100%)';
      setTimeout(() => feedback.remove(), 300);
    }, 3000);
  }

  // ============ ヘルパーメソッド ============

  collectCurrentFormData() {
    const form = document.getElementById('scenario-form');
    if (!form) return {};
    
    const formData = new FormData(form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }
    
    return data;
  }

  isSignificantChange(oldData, newData) {
    const importantFields = ['participants', 'era', 'setting', 'tone', 'incident_type'];
    
    return importantFields.some(field => oldData[field] !== newData[field]);
  }

  isCompatibleTemplate(template, formData) {
    const templateData = template.metadata?.formData || {};
    
    // 基本的な互換性チェック
    return (
      !formData.participants || templateData.participants === formData.participants
    ) && (
      !formData.era || templateData.era === formData.era
    );
  }

  extractTemplateTitle(template) {
    if (template.data && template.data.concept) {
      const match = template.data.concept.match(/\*\*作品タイトル\*\*:\s*(.+?)(?:\n|$)/);
      if (match) return match[1];
    }
    return 'マーダーミステリー';
  }

  generatePreview(template) {
    return {
      title: this.extractTemplateTitle(template),
      setting: template.metadata?.formData?.setting || '不明',
      participants: template.metadata?.formData?.participants || '不明'
    };
  }

  async recordSuggestions(formData, suggestions) {
    const record = {
      timestamp: Date.now(),
      formData,
      suggestions: suggestions.map(s => ({
        id: s.id,
        type: s.type,
        score: s.finalScore
      }))
    };
    
    this.suggestionHistory.set(Date.now(), record);
    
    // 履歴サイズ制限
    if (this.suggestionHistory.size > 100) {
      const oldestKey = Math.min(...this.suggestionHistory.keys());
      this.suggestionHistory.delete(oldestKey);
    }
  }

  async recordSuggestionUsage(suggestion) {
    const currentRate = this.acceptanceRates.get(suggestion.type) || { accepted: 0, total: 0 };
    
    currentRate.accepted++;
    currentRate.total++;
    
    this.acceptanceRates.set(suggestion.type, currentRate);
  }

  getAcceptanceRate(type) {
    const rate = this.acceptanceRates.get(type);
    if (!rate || rate.total === 0) return 0.5;
    
    return rate.accepted / rate.total;
  }

  // 簡易実装（実際はより複雑）
  analyzeTrends(recentTrends) { return []; }
  isCompatibleTrend(trend, formData) { return true; }
  generateTrendPreview(trend) { return {}; }
  isPersonallyRelevant(pattern, formData, userProfile) { return true; }
  generatePersonalPreview(pattern) { return {}; }
  generateCollaborativeRecommendations(users, formData) { return []; }
  generateCollaborativePreview(rec) { return {}; }
  findIncompleteFields(formData) { return []; }
  predictFieldValue(field, formData, userProfile) { return null; }
  getFieldDisplayName(field) { return field; }
  generateCompletionPreview(field, suggestion) { return {}; }
  analyzeFormBalance(formData) { return { issues: [] }; }
  generateOptimizationPreview(issue) { return {}; }
  calculateProfileFit(suggestion, userProfile) { return 0.5; }
  calculateCompatibility(suggestion, formData) { return 0.5; }
  calculateDiversityBonus(suggestion, allSuggestions) { return 0.5; }
  calculateTimeRelevance(suggestion) { return 0.5; }
  removeDuplicateSuggestions(suggestions) { return suggestions; }
  ensureDiversity(suggestions) { return suggestions; }
  finalAdjustments(suggestions, formData) { return suggestions; }
  updateRealtimeSuggestions() { /* 実装省略 */ }
  generateParticipantRelatedSuggestions(formData, userProfile) { return []; }
  generateEraRelatedSuggestions(formData, userProfile) { return []; }
  generateSettingRelatedSuggestions(formData, userProfile) { return []; }
  generateGenericSuggestions(formData, userProfile) { return []; }
}

/**
 * ユーザー学習エンジン
 */
class UserLearningEngine {
  constructor() {
    this.userProfile = null;
    this.behaviorHistory = [];
  }

  async initialize() {
    this.userProfile = await this.loadUserProfile();
  }

  async getUserProfile() {
    return this.userProfile || { hasHistory: false, summary: {} };
  }

  async loadUserProfile() {
    // 簡易実装
    return {
      hasHistory: false,
      favoritePatterns: [],
      summary: {}
    };
  }

  recordPositiveFeedback(suggestion) {
    this.behaviorHistory.push({
      type: 'positive_feedback',
      suggestion,
      timestamp: Date.now()
    });
  }
}

/**
 * 予測エンジン
 */
class PredictionEngine {
  async initialize() {
    // 予測モデル初期化
  }
}

/**
 * パーソナライゼーションエンジン
 */
class PersonalizationEngine {
  async initialize() {
    // パーソナライゼーション初期化
  }

  async findSimilarUsers(userProfile) {
    // 類似ユーザー検索
    return [];
  }
}

// グローバルインスタンス
window.smartSuggestionSystem = new SmartSuggestionSystem();

// エクスポート
export { SmartSuggestionSystem };