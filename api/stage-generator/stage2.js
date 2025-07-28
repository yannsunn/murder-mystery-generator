/**
 * 🎯 段階2: 事件核心・犯人・動機設定
 * Vercel無料プラン対応（10秒制限）
 */

const { StageBase } = require('./stage-base.js');
const { withSecurity } = require('../security-utils.js');


// 環境変数を初期化

class Stage2Generator extends StageBase {
  constructor() {
    super('段階2: 事件核心・犯人・動機設定', 12);
  }

  async processStage(sessionData, stageData) {
    const { formData, random_outline, concept_detail } = sessionData;
    
    const systemPrompt = `あなたは論理的なミステリー構成の専門家です。
事件の核心と犯人の動機を論理的に設定してください。
制限時間: 8秒以内で完了してください。`;
    
    const userPrompt = `
【事件核心設定】

基本構造:
${random_outline || ''}

世界観詳細:
${concept_detail || ''}

参加人数: ${formData.participants}人
複雑さ: ${formData.complexity}
トーン: ${formData.tone}

以下を設定してください：

## 🔪 事件の詳細
[何が起こったか - 具体的な事件内容]

## 🎭 真犯人
[犯人の身元・キャラクター設定]

## 💭 犯行動機
[なぜ犯行に至ったか - 心理的・状況的理由]

## ⚙️ 犯行手段
[どのように実行されたか - 手法・道具]

## 🕰️ 犯行時刻
[いつ実行されたか - タイムライン]

## 🎯 犯人の計画
[事前準備・隠蔽工作・アリバイ作り]

論理的で説得力のある設定にしてください。
`;

    const result = await this.generateWithAI(
      systemPrompt, 
      userPrompt, 
      process.env.GROQ_API_KEY || sessionData.apiKey,
      { 
        maxTokens: 2000,
        timeout: 6000,
        temperature: 0.6
      }
    );

    return { 
      incident_core: result.content,
      stage2_completed: true,
      stage2_timestamp: new Date().toISOString()
    };
  }
}

const stage2Generator = new Stage2Generator();

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'POST method required' 
    });
  }

  return await stage2Generator.execute(req, res);
}

module.exports = withSecurity(handler, 'stage-generation');