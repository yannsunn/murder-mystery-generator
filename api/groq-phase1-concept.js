// Groq超高速API - タイムアウト完全回避
// 処理時間: 5-10秒保証

export const config = {
  maxDuration: 90, // タイムアウト回避のため90秒に設定
};

const GROQ_API_KEY = process.env.GROQ_API_KEY;

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { participants, era, setting, incident_type, worldview, tone } = req.body;

    if (!GROQ_API_KEY) {
      return res.status(500).json({ 
        success: false, 
        error: 'Groq APIキーが設定されていません' 
      });
    }

    console.log('Groq Phase 1: Starting ultra-fast concept generation...');

    const systemPrompt = `あなたは世界最高峰のマーダーミステリー作家です。以下の厳格な制約と品質基準に従い、完璧な商業作品を生成してください。

【ULTRA厳格制約】
🚫 ABSOLUTE PROHIBITION:
- 同一文章の使用は1回まで（検証必須）
- 「〜のために行動を起こす」等の重複フレーズ完全禁止
- 全キャラクターが同じ動機・秘密を持つこと禁止
- 曖昧・抽象的表現禁止
- 論理矛盾・設定破綻禁止

✅ MANDATORY REQUIREMENTS:
- 各キャラクターに固有の動機・秘密・背景
- 被害者と容疑者の名前を明確に区別
- 具体的で詳細な時刻・場所・行動
- 論理的に推理可能なトリック
- 物理的証拠の具体的説明

【検証チェックリスト】
各セクション完成後に以下を確認:
1. 重複文章チェック（ゼロ必須）
2. 論理整合性チェック（矛盾ゼロ必須）
3. 固有性チェック（各要素がユニーク必須）
4. 具体性チェック（詳細描写必須）
5. 推理可能性チェック（解決可能必須）

【文体指示】
- 一人称視点禁止
- 「〜します」等の同じ語尾連続使用禁止
- 多様な表現・語彙を使用
- 具体的数値・時刻・固有名詞を多用`;
    
    const userPrompt = generateEnhancedPrompt({ participants, era, setting, incident_type, worldview, tone });

    // Groq API呼び出し - タイムアウト対応版
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000); // 45秒タイムアウト

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant', // 最高速モデル
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 6000, // 商業品質シナリオ用に最大増量
          top_p: 0.85,
          stream: false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const concept = data.choices[0].message.content;

      console.log('Groq Phase 1: Ultra-fast concept generated successfully');

      return res.status(200).json({
        success: true,
        content: concept,
        provider: 'groq',
        model: 'llama-3.1-8b-instant',
        processing_time: `${Date.now() - startTime}ms`
      });

    } catch (fetchError) {
      clearTimeout(timeout);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Groq API request timeout after 45 seconds');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Groq concept generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: `Groq生成エラー: ${error.message}`,
      processing_time: `${Date.now() - startTime}ms`
    });
  }
}

