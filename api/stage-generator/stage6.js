/**
 * 🎯 段階6: GM進行ガイド・セッション管理
 * Vercel無料プラン対応（10秒制限）
 */

const { StageBase } = require('./stage-base.js');
const { withSecurity } = require('../security-utils.js');


// 環境変数を初期化

class Stage6Generator extends StageBase {
  constructor() {
    super('段階6: GM進行ガイド・セッション管理', 8);
  }

  async processStage(sessionData, _stageData) {
    const { formData, characters, evidence_system } = sessionData;
    
    const systemPrompt = `あなたはGM経験豊富な専門家です。
実用的で分かりやすい進行ガイドを作成してください。
制限時間: 8秒以内で完了してください。`;
    
    const userPrompt = `
【GM進行ガイド作成】

参加人数: ${formData.participants}人
複雑さ: ${formData.complexity}
キャラクター設定: ${characters || ''}
証拠システム: ${evidence_system || ''}

実用的なガイドを作成：

## 📋 事前準備
[必要な準備物・セッティング・配布物]

## 🎬 オープニング（5分）
[導入の進行・ルール説明・雰囲気作り]

## 🔍 調査フェーズ（20-30分）
[情報開示のタイミング・プレイヤー誘導方法]

## 💭 推理フェーズ（15-20分）
[議論の促進・ヒントの出し方・時間管理]

## 🎭 解決フェーズ（10分）
[真相発表・投票・結果発表の進行]

## ⚠️ トラブル対応
[よくある問題と対処法]

## 📊 タイムマネジメント
[各フェーズの時間配分・調整方法]

実践的で使いやすいガイドにしてください。
`;

    const result = await this.generateWithAI(
      systemPrompt, 
      userPrompt, 
      process.env.GEMINI_API_KEY || sessionData.apiKey,
      { 
        maxTokens: 2000,
        timeout: 6000,
        temperature: 0.5
      }
    );

    return { 
      gm_guide: result.content,
      stage6_completed: true,
      stage6_timestamp: new Date().toISOString()
    };
  }
}

const stage6Generator = new Stage6Generator();

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'POST method required' 
    });
  }

  return await stage6Generator.execute(req, res);
}

module.exports = withSecurity(handler, 'stage-generation');