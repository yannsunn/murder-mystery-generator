/**
 * 🤖 Gemini API Client
 * Google Gemini 2.5 Flash Image generation support
 */

const { logger } = require('./logger.js');

/**
 * Gemini 2.5 Flash Image generation using Google AI API
 */
class GeminiImageClient {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY;
    this.baseURL = 'https://generativelanguage.googleapis.com/v1beta';

    if (!this.apiKey) {
      logger.warn('⚠️ GEMINI_API_KEY not set');
    }
  }

  /**
   * Generate image using Gemini 2.5 Flash
   */
  async generateImage(prompt, options = {}) {
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required for image generation');
    }

    const {
      // aspectRatio and numberOfImages reserved for future implementation
      safetySettings = 'default'
    } = options;

    try {
      logger.debug(`🎨 [Gemini] Generating image with prompt: ${prompt.substring(0, 100)}...`);

      // Gemini 2.5 Flash Image API endpoint
      const endpoint = `${this.baseURL}/models/gemini-2.5-flash:generateContent`;

      const requestBody = {
        contents: [{
          parts: [{
            text: `Generate a high-quality image: ${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          responseMimeType: 'image/png'
        },
        safetySettings: this.getSafetySettings(safetySettings)
      };

      const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`❌ [Gemini] API error: ${errorText}`);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      // Extract image data from response
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content;
        const imagePart = content.parts.find(part => part.inlineData);

        if (imagePart && imagePart.inlineData) {
          const base64Image = imagePart.inlineData.data;
          const mimeType = imagePart.inlineData.mimeType || 'image/png';

          logger.debug('✅ [Gemini] Image generated successfully');

          return {
            success: true,
            provider: 'gemini',
            model: 'gemini-2.5-flash',
            data: base64Image,
            mimeType: mimeType,
            url: `data:${mimeType};base64,${base64Image}`,
            prompt: prompt,
            finishReason: data.candidates[0].finishReason
          };
        }
      }

      throw new Error('Invalid response format from Gemini API');

    } catch (error) {
      logger.error(`❌ [Gemini] Image generation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate multiple images in batch
   */
  async generateImages(prompts, options = {}) {
    const results = [];

    for (const prompt of prompts) {
      try {
        const result = await this.generateImage(prompt, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          provider: 'gemini',
          error: error.message,
          prompt: prompt
        });
      }
    }

    return results;
  }

  /**
   * Get safety settings configuration
   */
  getSafetySettings(level = 'default') {
    const settings = {
      default: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      ],
      strict: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_LOW_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_LOW_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_LOW_AND_ABOVE'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_LOW_AND_ABOVE'
        }
      ],
      permissive: [
        {
          category: 'HARM_CATEGORY_HARASSMENT',
          threshold: 'BLOCK_ONLY_HIGH'
        },
        {
          category: 'HARM_CATEGORY_HATE_SPEECH',
          threshold: 'BLOCK_ONLY_HIGH'
        },
        {
          category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
          threshold: 'BLOCK_ONLY_HIGH'
        },
        {
          category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
          threshold: 'BLOCK_ONLY_HIGH'
        }
      ]
    };

    return settings[level] || settings.default;
  }

  /**
   * Check if API key is configured
   */
  isConfigured() {
    return !!this.apiKey;
  }
}

// Export
module.exports = {
  GeminiImageClient
};