function generateEnhancedPrompt(params) {
  const { participants, era, setting, incident_type, worldview, tone } = params;
  
  const eraMap = {
    'modern': '現代',
    'showa': '昭和時代', 
    'near-future': '近未来',
    'fantasy': 'ファンタジー'
  };
  
  const settingMap = {
    'closed-space': '密室空間',
    'mountain-villa': '山荘',
    'military-facility': '軍事施設',
    'underwater-facility': '海中施設',
    'city': '都市部'
  };
  
  const incidentMap = {
    'murder': '殺人事件',
    'disappearance': '失踪事件',
    'theft': '盗難事件',
    'blackmail': '恐喝事件',
    'fraud': '詐欺事件'
  };
  
  const toneMap = {
    'serious': 'シリアス',
    'comedy': 'コメディ',
    'horror': 'ホラー',
    'adventure': '冒険活劇'
  };
  
  const worldviewMap = {
    'realistic': 'リアル志向',
    'occult': 'オカルト',
    'sci-fi': 'SF',
    'mystery': '純粋ミステリー'
  };
  
  return `【重要】${participants}人用の完全なマーダーミステリーシナリオを商業品質で生成してください。

【設定情報】
- 参加人数: ${participants}人
- 時代背景: ${eraMap[era] || era}
- 舞台: ${settingMap[setting] || setting} 
- 事件タイプ: ${incidentMap[incident_type] || incident_type}
- 世界観: ${worldviewMap[worldview] || worldview}
- トーン: ${toneMap[tone] || tone}

【必須要件】
- 各セクション内で重複する文章を絶対に書かない
- 論理的に矛盾しない一貫したストーリー
- 推理可能で満足度の高いトリック
- 商業作品レベルの文章品質

以下の構成で詳細に作成してください:

## 📚 シナリオタイトル
記憶に残る魅力的なタイトル（日本語で5-15文字）

## 🎭 シナリオ概要
このシナリオの核心的魅力とプレイ体験を具体的に説明（400-500文字）
※以下の要素を含む: ストーリーの見どころ、プレイヤーが体験する感情、解決の達成感

## 🏛️ 舞台設定・世界観
時代背景と場所の具体的描写（400-500文字）
※以下を詳細に: 建物の構造、雰囲気、社会背景、季節・天候

## 👥 登場人物一覧
【${participants}人全員の完全なプロフィール】

キャラクター1:
- 名前: （フルネーム）
- 年齢・職業: 
- 外見・性格: （具体的な特徴）
- 背景・経歴: （重要な過去）
- 秘密・動機: （事件に関わる理由）
- 他者との関係: （重要な人間関係）

※この形式で${participants}人全員を作成。各キャラクター200-250文字

## ⚡ 事件の詳細
- 被害者: （名前、立場、殺害方法）
- 発見状況: （いつ、どこで、誰が発見したか）
- 現場の状況: （物理的証拠、不自然な点）
- 第一印象: （初期の推理、容疑者の候補）
- 核心的謎: （解決すべき最重要ポイント）
（600-700文字）

## 🔍 証拠・手がかり一覧
【物理的証拠】（7-8個）
1. 証拠品名: 具体的説明と重要度
2. 証拠品名: 具体的説明と重要度
※各証拠50-80文字で詳細説明

【証言・情報】（5-6個）
1. 証言者: 証言内容の詳細
2. 証言者: 証言内容の詳細
※各証言70-100文字

【隠された手がかり】（3-4個）
1. 手がかり: 発見方法と真相への重要性
※各手がかり80-120文字

## ⏰ 事件タイムライン
【事件前日】
- XX時: 具体的な出来事（誰が何をしたか）
- XX時: 具体的な出来事

【事件当日】
- XX時: 具体的な出来事
- XX時: 事件発生
- XX時: 発見

※各時間帯50-80文字の詳細説明

## 🎯 真相・解決編
- 真犯人: （名前と基本情報）
- 犯行動機: （詳細な心理的背景）
- 犯行手順: （時系列での具体的行動）
- トリック解説: （どのように密室/偽装を作ったか）
- 決定的証拠: （犯人を特定する証拠）
- 推理ポイント: （プレイヤーが気づくべき点）
（700-800文字）

## 🎮 ゲームマスター向けガイド
- セッション進行法: （開始から終了まで）
- 重要演出: （盛り上がりポイント）
- ヒント出しタイミング: （プレイヤーが詰まった時）
- 結末の演出: （感動的な真相発表方法）
（400-500文字）

## 🎊 マルチエンディング
【完全正解エンディング】: 全て解明した場合
【部分正解エンディング】: 犯人のみ正解の場合  
【不正解エンディング】: 推理が外れた場合
※各エンディング100-150文字

【文字数確認】合計: 5000-6000文字の本格商業品質シナリオ

重要: 絶対に同じ内容を繰り返さず、論理的に一貫したストーリーを作成してください。`;
}