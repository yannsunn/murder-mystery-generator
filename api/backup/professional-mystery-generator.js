/**
 * 🏆 Professional Murder Mystery Generator - 狂気山脈品質基準準拠
 * プロフェッショナルTRPG品質マーダーミステリー生成システム
 * 参考資料「狂気山脈　陰謀の分水嶺」分析結果に基づく完全品質対応
 */

import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 600, // 10分 - プロ品質生成のため十分な時間
};

// プロフェッショナル品質生成フロー
const PROFESSIONAL_GENERATION_FLOW = [
  {
    name: 'プロ品質コンセプト・世界観構築',
    weight: 15,
    handler: generateProfessionalConcept
  },
  {
    name: 'キャラクター完全設計（ハンドアウト含む）', 
    weight: 25,
    handler: generateCharacterPackage
  },
  {
    name: '事件・謎・真相完全構築',
    weight: 25,
    handler: generateIncidentSystem
  },
  {
    name: 'フェーズ別進行管理システム',
    weight: 20,
    handler: generatePhaseSystem
  },
  {
    name: 'GMガイド・プレイヤー資料完全版',
    weight: 15,
    handler: generateCompleteMaterials
  }
];

// ========== プロ品質コンセプト・世界観構築 ==========
async function generateProfessionalConcept(formData, context) {
  const systemPrompt = `あなたは「狂気山脈　陰謀の分水嶺」レベルのプロフェッショナルマーダーミステリー制作専門家です。
商業品質のTRPGシナリオを生成し、参加者が完全に没入できる世界観を構築してください。`;

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
- 狂気山脈レベルの没入感と世界観
- プロフェッショナルTRPG制作基準準拠
- 参加者が役になりきれる深いキャラクター設定
- 緻密な謎と論理的解決
- 美麗な雰囲気とドラマ性

以下の形式でプロ品質の基礎を生成してください：

## 作品タイトル
[印象的で覚えやすい、商業作品レベルのタイトル]

## 作品コンセプト
[500文字程度：世界観、テーマ、独自性を明確に示すプロ品質コンセプト]

## 舞台設定詳細
### 基本設定
[時代、場所、状況の詳細設定]

### 雰囲気・トーン
[視覚的イメージ、音響効果、感情的な雰囲気]

### 独自要素
[他のシナリオとの差別化ポイント]

## プレイヤー役職概要
[${formData.participants}人のキャラクター役職とその関係性の概要]

【絶対要求】完璧で完結した文章。商業品質。プロフェッショナル基準。`;

  const response = await aiClient.generateContent(systemPrompt, userPrompt);
  
  return {
    name: 'プロ品質コンセプト・世界観構築',
    content: {
      concept: response
    },
    status: 'completed'
  };
}

// ========== キャラクター完全設計 ==========
async function generateCharacterPackage(formData, context) {
  const conceptData = context.results[0]?.content?.concept || '';
  
  const systemPrompt = `あなたは狂気山脈レベルのキャラクター設計専門家です。
各キャラクターに個別のハンドアウト、バックストーリー、秘密、動機を与え、
参加者が完全に役になりきれるプロ品質のキャラクター資料を作成してください。`;

  const userPrompt = `
【キャラクター完全設計（${formData.participants}人分）】

作品コンセプト:
${conceptData}

【設計要件】
- 各キャラクター専用のハンドアウト
- 詳細なバックストーリー  
- 個人的動機と秘密
- 他キャラクターとの関係性
- 調査能力・特殊技能
- 事件との関わり方

以下の形式で${formData.participants}人分を完全設計：

## キャラクター1: [役職名]
### 基本情報
- 氏名: [フルネーム]
- 年齢・性別: 
- 職業・立場:
- 外見・性格:

### ハンドアウト（プレイヤー配布用）
[このキャラクターとして知っている情報、目的、関係性]

### バックストーリー（詳細）
[過去の出来事、人間関係、重要な経験]

### 秘密・隠された要素
[他のプレイヤーには秘密の情報、動機、過去]

### 調査技能・特殊能力
[このキャラクターが得意な調査方法、知識分野]

### 事件との関係
[今回の事件にどう関わっているか]

[キャラクター2以降も同様の形式で${formData.participants}人分]

【絶対要求】各キャラクターが独自性を持ち、相互に関連し合う完璧な設計。商業品質。`;

  const response = await aiClient.generateContent(systemPrompt, userPrompt);
  
  return {
    name: 'キャラクター完全設計',
    content: {
      characters: response
    },
    status: 'completed'
  };
}

// ========== 事件・謎・真相完全構築 ==========
async function generateIncidentSystem(formData, context) {
  const conceptData = context.results[0]?.content?.concept || '';
  const charactersData = context.results[1]?.content?.characters || '';
  
  const systemPrompt = `あなたは狂気山脈レベルの事件構築専門家です。
論理的で解決可能、しかし適度に困難な謎を構築し、
各キャラクターが重要な役割を果たす完璧な事件を設計してください。`;

  const userPrompt = `
【事件・謎・真相完全構築】

作品コンセプト:
${conceptData}

キャラクター設定:
${charactersData}

【構築要件】
- 論理的で解決可能な謎
- 各キャラクターが重要な手がかりを持つ
- 段階的な情報開示
- 複数の仮説と最終的真相
- フェア・プレイ原則遵守

以下の形式で完全構築：

## 事件概要
### 表面的事件
[参加者が最初に知る事件の内容]

### 真相
[実際に何が起こったのかの完全な真実]

## 謎の構造
### 中心的謎
[解決すべきメインの謎]

### 副次的謎
[メインを支える小さな謎や疑問]

## 手がかり・証拠システム
### 物的証拠
[現場にある物的な手がかり]

### 証言・情報
[各キャラクターが持つ情報や証言]

### 推理ポイント
[論理的推理で導ける結論]

## 偽の手がかり・ミスリード
[意図的な誤誘導要素（適度に）]

## 解決への道筋
### 段階1: [初期調査で判明すること]
### 段階2: [中盤の重要発見]
### 段階3: [終盤の真相判明]

## 動機・犯行方法詳細
[誰が、なぜ、どのように]

【絶対要求】論理的整合性完璧。フェア・プレイ。商業品質の謎構築。`;

  const response = await aiClient.generateContent(systemPrompt, userPrompt);
  
  return {
    name: '事件・謎・真相完全構築',
    content: {
      incident_and_truth: response
    },
    status: 'completed'
  };
}

// ========== フェーズ別進行管理システム ==========
async function generatePhaseSystem(formData, context) {
  const conceptData = context.results[0]?.content?.concept || '';
  const charactersData = context.results[1]?.content?.characters || '';
  const incidentData = context.results[2]?.content?.incident_and_truth || '';
  
  const playTime = getPlayTime(formData.complexity);
  
  const systemPrompt = `あなたは狂気山脈レベルのゲーム進行専門家です。
${playTime}で完璧に完結するフェーズ別進行システムを構築し、
各段階で適切な情報開示と緊張感を演出してください。`;

  const userPrompt = `
【フェーズ別進行管理システム（${playTime}完結）】

作品コンセプト:
${conceptData}

キャラクター設定:
${charactersData}

事件・真相:
${incidentData}

【進行設計要件】
- ${playTime}で完璧完結
- 明確なフェーズ分割
- 各フェーズの目標と制約
- 情報開示タイミング
- 緊張感とドラマの演出

以下の形式で完全設計：

## 全体進行スケジュール（${playTime}）
### 導入フェーズ（${Math.floor(parseInt(playTime) * 0.15)}分）
[状況説明、役割確認、初期情報共有]

### 調査フェーズ（${Math.floor(parseInt(playTime) * 0.6)}分）
[手がかり収集、推理、議論]

### 推理フェーズ（${Math.floor(parseInt(playTime) * 0.15)}分）
[仮説構築、最終推理]

### 解決フェーズ（${Math.floor(parseInt(playTime) * 0.1)}分）
[真相発表、エンディング]

## 詳細進行ガイド
### 導入フェーズ
- 実行内容: [具体的な導入手順]
- GM説明事項: [GMが説明すべき内容]
- プレイヤー行動: [プレイヤーがすべきこと]
- 配布資料: [この段階で配る資料]

### 調査フェーズ
- フェーズ目標: [このフェーズの達成目標]
- 利用可能行動: [プレイヤーができる調査行動]
- 情報開示ルール: [どの情報をいつ開示するか]
- 進行チェックポイント: [GMが確認すべき進行状況]

### 推理フェーズ
- 推理発表ルール: [推理の発表方法]
- 質疑応答システム: [追加質問や確認の方法]
- 採点・評価基準: [推理の正確性評価]

### 解決フェーズ
- 真相発表手順: [真相の効果的な発表方法]
- エンディング演出: [感動的な結末の演出]
- 振り返り: [ゲーム後の振り返り]

## 時間管理システム
[各フェーズの時間調整方法と緊急時対応]

【絶対要求】時間内完璧完結。ドラマチック進行。プロ品質管理。`;

  const response = await aiClient.generateContent(systemPrompt, userPrompt);
  
  return {
    name: 'フェーズ別進行管理システム',
    content: {
      timeline: response
    },
    status: 'completed'
  };
}

// ========== GMガイド・プレイヤー資料完全版 ==========
async function generateCompleteMaterials(formData, context) {
  const allPreviousData = context.results.map(r => r.content).reduce((acc, curr) => ({...acc, ...curr}), {});
  
  const systemPrompt = `あなたは狂気山脈レベルのゲーム資料制作専門家です。
GMが完璧に進行でき、プレイヤーが十分に楽しめる完全版資料を作成してください。`;

  const userPrompt = `
【GMガイド・プレイヤー資料完全版作成】

生成済み全データ:
${JSON.stringify(allPreviousData, null, 2)}

【作成要件】
- GM用完全マニュアル
- プレイヤー配布資料完全版
- トラブル対応ガイド
- 拡張・アレンジ案

以下の形式で完全作成：

## GMガイド完全版
### 事前準備チェックリスト
[ゲーム開始前にGMが準備すべき全項目]

### 進行台本
[フェーズごとの具体的な進行セリフと行動]

### 判定・裁定ガイド
[曖昧な状況での判定基準]

### トラブルシューティング
[よくある問題と対処法]

### プレイヤー誘導テクニック
[行き詰まった時の誘導方法]

## プレイヤー配布資料完全版
### 事前配布資料
- ゲーム概要説明
- ルール説明
- 注意事項

### ゲーム中配布資料
- キャラクターハンドアウト（${formData.participants}人分）
- 調査資料
- 追加情報カード

### 参考資料
- 用語集
- 世界観資料

## 品質向上要素
### アクセシビリティ対応
[視覚・聴覚・認知面での配慮]

### リプレイ価値向上
[繰り返しプレイでも楽しめる要素]

### カスタマイズガイド
[人数・時間調整方法]

【絶対要求】実用性完璧。商業品質。実際のゲーム運用で問題ゼロ。`;

  const response = await aiClient.generateContent(systemPrompt, userPrompt);
  
  return {
    name: 'GMガイド・プレイヤー資料完全版',
    content: {
      gamemaster_guide: response
    },
    status: 'completed'
  };
}

// ========== 画像生成（プロ品質） ==========
function createProfessionalImagePrompts(sessionData) {
  const prompts = [];
  const title = extractTitle(sessionData);
  const concept = sessionData.phases?.step1?.content?.concept || '';
  const characters = sessionData.phases?.step2?.content?.characters || '';
  
  // メインビジュアル
  prompts.push({
    type: 'main_visual',
    prompt: `Professional TRPG murder mystery main visual for "${title}". Dark atmospheric scene, mysterious lighting, professional game artwork quality, detailed illustration style similar to Japanese TRPG products. ${concept.substring(0, 200)}. High quality, commercial grade artwork.`,
    description: 'メインビジュアル（表紙用）'
  });
  
  // キャラクターポートレート
  const participantCount = parseInt(sessionData.formData?.participants || 5);
  for (let i = 1; i <= participantCount; i++) {
    prompts.push({
      type: `character_${i}`,
      prompt: `Professional TRPG character portrait for murder mystery game. Character ${i} from "${title}". Detailed character design, professional anime/manga art style, mysterious atmosphere, commercial TRPG quality. Face focus, dramatic lighting.`,
      description: `キャラクター${i}ポートレート`
    });
  }
  
  // 事件現場
  prompts.push({
    type: 'crime_scene',
    prompt: `Professional TRPG crime scene illustration for "${title}". Detailed investigation scene, atmospheric lighting, professional game artwork, mystery visual elements. Commercial quality illustration for murder mystery game.`,
    description: '事件現場イラスト'
  });
  
  return prompts;
}

// ========== 画像生成関数 ==========
async function generateImages(imagePrompts) {
  const images = [];
  
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
        status: 'failed'
      });
    }
  }
  
  return images;
}

// ========== ユーティリティ関数 ==========
function getPlayTime(complexity) {
  const timeMap = {
    'simple': '30分',
    'standard': '45分', 
    'complex': '60分'
  };
  return timeMap[complexity] || '45分';
}

function extractTitle(sessionData) {
  const step1 = sessionData.phases?.step1?.content?.concept;
  if (step1) {
    const titleMatch = step1.match(/## 作品タイトル[\\s\\S]*?\\n([^\\n]+)/);
    if (titleMatch) {
      return titleMatch[1].trim();
    }
  }
  return 'プロフェッショナルマーダーミステリー';
}

// ========== メインハンドラ ==========
const handler = withErrorHandler(async (req, res) => {
  setSecurityHeaders(res);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { formData, sessionId } = req.body;
  
  if (!formData) {
    throw new AppError('フォームデータが必要です', ErrorTypes.VALIDATION_ERROR);
  }

  console.log('🏆 Starting Professional Murder Mystery Generation...');
  
  const context = { results: [], formData, sessionId };
  const finalResult = {
    success: true,
    sessionId,
    sessionData: {
      formData,
      phases: {},
      images: [],
      generationType: 'professional',
      completedAt: new Date().toISOString()
    }
  };

  // プロフェッショナル品質生成実行
  for (let i = 0; i < PROFESSIONAL_GENERATION_FLOW.length; i++) {
    const phase = PROFESSIONAL_GENERATION_FLOW[i];
    
    console.log(`🎯 Generating: ${phase.name}`);
    
    try {
      const result = await phase.handler(formData, context);
      context.results.push(result);
      
      // フェーズ結果をsessionDataに保存
      const stepKey = `step${i + 1}`;
      finalResult.sessionData.phases[stepKey] = result;
      
      console.log(`✅ Completed: ${phase.name}`);
      
    } catch (error) {
      console.error(`❌ Error in ${phase.name}:`, error);
      throw new AppError(`${phase.name}の生成に失敗しました: ${error.message}`, ErrorTypes.AI_ERROR);
    }
  }

  // プロ品質画像生成
  try {
    console.log('🎨 Generating professional images...');
    const imagePrompts = createProfessionalImagePrompts(finalResult.sessionData);
    const images = await generateImages(imagePrompts);
    finalResult.sessionData.images = images;
    console.log(`🖼️ Generated ${images.length} professional images`);
  } catch (error) {
    console.error('❌ Image generation failed:', error);
    // 画像生成失敗は致命的ではない
    finalResult.sessionData.images = [];
  }

  console.log('🏆 Professional Murder Mystery Generation completed successfully!');
  
  return res.status(200).json(finalResult);
}, 'Professional Murder Mystery Generation');

export default handler;