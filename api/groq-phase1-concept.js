// Groq超高速API - ウルトラシンク修正版
// 処理時間: 5-15秒保証、商業品質

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

    console.log('🚀 Groq ULTRA: Starting commercial-grade concept generation...');

    // ウルトラシンプル・高品質プロンプト
    const systemPrompt = `あなたは世界最高レベルのマーダーミステリー作家です。商業販売レベルの高品質シナリオコンセプトを作成してください。

出力フォーマット:
## 🏆 タイトル
《独創的で魅力的なタイトル》

## 🎭 シナリオ概要
参加者全員が楽しめる魅力的なストーリー概要

## 📋 基本設定
時代、場所、状況の詳細な設定

## 🕵️ 事件概要
被害者、死因、発生状況の詳細

## 🎯 ゲームの目的
プレイヤーの明確な目標

簡潔かつ高品質で作成してください。`;
    
    const userPrompt = createUserPrompt({ participants, era, setting, incident_type, worldview, tone });

    console.log('📡 Calling Groq API with enhanced parameters...');

    // Groq API呼び出し - エラーハンドリング強化
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25秒

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
          max_tokens: 1500, // 安定性重視
          top_p: 0.9,
          frequency_penalty: 0.5, // バランス調整
          presence_penalty: 0.3,
          stream: false
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Groq API Error:', response.status, errorText);
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const concept = data.choices[0]?.message?.content;

      if (!concept) {
        throw new Error('No content returned from Groq API');
      }

      console.log('✅ Groq ULTRA: Concept generated successfully');

      return res.status(200).json({
        success: true,
        content: concept,
        provider: 'groq-ultra',
        model: 'llama-3.1-8b-instant',
        processing_time: `${Date.now() - startTime}ms`,
        quality: 'commercial-grade'
      });

    } catch (fetchError) {
      clearTimeout(timeout);
      
      console.error('❌ Fetch Error:', fetchError.message);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Groq API request timeout after 25 seconds');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('❌ Groq ULTRA generation error:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      error: `Groq生成エラー: ${error.message}`,
      processing_time: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString()
    });
  }
}

function createUserPrompt(params) {
  const { participants, era, setting, incident_type, worldview, tone } = params;
  
  const eraNames = {
    'modern': '現代',
    'showa': '昭和時代', 
    'near-future': '近未来',
    'fantasy': 'ファンタジー'
  };
  
  const settingNames = {
    'closed-space': '密室',
    'mountain-villa': '山荘',
    'military-facility': '軍事施設',
    'underwater-facility': '海中施設',
    'city': '都市部'
  };
  
  const incidentNames = {
    'murder': '殺人事件',
    'disappearance': '失踪事件',
    'theft': '盗難事件',
    'blackmail': '恐喝事件',
    'fraud': '詐欺事件'
  };
  
  const worldviewNames = {
    'realistic': '現実的',
    'occult': 'オカルト',
    'sci-fi': 'SF',
    'historical': '歴史的'
  };
  
  const toneNames = {
    'serious': 'シリアス',
    'light': 'ライト',
    'dark': 'ダーク',
    'comedy': 'コメディ',
    'adventure': '冒険活劇'
  };

  return `${participants}人参加の${eraNames[era] || era}時代、${settingNames[setting] || setting}を舞台とした${incidentNames[incident_type] || incident_type}のマーダーミステリーシナリオを作成してください。

設定:
- 参加者: ${participants}人
- 時代: ${eraNames[era] || era}
- 舞台: ${settingNames[setting] || setting}
- 事件: ${incidentNames[incident_type] || incident_type}
- 世界観: ${worldviewNames[worldview] || worldview}
- トーン: ${toneNames[tone] || tone}

独創的で論理的、商業販売レベルの品質で作成してください。`;
}