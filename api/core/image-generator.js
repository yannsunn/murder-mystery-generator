/**
 * 🎨 Image Generation Module
 * 画像生成関連の機能を集約
 */

const { logger } = require('../utils/logger.js');

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
  const characters = sessionData.phases?.step2?.content?.characters || '';
  
  // タイトル抽出
  const titleMatch = concept.match(/## 作品タイトル[\s\S]*?\n([^\n]+)/);
  const title = titleMatch ? titleMatch[1].trim() : 'マーダーミステリーシナリオ';
  
  // メインコンセプト画像
  prompts.push({
    type: 'main_concept',
    prompt: `Murder mystery scene for "${title}", atmospheric and mysterious, ${sessionData.formData?.tone || 'serious'} tone, ${sessionData.formData?.era || 'modern'} setting, professional book cover style, dramatic lighting, no text`,
    description: 'メインコンセプトアート'
  });
  
  // キャラクター画像（参加人数分）
  const participantCount = parseInt(sessionData.formData?.participants || 5);
  for (let i = 1; i <= participantCount; i++) {
    prompts.push({
      type: `character_${i}`,
      prompt: `Character portrait for murder mystery, player ${i}, ${sessionData.formData?.era || 'modern'} era, professional character art, detailed face, mysterious expression, dramatic lighting`,
      description: `キャラクター${i}のポートレート`
    });
  }
  
  logger.debug(`🎨 アートワーク生成が有効化されました - ${prompts.length}個のプロンプト生成`);
  return prompts;
}

/**
 * OpenAI画像生成関数（トグル対応）
 */
async function generateImages(imagePrompts) {
  const images = [];
  
  // プロンプトが空の場合はスキップ
  if (!imagePrompts || imagePrompts.length === 0) {
    logger.debug('🎨 アートワーク生成はスキップされました');
    return images;
  }
  
  // APIキーが設定されていない場合はスキップ
  if (!process.env.OPENAI_API_KEY) {
    logger.debug('⚠️ OPENAI_API_KEY not set, skipping image generation');
    return images;
  }
  
  for (const promptData of imagePrompts) {
    try {
      logger.debug(`🎨 Generating image: ${promptData.type}`);
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(sanitizeObject({
          model: 'dall-e-3',
          prompt: promptData.prompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard'
        }))
      });
      
      if (response.ok) {
        const data = await response.json();
        images.push({
          ...promptData,
          url: data.data[0].url,
          revised_prompt: data.data[0].revised_prompt,
          status: 'success'
        });
        logger.debug(`✅ Image generated: ${promptData.type}`);
      } else {
        const error = await response.text();
        logger.error(`❌ Image generation failed: ${error}`);
        images.push({
          ...promptData,
          error: 'Generation failed',
          status: 'failed'
        });
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
  
  return images;
}

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

// CommonJS形式でエクスポート
module.exports = {
  createImagePrompts,
  generateImages
};