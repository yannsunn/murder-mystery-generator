/**
 * 🎲 完全ランダムミステリー生成エンジン
 * Google Drive構造準拠・狂気山脈スタイル
 */

import { aiClient } from './ai-client.js';
import { logger } from './logger.js';

// ランダム要素のテンプレート
const RANDOM_ELEMENTS = {
  genres: [
    'クローズドサークル',
    '本格推理',
    '社会派ミステリー',
    'ハードボイルド',
    'ゴシックミステリー',
    '心理サスペンス',
    'SF推理',
    '歴史ミステリー'
  ],
  
  settings: [
    '雪山に閉ざされた山荘',
    'オンラインゲームの仮想世界',
    '未来のAI管理都市',
    '歴史ある孤島の古城',
    '豪華客船の船上',
    '廃墟と化した病院',
    '深海調査施設',
    '宇宙ステーション',
    '地下鉄の廃駅',
    '古い図書館の密室'
  ],
  
  tricks: [
    '完璧なアリバイトリック',
    '密室殺人の謎',
    '消失した遺体',
    '記憶を失った容疑者',
    '複数人協力による計画犯罪',
    '特定条件でのみ解ける暗号',
    '時限式の連続殺人',
    '人格交代による犯行',
    'AI予測不能な殺人計画',
    '過去の事件との意外な繋がり'
  ],
  
  motives: [
    '過去の復讐',
    '隠された相続問題',
    '秘密の暴露阻止',
    '歪んだ愛情',
    '正義の執行',
    '組織的陰謀',
    '狂気と妄想',
    '生存本能',
    '名誉の回復',
    '予期せぬ誤解'
  ]
};

// ランダム選択ヘルパー
const randomSelect = (array) => array[Math.floor(Math.random() * array.length)];
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Google Drive構造生成クラス
export class RandomMysteryGenerator {
  constructor() {
    this.mysteryData = {
      title: '',
      genre: '',
      setting: '',
      trick: '',
      motive: '',
      characters: [],
      plot: {},
      clues: [],
      files: {}
    };
  }

  // ステップ1: 基本要素のランダム生成
  async generateBasicElements() {
    console.log('🎲 ステップ1: 基本要素のランダム生成開始');
    
    this.mysteryData.genre = randomSelect(RANDOM_ELEMENTS.genres);
    this.mysteryData.setting = randomSelect(RANDOM_ELEMENTS.settings);
    this.mysteryData.trick = randomSelect(RANDOM_ELEMENTS.tricks);
    this.mysteryData.motive = randomSelect(RANDOM_ELEMENTS.motives);
    
    // タイトル生成
    const titlePrompt = `以下の要素を持つミステリーの魅力的なタイトルを1つ生成してください：
    ジャンル: ${this.mysteryData.genre}
    舞台: ${this.mysteryData.setting}
    
    タイトルのみを返してください。`;
    
    const titleResponse = await aiClient.generateContent({
      prompt: titlePrompt,
      temperature: 0.9
    });
    
    this.mysteryData.title = titleResponse.content || `${this.mysteryData.setting}の謎`;
    
    return this.mysteryData;
  }

  // ステップ2: キャラクター生成
  async generateCharacters() {
    console.log('👥 ステップ2: キャラクター生成開始');
    
    const characterCount = randomNumber(6, 8);
    const characterPrompt = `
以下の設定のミステリーに登場する${characterCount}人のキャラクターを生成してください：

タイトル: ${this.mysteryData.title}
ジャンル: ${this.mysteryData.genre}
舞台: ${this.mysteryData.setting}
核となるトリック: ${this.mysteryData.trick}
犯人の動機: ${this.mysteryData.motive}

必ず以下の役割を含めてください：
1. 被害者（1名）
2. 犯人（1名）
3. 探偵役または主人公（1名）
4. 主要容疑者（2-3名）
5. キーパーソン（1-2名）

各キャラクターについて以下の形式で出力してください：

**キャラクター[番号]**
- 名前: [フルネーム]
- 年齢: [年齢]
- 職業: [職業]
- 役割: [被害者/犯人/探偵役/容疑者/キーパーソン]
- 性格: [簡潔な性格描写]
- 事件との関連: [事件とどう関わるか]
- 隠された秘密: [そのキャラクターが隠している秘密]
`;

    const charactersResponse = await aiClient.generateContent({
      prompt: characterPrompt,
      temperature: 0.8
    });
    
    // キャラクター情報をパース（実際はより高度なパースが必要）
    this.mysteryData.characters = this.parseCharacters(charactersResponse.content);
    
    return this.mysteryData.characters;
  }

