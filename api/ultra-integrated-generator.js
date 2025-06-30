/**
 * 🚀 Ultra Integrated Generator - 完全統合型自動フェーズ実行システム
 * 自動フェーズ実行 + OpenAI画像生成 + エラー分離 + 完全統合
 */

// Startup initialization removed for reliability
import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 180, // 3分の最大実行時間
};

// フェーズ定義 - 完全自動化
const GENERATION_PHASES = {
  1: { 
    name: 'コンセプト・世界観生成', 
    priority: 'critical',
    estimatedTime: 15,
    handler: async (formData, context) => {
      const systemPrompt = `あなたは世界トップクラスのマーダーミステリー作家です。与えられた設定に基づいて、魅力的で独創的なコンセプトと詳細な世界観を生成してください。`;
      
      const userPrompt = `
設定情報:
- 参加人数: ${formData.participants}人
- 時代背景: ${formData.era}
- 舞台設定: ${formData.setting}
- 世界観: ${formData.worldview}
- トーン: ${formData.tone}
- 事件種類: ${formData.incident_type}
- 複雑さ: ${formData.complexity}

以下の形式で詳細なコンセプトと世界観を日本語で生成してください:

## 作品タイトル
[魅力的なタイトル]

## 基本コンセプト
[200文字程度の作品の核となるコンセプト]

## 世界観・設定
[300文字程度の詳細な世界観]

## 舞台詳細
[200文字程度の舞台の具体的な描写]

## 基本プロット
[300文字程度の基本的なストーリー展開]
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { 
        concept: result.content,
        imagePrompt: generateImagePrompt(formData, result.content),
        status: 'completed',
        nextPhase: 2
      };
    }
  },
  
  2: { 
    name: 'キャラクター詳細設計', 
    priority: 'critical',
    estimatedTime: 20,
    handler: async (formData, context) => {
      const concept = context.phase1?.concept || '';
      const systemPrompt = `経験豊富なキャラクターデザイナーとして、魅力的で複雑な人物設定を作成してください。`;
      
      const userPrompt = `
コンセプト: ${concept}
参加人数: ${formData.participants}人

各キャラクターに以下を含めて詳細設計してください:

## キャラクター${formData.participants}名の詳細
各キャラクターごとに:
- 名前・年齢・職業
- 性格・特徴
- 背景・動機
- 秘密・弱点
- 他キャラクターとの関係
- 事件との関わり方

形式:
### キャラクター1: [名前]
- 基本情報: [年齢、職業]
- 性格: [詳細な性格描写]
- 背景: [重要な過去・動機]
- 秘密: [隠している事実]
- 関係性: [他キャラとの関係]
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { 
        characters: result.content,
        characterImagePrompts: generateCharacterImagePrompts(result.content),
        status: 'completed',
        nextPhase: 3
      };
    }
  },

  3: { 
    name: '人物関係・動機マトリクス', 
    priority: 'high',
    estimatedTime: 15,
    handler: async (formData, context) => {
      const characters = context.phase2?.characters || '';
      const systemPrompt = `複雑な人間関係を設計する専門家として、深い関係性マトリクスを構築してください。`;
      
      const userPrompt = `
キャラクター情報: ${characters}

以下の形式で詳細な人物関係を構築してください:

## 関係性マトリクス
各キャラクター間の関係を詳細に:

## 動機・利害関係
- 各キャラクターの根本的動機
- 利益相反・対立構造
- 隠された関係性

## 過去の出来事
- 重要な共通体験
- 秘密の関係
- 恨み・愛憎の歴史

## 現在の状況
- 事件発生時の関係状態
- 緊張・対立ポイント
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { 
        relationships: result.content,
        status: 'completed',
        nextPhase: 4
      };
    }
  },

  4: { 
    name: '事件・謎・仕掛け構築', 
    priority: 'critical',
    estimatedTime: 25,
    handler: async (formData, context) => {
      const characters = context.phase2?.characters || '';
      const relationships = context.phase3?.relationships || '';
      
      const systemPrompt = `プロのミステリー作家として、論理的で解決可能な謎を構築してください。`;
      
      const userPrompt = `
キャラクター: ${characters}
人物関係: ${relationships}
複雑さレベル: ${formData.complexity}
特殊要素:
- レッドヘリング: ${formData.red_herring ? 'あり' : 'なし'}
- どんでん返し: ${formData.twist_ending ? 'あり' : 'なし'}
- 秘密の役割: ${formData.secret_roles ? 'あり' : 'なし'}

以下を含む詳細な事件構造を構築:

## 事件の概要
- 発生した事件の詳細
- 発見状況
- 初期状況

## 真相・犯行手順
- 真の犯人と動機
- 犯行の詳細手順
- トリック・仕掛け

## 手がかり・証拠
- 物的証拠リスト
- 証言・情報
- 重要な手がかり

## 推理ポイント
- 解決への論理的道筋
- 重要な推理要素
- 決定的証拠

## レッドヘリング
${formData.red_herring ? '- 偽の手がかり設計' : ''}

## どんでん返し要素
${formData.twist_ending ? '- 予想外の真相展開' : ''}
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { 
        incident: result.content,
        status: 'completed',
        nextPhase: 5
      };
    }
  },

  5: { 
    name: '手がかり・証拠システム', 
    priority: 'high',
    estimatedTime: 20,
    handler: async (formData, context) => {
      const incident = context.phase4?.incident || '';
      const characters = context.phase2?.characters || '';
      
      const systemPrompt = `証拠分析の専門家として、体系的な手がかりシステムを構築してください。`;
      
      const userPrompt = `
事件詳細: ${incident}
キャラクター: ${characters}

以下の形式で手がかりシステムを構築:

## 物的証拠
各証拠について:
- 証拠名・発見場所
- 証拠の詳細描写
- 推理への意味
- 入手可能タイミング

## 証言・情報
各キャラクターからの:
- 初期証言
- 追加情報
- 矛盾点・疑問点

## 隠された手がかり
- 発見が困難な重要証拠
- 推理で導き出す情報
- 決定的な真相証拠

## 手がかり公開タイミング
- フェーズ別公開計画
- 重要度による分類
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { 
        clues: result.content,
        status: 'completed',
        nextPhase: 6
      };
    }
  },

  6: { 
    name: 'タイムライン・進行管理', 
    priority: 'high',
    estimatedTime: 15,
    handler: async (formData, context) => {
      const incident = context.phase4?.incident || '';
      const clues = context.phase5?.clues || '';
      
      const systemPrompt = `ゲーム進行の専門家として、完璧なタイムラインを構築してください。`;
      
      const userPrompt = `
事件情報: ${incident}
手がかり: ${clues}

以下の形式でタイムラインを構築:

## 事件発生前タイムライン
- 重要な前史
- 関係性の変化
- 事件の準備段階

## 事件発生タイムライン
- 詳細な時系列
- 各キャラクターの行動
- 重要な出来事

## ゲーム進行タイムライン
- フェーズ別進行
- 情報公開タイミング
- 推理・議論の時間配分

## 最終推理フェーズ
- 推理発表順序
- 真相公開の流れ
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { 
        timeline: result.content,
        status: 'completed',
        nextPhase: 7
      };
    }
  },

  7: { 
    name: '真相・解決編構築', 
    priority: 'critical',
    estimatedTime: 20,
    handler: async (formData, context) => {
      const incident = context.phase4?.incident || '';
      const clues = context.phase5?.clues || '';
      const timeline = context.phase6?.timeline || '';
      
      const systemPrompt = `ミステリー作品の解決編専門家として、感動的な真相解明を構築してください。`;
      
      const userPrompt = `
事件: ${incident}
手がかり: ${clues}
タイムライン: ${timeline}

以下の形式で真相解決編を構築:

## 真相の全貌
- 事件の全体像
- 犯人の動機・手段
- すべての謎の解明

## 推理の道筋
- 論理的推理過程
- 重要な気づきポイント
- 決定的証拠の意味

## 感動的な解決
- 意外性のある展開
- 人間ドラマの解決
- 感情的カタルシス

## キャラクター結末
- 各キャラクターのその後
- 関係性の変化
- 成長・変化
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { 
        solution: result.content,
        status: 'completed',
        nextPhase: 8
      };
    }
  },

  8: { 
    name: 'ゲームマスター完全ガイド', 
    priority: 'high',
    estimatedTime: 15,
    handler: async (formData, context) => {
      const allPreviousData = {
        concept: context.phase1?.concept || '',
        characters: context.phase2?.characters || '',
        relationships: context.phase3?.relationships || '',
        incident: context.phase4?.incident || '',
        clues: context.phase5?.clues || '',
        timeline: context.phase6?.timeline || '',
        solution: context.phase7?.solution || ''
      };
      
      const systemPrompt = `ゲームマスター指導の専門家として、実践的な進行ガイドを作成してください。`;
      
      const userPrompt = `
シナリオ全体情報: ${JSON.stringify(allPreviousData, null, 2)}

以下の形式でゲームマスターガイドを構築:

## 準備・セットアップ
- 必要な準備物
- 環境設定
- 配布資料の準備

## 進行マニュアル
- フェーズ別進行方法
- 重要なタイミング
- 注意すべきポイント

## トラブル対応
- よくある問題と対処法
- 進行の軌道修正
- 参加者フォロー

## 演出・盛り上げ
- 効果的な演出方法
- 緊張感の維持
- 感動的な結末への導き

## タイムマネジメント
- 詳細な時間配分
- 調整方法
- 短縮・延長対応
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      return { 
        gamemaster: result.content,
        status: 'completed',
        nextPhase: 'image_generation'
      };
    }
  }
};

