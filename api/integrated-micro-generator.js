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

// 5時間対応統合生成フロー
const INTEGRATED_GENERATION_FLOW = [
  {
    name: '作品タイトル・コンセプト・導入',
    weight: 8,
    handler: async (formData, context) => {
      const systemPrompt = `あなたは世界トップクラスのマーダーミステリー作家です。魅力的で独創的な作品を生成してください。`;
      
      const userPrompt = `
【重要】5時間のマーダーミステリーセッション用の本格的シナリオを作成してください。

参加人数: ${formData.participants}人
時代背景: ${formData.era}
舞台設定: ${formData.setting}
世界観: ${formData.worldview || 'リアル'}
トーン: ${formData.tone}
事件種類: ${formData.incident_type}
複雑さ: ${formData.complexity}

以下の形式で5時間対応の本格的な作品基礎を生成してください：

## 作品タイトル
[魅力的で印象的なタイトル]

## 基本コンセプト
[500文字程度の深い核となるコンセプト - 5時間の展開を支える背景]

## 世界観・設定詳細
[800文字程度の詳細な世界観と舞台の描写 - 没入感を高める詳細設定]

## 導入シナリオ（全体配布用）
[1200文字程度の参加者全員に配布する導入ストーリー - 世界観への没入と事件発生までの経緯]

## 5時間構成プロット
【第1時間】導入・世界観説明・キャラクター紹介
【第2時間】事件発生・初期調査
【第3時間】詳細調査・証拠収集・証言聴取
【第4時間】推理・議論・仮説構築
【第5時間】最終推理・真相公開・エピローグ

## 複雑さレベル対応
### シンプル版の変更点
[複雑さ「シンプル」選択時の調整内容]

### 複雑版の変更点  
[複雑さ「複雑」選択時の追加要素]

## トーン別演出指針
### ${formData.tone}トーン専用演出
[選択されたトーンに特化した演出方法と雰囲気作り]
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { concept: result.content };
    }
  },

  {
    name: 'キャラクター完全設計・個別ハンドアウト',
    weight: 30,
    handler: async (formData, context) => {
      const concept = context.concept || '';
      const systemPrompt = `5時間のマーダーミステリー専門のキャラクターデザイナーとして、各プレイヤーが5時間楽しめる深い個別ハンドアウトを作成してください。`;
      
      const userPrompt = `
コンセプト: ${concept}
参加人数: ${formData.participants}人
複雑さ: ${formData.complexity}
トーン: ${formData.tone}

【重要】5時間のセッションで各プレイヤーが没入できる詳細な個別ハンドアウトを作成してください。

## 全キャラクター概要
[${formData.participants}人のキャラクター間の関係性と全体構造]

## 個別ハンドアウト（各プレイヤー配布用）

各キャラクターごとに：
### 【プレイヤー[番号]用ハンドアウト】
#### あなたのキャラクター: [名前]

**■ 基本設定**
- 年齢・職業・外見: [詳細設定]
- 性格・口調: [プレイヤーが演じやすい具体的指針]

**■ あなたの背景ストーリー**
[800文字程度 - プレイヤーのみが知る詳細な過去と現在の状況]

**■ あなたが知っている情報**
- 公開可能な情報: [他プレイヤーに話してもよい情報]
- 秘密の情報: [絶対に隠すべき重要な秘密]
- 推理の手がかり: [あなただけが気づける特別な情報]

**■ 他キャラクターとの関係**
[他の${formData.participants - 1}人それぞれとの具体的な関係性と感情]

**■ あなたの目標・勝利条件**
- 主目標: [このキャラクターが達成すべきメイン目標]
- 秘密目標: [他プレイヤーに知られたくない個人的目標]

**■ 行動指針・ロールプレイ指導**
- 序盤での行動: [最初の1-2時間での推奨行動]
- 中盤での行動: [証拠収集・調査での行動方針]
- 終盤での行動: [推理発表での戦略]

**■ 複雑さ別追加要素**
### シンプル版: [複雑さ「シンプル」時の簡略化内容]
### 標準版: [現在の設定]
### 複雑版: [複雑さ「複雑」時の追加秘密・関係性]

必ず${formData.participants}人分の完全な個別ハンドアウトを作成してください。
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { characters: result.content };
    }
  },

  {
    name: '事件・謎・真相構築（5時間対応）',
    weight: 25,
    handler: async (formData, context) => {
      const characters = context.characters || '';
      const systemPrompt = `5時間のマーダーミステリー専門の謎構築者として、プレイヤーが5時間かけて解き明かせる複層的で論理的な謎を構築してください。`;
      
      const userPrompt = `
キャラクター: ${characters}
複雑さレベル: ${formData.complexity}
トーン: ${formData.tone}
特殊要素:
- レッドヘリング: ${formData.red_herring ? 'あり' : 'なし'}
- どんでん返し: ${formData.twist_ending ? 'あり' : 'なし'}
- 秘密の役割: ${formData.secret_roles ? 'あり' : 'なし'}

【重要】5時間のセッションで段階的に解明される複層的な事件構造を構築してください。

## 事件発生・発見シーン（詳細）
- **事件発生の瞬間**: 具体的な状況と経緯（1000文字程度）
- **発見シーン**: 第一発見者の体験と現場の詳細描写
- **初期の混乱**: 参加者全員の最初の反応と状況

## 段階的謎解き構造（5時間対応）
### 【第1段階謎】表面的な疑問（1時間目）
- 初期の不審点と基本的な疑問
- 簡単に発見できる証拠

### 【第2段階謎】深層の謎（2-3時間目）  
- より詳細な調査で発見される矛盾
- キャラクター間の隠された関係

### 【第3段階謎】核心の真相（4-5時間目）
- 決定的な証拠と最終的な真相
- 全ての謎が解明される瞬間

## 完全な真相・犯行構造
- **真の犯人**: 犯人とその完全な動機（心理的背景含む）
- **詳細犯行手順**: 分単位の詳細な犯行過程
- **使用トリック**: 論理的で検証可能なトリック
- **証拠隠滅工作**: 犯人の完璧な隠蔽計画

## 5時間対応証拠・手がかりシステム
### 【時間別発見可能証拠】
- 1時間目発見可能: [基本的な物的証拠]
- 2時間目発見可能: [詳細調査で判明する証拠]
- 3時間目発見可能: [推理が必要な隠された証拠]
- 4時間目発見可能: [決定的証拠への手がかり]
- 5時間目発見可能: [最終的な決定的証拠]

### 【キャラクター別証言内容】
[各キャラクターが持つ証言・情報を時間経過で段階的に公開]

## 複雑さ別バリエーション
### シンプル版: [謎の簡略化、証拠の明確化]
### 標準版: [現在の設定]
### 複雑版: [追加の謎、複雑な人間関係、多重トリック]

## トーン別演出要素
### ${formData.tone}トーン専用要素
[選択されたトーンに合わせた事件の演出方法]
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { incident_and_truth: result.content };
    }
  },

  {
    name: 'タイムライン・進行管理（5時間完全対応）',
    weight: 17,
    handler: async (formData, context) => {
      const incident = context.incident_and_truth || '';
      const characters = context.characters || '';
      
      const systemPrompt = `5時間のマーダーミステリーセッション専門の進行管理者として、完璧な5時間タイムラインを構築してください。`;
      
      const userPrompt = `
事件情報: ${incident}
キャラクター: ${characters}
複雑さ: ${formData.complexity}

【重要】300分（5時間）の完全なセッション進行タイムラインを構築してください。

## 事件発生前完全タイムライン
- **重要な前史** (事件1週間前〜当日): 事件に至る詳細な背景
- **関係性の変化**: キャラクター間の関係発展の詳細
- **犯行準備タイムライン**: 犯人の準備過程（分単位）

## 事件発生詳細タイムライン
- **分単位タイムライン**: 事件発生の15分前〜発見まで
- **全キャラクター行動記録**: 各人の詳細行動ログ
- **重要証拠生成タイミング**: 証拠がいつ、どこで作られたか

## 5時間セッション完全進行表

### 【第1時間 (0-60分)】導入・世界観・キャラクター紹介
- 0-15分: ゲーム説明・ルール確認
- 15-30分: 導入シナリオ読み上げ・世界観説明  
- 30-45分: キャラクター紹介・関係性確認
- 45-60分: 事件発生・第一発見・初期混乱

### 【第2時間 (60-120分)】初期調査・基本証拠収集
- 60-75分: 現場検証・基本的な物的証拠発見
- 75-90分: 初期証言収集・各キャラクターからの情報
- 90-105分: 証拠整理・初期仮説構築
- 105-120分: 第1回全体ディスカッション

### 【第3時間 (120-180分)】詳細調査・深層情報
- 120-135分: 詳細調査開始・隠された証拠発見
- 135-150分: キャラクター個別尋問・秘密情報
- 150-165分: 証拠の矛盾発見・新たな疑問
- 165-180分: 関係性の再検討・仮説修正

### 【第4時間 (180-240分)】推理・議論・仮説構築
- 180-195分: 各プレイヤーの推理発表
- 195-210分: 集中議論・証拠の検証
- 210-225分: 最終仮説の構築・犯人推理
- 225-240分: 決定的証拠の最終確認

### 【第5時間 (240-300分)】最終推理・真相公開・エピローグ
- 240-255分: 最終推理発表・投票
- 255-270分: 真相公開・犯人の告白
- 270-285分: 全謎解き・動機説明
- 285-300分: エピローグ・感想・総括

## 情報公開タイミング表
### 【時間別公開情報】
- 第1時間公開: [基本情報・表面的事実]
- 第2時間公開: [初期証拠・基本的証言]
- 第3時間公開: [詳細証拠・隠された情報]
- 第4時間公開: [複雑な証拠・決定的手がかり]
- 第5時間公開: [最終証拠・完全な真相]

### 【条件付き情報公開】
[特定の行動・質問・推理で得られる追加情報のタイミング]

## 複雑さ別時間調整
### シンプル版: [各フェーズの簡略化・時間短縮のポイント]
### 標準版: [上記の標準設定]
### 複雑版: [追加調査時間・複雑な推理段階の追加]
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { timeline: result.content };
    }
  },

  {
    name: 'ゲームマスター完全ガイド（5時間対応）',
    weight: 20,
    handler: async (formData, context) => {
      const allData = {
        concept: context.concept || '',
        characters: context.characters || '',
        incident: context.incident_and_truth || '',
        timeline: context.timeline || ''
      };
      
      const systemPrompt = `5時間のマーダーミステリーセッション専門のゲームマスター指導者として、完璧な5時間進行ガイドを作成してください。`;
      
      const userPrompt = `
完全なシナリオ情報: ${JSON.stringify(allData, null, 2)}
参加人数: ${formData.participants}人
複雑さ: ${formData.complexity}
トーン: ${formData.tone}

【重要】5時間（300分）のマーダーミステリーセッションを完璧に進行するための完全ガイドを作成してください。

## 事前準備完全チェックリスト

### 【必須準備物】
- プレイヤー別個別ハンドアウト（${formData.participants}部）
- 導入シナリオ配布資料（${formData.participants}部）
- 証拠資料・写真・小道具リスト
- タイマー・ストップウォッチ
- ホワイトボード・マーカー（証拠整理用）

### 【会場設定】
- テーブル配置図（${formData.participants}人用）
- 照明・音響設定（${formData.tone}トーン対応）
- 証拠展示スペース
- 個別相談スペース

### 【ゲームマスター用資料】
- 5時間進行スケジュール表
- 時間別情報公開チェックリスト
- トラブルシューティングマニュアル
- 緊急時ヒント集

## 5時間完全進行マニュアル

### 【セッション開始前 (15分前)】
- 参加者受付・席順確認
- ルール説明準備・資料配布準備
- 雰囲気作り（${formData.tone}トーン演出開始）

### 【第1時間 (0-60分)】詳細進行
- 0-15分: ゲーム説明・ルール確認
  * 推理ゲームの基本ルール
  * 勝利条件の説明
  * 質問・相談のルール
- 15-30分: 導入シナリオ・世界観説明
  * 全体配布資料の読み上げ
  * 世界観への没入促進
- 30-45分: キャラクター紹介・関係性確認
  * 個別ハンドアウト配布
  * 各プレイヤーの自己紹介
  * 初期関係性の確認
- 45-60分: 事件発生・第一発見
  * 事件発生の演出
  * 現場の詳細説明
  * 初期混乱の演出

### 【第2時間〜第5時間】
[各時間の詳細な進行手順・注意点・演出方法]

## 時間別情報公開マニュアル
### 【厳密タイミング管理】
- 第1時間: 基本情報のみ公開
- 第2時間: 初期証拠公開タイミング
- 第3時間: 重要証拠・秘密情報公開
- 第4時間: 決定的手がかり公開
- 第5時間: 最終証拠・真相公開

### 【情報公開方法】
[各情報の効果的な公開方法・演出]

## 完全トラブルシューティング

### 【時間管理問題】
- 進行が早すぎる場合: [詳細調査の追加・議論時間延長]
- 進行が遅すぎる場合: [ヒント追加・簡略化ポイント]

### 【推理停滞問題】
- 行き詰まった場合の段階的ヒント（3段階）
- 第1段階ヒント: [軽いヒント]
- 第2段階ヒント: [中程度のヒント]  
- 第3段階ヒント: [決定的ヒント]

### 【参加者フォロー】
- 発言が少ない人への自然な振り方
- 推理が外れた人へのフォロー
- 熱くなりすぎた議論のクールダウン

## ${formData.tone}トーン専用演出ガイド
[選択されたトーンに特化した演出方法・雰囲気作り・進行テクニック]

## 完全配布資料パッケージ

### 【プレイヤー用個別ハンドアウト】
[各プレイヤーに配布する完全な個別資料の内容・フォーマット]

### 【共通配布資料】
- 導入シナリオ（全員配布用）
- 基本ルール説明書
- 証拠整理シート

### 【ゲームマスター専用資料】
- 完全回答集
- 時間別チェックシート
- 緊急対応マニュアル

## 複雑さ別運営調整
### シンプル版: [簡略化ポイント・時間短縮方法]
### 標準版: [上記の標準進行]
### 複雑版: [追加要素・延長ポイント・高度な演出]

この完全ガイドにより、5時間の充実したマーダーミステリーセッションが保証されます。
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