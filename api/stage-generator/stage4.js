/**
 * 🎯 段階4: キャラクター生成・関係性構築
 * Vercel無料プラン対応（10秒制限）- 最重要段階
 */

const { StageBase } = require('./stage-base.js');
const { withSecurity } = require('../security-utils.js');


// 環境変数を初期化

class Stage4Generator extends StageBase {
  constructor() {
    super('段階4: キャラクター生成・関係性構築', 35);
  }

  async processStage(sessionData, _stageData) {
    const { formData, random_outline, concept_detail, incident_core, incident_details } = sessionData;
    
    // 参加者数に応じて効率的な生成方法を選択
    const participants = parseInt(formData.participants) || 6;
    
    if (participants <= 4) {
      return await this.generateSmallGroup(sessionData);
    } else if (participants <= 6) {
      return await this.generateMediumGroup(sessionData);
    } else {
      return await this.generateLargeGroup(sessionData);
    }
  }

  /**
   * 小グループ（4人以下）- 詳細生成
   */
  async generateSmallGroup(sessionData) {
    const { formData } = sessionData;
    
    const systemPrompt = `あなたは精密なキャラクター設計の専門家です。
少人数での濃密な人間関係を構築してください。
制限時間: 8秒以内で完了してください。`;
    
    const userPrompt = `
【小グループキャラクター生成】

参加人数: ${formData.participants}人
基本設定: ${sessionData.random_outline || ''}
事件核心: ${sessionData.incident_core || ''}

各キャラクターを以下の形式で生成：

## 👤 キャラクター1 [役職名]
**基本情報**: 年齢・性別・職業
**性格**: 核となる性格特性
**動機**: 事件に対する利害関係
**秘密**: 隠している重要な情報
**関係性**: 他キャラとの具体的関係

## 👤 キャラクター2 [役職名]
[同様の構成]

全${formData.participants}人を生成してください。
各人に明確な動機と秘密を設定し、相互関係を密接にしてください。
`;

    const result = await this.generateWithAI(
      systemPrompt, 
      userPrompt, 
      process.env.GROQ_API_KEY || sessionData.apiKey,
      { 
        maxTokens: 2500,
        timeout: 7000,
        temperature: 0.7
      }
    );

    return this.formatCharacterResult(result.content, 'small');
  }

  /**
   * 中グループ（5-6人）- バランス型
   */
  async generateMediumGroup(sessionData) {
    const { formData } = sessionData;
    
    const systemPrompt = `あなたは効率的なキャラクター設計の専門家です。
バランスの取れた人間関係を構築してください。
制限時間: 8秒以内で完了してください。`;
    
    const userPrompt = `
【中グループキャラクター生成】

参加人数: ${formData.participants}人
基本設定: ${sessionData.concept_detail || ''}
事件詳細: ${sessionData.incident_details || ''}

効率的な形式で生成：

## 🎭 メインキャラクター（3-4人）
[主要な役割を持つキャラクターの詳細]

## 👥 サブキャラクター（残り）
[補助的な役割のキャラクター]

## 🔗 関係性マップ
[キャラクター間の重要な関係]

## 🎯 各人の動機・秘密
[簡潔な一覧表形式]

実用的で魅力的なキャラクター設定にしてください。
`;

    const result = await this.generateWithAI(
      systemPrompt, 
      userPrompt, 
      process.env.GROQ_API_KEY || sessionData.apiKey,
      { 
        maxTokens: 2800,
        timeout: 7000,
        temperature: 0.7
      }
    );

    return this.formatCharacterResult(result.content, 'medium');
  }

  /**
   * 大グループ（7人以上）- 効率重視
   */
  async generateLargeGroup(sessionData) {
    const { formData } = sessionData;
    
    const systemPrompt = `あなたは大規模グループ管理の専門家です。
多人数でも管理しやすいキャラクター構成を作成してください。
制限時間: 8秒以内で完了してください。`;
    
    const userPrompt = `
【大グループキャラクター生成】

参加人数: ${formData.participants}人
複雑さ: ${formData.complexity}

効率的な構成で生成：

## 🎯 核心グループ（4人）
[事件の中心となる重要キャラクター]

## 👥 周辺グループ（残り）
[目撃者・関係者・容疑者]

## 📊 役割分担表
| 番号 | 役職 | 基本情報 | 主要動機 | 重要秘密 |
|------|------|----------|----------|----------|
[表形式で全員分]

## 🎪 グループダイナミクス
[全体の人間関係の構造]

管理しやすさを重視した設定にしてください。
`;

    const result = await this.generateWithAI(
      systemPrompt, 
      userPrompt, 
      process.env.GROQ_API_KEY || sessionData.apiKey,
      { 
        maxTokens: 3000,
        timeout: 7000,
        temperature: 0.6
      }
    );

    return this.formatCharacterResult(result.content, 'large');
  }

  /**
   * キャラクター結果の整形
   */
  formatCharacterResult(content, groupType) {
    return {
      characters: content,
      character_count: this.extractCharacterCount(content),
      group_type: groupType,
      stage4_completed: true,
      stage4_timestamp: new Date().toISOString(),
      generation_method: `${groupType}_group_optimized`
    };
  }

  /**
   * キャラクター数の抽出
   */
  extractCharacterCount(content) {
    const matches = content.match(/キャラクター\d+|👤|##\s*\d+/g);
    return matches ? matches.length : 0;
  }
}

const stage4Generator = new Stage4Generator();

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'POST method required' 
    });
  }

  return await stage4Generator.execute(req, res);
}

module.exports = withSecurity(handler, 'stage-generation');