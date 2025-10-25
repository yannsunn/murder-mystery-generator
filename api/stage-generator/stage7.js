/**
 * 🎯 段階7: 統合・品質確認
 * Vercel無料プラン対応（10秒制限）
 */

const { StageBase } = require('./stage-base.js');
const { withSecurity } = require('../security-utils.js');


// 環境変数を初期化

class Stage7Generator extends StageBase {
  constructor() {
    super('段階7: 統合・品質確認', 5);
  }

  async processStage(sessionData, _stageData) {
    const { formData } = sessionData;
    
    const systemPrompt = `あなたは品質管理の専門家です。
シナリオ全体の整合性を確認し、必要な調整を行ってください。
制限時間: 8秒以内で完了してください。`;
    
    const userPrompt = `
【統合・品質確認】

参加人数: ${formData.participants}人
複雑さ: ${formData.complexity}

以下の要素を統合・確認：
- 基本構造・世界観
- 事件の核心・詳細
- キャラクター設定
- 証拠・手がかりシステム
- GM進行ガイド

## 🔍 整合性チェック
[設定間の矛盾・不整合の確認と修正]

## ⚖️ バランス調整
[難易度・情報量・時間配分の最適化]

## 📝 統合シナリオ概要
[全体をまとめた完成版概要]

## ✅ 品質確認項目
[商業レベル基準での確認事項]

## 🎯 最終調整
[プレイアビリティ向上のための微調整]

完成度の高いシナリオに仕上げてください。
`;

    const result = await this.generateWithAI(
      systemPrompt, 
      userPrompt, 
      process.env.GEMINI_API_KEY || sessionData.apiKey,
      { 
        maxTokens: 1800,
        timeout: 6000,
        temperature: 0.4
      }
    );

    return { 
      integration_check: result.content,
      stage7_completed: true,
      stage7_timestamp: new Date().toISOString()
    };
  }
}

const stage7Generator = new Stage7Generator();

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'POST method required' 
    });
  }

  return await stage7Generator.execute(req, res);
}

module.exports = withSecurity(handler, 'stage-generation');