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
import { randomMysteryGenerator } from './utils/random-mystery-generator.js';

export const config = {
  maxDuration: 300, // 5分 - 30分-1時間高精度生成のため十分な時間
};

// 30分-1時間理想的生成フロー（ランダム→段階的→全体調整）
const INTEGRATED_GENERATION_FLOW = [
  
  // === 段階0: ランダム全体構造生成 ===
  {
    name: '段階0: ランダム全体構造・アウトライン',
    weight: 15,
    handler: async (formData, context) => {
      console.log('🎲 段階0: ランダム全体構造生成開始');
      
      const systemPrompt = `あなたは「狂気山脈　陰謀の分水嶺」レベルのマーダーミステリークリエイターです。
30分-1時間セッション用のマーダーミステリーの大まかな全体構造をランダムに生成してください。
この段階では、後で詳細化されるための基本的なアウトラインを作成します。`;
      
      const userPrompt = `
【ランダム全体構造生成依頼】

参加人数: ${formData.participants}人
時代背景: ${formData.era}
舞台設定: ${formData.setting}
世界観: ${formData.worldview || 'リアル'}
トーン: ${formData.tone}
事件種類: ${formData.incident_type}
複雑さ: ${formData.complexity}

以下の形式で大まかな全体構造をランダム生成してください：

## 作品基本情報（ランダム版）
**作品タイトル**: [ユニークなタイトル]
**基本コンセプト**: [簡潔なコンセプト]
**舞台設定**: [具体的な場所・状況]

## 事件の大まかな構造（ランダム版）
**事件の種類**: [具体的な事件内容]
**犯人の数**: [単犯または共犯]
**基本的な動機**: [簡潔な動機]
**主なトリック**: [使用されるトリックの種類]

## キャラクターの大まかな役割（ランダム版）
${Array.from({length: parseInt(formData.participants)}, (_, i) => `**プレイヤー${i + 1}**: [大まかな役割・立場・事件との関係]`).join('\n')}

## 重要な要素（ランダム版）
**主な証拠**: [重要な証拠の種類]
**キーとなる手がかり**: [解決の鍵となる要素]
**メインイベント**: [セッション中の主要な出来事]

## 大まかな解決フロー（ランダム版）
**第1段階**: [初期発見・状況把握]
**第2段階**: [証拠収集・関係性理解]
**第3段階**: [推理・真相解明]

【重要】
- この段階はアウトラインのみ、詳細は後の段階で作成
- 30分-1時間で完結可能な範囲で設定
- ランダム性と面白さを重視
- 全ての文章を完結させる
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      console.log('✅ 段階0: ランダム全体構造完成');
      return { random_outline: result.content };
    }
  },
  // === 段階1: 基本コンセプト精密化 ===
  {
    name: '段階1: コンセプト精密化・世界観詳細化',
    weight: 10,
    handler: async (formData, context) => {
      console.log('🎨 段階1: コンセプト精密化開始');
      
      const randomOutline = context.random_outline || '';
      
      const systemPrompt = `あなたは「狂気山脈　陰謀の分水嶺」レベルのプロフェッショナルマーダーミステリー企画者です。
ランダム生成された大まかな構造を基に、詳細なコンセプトと世界観を精密に作成してください。`;
      
      const userPrompt = `
【コンセプト精密化依頼】

ランダム全体構造: ${randomOutline}

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
      console.log('✅ 段階1: 基本コンセプト完成');
      return { concept: result.content };
    }
  },
  
  // === 段階2: 事件核心部の設計 ===
  {
    name: '段階2: 事件核心・犯人・動機設定',
    weight: 12,
    handler: async (formData, context) => {
      console.log('🕵️ 段階2: 事件核心部詳細設計開始');
      
      const randomOutline = context.random_outline || '';
      const concept = context.concept || '';
      const systemPrompt = `あなたはマーダーミステリーの事件設計のエキスパートです。
ランダム生成された大まかな構造と精密化されたコンセプトを基に、事件の核心部分を詳細に設計してください。
この段階では犯人、動機、犯行手段の具体的な詳細を確定します。`;
      
      const userPrompt = `
【事件核心部詳細設計依頼】

ランダム全体構造: ${randomOutline}
精密化コンセプト: ${concept}
参加人数: ${formData.participants}人
複雑さ: ${formData.complexity}
トーン: ${formData.tone}

以下の形式で事件の核心部分を設計してください：

## 事件の核心構造

### 犯人の特定
**真の犯人**: [プレイヤー番号またはNPCを明記]
**犯人の特徴**: [人物像と性格的特徴]

### 根本的動機
**主動機**: [犯行の最も深い動機]
**副次的要因**: [犯行を後押しした状況や感情]
**隔したい秘密**: [犯人が最も隠したいこと]

### 犯行手段・トリック
**基本的な手段**: [30分-1時間で理解できるシンプルな手段]
**使用したトリック**: [特別なトリックや工作]
**犯行時刻**: [具体的な時刻と状況]

### 重要な証拠
**物的証拠**: [発見される重要な物証]
**状況証拠**: [現場の状況や痕跡]
**証言証拠**: [目撃情報や関連者の証言]

### ミスリード要素（簡潔版）
[短時間で整理できる程度の適度なミスリード要素]

【重要】
- 30分-1時間で理解・解決可能な範囲
- 後の段階で詳細化されるため、核心部分に集中
- 全ての文章を完結させる
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      console.log('✅ 段階2: 事件核心部完成');
      return { incident_core: result.content };
    }
  },

  // === 段階3: 事件詳細・タイムライン構築 ===
  {
    name: '段階3: 事件詳細・基本タイムライン',
    weight: 15,
    handler: async (formData, context) => {
      console.log('⏰ 段階3: 事件詳細・タイムライン構築開始');
      
      const concept = context.concept || '';
      const incidentCore = context.incident_core || '';
      const systemPrompt = `あなたはマーダーミステリーの事件詳細設計のエキスパートです。
30分-1時間セッション用の詳細な事件タイムラインと状況を段階的に構築してください。
この段階では、キャラクター生成の前段階として事件の詳細を確定します。`;
      
      const userPrompt = `
【事件詳細・タイムライン構築依頼】

基本コンセプト: ${concept}
事件核心部: ${incidentCore}
参加人数: ${formData.participants}人
複雑さ: ${formData.complexity}

以下の形式で事件の詳細とタイムラインを構築してください：

## 事件発生前タイムライン（簡潔版）
### 重要前史（事件1週間前〜）
[事件に直結する必要最小限の背景事情]

### 事件当日タイムライン（詳細版）
**午前**:
- [時刻]: [出来事・人物の行動]

**午後**:
- [時刻]: [出来事・人物の行動]  

**夜間**:
- [時刻]: [事件発生とその前後の状況]

## 事件現場詳細
### 現場の状況
[発見時の詳細な現場状況・証拠配置]

### 重要な物的証拠
[現場で発見される決定的証拠のリスト]

### 証言・目撃情報
[各関係者からの重要な証言や目撃情報]

## アリバイ・行動パターン
### 事件時刻周辺の人物動向
[各関係者の事件時刻前後の行動・アリバイ状況]

## ${formData.complexity}レベル対応調整
### シンプル版（30分）要素
[30分で解決可能な簡素化要素]

### 標準版（45分）要素  
[適度な複雑さの中級要素]

### 複雑版（60分）要素
[1時間必要な高度な要素]

【重要】
- 後のキャラクター生成で活用される詳細情報
- 30分-1時間で確実に解決可能な構造
- 全ての文章を完結させる
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      console.log('✅ 段階3: 事件詳細・タイムライン完成');
      return { incident_details: result.content };
    }
  },

  // === 段階4: 段階的キャラクター生成システム ===
  {
    name: '段階4: 段階的キャラクター生成システム',
    weight: 35,
    handler: async (formData, context) => {
      try {
        const randomOutline = context.random_outline || '';
        const concept = context.concept || '';
        const incidentCore = context.incident_core || '';
        const incidentDetails = context.incident_details || '';
        const participantCount = parseInt(formData.participants) || 5;
        
        console.log(`👥 段階的キャラクター生成開始: ${participantCount}人`);
        
        let allCharacters = [];
        let characterRelationships = '';
        
        // 段階1: 各キャラクターを個別に生成
        for (let i = 1; i <= participantCount; i++) {
          console.log(`🎭 プレイヤー${i}のキャラクター生成中...`);
          
          const systemPrompt = `あなたは「狂気山脈　陰謀の分水嶺」レベルのプロフェッショナルマーダーミステリーキャラクター設計専門家です。
30分-1時間セッション用の魅力的で複雑なキャラクターを一人ずつ丁寧に作成してください。`;
          
          const userPrompt = `
【プレイヤー${i}専用キャラクター作成】

ランダム全体構造: ${randomOutline}
作品情報: ${concept}
事件核心: ${incidentCore}
事件詳細: ${incidentDetails}
参加人数: ${participantCount}人中の${i}人目
既存キャラクター: ${allCharacters.length > 0 ? allCharacters.map((c, idx) => `プレイヤー${idx + 1}: ${c.name || '未設定'}`).join(', ') : 'なし'}

以下の形式でプレイヤー${i}の完全なハンドアウトを作成してください：

## 【プレイヤー${i}専用ハンドアウト】

### あなたのキャラクター
**氏名**: [フルネーム - 既存キャラと重複しないユニークな名前]
**年齢**: [具体的な年齢]
**職業**: [詳細な職業・立場・社会的ステータス]
**性格**: [個性的で記憶に残る性格特徴]
**外見**: [特徴的な外見や服装]

### あなたの背景と動機
[このキャラクターの詳細な背景ストーリー。事件との関連、動機、過去の経験を400文字程度で詳細に説明]

### あなただけが知っている秘密
**重要な秘密**: [事件に関連する決定的な秘密情報]
**隠したいこと**: [他のプレイヤーに知られたくないこと]
**特別な知識**: [事件解決に関わる特別な情報や知識]

### あなたの目標と行動指針
**主目標**: [セッションで達成したい主な目標]
**秘密の目標**: [他のプレイヤーに知られたくない真の目的]
**行動指針**: [セッション中の具体的な行動方針]

### 重要な所持品・証拠
[持っている重要なアイテム、証拠、手がかりの詳細リスト]

### 他のプレイヤーとの関係性（既知の場合）
${allCharacters.length > 0 ? allCharacters.map((c, idx) => `**プレイヤー${idx + 1}(${c.name})との関係**: [具体的な関係性、感情、過去の経緯]`).join('\n') : '[他のプレイヤーのキャラクターが決まった後で設定されます]'}

【絶対要求】
- 既存キャラクターとの名前重複禁止
- 事件と有意義な関連性を持たせる
- 30分-1時間で演じ切れる程度の複雑さ
- 全ての文章を完結させる
`;

          const characterResult = await aiClient.generateWithRetry(systemPrompt, userPrompt);
          
          // キャラクター情報を抽出して保存
          const nameMatch = characterResult.content.match(/\*\*氏名\*\*:\s*([^\n]+)/);
          const character = {
            playerId: i,
            name: nameMatch ? nameMatch[1].replace(/\[|\]/g, '').trim() : `プレイヤー${i}`,
            handout: characterResult.content
          };
          
          allCharacters.push(character);
          console.log(`✅ プレイヤー${i} (${character.name}) 生成完了`);
        }
        
        // 段階2: 全体の関係性を調整し、つじつまを合わせる
        console.log('🔗 全体の関係性調整中...');
        
        const relationshipSystemPrompt = `あなたはマーダーミステリーの関係性調整のエキスパートです。
各キャラクター間の関係性を調整し、全体のつじつまを合わせてください。`;
        
        const relationshipUserPrompt = `
【関係性調整依頼】

ランダム全体構造: ${randomOutline}
作品情報: ${concept}
事件核心: ${incidentCore}
事件詳細: ${incidentDetails}

キャラクター一覧:
${allCharacters.map((c, idx) => `${idx + 1}. ${c.name}`).join('\n')}

以下の形式で全キャラクター間の関係性を設定してください：

## キャラクター関係図

${allCharacters.map((c1, i) => 
  allCharacters.map((c2, j) => {
    if (i !== j) {
      return `### ${c1.name} → ${c2.name}\n[具体的な関係性、感情、過去の経緯、現在の状況]`;
    }
    return '';
  }).filter(r => r).join('\n\n')
).join('\n\n')}

