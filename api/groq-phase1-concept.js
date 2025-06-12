// Groq超高速API - 繰り返し問題修正版
// 処理時間: 5-10秒保証

export const config = {
  maxDuration: 90,
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

    console.log('Groq Phase 1: Starting concept generation...');

    const systemPrompt = `あなたはマーダーミステリーのコンセプト作成専門家です。簡潔で具体的なシナリオコンセプトを作成してください。

【出力制約】
- 各セクションは2-3文で簡潔に
- 同じ内容の繰り返し禁止
- 具体的な名前、時刻、場所を使用
- 完結性を保つ（途中で終わらない）

【出力フォーマット】
以下のフォーマットで出力してください。

## 🏆 タイトル
《[独創的なタイトル]》

## 🎭 シナリオ概要
[簡潔なあらすじ 2-3文]

## 📋 基本設定
[時代、場所、状況 2-3文]

## 🕵️ 事件概要
[被害者、死因、発生時刻 2-3文]

## 🎯 ゲームの目的
[プレイヤーが達成すべき目標 1-2文]

以上で終了。追加の説明は不要です。`;
    
    const userPrompt = generatePrompt({ participants, era, setting, incident_type, worldview, tone });

    // Groq API呼び出し
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 800, // 短縮
          top_p: 0.85,
          frequency_penalty: 1.5, // 繰り返しを強力に防ぐ
          presence_penalty: 1.2,   // 新しいトピックを促進
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

      console.log('Groq Phase 1: Concept generated successfully');

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
        throw new Error('Groq API request timeout after 30 seconds');
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

function generatePrompt(params) {
  const { participants, era, setting, incident_type, worldview, tone } = params;
  
  const uniqueId = Date.now().toString(36).substr(-4);
  
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
  
  const worldviewMap = {
    'realistic': '現実的',
    'occult': 'オカルト',
    'sci-fi': 'SF',
    'historical': '歴史的'
  };
  
  const toneMap = {
    'serious': 'シリアス',
    'light': 'ライト',
    'dark': 'ダーク',
    'comedy': 'コメディ',
    'adventure': '冒険活劇'
  };

  return `シナリオコード:${uniqueId} - ${participants}人の${eraMap[era] || era}${settingMap[setting] || setting}での${incidentMap[incident_type] || incident_type}をテーマに、${worldviewMap[worldview] || worldview}で${toneMap[tone] || tone}なマーダーミステリーシナリオのコンセプトを作成してください。

要求:
- 参加者数: ${participants}人
- 時代設定: ${eraMap[era] || era}
- 舞台: ${settingMap[setting] || setting}  
- 事件: ${incidentMap[incident_type] || incident_type}
- 世界観: ${worldviewMap[worldview] || worldview}
- トーン: ${toneMap[tone] || tone}

上記の指定フォーマットで、簡潔かつ具体的に作成してください。`;
}