/**
 * 🤖 Gemini Text Client
 * Google Gemini 2.5 Flash - 最新テキスト生成モデル
 * 超高速、高品質、マルチモーダル対応
 */

const { logger } = require('./logger.js');

/**
 * Gemini 2.5 Flash API呼び出し（テキスト生成）
 * @param {string} systemPrompt - システムプロンプト
 * @param {string} userPrompt - ユーザープロンプト
 * @param {string} apiKey - Gemini APIキー
 * @returns {Promise<Object>} 生成結果
 */
async function callGeminiTextAPI(systemPrompt, userPrompt, apiKey) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }

  // Gemini 2.5 Flash - 最新モデル
  const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  const requestBody = {
    contents: [{
      parts: [
        { text: `システム指示: ${systemPrompt}\n\nユーザー要求: ${userPrompt}` }
      ]
    }],
    generationConfig: {
      temperature: 0.8,
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 2048,
      candidateCount: 1
    },
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_NONE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE'
      }
    ]
  };

  try {
    logger.debug('🤖 [Gemini] Generating text with gemini-2.5-flash...');

    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000) // 30秒タイムアウト
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`❌ [Gemini] API error: ${response.status} - ${errorText}`);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();

    // レスポンス検証
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      logger.error('❌ [Gemini] Invalid response format:', JSON.stringify(data));
      throw new Error('Invalid response from Gemini API');
    }

    const candidate = data.candidates[0];
    const textContent = candidate.content.parts
      .filter(part => part.text)
      .map(part => part.text)
      .join('\n');

    if (!textContent) {
      throw new Error('No text content in Gemini response');
    }

    logger.success(`✅ [Gemini] Text generated (${textContent.length} chars)`);

    return {
      success: true,
      content: textContent,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      },
      model: 'gemini-2.5-flash',
      finishReason: candidate.finishReason
    };

  } catch (error) {
    logger.error('❌ [Gemini] Text generation failed:', error);
    throw error;
  }
}

/**
 * 環境変数からGemini APIキーを取得
 */
function getGeminiApiKey() {
  // 1. 直接アクセス
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  // 2. 大文字小文字の違いを考慮
  const envKeys = Object.keys(process.env);
  const geminiKey = envKeys.find(k => k.toUpperCase() === 'GEMINI_API_KEY');
  if (geminiKey && process.env[geminiKey]) {
    return process.env[geminiKey];
  }

  // 3. Google API Keyも確認
  if (process.env.GOOGLE_API_KEY) {
    return process.env.GOOGLE_API_KEY;
  }

  return null;
}

module.exports = {
  callGeminiTextAPI,
  getGeminiApiKey
};
