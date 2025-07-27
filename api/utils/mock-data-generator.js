/**
 * 🎭 Mock Data Generator - 完全オフライン動作用モックデータ生成器
 * 環境変数なしでもリアルなマーダーミステリーを生成
 */

const { logger } = require('./logger.js');

// 基本テンプレートデータ
const MOCK_TEMPLATES = {
  titles: [
    '雪山の館の殺人事件',
    '消えた遺産と最後の晩餐',
    '深夜特急の密室殺人',
    '孤島の古城に響く銃声',
    '仮面舞踏会の悲劇',
    '満月の夜の連続殺人',
    '閉ざされた研究所の謎',
    '豪華客船最後の航海'
  ],
  
  settings: [
    { name: '雪山の山荘', description: '吹雪で外界から隔絶された山荘' },
    { name: '孤島の洋館', description: '嵐で船が出せない絶海の孤島' },
    { name: '豪華客船', description: '大海原を航行中の豪華客船' },
    { name: '古城', description: '歴史ある古城での晩餐会' },
    { name: '研究施設', description: '極秘研究を行う隔離施設' }
  ],
  
  characterTypes: [
    { role: '医師', traits: '冷静沈着、観察力が鋭い' },
    { role: '実業家', traits: '野心的、秘密が多い' },
    { role: '執事', traits: '忠実、全てを見ている' },
    { role: '探偵', traits: '論理的、真実を追求' },
    { role: '令嬢', traits: '気品がある、実は強か' },
    { role: '作家', traits: '想像力豊か、人間観察が趣味' },
    { role: '弁護士', traits: '弁が立つ、正義感が強い' },
    { role: '記者', traits: '好奇心旺盛、真相を暴きたがる' }
  ],
  
  motives: [
    '遺産相続を巡る争い',
    '過去の復讐',
    '秘密の暴露を防ぐため',
    '歪んだ愛情',
    '正義の執行',
    '隠された血縁関係'
  ],
  
  tricks: [
    '密室トリック',
    'アリバイトリック',
    '入れ替わりトリック',
    '時間差トリック',
    '凶器すり替えトリック'
  ],
  
  evidence: [
    { name: '血痕のついた手袋', type: '物的証拠' },
    { name: '破られた手紙', type: '文書証拠' },
    { name: '目撃証言メモ', type: '証言' },
    { name: '凶器の包丁', type: '物的証拠' },
    { name: '防犯カメラ映像', type: '記録' },
    { name: '被害者の日記', type: '文書証拠' }
  ]
};

// キャラクター名生成用データ
const NAMES = {
  first: ['太郎', '花子', '健一', '美咲', '翔太', '愛子', '大輔', '由美'],
  last: ['田中', '佐藤', '鈴木', '高橋', '渡辺', '山田', '中村', '小林']
};

/**
 * ランダム選択ヘルパー
 */
