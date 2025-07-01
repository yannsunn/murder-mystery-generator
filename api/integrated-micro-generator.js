/**
 * 🏆 Professional Murder Mystery Generator - 狂気山脈品質準拠
 * プロフェッショナルTRPG品質マーダーミステリー生成システム完全版
 * 参考：「狂気山脈　陰謀の分水嶺」商業品質基準準拠
 */

import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';
import { createSecurityMiddleware } from './middleware/rate-limiter.js';
import { createPerformanceMiddleware } from './middleware/performance-monitor.js';
import { createValidationMiddleware } from './middleware/input-validator.js';
import { qualityAssessor } from './utils/quality-assessor.js';
import { parallelEngine, intelligentCache } from './utils/performance-optimizer.js';

export const config = {
  maxDuration: 300, // 5分 - 30分-1時間高精度生成のため十分な時間
};

// 30分-1時間高精度統合生成フロー
const INTEGRATED_GENERATION_FLOW = [
  {
    name: '作品タイトル・コンセプト・導入',
    weight: 8,
    handler: async (formData, context) => {
      const systemPrompt = `あなたは「狂気山脈　陰謀の分水嶺」レベルのプロフェッショナルマーダーミステリー制作専門家です。
商業品質のTRPGシナリオを生成し、参加者が完全に没入できる世界観を構築してください。
ハンドアウト、GM資料、キャラクターシートまで含む完全なパッケージを制作する最初のステップとして、
印象的で魅力的な作品基礎を構築してください。`;
      
      const userPrompt = `
【プロフェッショナル品質マーダーミステリー制作依頼】

参加人数: ${formData.participants}人
プレイ時間: ${getPlayTime(formData.complexity)}
時代背景: ${formData.era}
舞台設定: ${formData.setting}
世界観: ${formData.worldview || 'リアル'}
トーン: ${formData.tone}
事件種類: ${formData.incident_type}
複雑さ: ${formData.complexity}

【商業品質基準】
- 狂気山脈レベルの没入感と世界観構築
- プロフェッショナルTRPG制作基準完全準拠
- 参加者が役になりきれる深いキャラクター設定基礎
- 緻密な謎と論理的解決の基盤
- 美麗な雰囲気とドラマ性の演出

以下の形式でプロ品質の作品基礎を生成してください：

## 作品タイトル
[印象的で覚えやすい、商業作品レベルの完全にユニークなタイトル - 既存作品と重複しない独創的な名前]

## 作品コンセプト
[500文字程度：世界観、テーマ、独自性を明確に示すプロ品質コンセプト]

## 舞台設定詳細
### 基本設定
[時代、場所、状況の詳細設定]

### 雰囲気・トーン設計
[視覚的イメージ、音響効果、感情的な雰囲気の詳細設計]

### 独自要素・差別化ポイント
[他のシナリオとの明確な差別化要素]

## プレイヤー役職概要
[${formData.participants}人のキャラクター役職とその基本的関係性]

## 事件の核心
[今回発生する事件の概要と魅力的な謎の要素]
[400文字程度の必要十分な世界観 - 短時間で完全に理解できる設定]

## 導入シナリオ（全体配布用・完結版）
[600文字程度の完璧な導入 - 5分で読めて即座に没入できる内容]

## 30分-1時間完結構成
【導入フェーズ（5分）】世界観説明・キャラクター紹介・事件発生
【調査フェーズ（15-35分）】証拠収集・証言聴取・推理構築
【解決フェーズ（10-20分）】最終推理・真相公開・完結

## 複雑さレベル対応（短時間特化）
### シンプル版（30分完結）
[シンプルで確実に30分で完結する構造]

### 標準版（45分完結）
[バランス良く45分で完結する構造]

### 複雑版（60分完結）
[複雑だが確実に1時間で完結する構造]

## ${formData.tone}トーン専用演出（短時間特化）
[30分-1時間で最大効果を発揮する演出方法]

【絶対要求】
- 全ての文章は完結し、中途半端な表現は一切使用しないこと
- 作品タイトルは既存のマーダーミステリー作品と重複しない完全オリジナル
- 毎回異なるユニークなタイトルを生成（過去の生成タイトルと重複禁止）
- タイムスタンプ${Date.now()}を考慮した完全にユニークな創作
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { concept: result.content };
    }
  },

  {
    name: 'キャラクター完全設計・個別ハンドアウト',
    weight: 30,
    handler: async (formData, context) => {
      try {
        const concept = context.concept || '';
        const participantCount = parseInt(formData.participants) || 5;
        
        const systemPrompt = `あなたは商業品質のマーダーミステリーキャラクター設計専門家です。
各プレイヤー用の詳細なハンドアウトを作成してください。`;
        
        const userPrompt = `
【キャラクター設計依頼】

参加人数: ${participantCount}人
プレイ時間: ${getPlayTime(formData.complexity)}
作品概要: ${concept}

以下の形式で各プレイヤーのハンドアウトを作成してください：

${Array.from({length: participantCount}, (_, i) => `
## プレイヤー${i + 1}のハンドアウト

### あなたのキャラクター
氏名: [フルネーム]
年齢: [年齢]
職業: [職業・立場]
性格: [主要な性格特徴]

### バックストーリー
[このキャラクターの過去と現在の状況を300文字で説明]

### 秘密情報
- 公開情報: [他プレイヤーと共有可能な情報]
- 秘密: [あなただけが知っている重要な秘密]
- 目標: [このキャラクターの目的]

### 他キャラクターとの関係
[他のプレイヤーキャラクターとの関係性を簡潔に説明]
`).join('')}

【重要】全ての内容を完結させ、中途半端な文章は避けてください。
`;

        const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
        return { characters: result.content };
        
      } catch (error) {
        console.error('❌ Character generation error:', error);
        
        // フォールバック: シンプルなキャラクター生成
        const participantCount = parseInt(formData.participants) || 5;
        const fallbackCharacters = generateFallbackCharacters(participantCount);
        
        return { characters: fallbackCharacters };
      }
    }
  },

  {
    name: '事件・謎・真相構築（30分-1時間特化）',
    weight: 25,
    handler: async (formData, context) => {
      const characters = context.characters || '';
      const systemPrompt = `30分-1時間短時間マーダーミステリー専門の謎構築者として、短時間で確実に解決できる完璧な論理構造を構築してください。文章の切れや不完全さは絶対に許されません。`;
      
      const userPrompt = `
キャラクター: ${characters}
複雑さレベル: ${formData.complexity}
トーン: ${formData.tone}
特殊要素:
- レッドヘリング: ${formData.red_herring ? 'あり' : 'なし'}
- どんでん返し: ${formData.twist_ending ? 'あり' : 'なし'}
- 秘密の役割: ${formData.secret_roles ? 'あり' : 'なし'}

【超重要】30分-1時間で確実に解決できる完璧な事件構造を構築してください。

【絶対条件】
- 30分-1時間で完全解決可能
- 文章は必ず完結し、切れや不完全な部分は一切なし
- 論理的で検証可能な謎構造
- 無駄な要素は一切排除

## 事件発生・発見シーン（完結版）
- **事件発生の瞬間**: [300文字程度の簡潔で完璧な状況説明]
- **発見シーン**: [200文字程度の明確な発見状況]
- **初期状況**: [参加者全員の初期反応を短時間で把握]

## 短時間解決構造（30分-1時間特化）
### 【導入段階（5分）】事件発生・基本状況把握
- 明確で理解しやすい初期情報
- 即座に調査に入れる状況設定

### 【調査段階（15-35分）】証拠収集・推理構築
- 効率的に発見できる決定的証拠
- 短時間で論理構築可能な手がかり配置

### 【解決段階（10-20分）】真相究明・完結
- 確実に解決に導く最終証拠
- 満足感のある完璧な解決

## 完璧な真相・犯行構造（短時間特化）
- **真の犯人**: [短時間で理解できる明確な犯人像と動機]
- **犯行手順**: [簡潔で論理的な犯行過程]
- **使用トリック**: [短時間で検証可能なシンプルで巧妙なトリック]
- **決定的証拠**: [30分-1時間で確実に発見される証拠]

## 短時間対応証拠システム
### 【段階別証拠配置】
- 導入段階: [基本的な物的証拠・現場状況]
- 調査段階前半: [キャラクター証言・初期手がかり]
- 調査段階後半: [隠された証拠・重要な矛盾]
- 解決段階: [決定的証拠・完全な真相]

### 【キャラクター別重要情報】
[各キャラクターが持つ短時間で活用できる重要情報]

## 複雑さ別調整（短時間特化）
### シンプル版（30分）: [最小限の要素で確実に解決]
### 標準版（45分）: [適度な複雑さで満足感ある解決]
### 複雑版（60分）: [複雑だが1時間で確実に完結]

## ${formData.tone}トーン専用要素（短時間特化）
[30分-1時間で最大効果を発揮する演出方法]

【絶対要求】全ての文章は完結し、中途半端や不完全な表現は一切使用しないこと。
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { incident_and_truth: result.content };
    }
  },

  {
    name: 'タイムライン・進行管理（30分-1時間特化）',
    weight: 17,
    handler: async (formData, context) => {
      const incident = context.incident_and_truth || '';
      const characters = context.characters || '';
      
      const systemPrompt = `30分-1時間短時間マーダーミステリーセッション専門の進行管理者として、短時間で完璧に完結する進行タイムラインを構築してください。文章の切れや不完全さは絶対に許されません。`;
      
      const userPrompt = `
事件情報: ${incident}
キャラクター: ${characters}
複雑さ: ${formData.complexity}

【超重要】30分-1時間で完全に完結するセッション進行タイムラインを構築してください。

【絶対条件】
- 30分-1時間で確実に完結
- 文章は必ず完結し、切れや不完全な部分は一切なし
- 効率的で満足感のある進行
- 無駄な時間は一切排除

## 事件発生前タイムライン（簡潔版）
- **重要前史**: [事件に直結する必要最小限の背景]
- **関係性**: [短時間で理解できる人物関係]
- **犯行準備**: [簡潔で論理的な犯行準備過程]

## 事件発生タイムライン（完結版）
- **発生時刻**: [明確な事件発生タイミング]
- **発見経緯**: [第一発見までの簡潔な経緯]
- **初期状況**: [参加者が即座に理解できる状況]

## 30分-1時間完全進行表

### 【複雑さ別時間構成】

#### シンプル版（30分完結）
- **導入（5分）**: ルール説明・事件発生・状況把握
- **調査（20分）**: 証拠収集・証言聴取・推理構築
- **解決（5分）**: 最終推理・真相公開・完結

#### 標準版（45分完結）
- **導入（7分）**: ルール説明・世界観・事件発生
- **調査（30分）**: 詳細証拠収集・キャラクター尋問・推理
- **解決（8分）**: 推理発表・真相公開・エピローグ

#### 複雑版（60分完結）
- **導入（10分）**: 詳細ルール・世界観・キャラクター・事件
- **調査（40分）**: 複雑な証拠収集・深い推理・議論
- **解決（10分）**: 詳細推理・完全真相・満足エピローグ

## 効率的情報公開システム
### 【段階別公開タイミング】
- **導入段階**: 基本状況・初期証拠・キャラクター関係
- **調査前半**: 重要証拠・証言・手がかり
- **調査後半**: 決定的証拠・隠された情報・矛盾
- **解決段階**: 最終証拠・完全な真相・動機

### 【効率的進行のポイント】
- 情報は段階的だが迅速に公開
- 参加者が迷わない明確な手がかり配置
- 確実に解決に向かう構造

## 進行管理の重要ポイント
### 【時間管理】
- 各段階の厳密な時間配分
- 遅れた場合の調整方法
- 早く進んだ場合の追加要素

### 【参加者フォロー】
- 理解度確認のタイミング
- 行き詰まった時のヒント提供
- 全員参加を促進する方法

## ${formData.tone}トーン専用進行（短時間特化）
[30分-1時間で最大効果を発揮する進行テクニック]

【絶対要求】全ての文章は完結し、中途半端や不完全な表現は一切使用しないこと。
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { timeline: result.content };
    }
  },

  {
    name: 'ゲームマスター完全ガイド（30分-1時間特化）',
    weight: 20,
    handler: async (formData, context) => {
      const allData = {
        concept: context.concept || '',
        characters: context.characters || '',
        incident: context.incident_and_truth || '',
        timeline: context.timeline || ''
      };
      
      const systemPrompt = `30分-1時間短時間マーダーミステリーセッション専門のゲームマスター指導者として、短時間で完璧に進行する実用的ガイドを作成してください。文章の切れや不完全さは絶対に許されません。`;
      
      const userPrompt = `
完全なシナリオ情報: ${JSON.stringify(allData, null, 2)}
参加人数: ${formData.participants}人
複雑さ: ${formData.complexity}
トーン: ${formData.tone}

【超重要】30分-1時間のマーダーミステリーセッションを完璧に進行するための実用ガイドを作成してください。

【絶対条件】
- 30分-1時間で確実に完結する進行
- 文章は必ず完結し、切れや不完全な部分は一切なし
- 実用的で即座に使える内容
- 無駄な要素は一切排除

## 事前準備チェックリスト（短時間特化）

### 【必須準備物（最小限）】
- プレイヤー別個別ハンドアウト（${formData.participants}部）
- 導入シナリオ（${formData.participants}部）
- 証拠カード・小道具（必要最小限）
- タイマー（厳密な時間管理用）

### 【簡単会場設定】
- 円形またはU字型座席配置（${formData.participants}人用）
- ${formData.tone}トーン対応の簡単な雰囲気作り
- 証拠展示エリア（テーブル中央）

## 30分-1時間完全進行マニュアル

### 【複雑さ別進行ガイド】

#### シンプル版（30分）GMガイド
**開始前（2分）**
- 簡潔なルール説明・ハンドアウト配布

**導入（5分）**
- 事件発生・状況説明・調査開始

**調査（20分）**
- 証拠提示・証言収集・推理構築
- 行き詰まり時の3段階ヒントシステム

**解決（3分）**
- 最終推理・真相公開・完結

#### 標準版（45分）GMガイド
**開始前（3分）**
- ルール説明・世界観説明・ハンドアウト配布

**導入（7分）**
- 詳細な状況設定・事件発生・初期調査

**調査（30分）**
- 段階的証拠公開・詳細証言・推理議論
- 参加者フォロー・適切なヒント提供

**解決（5分）**
- 推理発表・真相公開・満足のエピローグ

#### 複雑版（60分）GMガイド
**開始前（5分）**
- 詳細ルール・世界観・キャラクター説明

**導入（10分）**
- 没入型状況設定・複雑な事件発生

**調査（40分）**
- 複雑な証拠システム・深い推理・活発な議論
- 高度な進行テクニック・個別相談対応

**解決（5分）**
- 詳細推理発表・完全真相・満足エピローグ

## 効率的情報公開システム

### 【段階的公開タイミング】
1. **導入段階**: 基本状況・初期証拠の即座公開
2. **調査前半**: 重要証拠・証言の効率的提示
3. **調査後半**: 決定的手がかり・矛盾の明確提示
4. **解決段階**: 最終証拠・完全真相の劇的公開

### 【短時間進行のコツ】
- 情報は簡潔で完全
- 参加者の理解度を常にチェック
- 迷いを生まない明確な手がかり配置

## 実用的トラブルシューティング

### 【時間管理】
- 各段階の厳密な時間チェック
- 遅れた場合の効率化テクニック
- 早く進んだ場合の追加要素

### 【参加者フォロー（短時間特化）】
- 素早い理解度確認
- 即効性のあるヒント提供
- 全員参加の効率的促進

### 【緊急対応】
- 推理停滞時の3段階ヒント
- 議論過熱時のクールダウン
- 時間不足時の簡潔解決法

## ${formData.tone}トーン専用演出（短時間特化）
[30分-1時間で最大効果を発揮する演出テクニック・雰囲気作り]

## 完全配布資料システム

### 【プレイヤー用資料】
- 個別ハンドアウト（短時間理解用フォーマット）
- 導入シナリオ（簡潔版）
- 証拠整理メモ

### 【GM専用資料】
- タイムスケジュール表
- 答え・ヒント一覧
- 緊急対応マニュアル

## 成功保証システム
- 30分-1時間で必ず完結する構造
- 参加者全員が満足する解決体験
- 効率的で印象的なセッション運営

【絶対要求】全ての文章は完結し、中途半端や不完全な表現は一切使用しないこと。
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { gamemaster_guide: result.content };
    }
  }
];

