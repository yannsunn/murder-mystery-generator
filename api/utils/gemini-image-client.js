/**
 * 🎨 Gemini Image Client
 * Google Gemini 2.5 Flash - 画像生成機能
 * Imagen 3統合（Gemini経由）
 */

const { logger } = require('./logger.js');
const { getGeminiApiKey } = require('./gemini-text-client.js');

/**
 * Gemini経由で画像生成
 * Note: Gemini 2.5 Flash自体は主にテキスト生成用
 * 画像生成にはImagen 3またはGemini Proビジョンモデルを使用
 */
class GeminiImageClient {
  constructor(apiKey) {
    this.apiKey = apiKey || getGeminiApiKey();
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';

    if (!this.apiKey) {
      logger.warn('⚠️ GEMINI_API_KEY not set - image generation disabled');
    }
  }

  /**
   * 画像生成（Geminiテキストモデル経由で画像プロンプト生成）
   * Note: 実際の画像生成はフロントエンドまたは別サービスで実装
   */
  async generateImagePrompt(sceneDescription) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required for image generation');
    }

    try {
      logger.debug(`🎨 [Gemini] Generating image prompt for: ${sceneDescription.substring(0, 50)}...`);

      // Gemini 2.5 Flashでプロ品質の画像プロンプトを生成
      const endpoint = `${this.baseURL}/models/gemini-2.5-flash:generateContent`;

      const requestBody = {
        contents: [{
          parts: [{
            text: `以下のシーン描写から、高品質なAI画像生成プロンプトを作成してください。

シーン描写：
${sceneDescription}

要件：
- DALL-E 3やMidjourneyで使用できる英語プロンプト
- 詳細な視覚的描写
- アート スタイル指定
- ライティングと構図の指定
- 200文字以内

プロンプトのみを出力してください：`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 500
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      };

      const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(25000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`❌ [Gemini] Image prompt generation error: ${errorText}`);
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from Gemini API');
      }

      const imagePrompt = data.candidates[0].content.parts
        .filter(part => part.text)
        .map(part => part.text)
        .join('\n')
        .trim();

      logger.success(`✅ [Gemini] Image prompt generated (${imagePrompt.length} chars)`);

      return {
        success: true,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        prompt: imagePrompt,
        originalScene: sceneDescription
      };

    } catch (error) {
      logger.error(`❌ [Gemini] Image prompt generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * 複数シーンの画像プロンプト生成
   */
  async generateImagePrompts(sceneDescriptions) {
    const results = [];

    for (const scene of sceneDescriptions) {
      try {
        const result = await this.generateImagePrompt(scene);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          provider: 'gemini',
          error: error.message,
          originalScene: scene
        });
      }
    }

    return results;
  }

  /**
   * APIキー設定確認
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

module.exports = {
  GeminiImageClient
};
