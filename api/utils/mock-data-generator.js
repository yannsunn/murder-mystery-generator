/**
 * 🎭 Mock Data Generator for Demo Mode
 * 環境変数未設定時でも完全動作を実現するモックデータ生成システム
 */

const { logger } = require('./logger.js');

/**
 * マーダーミステリーのテンプレートデータ
 */
const MURDER_MYSTERY_TEMPLATES = {
  titles: [
    '薔薇園の殺人事件',
    '満月の夜の惨劇',
    '古城に響く悲鳴',
    '最後の晩餐会',
    '仮面舞踏会の悪夢'
  ],
  
  settings: {
    mansion: '豪華な洋館',
    hotel: '歴史あるホテル',
    school: '名門私立学園',
    island: '孤島の別荘',
    train: '豪華寝台列車'
  },
  
  motives: [
    '遺産相続をめぐる確執',
    '過去の恨みと復讐',
    '秘密の暴露を恐れて',
    '愛憎のもつれから',
    'ビジネス上の対立'
  ],
  
  characterTypes: [
    { role: '資産家', traits: ['裕福', '横柄', '秘密主義'] },
    { role: '執事', traits: ['忠実', '観察力が鋭い', '過去がある'] },
    { role: '医師', traits: ['冷静', '分析的', '倫理的'] },
    { role: '芸術家', traits: ['情熱的', '気まぐれ', '敏感'] },
    { role: '実業家', traits: ['野心的', '計算高い', '冷酷'] },
    { role: '探偵', traits: ['鋭い洞察力', '正義感', '孤独'] },
    { role: '秘書', traits: ['有能', '忠実', '観察眼'] },
    { role: '親族', traits: ['複雑な感情', '遺産への執着', '家族の秘密'] }
  ],
  
  evidence: [
    '血痕のついたナイフ',
    '破られた遺言書',
    '不審なメモ',
    '壊れた懐中時計',
    '毒薬の空き瓶',
    '目撃者の証言',
    '防犯カメラの映像',
    '被害者の日記'
  ]
};

/**
 * ランダム要素選択ヘルパー
 */
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Stage 0: ランダム全体構造生成
 */
function generateStage0Mock(formData) {
  const title = randomChoice(MURDER_MYSTERY_TEMPLATES.titles);
  const setting = MURDER_MYSTERY_TEMPLATES.settings[formData.setting] || randomChoice(Object.values(MURDER_MYSTERY_TEMPLATES.settings));
  const motive = randomChoice(MURDER_MYSTERY_TEMPLATES.motives);
  
  return `## 📖 シナリオタイトル
${title}

## 🎭 基本設定
- **舞台**: ${setting}
- **時代**: ${formData.era === 'modern' ? '現代' : formData.era}
- **参加人数**: ${formData.participants}人
- **プレイ時間**: 約2-3時間

## 📝 あらすじ
${setting}で開かれた晩餐会の最中、主催者が何者かに殺害された。
現場は密室状態で、容疑者は参加者の中にいる。
${motive}が事件の背景にあるようだが...

## 🔍 事件の核心
- 被害者は晩餐会の主催者
- 凶器は現場から消えている
- 全員にアリバイがあるように見える
- しかし、誰もが何かを隠している...`;
}

/**
 * Stage 1: コンセプト詳細化
 */
function generateStage1Mock(sessionData) {
  return `## 🎯 シナリオコンセプト
### テーマ
「仮面の下の真実」 - 誰もが本当の自分を隠している

### ジャンル
${sessionData.formData.worldview === 'realistic' ? 'リアリスティック' : sessionData.formData.worldview}・ミステリー

### トーン
${sessionData.formData.tone === 'serious' ? 'シリアス' : sessionData.formData.tone}な雰囲気で展開

### 独自性
- 全員が動機を持つ構造
- 二重、三重のトリック
- 感情的な真相の解明

### プレイヤー体験
- 推理の楽しさ
- キャラクターロールプレイ
- 意外な真相への驚き`;
}

/**
 * Stage 2: 事件の核心設定
 */