// OpenAI画像生成プロンプト生成
function generateImagePrompt(formData, concept) {
  const era = formData.era === 'modern' ? 'modern day' : 
              formData.era === 'showa' ? '1950s Japanese' :
              formData.era === 'near-future' ? 'futuristic 2030s' : 'fantasy medieval';
  
  const setting = formData.setting === 'closed-space' ? 'isolated mansion interior' :
                  formData.setting === 'mountain-villa' ? 'mountain villa exterior' :
                  formData.setting === 'city' ? 'urban cityscape' : 'mysterious facility';
  
  return `${era} ${setting}, mystery atmosphere, dramatic lighting, detailed illustration, professional manga style, ${formData.tone} mood`;
}

function generateCharacterImagePrompts(charactersText) {
  // キャラクター名を抽出して画像プロンプトを生成
  const lines = charactersText.split('\n');
  const prompts = [];
  
  lines.forEach(line => {
    if (line.includes('キャラクター') && line.includes(':')) {
      const name = line.split(':')[1]?.trim();
      if (name) {
        prompts.push(`Portrait of ${name}, mystery character, professional manga illustration, detailed face, dramatic lighting`);
      }
    }
  });
  
  return prompts;
}

// OpenAI画像生成関数
async function generateImages(imagePrompts) {
  const images = [];
  
  for (const prompt of imagePrompts) {
    try {
      const response = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: prompt,
          n: 1,
          size: "1024x1024",
          quality: "standard"
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        images.push({
          prompt: prompt,
          url: data.data[0].url,
          status: 'success'
        });
      } else {
        images.push({
          prompt: prompt,
          error: 'Generation failed',
          status: 'failed'
        });
      }
    } catch (error) {
      images.push({
        prompt: prompt,
        error: error.message,
        status: 'error'
      });
    }
  }
  
  return images;
}

