/**
 * 🎨 Image Generation Module (Multi-Provider Support)
 * 画像生成関連の機能を集約 - DALL-E 3 & Gemini 2.5 Flash対応
 */

const { logger } = require('../utils/logger.js');
const { GeminiImageClient } = require('../utils/gemini-image-client.js');

/**
 * 画像プロバイダーの選択
 * 優先順位: 環境変数 IMAGE_PROVIDER > フォールバック
 */
function getImageProvider() {
  const provider = process.env.IMAGE_PROVIDER || 'gemini';
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;

  // 指定されたプロバイダーのAPIキーがあるかチェック
  if (provider === 'gemini' && hasGeminiKey) {
    return 'gemini';
  } else if (provider === 'openai' && hasOpenAIKey) {
    return 'openai';
  } else if (provider === 'dalle' && hasOpenAIKey) {
    return 'dalle';
  }

  // フォールバック: 利用可能なAPIキーを探す
  if (hasGeminiKey) {
    logger.debug('🎨 Using Gemini 2.5 Flash for image generation (fallback)');
    return 'gemini';
  } else if (hasOpenAIKey) {
    logger.debug('🎨 Using DALL-E 3 for image generation (fallback)');
    return 'dalle';
  }

  logger.warn('⚠️ No image generation API key configured');
  return null;
}

/**
 * 画像プロンプト生成関数（トグル対応）
 */
function createImagePrompts(sessionData) {
  // アートワーク生成がトグルで有効化されているかチェック
  if (!sessionData.formData?.generate_artwork) {
    logger.debug('🎨 アートワーク生成は無効化されています（ユーザー設定）');
    return [];
  }

  const prompts = [];
  const concept = sessionData.phases?.step1?.content?.concept || '';

  // タイトル抽出
  const titleMatch = concept.match(/## 作品タイトル[\s\S]*?\n([^\n]+)/);
  const title = titleMatch ? titleMatch[1].trim() : 'マーダーミステリーシナリオ';

  // トーン・時代設定の取得
  const tone = sessionData.formData?.tone || 'serious';
  const era = sessionData.formData?.era || 'modern';
  const setting = sessionData.formData?.setting || 'mansion';

  // メインコンセプト画像
  prompts.push({
    type: 'main_concept',
    prompt: `A dramatic and atmospheric murder mystery scene for "${title}". ${tone} tone, ${era} era setting in a ${setting}. Professional book cover art style with mysterious ambiance, cinematic lighting, high quality illustration, no text or watermarks.`,
    description: 'メインコンセプトアート',
    priority: 'high'
  });

  // キャラクター画像（参加人数分）
  const participantCount = parseInt(sessionData.formData?.participants || 5);
  for (let i = 1; i <= participantCount; i++) {
    prompts.push({
      type: `character_${i}`,
      prompt: `Character portrait for a murder mystery game. Player character ${i}, ${era} era clothing and style, professional character art, detailed facial features, mysterious and intriguing expression, dramatic lighting, high quality digital art, portrait orientation, no text.`,
      description: `キャラクター${i}のポートレート`,
      priority: 'medium'
    });
  }

  logger.debug(`🎨 アートワーク生成が有効化されました - ${prompts.length}個のプロンプト生成`);
  logger.debug(`🎨 選択されたプロバイダー: ${getImageProvider() || 'none'}`);

  return prompts;
}

/**
 * Gemini 2.5 Flash画像プロンプト生成
 * Note: 実際の画像はフロントエンドまたは外部サービスで生成
 */
async function generateImageWithGemini(promptData) {
  try {
    const geminiClient = new GeminiImageClient();

    if (!geminiClient.isConfigured()) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    logger.debug(`🎨 [Gemini] Generating image prompt for: ${promptData.type}`);

    const result = await geminiClient.generateImagePrompt(promptData.prompt);

    if (result.success) {
      logger.success(`✅ [Gemini] Image prompt generated: ${promptData.type}`);
      return {
        ...promptData,
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        generatedPrompt: result.prompt,
        status: 'success'
      };
    } else {
      throw new Error(result.error || 'Unknown error');
    }
  } catch (error) {
    logger.error(`❌ [Gemini] Image prompt generation failed: ${error.message}`);
    return {
      ...promptData,
      provider: 'gemini',
      error: error.message,
      status: 'failed'
    };
  }
}

/**
 * DALL-E 3 image generation (OpenAI)
 */
async function generateImageWithDALLE(promptData) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    logger.debug(`🎨 [DALL-E] Generating: ${promptData.type}`);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: promptData.prompt,
        n: 1,
        size: promptData.type === 'main_concept' ? '1792x1024' : '1024x1024',
        quality: 'standard',
        response_format: 'url'
      })
    });

    if (response.ok) {
      const data = await response.json();
      logger.debug(`✅ [DALL-E] Image generated: ${promptData.type}`);

      return {
        ...promptData,
        provider: 'dalle',
        model: 'dall-e-3',
        url: data.data[0].url,
        revised_prompt: data.data[0].revised_prompt,
        status: 'success'
      };
    } else {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }
  } catch (error) {
    logger.error(`❌ [DALL-E] Image generation failed: ${error.message}`);
    return {
      ...promptData,
      provider: 'dalle',
      error: error.message,
      status: 'failed'
    };
  }
}

/**
 * 統合画像生成関数（マルチプロバイダー対応）
 */
async function generateImages(imagePrompts) {
  const images = [];

  // プロンプトが空の場合はスキップ
  if (!imagePrompts || imagePrompts.length === 0) {
    logger.debug('🎨 アートワーク生成はスキップされました');
    return images;
  }

  // プロバイダーの選択
  const provider = getImageProvider();

  if (!provider) {
    logger.warn('⚠️ No image provider configured, skipping image generation');
    return images;
  }

  logger.info(`🎨 Starting image generation with provider: ${provider.toUpperCase()}`);

  for (const promptData of imagePrompts) {
    let result;

    try {
      // プロバイダーに応じた画像生成
      if (provider === 'gemini') {
        result = await generateImageWithGemini(promptData);
      } else if (provider === 'dalle' || provider === 'openai') {
        result = await generateImageWithDALLE(promptData);
      } else {
        logger.warn(`⚠️ Unknown provider: ${provider}`);
        result = {
          ...promptData,
          error: `Unknown provider: ${provider}`,
          status: 'failed'
        };
      }

      images.push(result);

      // レート制限対策: 少し待機
      if (imagePrompts.indexOf(promptData) < imagePrompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      logger.error(`❌ Image generation error: ${error.message}`);
      images.push({
        ...promptData,
        error: error.message,
        status: 'error'
      });
    }
  }

  const successCount = images.filter(img => img.status === 'success').length;
  logger.info(`🎨 Image generation completed: ${successCount}/${images.length} successful`);

  return images;
}

// CommonJS形式でエクスポート
module.exports = {
  createImagePrompts,
  generateImages,
  getImageProvider
};