  // ステップ3: プロット生成
  async generatePlot() {
    console.log('📖 ステップ3: プロット生成開始');
    
    const plotPrompt = `
以下の設定で完全なミステリープロットを生成してください：

【基本設定】
タイトル: ${this.mysteryData.title}
ジャンル: ${this.mysteryData.genre}
舞台: ${this.mysteryData.setting}
トリック: ${this.mysteryData.trick}
動機: ${this.mysteryData.motive}

【登場人物】
${this.mysteryData.characters.map(c => `- ${c.name}（${c.age}歳、${c.role}）`).join('\n')}

以下の構成で詳細なプロットを作成してください：

## 第1章: 導入
- 舞台設定の説明
- 登場人物の紹介
- 事件発生までの状況

## 第2章: 事件発生
- 被害者の発見
- 初期の混乱
- 警察/探偵の登場

## 第3章: 捜査開始
- 現場検証
- 初期の手がかり
- 容疑者への聞き取り

## 第4章: 謎の深化
- 新たな証拠の発見
- 矛盾する証言
- 第二の事件（必要に応じて）

## 第5章: 真相解明
- 探偵の推理
- トリックの暴露
- 犯人の特定

## エピローグ
- 事件の後日談
- 登場人物のその後
`;

    const plotResponse = await aiClient.generateContent({
      prompt: plotPrompt,
      temperature: 0.7,
      maxTokens: 3000
    });
    
    this.mysteryData.plot = {
      fullStory: plotResponse.content,
      chapters: this.parseChapters(plotResponse.content)
    };
    
    return this.mysteryData.plot;
  }

  // ステップ4: 手がかりと証拠生成
  async generateClues() {
    console.log('🔍 ステップ4: 手がかりと証拠生成開始');
    
    const clueCount = randomNumber(5, 8);
    const cluesPrompt = `
以下のミステリーに必要な${clueCount}個の手がかり・証拠品を生成してください：

【ミステリー概要】
${this.mysteryData.title}
トリック: ${this.mysteryData.trick}
犯人: ${this.mysteryData.characters.find(c => c.role === '犯人')?.name}

各手がかりについて以下の形式で出力してください：

**手がかり[番号]: [アイテム名]**
- 種類: [物的証拠/証言/文書/その他]
- 発見場所: [どこで見つかるか]
- 外見/内容: [具体的な描写]
- 重要度: [高/中/低]
- 推理への貢献: [この手がかりから何がわかるか]
- 誤導の可能性: [ミスリードになりうる解釈]
`;

    const cluesResponse = await aiClient.generateContent({
      prompt: cluesPrompt,
      temperature: 0.8
    });
    
    this.mysteryData.clues = this.parseClues(cluesResponse.content);
    
    return this.mysteryData.clues;
  }

  // ステップ5: Google Drive構造に沿ったファイル生成
  async generateGoogleDriveStructure() {
    console.log('📁 ステップ5: Google Drive構造生成開始');
    
    const files = {};
    
    // 1. メインシナリオファイル
    files['メインシナリオ'] = {
      filename: `${this.mysteryData.title}_完全プロット.txt`,
      path: '/',
      content: await this.generateMainScenario()
    };
    
    // 2. GM用資料
    files['GM用真相解説'] = {
      filename: `${this.mysteryData.title}_GM用_真相と解説.txt`,
      path: '/GM用資料/',
      content: await this.generateGMGuide()
    };
    
    // 3. プレイヤー配布資料
    files['プレイヤー導入'] = {
      filename: `${this.mysteryData.title}_プレイヤー用_導入と情報.txt`,
      path: '/プレイヤー配布資料/',
      content: await this.generatePlayerHandout()
    };
    
    // 4. 手がかりと証拠品
    for (let i = 0; i < this.mysteryData.clues.length; i++) {
      const clue = this.mysteryData.clues[i];
      files[`手がかり${i + 1}`] = {
        filename: `${this.mysteryData.title}_手がかり${i + 1}_${clue.name}.txt`,
        path: '/手がかりと証拠品/',
        content: this.generateClueFile(clue)
      };
    }
    
    // 5. 商品情報
    files['商品概要'] = {
      filename: `${this.mysteryData.title}_商品概要.txt`,
      path: '/',
      content: this.generateProductInfo()
    };
    
    files['改訂履歴'] = {
      filename: `${this.mysteryData.title}_改訂履歴.txt`,
      path: '/',
      content: this.generateRevisionHistory()
    };
    
    this.mysteryData.files = files;
    
    return files;
  }