function generateStage2Mock(sessionData) {
  return `## 🔪 事件詳細
### 被害者
- **名前**: 黒崎 玲二（55歳）
- **職業**: 大企業のCEO
- **性格**: 冷酷で計算高い
- **死因**: 毒殺（ワインに混入）

### 真犯人
- **正体**: [プレイ時に明かされる]
- **動機**: 過去の裏切りへの復讐
- **トリック**: アリバイ工作と共犯者の利用

### 核心トリック
1. 毒は時間差で効果が現れる特殊なもの
2. 複数の人物が独立して犯行を計画
3. 真犯人は別の犯行を隠れ蓑に利用`;
}

/**
 * Stage 3: 状況詳細化
 */
function generateStage3Mock(sessionData) {
  return `## 🏛️ 舞台設定詳細
### 場所の詳細
- 山奥の洋館、外部との連絡は困難
- 大雪で完全に孤立状態
- 館内には隠し通路が存在

### タイムライン
- 18:00 - 晩餐会開始
- 20:30 - 被害者が苦しみ始める
- 20:45 - 被害者死亡確認
- 21:00 - 警察への連絡試みるも不通

### 現場状況
- ダイニングルームで発生
- 全員が同じワインを飲んでいた
- 被害者のグラスだけに毒物反応`;
}

/**
 * Stage 4: キャラクター生成
 */
function generateStage4Mock(sessionData) {
  const formData = sessionData.formData || sessionData || {};
  const numPlayers = parseInt(formData.participants) || 4;
  const characters = [];
  
  for (let i = 0; i < numPlayers; i++) {
    const template = MURDER_MYSTERY_TEMPLATES.characterTypes[i % MURDER_MYSTERY_TEMPLATES.characterTypes.length];
    const character = {
      id: `char_${i + 1}`,
      name: `${['佐藤', '鈴木', '田中', '高橋', '渡辺'][i % 5]} ${['太郎', '花子', '次郎', '美咲', '健一'][i % 5]}`,
      age: randomInt(25, 60),
      role: template.role,
      traits: template.traits,
      publicInfo: `${template.role}として晩餐会に参加。被害者とは${randomChoice(['仕事上の付き合い', '親族関係', '古い友人', '取引相手'])}。`,
      secretInfo: `実は${randomChoice(['多額の借金がある', '被害者に弱みを握られていた', '遺産を狙っていた', '過去に確執があった'])}。`,
      relationships: [],
      motive: randomChoice(MURDER_MYSTERY_TEMPLATES.motives),
      alibi: `事件当時は${randomChoice(['他の参加者と会話していた', '一人で部屋にいた', 'トイレに行っていた', 'バルコニーで煙草を吸っていた'])}`
    };
    characters.push(character);
  }
  
  // 関係性を追加
  characters.forEach((char, i) => {
    const otherIndex = (i + 1) % characters.length;
    char.relationships.push({
      targetId: characters[otherIndex].id,
      relationship: randomChoice(['協力関係', '対立関係', '恋愛関係', '利害関係'])
    });
  });
  
  return {
    characters: characters,
    summary: `${numPlayers}人のキャラクターを生成しました。それぞれが独自の秘密と動機を持っています。`
  };
}

/**
 * Stage 5: 証拠システム設計
 */
function generateStage5Mock(sessionData) {
  const evidence = [];
  const numEvidence = randomInt(8, 12);
  
  for (let i = 0; i < numEvidence; i++) {
    evidence.push({
      id: `evidence_${i + 1}`,
      name: randomChoice(MURDER_MYSTERY_TEMPLATES.evidence),
      description: `この証拠は${randomChoice(['犯人を示唆する', '動機を明らかにする', 'アリバイを崩す', 'トリックを暴く'])}重要な手がかりです。`,
      location: randomChoice(['現場', '被害者の部屋', '廊下', '書斎', '庭園']),
      discoveredBy: randomChoice(['全員で発見', '特定のキャラクターが発見', 'GM主導で公開'])
    });
  }
  
  return {
    evidence: evidence,
    clueDistribution: '各キャラクターに2-3個の手がかりを配布',
    redHerrings: '誤導用の証拠も3つ含まれています'
  };
}

/**
 * Stage 6: GM進行設計
 */
function generateStage6Mock(sessionData) {
  return `## 🎮 GM進行ガイド
### 導入フェーズ（20分）
1. 舞台設定の説明
2. キャラクター紹介
3. 晩餐会の開始
4. 事件発生の演出

### 捜査フェーズ（60分）
1. 現場検証
2. 証拠品の発見
3. キャラクター間の情報交換
4. 追加情報の開示タイミング

### 推理フェーズ（30分）
1. 各自の推理発表
2. 議論と反論
3. 最終推理の準備

### 解決フェーズ（20分）
1. 真相の開示
2. トリックの解説
3. エピローグ

### GM用ヒント
- プレイヤーが行き詰まったら追加ヒントを
- 感情的な演出を大切に
- 全員が楽しめるよう配慮`;
}