// 画像プロンプト生成関数（トグル対応）
function createImagePrompts(sessionData) {
  // アートワーク生成がトグルで有効化されているかチェック
  if (!sessionData.formData?.generate_artwork) {
    console.log('🎨 アートワーク生成は無効化されています（ユーザー設定）');
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
  
  console.log(`🎨 アートワーク生成が有効化されました - ${prompts.length}個のプロンプト生成`);
  return prompts;
}

// OpenAI画像生成関数（トグル対応）
async function generateImages(imagePrompts) {
  const images = [];
  
  // プロンプトが空の場合はスキップ
  if (!imagePrompts || imagePrompts.length === 0) {
    console.log('🎨 アートワーク生成はスキップされました');
    return images;
  }
  
  // APIキーが設定されていない場合はスキップ
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️ OPENAI_API_KEY not set, skipping image generation');
    return images;
  }
  
  for (const promptData of imagePrompts) {
    try {
      console.log(`🎨 Generating image: ${promptData.type}`);
      
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: promptData.prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        images.push({
          ...promptData,
          url: data.data[0].url,
          revised_prompt: data.data[0].revised_prompt,
          status: 'success'
        });
        console.log(`✅ Image generated: ${promptData.type}`);
      } else {
        const error = await response.text();
        console.error(`❌ Image generation failed: ${error}`);
        images.push({
          ...promptData,
          error: 'Generation failed',
          status: 'failed'
        });
      }
    } catch (error) {
      console.error(`❌ Image generation error: ${error.message}`);
      images.push({
        ...promptData,
        error: error.message,
        status: 'error'
      });
    }
  }
  
  return images;
}