  // メインシナリオ生成
  async generateMainScenario() {
    return `
========================================
${this.mysteryData.title}
完全プロット
========================================

【作品情報】
ジャンル: ${this.mysteryData.genre}
舞台: ${this.mysteryData.setting}
想定プレイ時間: 60-90分
プレイ人数: ${this.mysteryData.characters.length}人

========================================

${this.mysteryData.plot.fullStory}

========================================
【登場人物一覧】
${this.mysteryData.characters.map(c => `
◆ ${c.name}（${c.age}歳）
  職業: ${c.profession}
  役割: ${c.role}
  性格: ${c.personality}
`).join('\n')}

========================================
`;
  }

  // GM用ガイド生成
  async generateGMGuide() {
    const criminal = this.mysteryData.characters.find(c => c.role === '犯人');
    const victim = this.mysteryData.characters.find(c => c.role === '被害者');
    
    return `
========================================
${this.mysteryData.title}
GM用資料 - 真相と解説
========================================

⚠️ この資料はGM専用です。プレイヤーには絶対に見せないでください。

【事件の真相】
犯人: ${criminal?.name}
被害者: ${victim?.name}
動機: ${this.mysteryData.motive}
使用されたトリック: ${this.mysteryData.trick}

【詳細な真相解説】
${await this.generateDetailedTruth()}

【各キャラクターの隠された秘密】
${this.mysteryData.characters.map(c => `
◆ ${c.name}
  隠された秘密: ${c.secret}
  真の関係性: ${c.relationship || '特になし'}
`).join('\n')}

【手がかりの解説】
${this.mysteryData.clues.map((clue, i) => `
${i + 1}. ${clue.name}
   真の意味: ${clue.trueMeaning}
   ミスリードの可能性: ${clue.misleading}
`).join('\n')}

【推奨される進行手順】
1. 導入フェーズ（15分）
   - 舞台設定の説明
   - キャラクター紹介
   
2. 事件発生（10分）
   - 被害者の発見
   - 初期混乱の演出
   
3. 捜査フェーズ（30-40分）
   - 手がかりの開示
   - 聞き込み時間
   
4. 推理フェーズ（20分）
   - プレイヤー間での議論
   - 追加質問の受付
   
5. 解決編（15分）
   - 真相の開示
   - エピローグ

========================================
`;
  }

  // プレイヤー用ハンドアウト生成
  async generatePlayerHandout() {
    return `
========================================
${this.mysteryData.title}
プレイヤー用導入資料
========================================

【シナリオ概要】
${this.mysteryData.setting}を舞台にした${this.mysteryData.genre}ミステリーです。
あなたたちは、ある事件に巻き込まれた関係者として、真相を解明することになります。

【初期状況】
${await this.generateInitialSituation()}

【公開情報】
現在判明している情報は以下の通りです：
- 日時: 202X年XX月XX日
- 場所: ${this.mysteryData.setting}
- 状況: 密室状態での事件発生

【登場人物紹介】※公開情報のみ
${this.mysteryData.characters.map(c => `
◆ ${c.name}（${c.age}歳）
  職業: ${c.profession}
  ${this.generatePublicInfo(c)}
`).join('\n')}

【プレイヤーへの注意事項】
1. 他のプレイヤーとの情報共有は自由です
2. GMへの質問は随時可能です
3. 推理は論理的根拠に基づいて行ってください
4. メタ推理は避けてください

【ゲームの目的】
事件の真相を解明し、犯人を特定することが目的です。
手がかりを集め、証言を聞き、論理的に推理してください。

========================================
`;
  }

