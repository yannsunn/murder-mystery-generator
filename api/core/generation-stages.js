/**
 * 🏆 Murder Mystery Generation Stages
 * 段階的生成処理の実装
 */

const { aiClient } = require('../utils/ai-client.js');
const { logger } = require('../utils/logger.js');

// プレイ時間取得ユーティリティ
function getPlayTime(complexity) {
  const timeMap = {
    'simple': '30分',
    'standard': '45分', 
    'complex': '60分'
  };
  return timeMap[complexity] || '45分';
}

// フォールバックキャラクター生成
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

// 段階的生成フロー定義
const INTEGRATED_GENERATION_FLOW = [
  // === 段階0: ランダム全体構造生成 ===
  {
    name: '段階0: ランダム全体構造・アウトライン',
    weight: 15,
    handler: async (accumulatedData) => {
      logger.debug('🎲 段階0: ランダム全体構造生成開始');
      
      const { formData } = accumulatedData;
      
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
      logger.debug('✅ 段階0: ランダム全体構造完成');
      return { random_outline: result.content };
    }
  },

  // === 段階1: 基本コンセプト精密化 ===
  {
    name: '段階1: コンセプト精密化・世界観詳細化',
    weight: 10,
    handler: async (accumulatedData) => {
      const { formData } = accumulatedData;
      logger.debug('🎨 段階1: コンセプト精密化開始');
      
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
      logger.debug('✅ 段階1: 基本コンセプト完成');
      return { concept: result.content };
    }
  },

  // === 段階2: 事件核心部の設計 ===
  {
    name: '段階2: 事件核心・犯人・動機設定',
    weight: 12,
    handler: async (accumulatedData) => {
      const { formData } = accumulatedData;
      logger.debug('🕵️ 段階2: 事件核心部詳細設計開始');
      
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
      logger.debug('✅ 段階2: 事件核心部完成');
      return { incident_core: result.content };
    }
  },

  // === 段階3: 事件詳細・タイムライン構築 ===
  {
    name: '段階3: 事件詳細・基本タイムライン',
    weight: 15,
    handler: async (accumulatedData) => {
      const { formData } = accumulatedData;
      logger.debug('⏰ 段階3: 事件詳細・タイムライン構築開始');
      
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
      logger.debug('✅ 段階3: 事件詳細・タイムライン完成');
      return { incident_details: result.content };
    }
  },

  // === 段階4: 段階的キャラクター生成システム ===
  {
    name: '段階4: 段階的キャラクター生成システム',
    weight: 35,
    handler: async (accumulatedData) => {
      const { formData } = accumulatedData;
      try {
        const randomOutline = context.random_outline || '';
        const concept = context.concept || '';
        const incidentCore = context.incident_core || '';
        const incidentDetails = context.incident_details || '';
        const participantCount = parseInt(formData.participants) || 5;
        
        logger.debug(`👥 段階的キャラクター生成開始: ${participantCount}人`);
        
        let allCharacters = [];
        let characterRelationships = '';
        
        // 段階1: 各キャラクターを並列で生成（パフォーマンス最適化）
        logger.debug(`🚀 並列キャラクター生成開始: ${participantCount}人`);
        
        // 並列処理用のプロミス配列を作成
        const characterPromises = Array.from({length: participantCount}, (_, i) => {
          const playerId = i + 1;
          logger.debug(`🎭 プレイヤー${playerId}のキャラクター生成開始...`);
          
          const systemPrompt = `あなたは「狂気山脈　陰謀の分水嶺」レベルのプロフェッショナルマーダーミステリーキャラクター設計専門家です。
30分-1時間セッション用の魅力的で複雑なキャラクターを一人ずつ丁寧に作成してください。`;
          
          const userPrompt = `
【プレイヤー${playerId}専用キャラクター作成】

ランダム全体構造: ${randomOutline}
作品情報: ${concept}
事件核心: ${incidentCore}
事件詳細: ${incidentDetails}
参加人数: ${participantCount}人中の${playerId}人目
既存キャラクター: [並列生成中のため、後で関係性を調整]

以下の形式でプレイヤー${playerId}の完全なハンドアウトを作成してください：

## 【プレイヤー${playerId}専用ハンドアウト】

### あなたのキャラクター
**氏名**: [フルネーム - 他のプレイヤーと重複しないユニークな名前]
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
[関係性は後で調整されます]

【絶対要求】
- 他のキャラクターとの名前重複禁止
- 事件と有意義な関連性を持たせる
- 30分-1時間で演じ切れる程度の複雑さ
- 全ての文章を完結させる
`;

          return aiClient.generateWithRetry(systemPrompt, userPrompt).then(result => {
            // キャラクター情報を抽出して保存
            const nameMatch = result.content.match(/\*\*氏名\*\*:\s*([^\n]+)/);
            const character = {
              playerId: playerId,
              name: nameMatch ? nameMatch[1].replace(/\[|\]/g, '').trim() : `プレイヤー${playerId}`,
              handout: result.content
            };
            
            logger.debug(`✅ プレイヤー${playerId} (${character.name}) 生成完了`);
            return character;
          });
        });
        
        // 全キャラクターの生成を並列実行
        allCharacters = await Promise.all(characterPromises);
        logger.debug(`🎉 並列キャラクター生成完了: ${allCharacters.length}人`);
        
        // 名前重複チェック
        const nameSet = new Set();
        const duplicateNames = [];
        allCharacters.forEach(char => {
          if (nameSet.has(char.name)) {
            duplicateNames.push(char.name);
          } else {
            nameSet.add(char.name);
          }
        });
        
        if (duplicateNames.length > 0) {
          logger.warn(`⚠️ 名前重複検出: ${duplicateNames.join(', ')} - 関係性調整で修正されます`);
        }
        
        // 段階2: 全体の関係性を調整し、つじつまを合わせる
        logger.debug('🔗 全体の関係性調整中...');
        
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
        logger.debug('🔄 ハンドアウトの関係性情報更新中...');
        
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
          logger.debug(`✅ ${character.name}のハンドアウト更新完了`);
        }
        
        // 最終結果をフォーマット
        const finalCharacterHandouts = allCharacters.map(c => c.handout).join('\n\n---\n\n');
        
        logger.debug('🎉 段階的キャラクター生成完了!');
        
        return {
          characters: finalCharacterHandouts,
          character_relationships: characterRelationships,
          character_count: participantCount,
          character_list: allCharacters.map(c => ({ name: c.name, playerId: c.playerId }))
        };
        
      } catch (error) {
        logger.error('❌ 段階的キャラクター生成エラー:', error);
        
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
    handler: async (accumulatedData) => {
      const { formData } = accumulatedData;
      logger.debug('🔍 段階5: 証拠配置・手がかり体系化開始');
      
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
      logger.debug('✅ 段階5: 証拠配置・手がかり体系化完成');
      return { evidence_system: result.content };
    }
  },

  // === 段階6: GM進行ガイド作成 ===
  {
    name: '段階6: GM進行ガイド・セッション管理',
    weight: 20,
    handler: async (accumulatedData) => {
      const { formData } = accumulatedData;
      logger.debug('🎓 段階6: GM進行ガイド・セッション管理作成開始');
      
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
    handler: async (accumulatedData) => {
      const { formData } = accumulatedData;
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
      logger.debug('✅ 段階6: GM進行ガイド完成');
      return { gamemaster_guide: result.content };
    }
  },

  // === 段階7: 最終統合・品質確認 ===
  {
    name: '段階7: 統合・品質確認',
    weight: 10,
    handler: async (accumulatedData) => {
      const { formData } = accumulatedData;
      logger.debug('🔧 段階7: 最終統合・全体つじつま調整開始');
      
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
      logger.debug('✅ 段階7: 最終統合・全体調整完成');
      return { final_integration: result.content };
    }
  },

  // === 段階8: 全体最終確認・総合品質保証 ===
  {
    name: '段階8: 最終レビュー・総合調整完了',
    weight: 8,
    handler: async (accumulatedData) => {
      const { formData } = accumulatedData;
      logger.debug('🏆 段階8: 全体最終確認・総合品質保証開始');
      
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
      logger.debug('🎉 段階8: 最終総合レビュー完了 - プロ品質保証済み');
      return { comprehensive_review: result.content };
    }
  }
];

// CommonJS形式でエクスポート
module.exports = {
  INTEGRATED_GENERATION_FLOW
};