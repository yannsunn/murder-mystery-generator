/**
 * 🚀 統一AI クライアント - 全重複コードの統合
 * すべてのAI API呼び出しを一元管理
 */

import { envManager } from '../config/env-manager.js';

export const AI_CONFIG = {
  maxDuration: 30,
  timeout: 25000,
  retries: 2
};

/**
 * 統一AIクライアント
 */
export class UnifiedAIClient {
  constructor() {
    // 環境変数マネージャーを初期化してから取得
    if (!envManager.initialized) {
      envManager.initialize();
    }
    
    // 環境変数マネージャーから取得
    this.groqKey = envManager.get('GROQ_API_KEY');
    this.openaiKey = envManager.get('OPENAI_API_KEY');
    
    // 設定値もenvManagerから取得
    this.timeout = envManager.get('MAX_GENERATION_TIME') || AI_CONFIG.timeout;
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
        body: JSON.stringify(config.payload(systemPrompt, userPrompt)),
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
   * フォールバック付きAI呼び出し
   */
  async generateContent(systemPrompt, userPrompt, preferredProvider = 'groq') {
    const providers = preferredProvider === 'groq' ? ['groq', 'openai'] : ['openai', 'groq'];
    let lastError;
    
    for (const provider of providers) {
      try {
        return await this.makeAPICall(provider, systemPrompt, userPrompt);
      } catch (error) {
        console.warn(`${provider} failed, trying next provider:`, error.message);
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
          console.warn(`Attempt ${attempt + 1} failed, retrying in ${retryDelay}ms:`, error.message);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    throw new Error(`Failed after ${maxRetries + 1} attempts. Last error: ${lastError?.message}`);
  }
}

// シングルトンインスタンス
export const aiClient = new UnifiedAIClient();