/**
 * 🎯 段階3: 事件詳細・状況設定
 * Vercel無料プラン対応（10秒制限）
 */

const { StageBase } = require('./stage-base.js');
const { withSecurity } = require('../security-utils.js');
const { envManager } = require('../config/env-manager.js');

// 環境変数を初期化
envManager.initialize();

class Stage3Generator extends StageBase {
  constructor() {
    super('段階3: 事件詳細・状況設定', 13);
  }

  async processStage(sessionData, stageData) {
    const { formData, random_outline, concept_detail, incident_core } = sessionData;
    
    const systemPrompt = `あなたは詳細なシナリオ設計の専門家です。
事件の具体的な状況と環境を詳細に設定してください。
制限時間: 8秒以内で完了してください。`;
    
    const userPrompt = `
【事件詳細設定】

基本構造: ${random_outline || ''}
世界観: ${concept_detail || ''}
事件核心: ${incident_core || ''}

参加人数: ${formData.participants}人
舞台設定: ${formData.setting}
複雑さ: ${formData.complexity}

以下を詳細に設定してください：

## 🏛️ 事件現場
[現場の詳細な描写・レイアウト・特徴]

## 📅 詳細タイムライン
[事件当日の時系列での出来事]

## 🌍 周辺状況
[天候・社会情勢・その他の環境要因]

## 👥 関係者の配置
[事件時に各人がどこにいたか]

## 🔍 初期状況
[事件発覚時の状況・第一発見者・通報]

## 📋 重要な制約
[アリバイ・物理的制限・時間制約]

具体的で臨場感のある設定にしてください。
`;

    const result = await this.generateWithAI(
      systemPrompt, 
      userPrompt, 
      process.env.GROQ_API_KEY || sessionData.apiKey,
      { 
        maxTokens: 2200,
        timeout: 6000,
        temperature: 0.6
      }
    );

    return { 
      incident_details: result.content,
      stage3_completed: true,
      stage3_timestamp: new Date().toISOString()
    };
  }
}

const stage3Generator = new Stage3Generator();

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'POST method required' 
    });
  }

  return await stage3Generator.execute(req, res);
}

module.exports = withSecurity(handler, 'stage-generation');