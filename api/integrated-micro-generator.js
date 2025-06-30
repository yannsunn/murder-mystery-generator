/**
 * 🔬 Integrated Micro Generator - 完全統合マイクロ生成システム
 * 1回のリクエストで全体を生成する信頼性重視のシステム
 */

import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';
import { createSecurityMiddleware } from './middleware/rate-limiter.js';
import { createPerformanceMiddleware } from './middleware/performance-monitor.js';
import { createValidationMiddleware } from './middleware/input-validator.js';

export const config = {
  maxDuration: 300, // 5分 - 完全生成のため十分な時間
};

// 統合生成フロー
const INTEGRATED_GENERATION_FLOW = [
  {
    name: '作品タイトル・コンセプト',
    weight: 10,
    handler: async (formData, context) => {
      const systemPrompt = `あなたは世界トップクラスのマーダーミステリー作家です。魅力的で独創的な作品を生成してください。`;
      
      const userPrompt = `
参加人数: ${formData.participants}人
時代背景: ${formData.era}
舞台設定: ${formData.setting}
世界観: ${formData.worldview || 'リアル'}
トーン: ${formData.tone}
事件種類: ${formData.incident_type}
複雑さ: ${formData.complexity}

以下の形式で作品の基礎を生成してください：

## 作品タイトル
[魅力的で印象的なタイトル]

## 基本コンセプト
[200文字程度の核となるコンセプト]

## 世界観・設定
[300文字程度の詳細な世界観と舞台の描写]

## 基本プロット概要
[300文字程度の大まかなストーリー展開]
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { concept: result.content };
    }
  },

  {
    name: 'キャラクター完全設計',
    weight: 25,
    handler: async (formData, context) => {
      const concept = context.concept || '';
      const systemPrompt = `経験豊富なキャラクターデザイナーとして、魅力的で複雑な人物設定を作成してください。`;
      
      const userPrompt = `
コンセプト: ${concept}
参加人数: ${formData.participants}人

各キャラクターに以下を含めて完全設計してください：

## キャラクター${formData.participants}名の完全設計

各キャラクターごとに：
### キャラクター[番号]: [名前]
- **基本情報**: 年齢、職業、外見の特徴
- **性格**: 詳細な性格描写、口調、行動パターン
- **背景**: 重要な過去、現在の状況、動機
- **秘密**: 隠している重要な事実
- **能力・特技**: 推理に関連する特殊能力
- **人間関係**: 他キャラクターとの具体的関係
- **事件との関わり**: 事件に対する立場・利害関係
- **勝利条件**: このキャラクターの目標

必ず${formData.participants}人分を詳細に作成してください。
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { characters: result.content };
    }
  },

  {
    name: '事件・謎・真相構築',
    weight: 30,
    handler: async (formData, context) => {
      const characters = context.characters || '';
      const systemPrompt = `プロのミステリー作家として、論理的で解決可能な謎を構築してください。`;
      
      const userPrompt = `
キャラクター: ${characters}
複雑さレベル: ${formData.complexity}
特殊要素:
- レッドヘリング: ${formData.red_herring ? 'あり' : 'なし'}
- どんでん返し: ${formData.twist_ending ? 'あり' : 'なし'}
- 秘密の役割: ${formData.secret_roles ? 'あり' : 'なし'}

以下を含む完全な事件構造を構築：

## 事件の詳細
- **発生した事件**: 具体的な事件内容
- **発見状況**: いつ、どこで、誰が発見したか
- **現場の状況**: 詳細な現場描写

## 真相・犯行の全貌
- **真の犯人**: 犯人とその動機の詳細
- **犯行手順**: 時系列での詳細な犯行過程
- **トリック・仕掛け**: 使用されたトリックの詳細
- **証拠隠滅**: 犯人の隠蔽工作

## 手がかり・証拠システム
- **物的証拠**: 発見される物的証拠リスト
- **証言情報**: 各キャラクターからの証言
- **隠された手がかり**: 推理で導き出す重要情報
- **決定的証拠**: 真相解明の鍵となる証拠

## 推理要素
- **重要な推理ポイント**: プレイヤーが注目すべき点
- **論理的道筋**: 真相にたどり着く推理過程
- **ミスリード要素**: ${formData.red_herring ? '偽の手がかりとその意図' : ''}
- **サプライズ要素**: ${formData.twist_ending ? '予想外の真相展開' : ''}
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { incident_and_truth: result.content };
    }
  },

  {
    name: 'タイムライン・進行管理',
    weight: 15,
    handler: async (formData, context) => {
      const incident = context.incident_and_truth || '';
      const characters = context.characters || '';
      
      const systemPrompt = `ゲーム進行の専門家として、完璧なタイムラインを構築してください。`;
      
      const userPrompt = `
事件情報: ${incident}
キャラクター: ${characters}

以下の形式で完全なタイムラインを構築：

## 事件発生前タイムライン
- **重要な前史**: 事件に至る背景
- **関係性の変化**: キャラクター間の関係発展
- **事件の準備段階**: 犯行準備の過程

## 事件発生タイムライン
- **詳細な時系列**: 分単位での正確な時間
- **各キャラクターの行動**: 事件時の全員の行動
- **重要な出来事**: 事件に関連する全ての出来事

## ゲーム進行タイムライン
- **第1フェーズ**: 事件発見・初期情報収集 (30分)
- **第2フェーズ**: 詳細調査・証言収集 (45分)
- **第3フェーズ**: 推理・議論 (30分)
- **第4フェーズ**: 最終推理発表 (15分)
- **解決フェーズ**: 真相公開・総括 (15分)

## 情報公開タイミング
- **初期公開情報**: ゲーム開始時に公開する情報
- **段階的公開**: フェーズごとの追加情報
- **条件付き情報**: 特定の行動で得られる情報
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { timeline: result.content };
    }
  },

  {
    name: 'ゲームマスター完全ガイド',
    weight: 20,
    handler: async (formData, context) => {
      const allData = {
        concept: context.concept || '',
        characters: context.characters || '',
        incident: context.incident_and_truth || '',
        timeline: context.timeline || ''
      };
      
      const systemPrompt = `ゲームマスター指導の専門家として、実践的な進行ガイドを作成してください。`;
      
      const userPrompt = `
完全なシナリオ情報: ${JSON.stringify(allData, null, 2)}

以下の形式でゲームマスター完全ガイドを作成：

## 事前準備チェックリスト
- **必要な準備物**: 配布資料、小道具など
- **環境設定**: 会場レイアウト、必要設備
- **資料準備**: プレイヤー別配布資料
- **タイムキーピング**: 進行タイマー設定

## フェーズ別進行マニュアル
- **開始前**: ルール説明、キャラクター配布
- **各フェーズ**: 具体的な進行方法、注意点
- **情報公開**: タイミングと方法
- **議論ファシリテーション**: 効果的な進行テクニック

## トラブルシューティング
- **よくある問題**: 推理が行き詰まった場合の対処
- **ヒント出し**: 段階的ヒントシステム
- **時間調整**: 進行が早い/遅い場合の調整
- **参加者フォロー**: 発言が少ない人への配慮

## 演出・盛り上げテクニック
- **雰囲気作り**: 効果的な演出方法
- **緊張感維持**: 謎解きの臨場感演出
- **感動的結末**: 真相公開の演出方法
- **参加者満足度向上**: 全員が楽しめる工夫

## 配布資料テンプレート
- **キャラクターシート**: 各プレイヤー用
- **共通情報シート**: 全員共有情報
- **証拠資料**: 調査で発見される資料
- **まとめシート**: ゲームマスター用総括
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { gamemaster_guide: result.content };
    }
  }
];

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
    createSecurityMiddleware('generation'),
    createValidationMiddleware('generation')
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
      return;
    }
  }

  try {
    const { formData, sessionId } = req.body;
    
    console.log('🔬 Starting integrated micro generation...');
    
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

    // 各ステップを順次実行
    for (let i = 0; i < INTEGRATED_GENERATION_FLOW.length; i++) {
      const step = INTEGRATED_GENERATION_FLOW[i];
      
      console.log(`🔄 Executing: ${step.name}`);
      
      try {
        const result = await step.handler(formData, context);
        
        // コンテキストに結果を追加
        Object.assign(context, result);
        
        // フェーズデータとして保存
        sessionData.phases[`step${i + 1}`] = {
          name: step.name,
          content: result,
          status: 'completed',
          completedAt: new Date().toISOString()
        };
        
        currentWeight += step.weight;
        const progress = Math.round((currentWeight / totalWeight) * 100);
        
        console.log(`✅ ${step.name} completed (${progress}%)`);
        
      } catch (stepError) {
        console.error(`❌ Step failed: ${step.name}`, stepError);
        
        sessionData.phases[`step${i + 1}`] = {
          name: step.name,
          status: 'error',
          error: stepError.message,
          failedAt: new Date().toISOString()
        };
        
        // 致命的エラーではない場合は続行
        if (step.weight < 30) {
          console.log(`⚠️ Non-critical step failed, continuing...`);
          continue;
        } else {
          throw new AppError(`Critical step failed: ${step.name}`, ErrorTypes.GENERATION_ERROR);
        }
      }
    }

    // 完了処理
    sessionData.status = 'completed';
    sessionData.completedAt = new Date().toISOString();
    sessionData.context = context;

    console.log('🎉 Integrated micro generation completed successfully!');

    return res.status(200).json({
      success: true,
      sessionData,
      message: '🎉 統合マイクロ生成が完了しました！',
      downloadReady: true,
      generationType: 'integrated_micro'
    });

  } catch (error) {
    console.error('🚨 Integrated micro generation error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Generation failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}