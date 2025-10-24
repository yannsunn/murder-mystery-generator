/**
 * 🎯 段階5: 証拠配置・手がかり体系化
 * Vercel無料プラン対応（10秒制限）
 */

const { StageBase } = require('./stage-base.js');
const { withSecurity } = require('../security-utils.js');


// 環境変数を初期化

class Stage5Generator extends StageBase {
  constructor() {
    super('段階5: 証拠配置・手がかり体系化', 18);
  }

  async processStage(sessionData, _stageData) {
    const { formData, incident_core, incident_details, characters } = sessionData;
    
    const systemPrompt = `あなたは論理的な証拠設計の専門家です。
推理ゲームとして適切な証拠・手がかりシステムを構築してください。
制限時間: 8秒以内で完了してください。`;
    
    const userPrompt = `
【証拠・手がかり体系化】

事件核心: ${incident_core || ''}
事件詳細: ${incident_details || ''}
キャラクター: ${characters || ''}

複雑さ: ${formData.complexity}
参加人数: ${formData.participants}人

以下を体系的に設計：

## 🔍 物的証拠
[現場・関係者から発見される具体的な証拠品]

## 💬 証言・情報
[各キャラクターが知っている重要情報]

## 🧩 推理の手がかり
[論理的推理につながるヒント]

## 🎭 ミスリード要素
[推理を困難にする偽の手がかり]

## 📋 情報開示タイミング
[いつ・どの情報が明かされるか]

## 🎯 解決への道筋
[正解にたどり着くための論理的経路]

推理ゲームとして適切な難易度に調整してください。
`;

    const result = await this.generateWithAI(
      systemPrompt, 
      userPrompt, 
      process.env.GROQ_API_KEY || sessionData.apiKey,
      { 
        maxTokens: 2500,
        timeout: 6500,
        temperature: 0.6
      }
    );

    return { 
      evidence_system: result.content,
      stage5_completed: true,
      stage5_timestamp: new Date().toISOString()
    };
  }
}

const stage5Generator = new Stage5Generator();

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'POST method required' 
    });
  }

  return await stage5Generator.execute(req, res);
}

module.exports = withSecurity(handler, 'stage-generation');