## 関係性の特徴
- グループ内の力関係
- 秘密を共有する関係
- 対立している関係
- アリバイを提供し合う関係

【重要】事件の複雑さと謎解きに適した絶妙なバランスを保つこと。
`;

        const relationshipResult = await aiClient.generateWithRetry(relationshipSystemPrompt, relationshipUserPrompt);
        characterRelationships = relationshipResult.content;
        
        // 段階3: 各キャラクターのハンドアウトを関係性情報で更新
        console.log('🔄 ハンドアウトの関係性情報更新中...');
        
        for (let i = 0; i < allCharacters.length; i++) {
          const character = allCharacters[i];
          const systemPrompt = `あなたはマーダーミステリーのハンドアウト更新専門家です。
既存のハンドアウトに関係性情報を統合してください。`;
          
          const userPrompt = `
【ハンドアウト更新依頼】

対象キャラクター: ${character.name} (プレイヤー${character.playerId})

現在のハンドアウト:
${character.handout}

全体の関係性情報:
${characterRelationships}

上記の関係性情報を基に、「他のプレイヤーとの関係性」セクションを更新した完全なハンドアウトを出力してください。

【要求】
- 関係性情報を詳細で具体的に追加
- 他のキャラクターとの面識や関係を明確化
- ゲーム中の行動指針に関係性を反映
- 元のハンドアウトの品質を維持
`;

          const updatedHandout = await aiClient.generateWithRetry(systemPrompt, userPrompt);
          allCharacters[i].handout = updatedHandout.content;
          console.log(`✅ ${character.name}のハンドアウト更新完了`);
        }
        
        // 最終結果をフォーマット
        const finalCharacterHandouts = allCharacters.map(c => c.handout).join('\n\n---\n\n');
        
        console.log('🎉 段階的キャラクター生成完了!');
        
        return {
          characters: finalCharacterHandouts,
          character_relationships: characterRelationships,
          character_count: participantCount,
          character_list: allCharacters.map(c => ({ name: c.name, playerId: c.playerId }))
        };
        
      } catch (error) {
        console.error('❌ 段階的キャラクター生成エラー:', error);
        
        // フォールバック: シンプルなキャラクター生成
        const participantCount = parseInt(formData.participants) || 5;
        const fallbackCharacters = generateFallbackCharacters(participantCount);
        
        return { characters: fallbackCharacters };
      }
    }
  },

  // === 段階5: 証拠配置・手がかり設計 ===
  {
    name: '段階5: 証拠配置・手がかり体系化',
    weight: 18,
    handler: async (formData, context) => {
      console.log('🔍 段階5: 証拠配置・手がかり体系化開始');
      
      const concept = context.concept || '';
      const incidentCore = context.incident_core || '';
      const incidentDetails = context.incident_details || '';
      const characters = context.characters || '';
      
      const systemPrompt = `あなたはマーダーミステリーの証拠配置とヒントシステム設計の専門家です。
