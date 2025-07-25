/**
 * 🎯 段階1: コンセプト精密化・世界観詳細化
 * Vercel無料プラン対応（10秒制限）
 */

const { StageBase } = require('./stage-base.js');
const { withSecurity } = require('../security-utils.js');

class Stage1Generator extends StageBase {
  constructor() {
    super('段階1: コンセプト精密化・世界観詳細化', 10);
  }

  async processStage(sessionData, stageData) {
    const { formData, random_outline } = sessionData;
    
    const systemPrompt = `あなたは商業レベルのマーダーミステリー企画者です。
基本構造を詳細化し、没入感のある世界観を構築してください。
制限時間: 8秒以内で完了してください。`;
    
    const userPrompt = `
【コンセプト精密化】

基本構造:
${random_outline || ''}

参加人数: ${formData.participants}人
時代背景: ${formData.era}
舞台設定: ${formData.setting}
トーン: ${formData.tone}
複雑さ: ${formData.complexity}

以下を詳細化してください：

## 🌍 世界観設定
[時代・場所・社会背景の詳細]

## 🎭 コンセプト詳細
[シナリオの核となる魅力的な要素]

## 🏛️ 舞台詳細
[事件現場・周辺環境の具体的描写]

## 📚 背景設定
[事件に至る社会・人間関係の背景]

## 🎯 プレイヤー体験
[参加者が得られる体験の方向性]

簡潔で魅力的に表現してください。
`;

    const result = await this.generateWithAI(
      systemPrompt, 
      userPrompt, 
      formData.apiKey,
      { 
        maxTokens: 1800,
        timeout: 6000,
        temperature: 0.7
      }
    );

    return { 
      concept_detail: result.content,
      stage1_completed: true,
      stage1_timestamp: new Date().toISOString()
    };
  }
}

const stage1Generator = new Stage1Generator();

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'POST method required' 
    });
  }

  return await stage1Generator.execute(req, res);
}

module.exports = withSecurity(handler, 'stage-generation');