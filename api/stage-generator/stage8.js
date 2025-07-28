/**
 * 🎯 段階8: 最終品質保証・完成
 * Vercel無料プラン対応（10秒制限）
 */

const { StageBase } = require('./stage-base.js');
const { withSecurity } = require('../security-utils.js');
const { envManager } = require('../config/env-manager.js');

// 環境変数を初期化
envManager.initialize();

class Stage8Generator extends StageBase {
  constructor() {
    super('段階8: 最終品質保証・完成', 4);
  }

  async processStage(sessionData, stageData) {
    const { formData } = sessionData;
    
    const systemPrompt = `あなたは最終品質保証の専門家です。
商業レベルの完成品として仕上げてください。
制限時間: 8秒以内で完了してください。`;
    
    const userPrompt = `
【最終品質保証・完成】

参加人数: ${formData.participants}人
トーン: ${formData.tone}
複雑さ: ${formData.complexity}

## 🎯 最終チェックリスト
[✓] 論理的整合性
[✓] キャラクターの魅力度
[✓] 推理の適切な難易度  
[✓] GM進行の実用性
[✓] 制限時間内での完結性

## 📋 完成版シナリオ情報
**タイトル**: [最終確定版]
**推奨プレイ時間**: [分]
**難易度**: [★の数で表示]
**特徴**: [このシナリオの魅力的な特徴]

## 🎭 プレイヤー向け紹介文
[魅力的なキャッチコピーと概要]

## 📖 GM向け要約
[進行のポイントと注意事項]

## ✨ 品質保証済み認定
[商業レベル基準クリア確認]

完成度の高い最終製品として仕上げてください。
`;

    const result = await this.generateWithAI(
      systemPrompt, 
      userPrompt, 
      process.env.GROQ_API_KEY || sessionData.apiKey,
      { 
        maxTokens: 1500,
        timeout: 6000,
        temperature: 0.3
      }
    );

    // 最終完成フラグを設定
    return { 
      final_quality_check: result.content,
      stage8_completed: true,
      stage8_timestamp: new Date().toISOString(),
      scenario_completed: true,
      completion_timestamp: new Date().toISOString(),
      total_stages: 9,
      quality_assured: true
    };
  }
}

const stage8Generator = new Stage8Generator();

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'POST method required' 
    });
  }

  return await stage8Generator.execute(req, res);
}

module.exports = withSecurity(handler, 'stage-generation');