/**
 * Stage 7: 統合チェック
 */
function generateStage7Mock(sessionData) {
  return {
    consistency: {
      timeline: '✅ タイムラインに矛盾なし',
      characters: '✅ キャラクター設定に一貫性あり',
      evidence: '✅ 証拠が論理的に配置',
      solution: '✅ 解決可能な謎として成立'
    },
    balance: {
      difficulty: '中級者向けの難易度',
      playtime: '2-3時間で完結',
      roleplay: 'ロールプレイと推理のバランス良好'
    },
    improvements: []
  };
}

/**
 * Stage 8: 最終品質確認
 */
function generateStage8Mock(sessionData) {
  return {
    qualityScore: 92,
    checklist: {
      story: '✅ ストーリーの完成度: 優秀',
      characters: '✅ キャラクターの魅力: 良好',
      mystery: '✅ ミステリーの質: 優秀',
      playability: '✅ プレイアビリティ: 良好'
    },
    finalNotes: 'デモモードで生成されたシナリオです。実際のAI生成ではより詳細で独創的なシナリオが作成されます。'
  };
}

/**
 * 統合モック生成関数
 */
function generateMockResponse(systemPrompt, userPrompt, context = {}) {
  logger.info('🎭 Generating mock response for demo mode');
  
  // プロンプトから段階を判定
  if (userPrompt.includes('段階0') || userPrompt.includes('全体構造')) {
    return generateStage0Mock(context.formData || {});
  } else if (userPrompt.includes('段階1') || userPrompt.includes('コンセプト')) {
    return generateStage1Mock(context);
  } else if (userPrompt.includes('段階2') || userPrompt.includes('事件の核心')) {
    return generateStage2Mock(context);
  } else if (userPrompt.includes('段階3') || userPrompt.includes('状況詳細')) {
    return generateStage3Mock(context);
  } else if (userPrompt.includes('段階4') || userPrompt.includes('キャラクター')) {
    return generateStage4Mock(context);
  } else if (userPrompt.includes('段階5') || userPrompt.includes('証拠')) {
    return generateStage5Mock(context);
  } else if (userPrompt.includes('段階6') || userPrompt.includes('GM進行')) {
    return generateStage6Mock(context);
  } else if (userPrompt.includes('段階7') || userPrompt.includes('統合')) {
    return generateStage7Mock(context);
  } else if (userPrompt.includes('段階8') || userPrompt.includes('品質')) {
    return generateStage8Mock(context);
  }
  
  // デフォルトレスポンス
  return `## 🎭 デモモード
このシナリオはデモモードで生成されています。
実際のAI生成機能を利用するには、環境変数の設定が必要です。

### 設定が必要な環境変数:
- GROQ_API_KEY: AI生成機能
- SUPABASE_URL/KEY: データ保存機能

詳細はドキュメントをご確認ください。`;
}

/**
 * キャラクターハンドアウト生成
 */
function generateCharacterHandout(character) {
  return `# キャラクターシート: ${character.name}

## 基本情報
- **年齢**: ${character.age}歳
- **職業**: ${character.role}
- **性格**: ${character.traits.join('、')}

## 公開情報
${character.publicInfo}

## 秘密情報（他のプレイヤーには内緒）
${character.secretInfo}

## 他のキャラクターとの関係
${character.relationships.map(rel => `- ${rel.targetId}: ${rel.relationship}`).join('\n')}

## あなたの目的
1. 自分の秘密を守る
2. 真相を推理する
3. 疑いを晴らす

## アリバイ
${character.alibi}

---
*このキャラクターを演じて、事件の真相を解明してください！*`;
}

module.exports = {
  generateMockResponse,
  generateCharacterHandout,
  MURDER_MYSTERY_TEMPLATES,
  generateStage0Mock,
  generateStage1Mock,
  generateStage2Mock,
  generateStage3Mock,
  generateStage4Mock,
  generateStage5Mock,
  generateStage6Mock,
  generateStage7Mock,
  generateStage8Mock
};