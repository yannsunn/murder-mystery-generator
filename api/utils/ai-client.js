/**
 * 🤖 統一AIクライアント - Gemini 2.5 Flash統合版
 * Google Gemini 2.5 Flash - 最新最速のマルチモーダルAI
 */

const { logger } = require('./logger.js');
const { callGeminiTextAPI, getGeminiApiKey } = require('./gemini-text-client.js');

/**
 * AI設定
 */
const AI_CONFIG = {
  maxDuration: 30,
  timeout: 30000,
  retries: 2
};

/**
 * サロゲートペア不正除去
 */
function removeInvalidSurrogates(str) {
  return typeof str === 'string'
    ? str.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '')
    : str;
}

function sanitizeObject(obj) {
  if (typeof obj === 'string') {
    return removeInvalidSurrogates(obj);
  } else if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  } else if (typeof obj === 'object' && obj !== null) {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = sanitizeObject(obj[key]);
    }
    return newObj;
  }
  return obj;
}

/**
 * 統一AIクライアント - Gemini専用
 */
class UnifiedAIClient {
  geminiKey = null;
  timeout;

  constructor() {
    this.initializeEnvironment();
    this.timeout = AI_CONFIG.timeout;
  }

  /**
   * 環境変数の初期化
   */
  initializeEnvironment() {
    this.geminiKey = getGeminiApiKey();

    logger.info('[AI-CLIENT] Environment Check:');
    logger.info(`  Gemini API: ${this.geminiKey ? '✅ Configured' : '❌ Missing'}`);

    if (!this.geminiKey) {
      logger.error('[AI-CLIENT] ❌ CRITICAL: GEMINI_API_KEY not configured!');
      logger.error('[AI-CLIENT] Please set GEMINI_API_KEY in Vercel Environment Variables');
    } else {
      logger.success('[AI-CLIENT] ✅ Gemini AI Client initialized successfully');
    }
  }

  /**
   * コンテンツ生成（メインメソッド）
   */
  async generateContent(systemPrompt, userPrompt) {
    if (!this.geminiKey) {
      throw new Error('GEMINI_API_KEY is not configured. Please set it in environment variables.');
    }

    try {
      logger.debug('🤖 Generating content with Gemini 2.5 Flash...');
      const result = await callGeminiTextAPI(systemPrompt, userPrompt, this.geminiKey);

      return sanitizeObject({
        success: true,
        content: result.content,
        provider: 'gemini',
        model: result.model,
        usage: result.usage
      });
    } catch (error) {
      logger.error('❌ Gemini API call failed:', error);
      throw error;
    }
  }

  /**
   * リトライ機能付きコンテンツ生成
   */
  async generateWithRetry(systemPrompt, userPrompt, options = {}) {
    const { maxRetries = AI_CONFIG.retries, retryDelay = 1000 } = options;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateContent(systemPrompt, userPrompt);
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          const delay = retryDelay * (attempt + 1);
          logger.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`Failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * プロンプトからフォームデータを抽出（ユーティリティ）
   */
  extractFormDataFromPrompt(prompt) {
    const formData = {
      participants: '5',
      complexity: 'standard',
      tone: 'balanced',
      era: '現代',
      setting: '洋館',
      worldview: 'リアル',
      incident_type: '殺人'
    };

    // 参加人数を抽出
    const participantsMatch = prompt.match(/参加人数:\s*(\d+)人/);
    if (participantsMatch && participantsMatch[1]) {
      formData.participants = participantsMatch[1];
    }

    // 複雑さを抽出
    if (prompt.includes('simple') || prompt.includes('シンプル')) {
      formData.complexity = 'simple';
    } else if (prompt.includes('complex') || prompt.includes('複雑')) {
      formData.complexity = 'complex';
    }

    // トーンを抽出
    if (prompt.includes('serious') || prompt.includes('シリアス')) {
      formData.tone = 'serious';
    } else if (prompt.includes('comedic') || prompt.includes('コメディ')) {
      formData.tone = 'comedic';
    }

    return formData;
  }
}

// シングルトンインスタンス
const aiClient = new UnifiedAIClient();

module.exports = {
  AI_CONFIG,
  aiClient,
  UnifiedAIClient
};
