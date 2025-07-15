/**
 * 🚀 統一AI クライアント - 全重複コードの統合
 * すべてのAI API呼び出しを一元管理
 */

const { envManager } = require('../config/env-manager.js');
const { logger } = require('./logger.js');

const AI_CONFIG = {
  maxDuration: 30,
  timeout: 25000,
  retries: 2
};

// サロゲートペア不正除去ユーティリティ
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
 * 統一AIクライアント
 */
class UnifiedAIClient {
  constructor() {
    // プロダクション環境での確実な初期化
    this.initializeEnvironment();
    
    // 設定値もenvManagerから取得
    this.timeout = this.groqKey || this.openaiKey ? 
      (envManager.get('MAX_GENERATION_TIME') || AI_CONFIG.timeout) : 
      AI_CONFIG.timeout;
  }

  /**
   * 環境変数の確実な初期化
   */
  initializeEnvironment() {
    try {
      if (!envManager.initialized) {
        envManager.initialize();
      }
      
      // envManagerから取得を試みる
      this.groqKey = envManager.get('GROQ_API_KEY');
      this.openaiKey = envManager.get('OPENAI_API_KEY');
    } catch (error) {
      // envManagerが失敗した場合、直接process.envから取得
      logger.warn('EnvManager failed, using direct process.env access:', error.message);
      this.groqKey = process.env.GROQ_API_KEY;
      this.openaiKey = process.env.OPENAI_API_KEY;
    }

    // 最終確認とログ
    logger.info('🔑 AI Client Environment Check:');
    logger.info(`   GROQ: ${this.groqKey ? '✅ Configured' : '❌ Missing'}`);
    logger.info(`   OpenAI: ${this.openaiKey ? '✅ Configured' : '❌ Missing'}`);
    
    if (!this.groqKey && !this.openaiKey) {
      logger.error('❌ No AI providers configured! Please set GROQ_API_KEY or OPENAI_API_KEY');
    }
  }

  /**
   * 統一API呼び出しメソッド（重複排除）
   */
  async makeAPICall(provider, systemPrompt, userPrompt, model = null) {
    const config = this.getProviderConfig(provider, model);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(sanitizeObject(config.payload(systemPrompt, userPrompt))),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${provider} API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return this.extractContent(data, provider, model);

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`${provider} API timeout after ${this.timeout}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * プロバイダー設定取得
   */
  getProviderConfig(provider, model) {
    const configs = {
      groq: {
        url: 'https://api.groq.com/openai/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${this.groqKey}`,
          'Content-Type': 'application/json',
        },
        payload: (systemPrompt, userPrompt) => ({
          model: model || 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 1800,
          top_p: 0.9,
          frequency_penalty: 0.3,
          presence_penalty: 0.4,
          stream: false
        })
      },
      openai: {
        url: 'https://api.openai.com/v1/chat/completions',
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json',
        },
        payload: (systemPrompt, userPrompt) => ({
          model: model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 1800
        })
      }
    };

    if (!configs[provider]) {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    if (provider === 'groq' && !this.groqKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    if (provider === 'openai' && !this.openaiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    return configs[provider];
  }

  /**
   * レスポンスからコンテンツ抽出
   */
  extractContent(data, provider, model) {
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error(`No content returned from ${provider} API`);
    }

    return {
      success: true,
      content,
      provider,
      model
    };
  }

  /**
   * Groq API呼び出し（レガシー互換性のため）
   */
  async callGroq(systemPrompt, userPrompt, model = 'llama-3.1-8b-instant') {
    return this.makeAPICall('groq', systemPrompt, userPrompt, model);
  }

  /**
   * OpenAI API呼び出し（レガシー互換性のため）
   */
  async callOpenAI(systemPrompt, userPrompt, model = 'gpt-3.5-turbo') {
    return this.makeAPICall('openai', systemPrompt, userPrompt, model);
  }

  /**
   * フォールバック付きAI呼び出し - 環境変数チェック改善
   */
  async generateContent(systemPrompt, userPrompt, preferredProvider = 'groq') {
    // 利用可能なプロバイダーのみ使用
    const availableProviders = [];
    
    if (this.groqKey) {
      availableProviders.push('groq');
    }
    if (this.openaiKey) {
      availableProviders.push('openai');
    }
    
    if (availableProviders.length === 0) {
      throw new Error('No AI providers configured. Please set GROQ_API_KEY or OPENAI_API_KEY');
    }
    
    // 優先順位を設定
    const providers = preferredProvider === 'groq' && availableProviders.includes('groq') 
      ? availableProviders 
      : availableProviders.reverse();
    
    let lastError;
    
    for (const provider of providers) {
      try {
        logger.debug(`🤖 Trying ${provider.toUpperCase()} provider...`);
        return await this.makeAPICall(provider, systemPrompt, userPrompt);
      } catch (error) {
        logger.warn(`❌ ${provider.toUpperCase()} failed:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    throw new Error(`All AI providers failed. Last error: ${lastError?.message}`);
  }

  /**
   * リトライ機能付きAI呼び出し
   */
  async generateWithRetry(systemPrompt, userPrompt, options = {}) {
    const {
      preferredProvider = 'groq',
      maxRetries = AI_CONFIG.retries,
      retryDelay = 1000
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateContent(systemPrompt, userPrompt, preferredProvider);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxRetries) {
          logger.warn(`Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    throw new Error(`Failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message}`);
  }
}

// シングルトンインスタンス
const aiClient = new UnifiedAIClient();

// CommonJS形式でエクスポート
module.exports = {
  AI_CONFIG,
  aiClient,
  UnifiedAIClient
};