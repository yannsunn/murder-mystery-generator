/**
 * 🚀 統一AI クライアント - 全重複コードの統合
 * すべてのAI API呼び出しを一元管理
 */

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
    this.groqKey = process.env.GROQ_API_KEY;
    this.openaiKey = process.env.OPENAI_API_KEY;
  }

  /**
   * Groq API呼び出し（統一化）
   */
  async callGroq(systemPrompt, userPrompt, model = 'llama-3.1-8b-instant') {
    if (!this.groqKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_CONFIG.timeout);

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.groqKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
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
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content returned from Groq API');
      }

      return {
        success: true,
        content,
        provider: 'groq',
        model
      };

    } catch (error) {
      clearTimeout(timeout);
      
      if (error.name === 'AbortError') {
        throw new Error(`Groq API timeout after ${AI_CONFIG.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * OpenAI API呼び出し（統一化）
   */
  async callOpenAI(systemPrompt, userPrompt, model = 'gpt-3.5-turbo') {
    if (!this.openaiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_CONFIG.timeout);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.8,
          max_tokens: 1800
        }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content returned from OpenAI API');
      }

      return {
        success: true,
        content,
        provider: 'openai',
        model
      };

    } catch (error) {
      clearTimeout(timeout);
      
      if (error.name === 'AbortError') {
        throw new Error(`OpenAI API timeout after ${AI_CONFIG.timeout}ms`);
      }
      throw error;
    }
  }

  /**
   * フォールバック付きAI呼び出し
   */
  async generateContent(systemPrompt, userPrompt, preferredProvider = 'groq') {
    const providers = preferredProvider === 'groq' ? ['groq', 'openai'] : ['openai', 'groq'];
    
    for (const provider of providers) {
      try {
        if (provider === 'groq') {
          return await this.callGroq(systemPrompt, userPrompt);
        } else {
          return await this.callOpenAI(systemPrompt, userPrompt);
        }
      } catch (error) {
        console.warn(`${provider} failed, trying next provider:`, error.message);
        continue;
      }
    }
    
    throw new Error('All AI providers failed');
  }
}

// シングルトンインスタンス
export const aiClient = new UnifiedAIClient();