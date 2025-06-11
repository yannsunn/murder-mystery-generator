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

    const systemPrompt = `マーダーミステリー専門作家として、高品質なコンセプトを効率的に作成してください。`;
    
    const userPrompt = generateOptimizedPrompt({ participants, era, setting, incident_type, worldview, tone });

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
          temperature: 0.8,
          max_tokens: 4000, // 完全シナリオ用に大幅増量
          top_p: 0.9,
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

function generateOptimizedPrompt(params) {
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
  
  return `${participants}人用の完全なマーダーミステリーシナリオを詳細に生成してください。

【基本設定】
- 参加人数: ${participants}人
- 時代背景: ${eraMap[era] || era}
- 舞台: ${settingMap[setting] || setting} 
- 事件タイプ: ${incidentMap[incident_type] || incident_type}
- 世界観: ${worldviewMap[worldview] || worldview}
- トーン: ${toneMap[tone] || tone}

以下の構成で詳細なシナリオを作成してください:

## 📚 シナリオタイトル
印象的で記憶に残る魅力的なタイトル

## 🎭 シナリオ概要
ストーリーの核心、魅力、プレイ体験を詳細に(300-400文字)

## 🏛️ 舞台設定・世界観
時代背景、場所の詳細、雰囲気を具体的に描写(300-400文字)

## 👥 登場人物一覧
【${participants}人の詳細なキャラクター設定】
各キャラクターについて以下を記載:
- 名前・年齢・職業
- 性格・特徴
- 秘密・動機
- 事件との関係性
(各キャラクター150-200文字)

## ⚡ 事件の詳細
- 事件の経緯と状況
- 発見時の状況
- 初期情報
- 謎の核心部分
(400-500文字)

## 🕵️ 手がかり・証拠
- 物理的証拠 (5-7個)
- 証言・情報 (3-5個)
- 隠された手がかり (2-3個)
各手がかりの詳細と重要度を記載

## ⏰ 事件タイムライン
事件前日から発見まで、重要な出来事を時系列で詳細に記載
- 各時刻に何が起こったか
- 誰がどこにいたか
- 重要な行動

## 🎯 真相・解決編
- 真犯人とその動機
- 犯行の手口
- トリックの詳細
- 推理のポイント
(500-600文字)

## 🎮 ゲームマスター向け情報
- 進行のコツ
- 重要な演出ポイント
- プレイヤーへの誘導方法
- 盛り上げるタイミング
(300-400文字)

## 🎊 エンディング案
複数のエンディングパターンを提示し、プレイヤーの推理結果に応じた締めくくり方

合計4000-5000文字の本格的な商業品質シナリオを作成してください。`;
}