function randomSelect(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * モックデータ生成クラス
 */
class MockDataGenerator {
  constructor() {
    this.sessionId = `mock_${Date.now()}`;
    this.usedNames = new Set();
  }

  /**
   * ユニークな名前を生成
   */
  generateUniqueName() {
    let attempts = 0;
    while (attempts < 50) {
      const firstName = randomSelect(NAMES.first);
      const lastName = randomSelect(NAMES.last);
      const fullName = `${lastName} ${firstName}`;
      
      if (!this.usedNames.has(fullName)) {
        this.usedNames.add(fullName);
        return fullName;
      }
      attempts++;
    }
    // フォールバック：番号付き名前
    const num = this.usedNames.size + 1;
    const name = `プレイヤー${num}`;
    this.usedNames.add(name);
    return name;
  }

  /**
   * 段階0: ランダム全体構造生成
   */
  generateStage0(formData) {
    const title = randomSelect(MOCK_TEMPLATES.titles);
    const setting = randomSelect(MOCK_TEMPLATES.settings);
    const trick = randomSelect(MOCK_TEMPLATES.tricks);
    const motive = randomSelect(MOCK_TEMPLATES.motives);
    
    return `## 作品基本情報（ランダム版）
**作品タイトル**: ${title}
**基本コンセプト**: ${setting.description}を舞台にした本格ミステリー
**舞台設定**: ${setting.name}

## 事件の大まかな構造（ランダム版）
**事件の種類**: 殺人事件
**犯人の数**: 単独犯
**基本的な動機**: ${motive}
**主なトリック**: ${trick}

## キャラクターの大まかな役割（ランダム版）
${Array.from({length: parseInt(formData.participants || 5)}, (_, i) => 
  `**プレイヤー${i + 1}**: ${randomSelect(MOCK_TEMPLATES.characterTypes).role}`
).join('\n')}

## 重要な要素（ランダム版）
**主な証拠**: ${randomSelect(MOCK_TEMPLATES.evidence).name}
**キーとなる手がかり**: 被害者の最後の言葉
**メインイベント**: 事件発生と真相解明

## 大まかな解決フロー（ランダム版）
**第1段階**: 事件発生・現場保全
**第2段階**: 証拠収集・アリバイ確認  
**第3段階**: 推理・犯人特定`;
  }

  /**
   * 段階1: コンセプト精密化
   */
  generateStage1(formData, previousData) {
    const complexity = formData.complexity || 'standard';
    const playTime = complexity === 'simple' ? '30分' : complexity === 'complex' ? '60分' : '45分';
    
    return `## 作品タイトル
${randomSelect(MOCK_TEMPLATES.titles)}

## 作品コンセプト
${randomSelect(MOCK_TEMPLATES.settings).description}を舞台に、${randomSelect(MOCK_TEMPLATES.motives)}を巡る本格推理劇。
参加者全員が重要な役割を持ち、誰もが犯人である可能性を秘めています。
${playTime}という短時間で、緊張感あふれる推理体験をお届けします。

## 舞台設定詳細
### 基本設定
時代: 現代
場所: ${randomSelect(MOCK_TEMPLATES.settings).name}
状況: 外界から隔絶された密室状態

### 雰囲気・トーン設計
${formData.tone === 'serious' ? '重厚で緊迫感のある' : formData.tone === 'comedic' ? '軽快でユーモアのある' : 'バランスの取れた'}雰囲気

### 独自要素・差別化ポイント
- 全員が秘密を抱えている
- 誰もが動機を持っている
- 最後まで犯人が分からない構成

## プレイヤー役職概要
${formData.participants}人それぞれが独自の背景と秘密を持つキャラクター

## 事件の核心
深夜に発生した殺人事件。被害者は全員と何らかの関係があり、それぞれに動機が...

## 導入シナリオ（全体配布用・完結版）
静かな夜、突然響き渡る悲鳴。駆けつけた一同が見たものは、変わり果てた姿の被害者だった。
外は嵐。警察を呼ぶことはできない。この中に犯人がいる。
今、生き残りをかけた推理ゲームが始まる...`;
  }

  /**
   * 段階2: 事件核心部の設計
   */
  generateStage2(formData, previousData) {
    const criminalNum = randomNumber(1, parseInt(formData.participants));
    
    return `## 事件の核心構造

### 犯人の特定
**真の犯人**: プレイヤー${criminalNum}
**犯人の特徴**: 一見すると最も疑われにくい人物

### 根本的動機
**主動機**: ${randomSelect(MOCK_TEMPLATES.motives)}
**副次的要因**: 長年の恨みと最近の決定的な出来事
**隠したい秘密**: 被害者との隠された関係

### 犯行手段・トリック
**基本的な手段**: 深夜の犯行
**使用したトリック**: ${randomSelect(MOCK_TEMPLATES.tricks)}
**犯行時刻**: 午前2時頃

### 重要な証拠
**物的証拠**: ${randomSelect(MOCK_TEMPLATES.evidence).name}
**状況証拠**: 現場の不自然な状況
**証言証拠**: 矛盾する複数の目撃証言

### ミスリード要素（簡潔版）
他の参加者も動機があり、怪しい行動をしていた`;
  }

  /**
   * 段階3: 事件詳細・タイムライン
   */
  generateStage3(formData, previousData) {
    return `## 事件発生前タイムライン（簡潔版）
### 重要前史（事件1週間前〜）
- 1週間前: 被害者が重要な決定を下す
- 3日前: 関係者全員に招待状が届く
- 前日: 全員が現地に到着

### 事件当日タイムライン（詳細版）
**午前**:
- 10:00: 朝食会で全員が顔合わせ
- 11:00: それぞれ自由行動

**午後**:
- 14:00: 昼食会
- 16:00: 被害者が重要な発表を予告

**夜間**:
- 20:00: 夕食会
- 22:00: 被害者が部屋に戻る
- 02:00: 事件発生
- 06:00: 遺体発見

## 事件現場詳細
### 現場の状況
密室状態の被害者の部屋。窓は内側から施錠、ドアも同様。

### 重要な物的証拠
- ${randomSelect(MOCK_TEMPLATES.evidence).name}
- 現場に残された不審な痕跡
- 被害者の最後のメモ

## アリバイ・行動パターン
各人物の事件時刻前後の行動には矛盾点が...`;
  }

  /**
   * 段階4: キャラクター生成
   */
  generateStage4(formData, previousData) {
    const participantCount = parseInt(formData.participants) || 5;
    const characters = [];
    
    // 犯人を決定（ランダム）
    const criminalIndex = randomNumber(0, participantCount - 1);
    
    for (let i = 0; i < participantCount; i++) {
      const name = this.generateUniqueName();
      const age = randomNumber(25, 55);
      const role = randomSelect(MOCK_TEMPLATES.characterTypes);
      const isCriminal = i === criminalIndex;
      
      characters.push(`## 【プレイヤー${i + 1}専用ハンドアウト】

### あなたのキャラクター
**氏名**: ${name}
**年齢**: ${age}歳
**職業**: ${role.role}
**性格**: ${role.traits}
**外見**: 清潔感のある服装、${age < 40 ? '若々しい' : '落ち着いた'}印象

### あなたの背景と動機
${isCriminal ? 
  `あなたは被害者に深い恨みを持っていました。表面上は友好的に振る舞っていましたが、
心の中では復讐の機会を狙っていました。今回の集まりは、その絶好の機会でした。` :
  `あなたは被害者とは${randomSelect(['古い友人', 'ビジネスパートナー', '親戚', '知人'])}の関係でした。
最近、被害者との間に${randomSelect(['金銭トラブル', '意見の相違', '過去の確執'])}がありました。`}

### あなただけが知っている秘密
**重要な秘密**: ${isCriminal ? 
  '事件当夜、あなたは被害者の部屋を訪れていた' : 
  randomSelect([
    '被害者から借金をしていた',
    '被害者の秘密を知っていた', 
    '被害者と口論していた',
    '怪しい人影を目撃していた'
  ])}
**隠したいこと**: ${isCriminal ? '犯行の事実' : '自分も疑われる可能性がある行動'}
**特別な知識**: ${isCriminal ? 'トリックの詳細' : '事件解決のヒントとなる情報'}

### あなたの目標と行動指針
**主目標**: ${isCriminal ? '犯行を隠し通す' : '真実を明らかにする'}
**秘密の目標**: ${isCriminal ? '他の人物に疑いを向ける' : '自分の秘密を守る'}
**行動指針**: ${isCriminal ? '協力的に見せかけて情報を操作' : '積極的に情報収集'}

### 重要な所持品・証拠
- ${randomSelect(['手帳', '携帯電話', '鍵', '写真'])}
- ${isCriminal ? '犯行に関連するアイテム（隠している）' : '無実を証明できるかもしれないアイテム'}

### 他のプレイヤーとの関係性
全員と面識があり、それぞれに異なる感情を抱いています。
特に注意すべき人物がいるかもしれません...`);
    }
    
    return characters.join('\n\n---\n\n');
  }

  /**
   * 段階5: 証拠配置
   */
  generateStage5(formData, previousData) {
    return `## 事件発生・発見シーン（完結版）
- **事件発生の瞬間**: 深夜2時頃、館は静寂に包まれていた。その時、一つの部屋で悲劇が...
- **発見シーン**: 朝6時、朝食の準備をしていた者が、返事のない部屋のドアを開けると...
- **初期状況**: 全員がパニックに陥る中、冷静に状況を把握しようとする者も

## 短時間解決構造（30分-1時間特化）
### 【導入段階（5分）】
- 事件概要の説明
- 各自のハンドアウト確認

### 【調査段階（15-35分）】  
- 現場検証
- 相互尋問
- 証拠の検討

### 【解決段階（10-20分）】
- 推理発表
- 真相解明

## 証拠システム
- ${MOCK_TEMPLATES.evidence.map(e => e.name).slice(0, 3).join('\n- ')}
- 各人物の証言メモ
- タイムラインの矛盾`;
  }

  /**
   * 段階6: GM進行ガイド
   */
  generateStage6(formData, previousData) {
    const timeLimit = formData.complexity === 'simple' ? '30分' : 
                     formData.complexity === 'complex' ? '60分' : '45分';
    
    return `## 事前準備チェックリスト
- ハンドアウト ${formData.participants}部
- 証拠カード一式
- タイマー
- メモ用紙

## ${timeLimit}完全進行マニュアル

### 開始前（3分）
- 簡単なルール説明
- ハンドアウト配布
- 質疑応答

### 導入（5-10分）
- 事件発生の説明
- 初期情報の共有
- 調査開始の宣言

### 調査（${timeLimit === '30分' ? '20分' : timeLimit === '45分' ? '30分' : '40分'}）
- 自由な情報交換
- 証拠の開示
- GMへの質問対応

### 解決（5-10分）
- 最終推理タイム
- 犯人指名
- 真相解明

## 進行のコツ
- 時間管理を厳密に
- 全員が発言できるよう配慮
- 行き詰まったらヒントを提供`;
  }

  /**
   * 段階7: 最終統合
   */
  generateStage7(formData, previousData) {
    return `## 最終品質チェック

### 論理的整合性 ✓
- キャラクター設定に矛盾なし
- タイムラインが成立
- 証拠と真相が一致

### プレイアビリティ ✓
- ${formData.complexity === 'simple' ? '30分' : formData.complexity === 'complex' ? '60分' : '45分'}で完結可能
- 難易度が適切
- 全員が楽しめる構成

### 完成度評価
- 論理性: 85/100
- エンターテイメント性: 90/100
- プレイアビリティ: 95/100
- 総合評価: 90/100

このシナリオは短時間セッションとして十分な品質を持っています。`;
  }

  /**
   * 段階8: 最終レビュー
   */
  generateStage8(formData, previousData) {
    return `## 最終総合レビュー

### 生成品質確認
全ての段階が適切に生成され、一貫性のあるシナリオが完成しました。

### 商業品質基準適合性
- 短時間プレイに最適化: 10/10
- エンターテイメント性: 9/10
- プレイアビリティ: 10/10

### 最終推奨事項
1. 時間管理を確実に行う
2. 全員が参加できるよう配慮
3. 楽しい雰囲気作りを心がける

### 完成宣言
このマーダーミステリーは、環境変数なしでも完全に機能する高品質なシナリオです。
デモモードでの生成ですが、実際のプレイに十分使用可能な内容となっています。

【注意】これはAIを使用せずに生成されたデモシナリオです。
実際のAI生成版では、より複雑で独創的なシナリオが作成されます。`;
  }

  /**
   * 統合生成メソッド
   */
  async generateCompleteScenario(formData) {
    logger.info('🎭 Mock data generation started');
    
    const stages = [
      { name: '段階0: ランダム全体構造', handler: () => this.generateStage0(formData) },
      { name: '段階1: コンセプト精密化', handler: (prev) => this.generateStage1(formData, prev) },
      { name: '段階2: 事件核心設計', handler: (prev) => this.generateStage2(formData, prev) },
      { name: '段階3: タイムライン構築', handler: (prev) => this.generateStage3(formData, prev) },
      { name: '段階4: キャラクター生成', handler: (prev) => this.generateStage4(formData, prev) },
      { name: '段階5: 証拠配置', handler: (prev) => this.generateStage5(formData, prev) },
      { name: '段階6: GM進行ガイド', handler: (prev) => this.generateStage6(formData, prev) },
      { name: '段階7: 最終統合', handler: (prev) => this.generateStage7(formData, prev) },
      { name: '段階8: 最終レビュー', handler: (prev) => this.generateStage8(formData, prev) }
    ];
    
    let accumulatedData = { formData, sessionId: this.sessionId };
    
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      logger.debug(`Generating mock data for ${stage.name}`);
      
      // 少し遅延を入れてリアリティを出す
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const content = stage.handler(accumulatedData);
      const key = `stage_${i}_content`;
      accumulatedData[key] = content;
      
      // 特定の段階の結果を適切なキーに保存
      switch (i) {
        case 0:
          accumulatedData.random_outline = content;
          break;
        case 1:
          accumulatedData.concept = content;
          break;
        case 2:
          accumulatedData.incident_core = content;
          break;
        case 3:
          accumulatedData.incident_details = content;
          break;
        case 4:
          accumulatedData.characters = content;
          break;
        case 5:
          accumulatedData.evidence_system = content;
          break;
        case 6:
          accumulatedData.gamemaster_guide = content;
          break;
        case 7:
          accumulatedData.final_integration = content;
          break;
        case 8:
          accumulatedData.comprehensive_review = content;
          break;
      }
    }
    
    // 最終的なシナリオデータを構築
    accumulatedData.title = randomSelect(MOCK_TEMPLATES.titles);
    accumulatedData.description = `${randomSelect(MOCK_TEMPLATES.settings).description}を舞台にした本格ミステリー。環境変数なしで生成されたデモシナリオです。`;
    accumulatedData.mockGenerated = true;
    accumulatedData.generatedAt = new Date().toISOString();
    
    logger.success('✅ Mock scenario generation completed');
    return accumulatedData;
  }
}

// エクスポート
module.exports = {
  MockDataGenerator,
  MOCK_TEMPLATES
};