// メインハンドラー - 完全自動化
export default async function handler(req, res) {
  console.log('🚀 Ultra Integrated Generator called:', req.method);
  
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

  try {
    const { action, formData, sessionId, continueFrom } = req.body;
    
    if (action === 'generate_complete') {
      console.log('🔥 Starting complete generation process...');
      
      const sessionData = {
        sessionId: sessionId || `session_${Date.now()}`,
        formData,
        startTime: new Date().toISOString(),
        phases: {},
        status: 'running',
        currentPhase: continueFrom || 1,
        totalPhases: 8
      };
      
      const progressUpdates = [];
      
      // 全フェーズを自動実行
      for (let phaseNum = sessionData.currentPhase; phaseNum <= 8; phaseNum++) {
        const phase = GENERATION_PHASES[phaseNum];
        if (!phase) continue;
        
        console.log(`🔄 Executing Phase ${phaseNum}: ${phase.name}`);
        
        progressUpdates.push({
          phase: phaseNum,
          name: phase.name,
          status: 'running',
          startTime: new Date().toISOString()
        });
        
        try {
          const phaseResult = await phase.handler(formData, sessionData.phases);
          
          sessionData.phases[`phase${phaseNum}`] = {
            ...phaseResult,
            completedAt: new Date().toISOString(),
            executionTime: Date.now() - new Date().getTime()
          };
          
          progressUpdates.push({
            phase: phaseNum,
            name: phase.name,
            status: 'completed',
            result: phaseResult,
            completedAt: new Date().toISOString()
          });
          
          console.log(`✅ Phase ${phaseNum} completed successfully`);
          
        } catch (phaseError) {
          console.error(`❌ Phase ${phaseNum} failed:`, phaseError);
          
          // エラー分離システム - フェーズが失敗しても続行
          sessionData.phases[`phase${phaseNum}`] = {
            status: 'error',
            error: phaseError.message,
            failedAt: new Date().toISOString()
          };
          
          progressUpdates.push({
            phase: phaseNum,
            name: phase.name,
            status: 'error',
            error: phaseError.message
          });
          
          // 重要フェーズ以外は続行
          if (phase.priority !== 'critical') {
            console.log(`⚠️ Non-critical phase failed, continuing...`);
            continue;
          } else {
            console.log(`🚨 Critical phase failed, attempting recovery...`);
            // クリティカルフェーズは1回リトライ
            try {
              const retryResult = await phase.handler(formData, sessionData.phases);
              sessionData.phases[`phase${phaseNum}`] = {
                ...retryResult,
                completedAt: new Date().toISOString(),
                retried: true
              };
              console.log(`🔄 Phase ${phaseNum} retry successful`);
            } catch (retryError) {
              throw new AppError(`Critical phase ${phaseNum} failed after retry: ${retryError.message}`, ErrorTypes.GENERATION_ERROR);
            }
          }
        }
      }
      
      // OpenAI画像生成 (分離実行)
      let generatedImages = [];
      if (process.env.OPENAI_API_KEY) {
        try {
          console.log('🎨 Starting image generation...');
          
          const imagePrompts = [];
          if (sessionData.phases.phase1?.imagePrompt) {
            imagePrompts.push(sessionData.phases.phase1.imagePrompt);
          }
          if (sessionData.phases.phase2?.characterImagePrompts) {
            imagePrompts.push(...sessionData.phases.phase2.characterImagePrompts);
          }
          
          if (imagePrompts.length > 0) {
            generatedImages = await generateImages(imagePrompts);
            console.log(`🎨 Generated ${generatedImages.length} images`);
          }
          
        } catch (imageError) {
          console.error('🎨 Image generation failed:', imageError);
          // 画像生成失敗でも続行
          generatedImages = [{ status: 'failed', error: imageError.message }];
        }
      }
      
      sessionData.status = 'completed';
      sessionData.completedAt = new Date().toISOString();
      sessionData.generatedImages = generatedImages;
      sessionData.progressUpdates = progressUpdates;
      
      return res.status(200).json({
        success: true,
        sessionData,
        message: '🎉 Complete generation finished successfully!',
        downloadReady: true,
        nextActions: ['download_pdf', 'download_zip']
      });
    }
    
    if (action === 'get_progress') {
      // 進行状況取得
      return res.status(200).json({
        success: true,
        message: 'Progress retrieved',
        // 実際の進行状況を返す
      });
    }
    
    return res.status(400).json({
      success: false,
      error: 'Invalid action specified'
    });
    
  } catch (error) {
    console.error('🚨 Ultra Integrated Generator error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Generation failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}