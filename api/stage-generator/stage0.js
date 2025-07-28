/**
 * 🎯 段階0: ランダム全体構造・アウトライン生成
 * Vercel無料プラン対応（10秒制限）
 */

const { StageBase } = require('./stage-base.js');
const { withSecurity } = require('../security-utils.js');

class Stage0Generator extends StageBase {
  constructor() {
    super('段階0: ランダム全体構造・アウトライン生成', 15);
  }

  async processStage(sessionData, stageData) {
    const { formData } = sessionData;
    
    // 詳細なログを追加
    console.log('[STAGE0] Processing stage with formData:', formData);
    console.log('[STAGE0] Direct environment check, GROQ_API_KEY exists:', process.env.GROQ_API_KEY ? 'YES' : 'NO');
    
    const systemPrompt = `あなたは商業レベルのマーダーミステリー企画者です。
30分-60分で完結する高品質なシナリオの基本構造を作成してください。
制限時間: 8秒以内で完了してください。`;
    
    const userPrompt = `
【ランダム全体構造生成】

参加人数: ${formData.participants}人
時代背景: ${formData.era}
舞台設定: ${formData.setting}
トーン: ${formData.tone}
複雑さ: ${formData.complexity}

以下の構造で簡潔に生成してください：

## 📖 シナリオタイトル
[魅力的なタイトル]

## 🎭 基本コンセプト
[200文字以内の核心概念]

## 🎯 事件の概要
[150文字以内の事件概要]

## 👥 参加者役割
[各参加者の基本役割を1行ずつ]

## ⏰ 基本タイムライン
[重要な時間帯を5つ以内で]

## 🔍 謎の核心
[解決すべき中心的な謎]

簡潔で効率的に生成してください。
`;

    // 環境変数からAPIキーを取得（直接アクセス）
    const apiKey = process.env.GROQ_API_KEY || sessionData.apiKey;
    console.log('[STAGE0] API Key found:', apiKey ? 'YES' : 'NO');
    console.log('[STAGE0] API Key prefix:', apiKey ? apiKey.substring(0, 8) + '...' : 'NONE');
    console.log('[STAGE0] process.env.GROQ_API_KEY exists:', process.env.GROQ_API_KEY ? 'YES' : 'NO');
    console.log('[STAGE0] All env vars with API:', Object.keys(process.env).filter(k => k.includes('API')).join(', '));
    console.log('[STAGE0] Vercel env detected:', process.env.VERCEL ? 'YES' : 'NO');
    console.log('[STAGE0] NODE_ENV:', process.env.NODE_ENV);
    
    if (!apiKey) {
      console.error('[STAGE0] No API key available! process.env.GROQ_API_KEY:', process.env.GROQ_API_KEY);
      console.error('[STAGE0] Environment variables:', Object.keys(process.env).filter(k => k.includes('API')));
      throw new Error('GROQ API key not found in environment variables');
    }
    
    const result = await this.generateWithAI(
      systemPrompt, 
      userPrompt, 
      apiKey,
      { 
        maxTokens: 1500,
        timeout: 6000,
        temperature: 0.8
      }
    );

    return { 
      random_outline: result.content,
      stage0_completed: true,
      stage0_timestamp: new Date().toISOString()
    };
  }
}

const stage0Generator = new Stage0Generator();

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'POST method required' 
    });
  }

  return await stage0Generator.execute(req, res);
}

module.exports = withSecurity(handler, 'stage-generation');