// メインハンドラー
export default async function handler(req, res) {
  console.log('🔬 Integrated Micro Generator called');
  
  setSecurityHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  // セキュリティ・パフォーマンス・バリデーション統合チェック
  const middlewares = [
    createPerformanceMiddleware(),
    createSecurityMiddleware('generation')
    // createValidationMiddleware('generation') // 一時無効化
  ];

  for (const middleware of middlewares) {
    try {
      await new Promise((resolve, reject) => {
        middleware(req, res, (error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    } catch (middlewareError) {
      console.error('Middleware error:', middlewareError);
      return res.status(500).json({ 
        success: false, 
        error: 'Middleware error: ' + middlewareError.message 
      });
    }
  }

  try {
    const { formData, sessionId } = req.body;
    
    console.log('🔬 Starting integrated micro generation...');
    console.log('📋 Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('📋 Received formData:', JSON.stringify(formData, null, 2));
    console.log('🆔 Session ID:', sessionId);
    
    if (!formData) {
      return res.status(400).json({
        success: false,
        error: 'formData is required',
        received: req.body
      });
    }
    
    const sessionData = {
      sessionId: sessionId || `integrated_micro_${Date.now()}`,
      formData,
      startTime: new Date().toISOString(),
      phases: {},
      status: 'running',
      generationType: 'integrated_micro'
    };

    let context = {};
    let currentWeight = 0;
    const totalWeight = INTEGRATED_GENERATION_FLOW.reduce((sum, step) => sum + step.weight, 0);

    // 🚀 パフォーマンス最適化: 並列生成可能なタスクを特定
    const optimizedFlow = await optimizeGenerationFlow(INTEGRATED_GENERATION_FLOW, formData);
    
    // 各ステップを実行（並列化対応）
    if (optimizedFlow.canParallelize) {
      console.log('🚀 Using parallel generation for independent tasks');
      const parallelResults = await parallelEngine.generateConcurrently(optimizedFlow.tasks, context);
      
      // 結果をセッションデータに統合
      for (const [stepName, result] of Object.entries(parallelResults)) {
        if (!result.error) {
          Object.assign(context, result);
          
          const stepIndex = INTEGRATED_GENERATION_FLOW.findIndex(s => s.name === stepName);
          sessionData.phases[`step${stepIndex + 1}`] = {
            name: stepName,
            content: result,
            status: 'completed',
            completedAt: new Date().toISOString(),
            generationMethod: 'parallel'
          };
        }
      }
    } else {
      // 従来の順次実行
      for (let i = 0; i < INTEGRATED_GENERATION_FLOW.length; i++) {
        const step = INTEGRATED_GENERATION_FLOW[i];
        
        console.log(`🔄 Executing: ${step.name}`);
        
        try {
          // 🧠 インテリジェントキャッシュチェック
          const cacheKey = createCacheKey(step.name, formData);
          const cachedResult = await intelligentCache.get(cacheKey, step.name);
          
          let result;
          if (cachedResult) {
            console.log(`💾 Using cached result for: ${step.name}`);
            result = cachedResult;
          } else {
            // 新規生成
            result = await step.handler(formData, context);
            
            // 🧠 品質評価実行
            if (step.name.includes('キャラクター') || step.name.includes('事件') || step.name.includes('タイトル')) {
              console.log(`🔍 Running quality assessment for: ${step.name}`);
              const qualityResult = await qualityAssessor.evaluateScenario(
                JSON.stringify(result), 
                formData
              );
              
              // 品質が基準以下の場合は再生成
              if (!qualityResult.passesQuality && qualityResult.score < 0.8) {
                console.log(`⚠️ Quality below threshold (${(qualityResult.score * 100).toFixed(1)}%), regenerating...`);
                
                // フィードバックを含めて再生成
                const enhancedContext = {
                  ...context,
                  qualityFeedback: qualityResult.recommendations.join('\n'),
                  previousAttempt: result
                };
                
                result = await step.handler(formData, enhancedContext);
                
                // 再評価
                const requalityResult = await qualityAssessor.evaluateScenario(
                  JSON.stringify(result), 
                  formData
                );
                
                console.log(`🔍 Re-evaluation score: ${(requalityResult.score * 100).toFixed(1)}%`);
              } else {
                console.log(`✅ Quality assessment passed: ${(qualityResult.score * 100).toFixed(1)}%`);
              }
            }
            
            // キャッシュに保存
            await intelligentCache.set(cacheKey, result, step.name, {
              stepName: step.name,
              formDataHash: createFormDataHash(formData),
              timestamp: Date.now()
            });
          }
          
          // コンテキストに結果を追加
          Object.assign(context, result);
          
          // フェーズデータとして保存
          sessionData.phases[`step${i + 1}`] = {
            name: step.name,
            content: result,
            status: 'completed',
            completedAt: new Date().toISOString(),
            generationMethod: cachedResult ? 'cached' : 'generated',
            qualityAssessed: step.name.includes('キャラクター') || step.name.includes('事件') || step.name.includes('タイトル')
          };
          
          currentWeight += step.weight;
          const progress = Math.round((currentWeight / totalWeight) * 100);
          
          console.log(`✅ ${step.name} completed (${progress}%)`);
          
        } catch (stepError) {
          console.error(`❌ Step failed: ${step.name}`, stepError);
          console.error(`❌ Error details:`, {
            message: stepError.message,
            stack: stepError.stack,
            name: stepError.name,
            type: stepError.type || 'Unknown'
          });
          
          sessionData.phases[`step${i + 1}`] = {
            name: step.name,
            status: 'error',
            error: stepError.message,
            errorDetails: {
              type: stepError.name || stepError.type || 'Unknown',
              stack: process.env.NODE_ENV === 'development' ? stepError.stack : undefined
            },
            failedAt: new Date().toISOString()
          };
          
          // 致命的エラーではない場合は続行
          if (step.weight < 30) {
            console.log(`⚠️ Non-critical step failed, continuing...`);
            continue;
          } else {
            throw new AppError(`Critical step failed: ${step.name} - ${stepError.message}`, ErrorTypes.GENERATION_ERROR);
          }
        }
      }
    }

    // 画像生成フェーズ
    console.log('🎨 Starting image generation phase...');
    const imagePrompts = createImagePrompts(sessionData);
    const generatedImages = await generateImages(imagePrompts);
    
    // 画像データをセッションに追加
    sessionData.images = generatedImages;
    sessionData.hasImages = generatedImages.length > 0;
    
    // 完了処理
    sessionData.status = 'completed';
    sessionData.completedAt = new Date().toISOString();
    sessionData.context = context;

    console.log('🎉 Integrated micro generation completed successfully!');
    console.log(`📸 Generated ${generatedImages.filter(img => img.status === 'success').length} images`);

    return res.status(200).json({
      success: true,
      sessionData,
      message: '🎉 統合マイクロ生成が完了しました！',
      downloadReady: true,
      generationType: 'integrated_micro',
      imageCount: generatedImages.filter(img => img.status === 'success').length
    });

  } catch (error) {
    console.error('🚨 Integrated micro generation error:', error);
    console.error('🚨 Error stack:', error.stack);
    return res.status(500).json({
      success: false,
      error: error.message || 'Generation failed',
      errorType: error.name || error.type || 'UnknownError',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
}

// ========== ユーティリティ関数 ==========

/**
 * 🚀 生成フロー最適化
 */
async function optimizeGenerationFlow(flow, formData) {
  // 現在は順次実行を維持（将来の拡張ポイント）
  return {
    canParallelize: false,
    tasks: flow,
    reason: 'Sequential execution for content dependency'
  };
}

/**
 * 🔑 キャッシュキー生成
 */
function createCacheKey(stepName, formData) {
  const relevantFields = {
    participants: formData.participants,
    era: formData.era,
    setting: formData.setting,
    complexity: formData.complexity,
    tone: formData.tone,
    incident_type: formData.incident_type
  };
  
  const dataHash = createFormDataHash(relevantFields);
  return `${stepName}_${dataHash}`;
}

/**
 * 🔐 フォームデータハッシュ生成
 */
function createFormDataHash(formData) {
  try {
    // 簡単で確実なハッシュ生成
    const dataString = JSON.stringify(formData, Object.keys(formData).sort());
    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit int
    }
    return Math.abs(hash).toString(16).substring(0, 8);
  } catch (error) {
    console.error('Hash generation error:', error);
    return Date.now().toString(16).substring(0, 8);
  }
}

function getPlayTime(complexity) {
  const timeMap = {
    'simple': '30分',
    'standard': '45分', 
    'complex': '60分'
  };
  return timeMap[complexity] || '45分';
}

/**
 * 🛡️ フォールバックキャラクター生成
 */
function generateFallbackCharacters(count) {
  const characters = [];
  const names = ['田中太郎', '佐藤花子', '山田次郎', '鈴木美咲', '高橋健一', '渡辺理恵'];
  const jobs = ['会社員', '大学生', '医師', '教師', '弁護士', '記者'];
  
  for (let i = 0; i < count; i++) {
    characters.push(`
## プレイヤー${i + 1}のハンドアウト

### あなたのキャラクター
氏名: ${names[i] || `プレイヤー${i + 1}`}
年齢: ${20 + Math.floor(Math.random() * 40)}歳
職業: ${jobs[i] || '会社員'}
性格: 真面目で責任感が強い

### バックストーリー
地元出身で、現在は都市部で働いている。家族思いで、正義感が強い性格。

### 秘密情報
- 公開情報: 信頼できる人物として知られている
- 秘密: 過去に重要な出来事を目撃している
- 目標: 真実を明らかにしたい

### 他キャラクターとの関係
他のプレイヤーとは知人または友人関係。
    `);
  }
  
  return characters.join('\n');
}