30分-1時間で確実に解決可能な、段階的で論理的な証拠配置システムを構築してください。
この段階では、キャラクターと事件詳細を基にした具体的な証拠・手がかりの配置を行います。`;
      
      const userPrompt = `
【証拠配置・手がかり体系化依頼】

基本情報: ${concept}
事件核心: ${incidentCore}
事件詳細: ${incidentDetails}
キャラクター情報: ${characters}
複雑さレベル: ${formData.complexity}
トーン: ${formData.tone}
特殊要素:
- レッドヘリング: ${formData.red_herring ? 'あり' : 'なし'}
- どんでん返し: ${formData.twist_ending ? 'あり' : 'なし'}
- 秘密の役割: ${formData.secret_roles ? 'あり' : 'なし'}

以下の形式で証拠配置システムを構築してください：

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
      console.log('✅ 段階5: 証拠配置・手がかり体系化完成');
      return { evidence_system: result.content };
    }
  },

  // === 段階6: GM進行ガイド作成 ===
  {
    name: '段階6: GM進行ガイド・セッション管理',
    weight: 20,
    handler: async (formData, context) => {
      console.log('🎓 段階6: GM進行ガイド・セッション管理作成開始');
      
      const concept = context.concept || '';
      const incidentCore = context.incident_core || '';
      const incidentDetails = context.incident_details || '';
      const characters = context.characters || '';
      const evidenceSystem = context.evidence_system || '';
      
      const systemPrompt = `あなたは「狂気山脈　陰謀の分水嶺」レベルのプロフェッショナルGM（ゲームマスター）です。
30分-1時間セッション用の完璧なGM進行ガイドを、これまでの全段階の情報を統合して作成してください。
実際のセッション運営で即座に使用できる実用的なガイドに仕上げてください。`;
      
      const userPrompt = `
【GM進行ガイド統合作成依頼】

基本情報: ${concept}
事件核心: ${incidentCore}
事件詳細: ${incidentDetails}
キャラクター情報: ${characters}
証拠システム: ${evidenceSystem}
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
      console.log('✅ 段階6: GM進行ガイド完成');
      return { gamemaster_guide: result.content };
    }
  },

  // === 段階7: 最終統合・品質確認 ===
  {
    name: '段階7: 統合・品質確認',
    weight: 10,
    handler: async (formData, context) => {
      console.log('🔧 段階7: 最終統合・全体つじつま調整開始');
      
      const concept = context.concept || '';
      const incidentCore = context.incident_core || '';
      const incidentDetails = context.incident_details || '';
      const characters = context.characters || '';
      const evidenceSystem = context.evidence_system || '';
      const gamemasterGuide = context.gamemaster_guide || '';
      
      const systemPrompt = `あなたはマーダーミステリー品質管理の最終責任者です。
これまでの全段階で作成された要素を統合し、全体のつじつま合わせと品質確認を行ってください。
30分-1時間セッションとして完璧に機能するよう最終調整してください。`;
      
      const userPrompt = `
【最終統合・品質確認依頼】

全ての生成要素:
1. 基本コンセプト: ${concept}
2. 事件核心: ${incidentCore}
3. 事件詳細: ${incidentDetails}
4. キャラクター情報: ${characters}
5. 証拠システム: ${evidenceSystem}
6. GM進行ガイド: ${gamemasterGuide}

以下の観点で最終チェックと調整を行ってください：

## 論理的整合性チェック
### キャラクター間の矛盾確認
[各キャラクターの設定、関係性、動機に矛盾がないか確認]

### 事件・証拠の論理性確認
[事件の流れ、証拠配置、解決手順に論理的問題がないか確認]

### タイムライン整合性確認
[時系列、アリバイ、行動パターンの整合性確認]

## プレイアビリティ確認
### 30分-1時間完結性
[指定時間内で確実に完結できるかの確認]

### 難易度適正性
[${formData.complexity}レベルとして適切な難易度か確認]

### 参加者体験品質
[全${formData.participants}人が楽しめる構成になっているか確認]

## 最終調整・修正点
### 発見された問題点
[チェックで発見された問題とその解決策]

### 最終版推奨事項
[セッション成功のための最終的な推奨事項]

## 完成度評価
### 品質スコア（100点満点）
- 論理性: [点数]/100
- エンターテイメント性: [点数]/100  
- プレイアビリティ: [点数]/100
- 総合評価: [点数]/100

【最終確認】このマーダーミステリーは30分-1時間セッションとして完璧に機能しますか？
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      console.log('✅ 段階7: 最終統合・全体調整完成');
      return { final_integration: result.content };
    }
  },

  // === 段階8: 全体最終確認・総合品質保証 ===
  {
    name: '段階8: 最終レビュー・総合調整完了',
    weight: 8,
    handler: async (formData, context) => {
      console.log('🏆 段階8: 全体最終確認・総合品質保証開始');
      
      const randomOutline = context.random_outline || '';
      const concept = context.concept || '';
      const incidentCore = context.incident_core || '';
      const incidentDetails = context.incident_details || '';
      const characters = context.characters || '';
      const evidenceSystem = context.evidence_system || '';
      const gamemasterGuide = context.gamemaster_guide || '';
      const finalIntegration = context.final_integration || '';
      
      const systemPrompt = `あなたは「狂気山脈　陰謀の分水嶺」レベルの品質管理最高責任者です。
理想的な生成フローを完了した全ての出力物を総合的にレビューし、最終的な品質保証を行ってください。
ランダム生成→段階的生成→全体調整が適切に行われたかを確認し、必要に応じて最終調整を指示してください。`;
      
      const userPrompt = `
【最終総合レビュー・品質保証依頼】

理想的生成フローの全段階出力:

=== ランダム生成段階 ===
段階0: ${randomOutline}

=== 段階的生成段階 ===
段階1: ${concept}
段階2: ${incidentCore}
段階3: ${incidentDetails}
段階4: ${characters}
段階5: ${evidenceSystem}
段階6: ${gamemasterGuide}
段階7: ${finalIntegration}

参加人数: ${formData.participants}人
複雑さ: ${formData.complexity}
時間目標: 30分-1時間

以下の観点で最終総合レビューを実施してください：

## 理想的生成フローの検証
### ランダム→段階的→調整の流れ確認
[各段階が前段階の出力を適切に活用しているか]

### 全体一貫性の最終確認
[ランダム生成された要素が最終的に統合されているか]

## 完成度総合評価
### 商業品質基準適合性
- 狂気山脈レベルの品質達成度: [評価]/10
- 30分-1時間完結性: [評価]/10
- エンターテイメント性: [評価]/10
- プレイアビリティ: [評価]/10

### 技術的完成度
- 論理的整合性: [評価]/10
- キャラクター深度: [評価]/10
- 謎解き設計: [評価]/10
- 進行システム: [評価]/10

## 最終推奨事項
### 成功保証のための重要ポイント
[セッション成功のために特に注意すべき点]

### 高品質体験のためのコツ
[参加者が最高の体験を得るための追加アドバイス]

## 完成宣言
### 品質証明
[このマーダーミステリーが商業レベルの品質を満たしていることの確認]

### 実用性証明
[30分-1時間セッションとして完璧に機能することの確認]

【最終判定】このマーダーミステリーは理想的な生成フローを経て、プロフェッショナル品質に達しましたか？
`;

      const result = await aiClient.generateWithRetry(systemPrompt, userPrompt);
      console.log('🎉 段階8: 最終総合レビュー完了 - プロ品質保証済み');
      return { comprehensive_review: result.content };
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

  // GET リクエスト対応（EventSource用）
  if (req.method === 'GET') {
    const { formData, sessionId, action, stream } = req.query;
    
    // EventSource接続の場合は特別処理
    if (stream === 'true') {
      console.log('🌐 EventSource接続検出');
      
      try {
        // クエリパラメータをbody形式に変換
        req.body = {
          formData: formData ? JSON.parse(formData) : {},
          sessionId: sessionId || `integrated_micro_${Date.now()}`,
          action: action || null,
          stream: true
        };
        console.log('✅ EventSource用データ変換完了');
      } catch (parseError) {
        console.error('❌ formData parse error:', parseError);
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });
        res.write(`event: error\ndata: {"error": "formDataの解析に失敗しました"}\n\n`);
        res.end();
        return;
      }
    } else {
      // 通常のGETリクエスト
      if (!formData && action !== 'init') {
        return res.status(400).json({
          success: false,
          error: 'formData is required in query params'
        });
      }
      
      req.body = {
        formData: formData ? JSON.parse(formData) : {},
        sessionId: sessionId || `integrated_micro_${Date.now()}`,
        action: action || null
      };
    }
  } else if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST or GET.' 
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
    const { formData, sessionId, action } = req.body;
    
    console.log('🔬 Starting integrated micro generation...');
    console.log('📋 Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('📋 Received formData:', JSON.stringify(formData, null, 2));
    console.log('🆔 Session ID:', sessionId);
    console.log('⚡ Action:', action);

    // action: 'init'の場合はセッション初期化のみ実行
    if (action === 'init') {
      console.log('🎯 Init action detected - セッション初期化のみ実行');
      
      const initSessionData = {
        sessionId: sessionId || `integrated_micro_${Date.now()}`,
        formData,
        startTime: new Date().toISOString(),
        phases: {},
        status: 'initialized',
        generationType: 'integrated_micro',
        action: 'init'
      };

      // 初期化完了レスポンス
      return res.status(200).json({
        success: true,
        message: 'セッション初期化完了',
        sessionData: initSessionData,
        action: 'init',
        initialized: true
      });
    }
    
    if (!formData) {
      return res.status(400).json({
        success: false,
        error: 'formData is required',
        received: req.body
      });
    }
    
    // 🎲 完全ランダムモードのチェックと処理
    if (formData.randomMode === true) {
      console.log('🎲 完全ランダムモード検出 - RandomMysteryGeneratorを使用');
      
      try {
        // ランダム生成の実行
        const randomResult = await randomMysteryGenerator.generateCompleteRandomMystery();
        
        if (!randomResult.success) {
          throw new Error('ランダム生成に失敗しました: ' + randomResult.error);
        }
        
        // ランダム生成結果を既存のsessionDataフォーマットに変換
        const convertedSessionData = convertRandomToSessionFormat(randomResult.mysteryData, formData, sessionId);
        
        // EventSource対応のレスポンス処理
        if (req.headers.accept?.includes('text/event-stream')) {
          // EventSource用のヘッダー設定
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
          });
          
          // 進捗通知を送信
          res.write(`event: start\ndata: {"message": "🎲 完全ランダム生成を開始します"}\n\n`);
          
          // 9段階進捗をシミュレートして送信
          const mockSteps = [
            { name: '段階0: ランダム全体構造・アウトライン', weight: 15 },
            { name: '段階1: コンセプト精密化・世界観詳細化', weight: 10 },
            { name: '段階2: 事件核心・犯人設定', weight: 12 },
            { name: '段階3: 事件詳細・状況設定', weight: 13 },
            { name: '段階4: キャラクター生成・関係性', weight: 15 },
            { name: '段階5: 証拠配置・手がかり体系化', weight: 18 },
            { name: '段階6: GM進行・セッション管理', weight: 8 },
            { name: '段階7: 統合・品質確認', weight: 5 },
            { name: '段階8: 最終品質保証・完成', weight: 4 }
          ];
          
          let cumulativeProgress = 0;
          
          // 各段階の進捗を順次送信
          for (let i = 0; i < mockSteps.length; i++) {
            const step = mockSteps[i];
            cumulativeProgress += step.weight;
            
            // 進捗更新を送信
            res.write(`event: progress\ndata: ${JSON.stringify({
              step: i + 1,
              totalSteps: mockSteps.length,
              stepName: step.name,
              progress: Math.min(cumulativeProgress, 100),
              estimatedTimeRemaining: Math.max(0, Math.floor((100 - cumulativeProgress) * 2 / 100)),
              message: `${step.name} 完了`
            })}\n\n`);
            
            // 少し待機してリアルな進捗感を演出
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
          // 完了通知を送信
          const finalResponse = {
            success: true,
            sessionData: convertedSessionData,
            message: '🎲 完全ランダム生成が完了しました！',
            downloadReady: true,
            generationType: 'random',
            isComplete: true
          };
          
          res.write(`event: complete\ndata: ${JSON.stringify(finalResponse)}\n\n`);
          res.end();
        } else {
          // POST用のレスポンス
          return res.status(200).json({
            success: true,
            sessionData: convertedSessionData,
            message: '🎲 完全ランダム生成が完了しました！',
            downloadReady: true,
            generationType: 'random'
          });
        }
        
        return; // 通常のフロー実行をスキップ
      } catch (error) {
        console.error('❌ ランダム生成エラー:', error);
        const errorResponse = {
          success: false,
          error: error.message || 'ランダム生成中にエラーが発生しました'
        };
        
        if (req.headers.accept?.includes('text/event-stream')) {
          // EventSource対応のエラーレスポンス
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
          });
          res.write(`event: error\ndata: ${JSON.stringify(errorResponse)}\n\n`);
          res.end();
        } else {
          return res.status(500).json(errorResponse);
        }
        return;
      }
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

    // 🎯 段階的レスポンス実装: 各段階で進捗を送信
    let isFirstStep = true;
    let isEventSource = req.body.stream === true || req.headers.accept?.includes('text/event-stream');
    
    // EventSource接続かどうかで処理を分岐
    if (isEventSource) {
      // EventSourceヘッダー設定
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      });
      
      // 接続確認
      res.write(`event: connected\ndata: {"message": "段階的生成を開始します", "sessionId": "${sessionData.sessionId}"}\n\n`);
      console.log('🌐 EventSource接続確立 - 段階的生成開始');
    }
    
    const sendProgressUpdate = (stepIndex, stepName, result, isComplete = false) => {
      if (!isEventSource) return; // EventSourceでない場合はスキップ
      
      const progressData = {
        step: stepIndex + 1,
        totalSteps: INTEGRATED_GENERATION_FLOW.length,
        stepName: stepName,
        content: result,
        progress: Math.round(((currentWeight) / totalWeight) * 100),
        isComplete,
        timestamp: new Date().toISOString(),
        estimatedTimeRemaining: Math.max(0, Math.floor((totalWeight - currentWeight) * 2 / totalWeight))
      };
      
      try {
        res.write(`event: progress\ndata: ${JSON.stringify(progressData)}\n\n`);
        console.log(`📡 Progress sent: ${stepName} (${progressData.progress}%)`);
      } catch (writeError) {
        console.error('❌ Progress write error:', writeError);
      }
    };
    
    // 真の段階的実行 - 各段階でレスポンス送信
    for (let i = 0; i < INTEGRATED_GENERATION_FLOW.length; i++) {
      const step = INTEGRATED_GENERATION_FLOW[i];
      
      console.log(`🔄 段階${i + 1}/9実行中: ${step.name}`);
      
      try {
        // 段階開始通知
        if (isFirstStep && isEventSource) {
          res.write(`event: start\ndata: {"message": "段階的生成開始", "totalSteps": ${INTEGRATED_GENERATION_FLOW.length}}\n\n`);
          isFirstStep = false;
        }
        
        // 実際の段階処理時間をシミュレート（5-15秒）
        const stepStartTime = Date.now();
        
        // 🧠 インテリジェントキャッシュチェック
        const cacheKey = createCacheKey(step.name, formData);
        const cachedResult = await intelligentCache.get(cacheKey, step.name);
        
        let result;
        if (cachedResult) {
          console.log(`💾 Using cached result for: ${step.name}`);
          result = cachedResult;
          // キャッシュの場合でも最低2秒は処理時間を確保
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          // 新規生成 - より時間をかけて品質を向上
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
          
          // 各段階に適切な処理時間を確保（5-20秒）
          const minProcessTime = step.weight > 20 ? 8000 : 5000; // 重要な段階は長め
          const maxProcessTime = step.weight > 20 ? 20000 : 12000;
          const elapsedTime = Date.now() - stepStartTime;
          const remainingTime = Math.max(0, minProcessTime - elapsedTime);
          
          if (remainingTime > 0) {
            console.log(`⏱️ 段階${i + 1}追加処理時間: ${remainingTime}ms`);
            await new Promise(resolve => setTimeout(resolve, remainingTime));
          }
        }
        
        // コンテキストに結果を追加
        Object.assign(context, result);
        
        // フェーズデータとして保存
        sessionData.phases[`step${i + 1}`] = {
          name: step.name,
          content: result,
          status: 'completed',
          completedAt: new Date().toISOString(),
          progress: Math.round(((currentWeight + step.weight) / totalWeight) * 100)
        };
        
        currentWeight += step.weight;
        
        // 段階完了を即座にフロントエンドに送信
        sendProgressUpdate(i, step.name, result, false);
        
        console.log(`✅ 段階${i + 1}完了: ${step.name} (進捗: ${Math.round((currentWeight / totalWeight) * 100)}%)`);
        
      } catch (stepError) {
        console.error(`❌ Step ${i + 1} failed: ${stepError.message}`);
        
        // エラー情報を送信
        if (isEventSource) {
          res.write(`event: error\ndata: {"step": ${i + 1}, "error": "${stepError.message}"}\n\n`);
        }
        
        // 致命的エラーではない場合は続行
        if (step.weight < 30) {
          console.log(`⚠️ Non-critical step failed, continuing...`);
          continue;
        } else {
          throw new AppError(`Critical step failed: ${step.name} - ${stepError.message}`, ErrorTypes.GENERATION_ERROR);
        }
      }
    }
    
    // 並列処理はスキップ（段階的処理のため）
    console.log('📝 段階的処理のため並列処理をスキップ');
    if (false) {
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

    // 最終完了通知を送信
    const finalResponse = {
      success: true,
      sessionData,
      message: '🎉 統合マイクロ生成が完了しました！',
      downloadReady: true,
      generationType: 'integrated_micro',
      imageCount: generatedImages.filter(img => img.status === 'success').length,
      isComplete: true
    };
    
    if (isEventSource) {
      res.write(`event: complete\ndata: ${JSON.stringify(finalResponse)}\n\n`);
      res.end();
    } else {
      return res.status(200).json(finalResponse);
    }
    
    console.log('📡 段階的生成完了 - 全9段階実行済み');

  } catch (error) {
    console.error('🚨 Integrated micro generation error:', error);
    console.error('🚨 Error stack:', error.stack);
    
    const errorResponse = {
      success: false,
      error: error.message || 'Generation failed',
      errorType: error.name || error.type || 'UnknownError',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
    
    // EventSource判定を再実行
    const isEventSourceError = req.body?.stream === true || req.headers.accept?.includes('text/event-stream');
    
    if (isEventSourceError) {
      try {
        res.write(`event: error\ndata: ${JSON.stringify(errorResponse)}\n\n`);
        res.end();
      } catch (writeError) {
        console.error('Error writing to response:', writeError);
      }
    } else {
      return res.status(500).json(errorResponse);
    }
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

/**
 * 🎲 ランダム生成結果を既存のsessionDataフォーマットに変換
 */
function convertRandomToSessionFormat(randomData, formData, sessionId) {
  const { title, genre, setting, plot, characters, clues, files } = randomData;
  
  // キャラクターハンドアウトの構築
  const characterHandouts = characters.map((char, index) => `
## 【プレイヤー${index + 1}専用ハンドアウト】

### あなたのキャラクター
**氏名**: ${char.name}
**年齢**: ${char.age}歳
**職業**: ${char.profession}
**性格**: ${char.personality}
**役割**: ${char.role}

### あなたの背景と動機
${char.secret || '特になし'}

### 他のプレイヤーとの関係性
${char.relationship || '初期段階では不明'}
`).join('\n\n---\n\n');

  // 証拠システムの構築
  const evidenceSystem = `
## 証拠配置・手がかり体系

### 重要な証拠
${clues.map((clue, i) => `
${i + 1}. **${clue.name}**
   - 種類: ${clue.type}
   - 発見場所: ${clue.location || '現場付近'}
   - 重要度: ${clue.importance || '中'}
`).join('\n')}

### 真相への道筋
${plot.chapters ? plot.chapters.join('\n\n') : plot.fullStory}
`;

  // sessionDataフォーマットに変換
  return {
    sessionId: sessionId || `random_${Date.now()}`,
    formData: {
      ...formData,
      generationType: 'random'
    },
    startTime: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: 'completed',
    generationType: 'random',
    phases: {
      step0: {
        name: 'ランダム全体構造',
        content: {
          randomOutline: `## 作品基本情報（ランダム生成）\n**作品タイトル**: ${title}\n**基本コンセプト**: ${genre}を舞台とした${setting}のミステリー\n**舞台設定**: ${setting}`
        },
        status: 'completed'
      },
      step1: {
        name: '基本コンセプト',
        content: {
          concept: `## 作品タイトル\n${title}\n\n## 作品コンセプト\nジャンル: ${genre}\n舞台: ${setting}\n\n${plot.fullStory || ''}`
        },
        status: 'completed'
      },
      step2: {
        name: '事件核心',
        content: {
          incidentCore: `## 事件の核心\n動機: ${randomData.motive}\nトリック: ${randomData.trick}\n\n被害者: ${characters.find(c => c.role === '被害者')?.name || '不明'}\n犯人: ${characters.find(c => c.role === '犯人')?.name || '不明'}`
        },
        status: 'completed'
      },
      step3: {
        name: '事件詳細',
        content: {
          incidentDetails: plot.fullStory || '詳細なプロットは生成されました'
        },
        status: 'completed'
      },
      step4: {
        name: 'キャラクター生成',
        content: {
          characters: characterHandouts,
          character_count: characters.length
        },
        status: 'completed'
      },
      step5: {
        name: '証拠配置',
        content: {
          evidence_system: evidenceSystem
        },
        status: 'completed'
      },
      step6: {
        name: 'GM進行ガイド',
        content: {
          gamemaster_guide: files['GM用真相解説']?.content || ''
        },
        status: 'completed'
      },
      step7: {
        name: '配布資料準備',
        content: {
          handouts: files['プレイヤー導入']?.content || '',
          downloadableFiles: Object.keys(files).map(key => ({
            name: files[key].filename,
            path: files[key].path,
            content: files[key].content
          }))
        },
        status: 'completed'
      }
    },
    context: randomData,
    files: files,
    images: [],
    hasImages: false
  };
}