  // ヘルパーメソッド群
  parseCharacters(content) {
    // 実際の実装では、AIの出力を構造化データにパースする
    // ここでは簡易実装
    return [
      { name: '架空人物A', age: 35, profession: '医師', role: '被害者', personality: '厳格', secret: '隠された過去' },
      { name: '架空人物B', age: 28, profession: '看護師', role: '犯人', personality: '献身的', secret: '復讐心' },
      { name: '架空人物C', age: 42, profession: '探偵', role: '探偵役', personality: '鋭敏', secret: 'なし' },
      // ... 他のキャラクター
    ];
  }

  parseChapters(content) {
    // プロットを章ごとに分割
    return content.split(/##\s+/);
  }

  parseClues(content) {
    // 手がかりをパース
    return [
      { name: '血痕のついた手袋', type: '物的証拠', trueMeaning: '犯人の所持品', misleading: '別人のものと誤認可能' },
      // ... 他の手がかり
    ];
  }

  generateClueFile(clue) {
    return `
【手がかり】${clue.name}

種類: ${clue.type}
発見場所: ${clue.location || '現場付近'}

[詳細な描写]
${clue.description || 'この証拠品の詳細な外見と状態を記述'}

[プレイヤーが確認できる情報]
${clue.visibleInfo || '表面的に観察できる特徴'}

※GMへの注記: この手がかりの真の意味は「${clue.trueMeaning}」です
`;
  }

  generateProductInfo() {
    return `
【商品概要】
タイトル: ${this.mysteryData.title}
ジャンル: ${this.mysteryData.genre}
想定プレイ時間: 60-90分
プレイ人数: ${this.mysteryData.characters.length}人
難易度: ★★★☆☆

${this.mysteryData.setting}を舞台に繰り広げられる本格ミステリー。
${this.mysteryData.trick}を軸にした巧妙なプロットと、
個性豊かなキャラクターたちが織りなす人間ドラマをお楽しみください。

AIによって完全ランダム生成された、世界に一つだけのオリジナルシナリオです。
`;
  }

  generateRevisionHistory() {
    const today = new Date().toISOString().split('T')[0];
    return `
【改訂履歴】

バージョン: 1.0（初版AI生成）
生成日: ${today}
生成方式: 完全ランダムAI生成
使用AI: Claude (Anthropic)

[生成パラメータ]
- ジャンル: ${this.mysteryData.genre}（ランダム選択）
- 舞台: ${this.mysteryData.setting}（ランダム選択）
- トリック: ${this.mysteryData.trick}（ランダム選択）
- 動機: ${this.mysteryData.motive}（ランダム選択）

このシナリオは、指定されたパラメータに基づいて
AIが自動生成したオリジナル作品です。
`;
  }

  async generateDetailedTruth() {
    // 真相の詳細を生成
    return `犯人は計画的に${this.mysteryData.trick}を用いて犯行を実行した...`;
  }

  async generateInitialSituation() {
    // 初期状況の説明を生成
    return `あなたたちは${this.mysteryData.setting}に集まっていた...`;
  }

  generatePublicInfo(character) {
    // キャラクターの公開情報を生成
    return `一見すると${character.personality}な人物`;
  }

  // メイン実行メソッド
  async generateCompleteRandomMystery() {
    console.log('🎭 完全ランダムミステリー生成開始');
    
    try {
      // 1. 基本要素生成
      await this.generateBasicElements();
      console.log('✅ 基本要素生成完了:', this.mysteryData.title);
      
      // 2. キャラクター生成
      await this.generateCharacters();
      console.log('✅ キャラクター生成完了:', this.mysteryData.characters.length, '人');
      
      // 3. プロット生成
      await this.generatePlot();
      console.log('✅ プロット生成完了');
      
      // 4. 手がかり生成
      await this.generateClues();
      console.log('✅ 手がかり生成完了:', this.mysteryData.clues.length, '個');
      
      // 5. Google Drive構造生成
      await this.generateGoogleDriveStructure();
      console.log('✅ Google Drive構造生成完了');
      
      return {
        success: true,
        mysteryData: this.mysteryData,
        files: this.mysteryData.files
      };
      
    } catch (error) {
      logger.error('❌ ランダムミステリー生成エラー:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// エクスポート
export const randomMysteryGenerator = new RandomMysteryGenerator();